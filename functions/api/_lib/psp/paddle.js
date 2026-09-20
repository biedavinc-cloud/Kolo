// Intégration Paddle Billing (marchand de référence — gère la TVA/taxes
// internationales) — https://developer.paddle.com/api-reference/transactions/create-transaction
// Non testée en conditions réelles (aucune clé API disponible ici) : suit le
// contrat documenté, à vérifier avec de vraies clés sandbox avant production.

export const id = 'paddle';
export const label = 'Paddle (international, taxes gérées)';

export function isConfigured(env) {
  return !!env.PADDLE_API_KEY;
}

function baseUrl(env) {
  return env.PADDLE_MODE === 'live' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com';
}

export async function createCheckoutSession(env, ctx) {
  // Prix "non catalogué" (custom_data) : évite d'avoir à pré-créer un objet
  // Price par plan dans le dashboard Paddle pour chaque devise.
  const res = await fetch(`${baseUrl(env)}/transactions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.PADDLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          quantity: 1,
          price: {
            description: `Kolo — Plan ${ctx.planLabel}`,
            unit_price: { amount: String(Math.round(ctx.amountUsd * 100)), currency_code: 'USD' },
            billing_cycle: { interval: 'month', frequency: 1 },
          },
        },
      ],
      customer: { email: ctx.email },
      custom_data: { household_id: ctx.household_id, plan: ctx.plan },
      checkout: { url: ctx.successUrl },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.detail || 'Paddle: échec de création de transaction');
  return { url: data.data.checkout.url };
}

async function verifyPaddleSignature(env, rawBody, sigHeader) {
  if (!env.PADDLE_WEBHOOK_SECRET || !sigHeader) return false;
  const parts = Object.fromEntries(sigHeader.split(';').map((p) => p.split('=')));
  const signedPayload = `${parts.ts}:${rawBody}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.PADDLE_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expected = [...new Uint8Array(sigBuf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return expected === parts.h1;
}

export async function verifyAndParseWebhook(env, request, rawBody) {
  const sig = request.headers.get('Paddle-Signature');
  if (!(await verifyPaddleSignature(env, rawBody, sig))) return null;
  const event = JSON.parse(rawBody);
  if (event.event_type === 'transaction.completed') {
    const custom = event.data.custom_data || {};
    return { household_id: custom.household_id, plan: custom.plan, status: 'active' };
  }
  return null;
}
