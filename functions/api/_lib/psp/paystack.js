// Intégration Paystack — https://paystack.com/docs/payments/accept-payments/
// Non testée en conditions réelles (aucune clé API disponible ici) : suit le
// contrat documenté, à vérifier avec de vraies clés de test avant production.

export const id = 'paystack';
export const label = 'Paystack (Afrique)';

export function isConfigured(env) {
  return !!env.PAYSTACK_SECRET_KEY;
}

export async function createCheckoutSession(env, ctx) {
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: ctx.email,
      amount: Math.round(ctx.amountUsd * 100), // sous-unité (kobo/cents)
      currency: env.PAYSTACK_CURRENCY || 'USD',
      callback_url: ctx.successUrl,
      metadata: { household_id: ctx.household_id, plan: ctx.plan },
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.status) throw new Error(data?.message || 'Paystack: échec de création de transaction');
  return { url: data.data.authorization_url };
}

async function verifyPaystackSignature(env, rawBody, sigHeader) {
  if (!sigHeader) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.PAYSTACK_SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const expected = [...new Uint8Array(sigBuf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return expected === sigHeader;
}

export async function verifyAndParseWebhook(env, request, rawBody) {
  const sig = request.headers.get('x-paystack-signature');
  if (!(await verifyPaystackSignature(env, rawBody, sig))) return null;
  const event = JSON.parse(rawBody);
  if (event.event === 'charge.success') {
    const meta = event.data.metadata || {};
    return { household_id: meta.household_id, plan: meta.plan, status: 'active' };
  }
  return null;
}
