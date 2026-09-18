const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

const PLANS = ['starter', 'pro', 'premium', 'family'];

// Validation manuelle de la signature Stripe (HMAC-SHA256) — sans dépendance externe
async function verifySignature(body, sigHeader, secret) {
  const elements = String(sigHeader || '').split(',').map((p) => p.split('=').map((s) => s.trim()));
  let ts = '';
  const sigs = [];
  for (const [k, v] of elements) {
    if (k === 't') ts = v;
    if (k === 'v1') sigs.push(v);
  }
  if (!ts || sigs.length === 0) return false;
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (age > 300) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${ts}.${body}`));
  const hex = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return sigs.some((s) => s === hex);
}

function isoDate(seconds) {
  return seconds ? new Date(seconds * 1000).toISOString().slice(0, 10) : null;
}

async function stripeGet(path) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${secrets.get('STRIPE_SECRET_KEY')}`,
      'Stripe-Version': '2025-10-29.clover',
    },
  });
  return res.json();
}

async function updateSubscriptionRecord(svc, householdId, data) {
  const subs = await svc.entities.Subscription.filter({ household_id: householdId });
  if (subs.length > 0) {
    await svc.entities.Subscription.update(subs[0].id, data);
  } else {
    await svc.entities.Subscription.create({
      household_id: householdId,
      plan: data.plan || 'starter',
      status: data.status || 'active',
      period_end: data.period_end || undefined,
    });
  }
}

export default async function (req) {
  try {
    const body = await req.text();
    const valid = await verifySignature(body, req.headers.get('stripe-signature'), secrets.get('STRIPE_WEBHOOK_SECRET'));
    if (!valid) return Response.json({ error: 'Signature invalide' }, { status: 400 });

    const event = JSON.parse(body);
    const base44 = createClientFromRequest(req);
    const svc = db.asServiceRole;

    if (event.type === 'checkout.session.completed') {
      const s = event.data.object;
      const householdId = s.metadata?.household_id || s.client_reference_id;
      const plan = PLANS.includes(s.metadata?.plan) ? s.metadata.plan : null;
      if (!householdId) return Response.json({ received: true });
      let periodEnd = null;
      if (s.subscription) {
        const sub = await stripeGet(`/subscriptions/${s.subscription}`);
        periodEnd = isoDate(sub.current_period_end);
      }
      const data = { status: 'active' };
      if (plan) data.plan = plan;
      if (periodEnd) data.period_end = periodEnd;
      await updateSubscriptionRecord(svc, householdId, data);
      return Response.json({ received: true });
    }

    if (event.type === 'invoice.payment_succeeded') {
      const inv = event.data.object;
      const householdId = inv.subscription_details?.metadata?.household_id || inv.metadata?.household_id;
      if (householdId) {
        const periodEnd = isoDate(inv.period_end);
        if (periodEnd) await updateSubscriptionRecord(svc, householdId, { status: 'active', period_end: periodEnd });
      }
      return Response.json({ received: true });
    }

    if (event.type === 'invoice.payment_failed') {
      const inv = event.data.object;
      const householdId = inv.subscription_details?.metadata?.household_id || inv.metadata?.household_id;
      if (householdId) await updateSubscriptionRecord(svc, householdId, { status: 'expired' });
      return Response.json({ received: true });
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const householdId = sub.metadata?.household_id;
      if (householdId) await updateSubscriptionRecord(svc, householdId, { status: 'expired' });
      return Response.json({ received: true });
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('stripeWebhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}