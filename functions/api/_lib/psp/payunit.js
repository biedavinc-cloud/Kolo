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
  return !!(env.PAYUNIT_API_KEY && env.PAYUNIT_API_USER);
}

export async function createCheckoutSession(env, ctx) {
  const mode = env.PAYUNIT_MODE === 'live' ? 'live' : 'test';
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
      notify_url: ctx.webhookUrl,
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
  // PayUnit ne documente pas publiquement de vérification de signature au
  // moment de l'écriture — la notification n'est acceptée que si l'appel
  // provient bien de leur IP annoncée n'est pas non plus vérifiable côté
  // Workers. À défaut, on ne traite que les notifications dont le statut
  // est explicitement "SUCCESS" ; à renforcer une fois leur documentation de
  // sécurité webhook confirmée.
  const event = JSON.parse(rawBody);
  if (event.status === 'SUCCESS' || event.data?.status === 'SUCCESS') {
    const meta = event.metadata || event.data?.metadata || {};
    return { household_id: meta.household_id, plan: meta.plan, status: 'active' };
  }
  return null;
}
