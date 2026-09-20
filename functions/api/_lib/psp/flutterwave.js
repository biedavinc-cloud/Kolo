// Intégration Flutterwave — https://developer.flutterwave.com/docs/collecting-payments/standard
// Non testée en conditions réelles (aucune clé API disponible ici) : suit le
// contrat documenté, à vérifier avec de vraies clés de test avant production.

export const id = 'flutterwave';
export const label = 'Flutterwave (Afrique)';

export function isConfigured(env) {
  return !!env.FLUTTERWAVE_SECRET_KEY;
}

export async function createCheckoutSession(env, ctx) {
  const tx_ref = `kolo-${ctx.household_id}-${Date.now()}`;
  const res = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref,
      amount: ctx.amountUsd, // unité majeure, pas de sous-unité chez Flutterwave
      currency: env.FLUTTERWAVE_CURRENCY || 'USD',
      redirect_url: ctx.successUrl,
      customer: { email: ctx.email },
      customizations: { title: 'Kolo', description: `Plan ${ctx.planLabel}` },
      meta: { household_id: ctx.household_id, plan: ctx.plan },
    }),
  });
  const data = await res.json();
  if (!res.ok || data.status !== 'success') {
    throw new Error(data?.message || 'Flutterwave: échec de création de paiement');
  }
  return { url: data.data.link };
}

export async function verifyAndParseWebhook(env, request, rawBody) {
  const sig = request.headers.get('verif-hash');
  if (!env.FLUTTERWAVE_WEBHOOK_HASH || sig !== env.FLUTTERWAVE_WEBHOOK_HASH) return null;
  const event = JSON.parse(rawBody);
  if (event.event === 'charge.completed' && event.data?.status === 'successful') {
    const meta = event.data.meta || {};
    return { household_id: meta.household_id, plan: meta.plan, status: 'active' };
  }
  return null;
}
