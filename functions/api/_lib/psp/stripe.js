// Intégration Stripe Checkout — https://docs.stripe.com/api/checkout/sessions/create
// Non testée en conditions réelles (aucune clé API disponible dans cet
// environnement de build) : suit fidèlement le contrat documenté par Stripe,
// à vérifier avec de vraies clés de test avant mise en production.

export const id = 'stripe';
export const label = 'Carte bancaire (Stripe)';

export function isConfigured(env) {
  return !!env.STRIPE_SECRET_KEY;
}

function formEncode(obj, prefix = '') {
  const parts = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      parts.push(formEncode(v, key));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
    }
  }
  return parts.join('&');
}

export async function createCheckoutSession(env, ctx) {
  const body = formEncode({
    mode: 'subscription',
    success_url: ctx.successUrl,
    cancel_url: ctx.cancelUrl,
    customer_email: ctx.email,
    client_reference_id: ctx.household_id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(ctx.amountUsd * 100),
          recurring: { interval: 'month' },
          product_data: { name: `Kolo — Plan ${ctx.planLabel}` },
        },
      },
    ],
    metadata: { household_id: ctx.household_id, plan: ctx.plan },
  });

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || 'Stripe: échec de création de session');
  return { url: data.url };
}

// Vérifie la signature du webhook Stripe (HMAC-SHA256 sur "timestamp.body")
// sans dépendre du SDK Node de Stripe (non garanti compatible Workers).
async function verifyStripeSignature(env, rawBody, sigHeader) {
  if (!env.STRIPE_WEBHOOK_SECRET || !sigHeader) return false;
  const parts = Object.fromEntries(sigHeader.split(',').map((p) => p.split('=')));
  const signedPayload = `${parts.t}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expected = [...new Uint8Array(sigBuf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return expected === parts.v1;
}

export async function verifyAndParseWebhook(env, request, rawBody) {
  const sig = request.headers.get('Stripe-Signature');
  if (!(await verifyStripeSignature(env, rawBody, sig))) return null;
  const event = JSON.parse(rawBody);
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    return {
      household_id: session.client_reference_id || session.metadata?.household_id,
      plan: session.metadata?.plan,
      status: 'active',
    };
  }
  return null;
}
