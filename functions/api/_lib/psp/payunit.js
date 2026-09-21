// Intégration PayUnit (agrégateur mobile money — Afrique centrale/de l'Ouest)
// — https://docs.payunit.net
// ATTENTION : PayUnit est moins documenté publiquement que les autres PSP.
// Cette intégration suit leur contrat REST tel que documenté, mais n'a pu
// être vérifiée contre un vrai environnement sandbox (aucune clé disponible
// ici, et le domaine de leur API n'est pas joignable depuis cet
// environnement de build). À tester en priorité avant mise en production.

export const id = 'payunit';
export const label = 'PayUnit — Mobile Money (Afrique centrale)';

export function isConfigured(env) {
  return !!(env.PAYUNIT_API_KEY && env.PAYUNIT_API_USER && env.PAYUNIT_WEBHOOK_SECRET);
}

export async function createCheckoutSession(env, ctx) {
  const mode = env.PAYUNIT_MODE === 'live' ? 'live' : 'test';
  // PayUnit ne documente aucune vérification de signature de webhook — donc,
  // qu'ils en fassent une ou non, on ajoute notre PROPRE secret dans
  // notify_url. Sans ce jeton en retour, le webhook est refusé (voir plus
  // bas) : n'importe qui pourrait sinon POSTer un faux paiement "réussi" sur
  // /api/checkout/webhook/payunit avec le household_id de son choix, sans
  // aucune authentification, et s'attribuer un plan payant gratuitement.
  const notifyUrl = `${ctx.webhookUrl}?secret=${encodeURIComponent(env.PAYUNIT_WEBHOOK_SECRET)}`;
  const res = await fetch(`https://gateway.payunit.net/api/gateway/initialize`, {
    method: 'POST',
    headers: {
      'x-api-key': env.PAYUNIT_API_KEY,
      'x-api-user': env.PAYUNIT_API_USER,
      'x-api-password': env.PAYUNIT_API_PASSWORD || '',
      mode,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      total_amount: Math.round(ctx.amountUsd),
      currency: env.PAYUNIT_CURRENCY || 'XAF',
      transaction_id: `kolo-${ctx.household_id}-${Date.now()}`,
      return_url: ctx.successUrl,
      notify_url: notifyUrl,
      description: `Kolo — Plan ${ctx.planLabel}`,
      customer_email: ctx.email,
      metadata: { household_id: ctx.household_id, plan: ctx.plan },
    }),
  });
  const data = await res.json();
  if (!res.ok || !data?.data?.transaction_url) {
    throw new Error(data?.message || 'PayUnit: échec de création de transaction');
  }
  return { url: data.data.transaction_url };
}

export async function verifyAndParseWebhook(env, request, rawBody) {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');
  if (!env.PAYUNIT_WEBHOOK_SECRET || secret !== env.PAYUNIT_WEBHOOK_SECRET) return null;
  const event = JSON.parse(rawBody);
  if (event.status === 'SUCCESS' || event.data?.status === 'SUCCESS') {
    const meta = event.metadata || event.data?.metadata || {};
    return { household_id: meta.household_id, plan: meta.plan, status: 'active' };
  }
  return null;
}
