// Intégration PayUnit (agrégateur mobile money — Afrique centrale/de l'Ouest)
// Vérifiée contre la documentation officielle :
// https://developer.payunit.net/rest-api/initialize-payment
// (trouvée après coup — la première version de ce fichier avait deviné un
// contrat différent de la vraie API, ce qui empêchait tout paiement PayUnit
// d'aboutir : mauvais en-tête d'authentification, mauvais nom de champ pour
// les données personnalisées.)

export const id = 'payunit';
export const label = 'PayUnit — Mobile Money (Afrique centrale)';

export function isConfigured(env) {
  return !!(env.PAYUNIT_API_KEY && env.PAYUNIT_API_USER && env.PAYUNIT_API_PASSWORD && env.PAYUNIT_WEBHOOK_SECRET);
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

  // Authentification Basic (base64 "apiUsername:apiPassword") — c'est ce que
  // leur API REST attend réellement, pas des en-têtes x-api-user/x-api-password.
  const basicAuth = btoa(`${env.PAYUNIT_API_USER}:${env.PAYUNIT_API_PASSWORD}`);

  const res = await fetch(`https://gateway.payunit.net/api/gateway/initialize`, {
    method: 'POST',
    headers: {
      'x-api-key': env.PAYUNIT_API_KEY,
      mode,
      'Content-Type': 'application/json',
      Authorization: `Basic ${basicAuth}`,
    },
    body: JSON.stringify({
      total_amount: Math.round(ctx.amountUsd),
      currency: env.PAYUNIT_CURRENCY || 'XAF',
      transaction_id: `kolo-${ctx.household_id}-${Date.now()}`,
      return_url: ctx.successUrl,
      notify_url: notifyUrl,
      // "custom_fields", pas "metadata" — nom confirmé par les définitions
      // TypeScript officielles du SDK (InitiatePaymentRequest).
      custom_fields: { household_id: ctx.household_id, plan: ctx.plan },
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
  const status = event.status || event.data?.status || event.transaction_status;
  if (status === 'SUCCESS' || status === 'SUCCESSFUL') {
    const custom = event.custom_fields || event.data?.custom_fields || {};
    return { household_id: custom.household_id, plan: custom.plan, status: 'active' };
  }
  return null;
}
