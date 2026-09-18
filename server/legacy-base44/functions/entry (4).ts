import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

// Plans Kolo -> prix Stripe (abonnement mensuel USD)
const PRICES = {
  starter: 'price_1UGl5LRhcVRS1qEcg4Sroeca',
  pro: 'price_1UGl5LRhcVRS1qEcl3I1xkWB',
  premium: 'price_1UGl5LRhcVRS1qEcNNKNRK4B',
  family: 'price_1UGl5LRhcVRS1qEcNmtAtJsu',
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ error: 'Utilisateur non authentifié' }, { status: 401 });

    const householdId = user.data?.household_id;
    if (!householdId) return Response.json({ error: 'Aucun foyer rattaché à ce compte' }, { status: 400 });

    const payload = await req.json().catch(() => ({}));
    const plan = String(payload?.plan || '');
    if (!PRICES[plan]) return Response.json({ error: 'Plan inconnu' }, { status: 400 });

    let origin = '';
    try {
      origin = new URL(String(payload?.origin || '')).origin;
    } catch (e) {
      return Response.json({ error: 'Origine invalide' }, { status: 400 });
    }

    const appId = Deno.env.get('BASE44_APP_ID') || '';
    const body = new URLSearchParams();
    body.append('mode', 'subscription');
    body.append('line_items[0][price]', PRICES[plan]);
    body.append('line_items[0][quantity]', '1');
    body.append('success_url', `${origin}/abonnement?checkout=success`);
    body.append('cancel_url', `${origin}/abonnement?checkout=cancelled`);
    body.append('client_reference_id', householdId);
    body.append('allow_promotion_codes', 'true');
    body.append('metadata[base44_app_id]', appId);
    body.append('metadata[household_id]', householdId);
    body.append('metadata[plan]', plan);
    body.append('subscription_data[metadata][base44_app_id]', appId);
    body.append('subscription_data[metadata][household_id]', householdId);
    body.append('subscription_data[metadata][plan]', plan);

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secrets.get('STRIPE_SECRET_KEY')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': '2025-10-29.clover',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body,
    });
    const session = await res.json();
    if (!res.ok) {
      console.error('Stripe checkout error:', session?.error?.message);
      return Response.json({ error: session?.error?.message || 'Erreur Stripe' }, { status: 502 });
    }
    return Response.json({ url: session.url });
  } catch (error) {
    console.error('stripeCheckout error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}