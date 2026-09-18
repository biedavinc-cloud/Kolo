import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const miscRouter = Router();

// ---------------------------------------------------------------------------
// Taux de change (portage direct de server/legacy-base44/functions/entry.ts —
// aucune dépendance Base44, fonctionne tel quel).
// ---------------------------------------------------------------------------
miscRouter.get('/exchange-rates', async (_req, res) => {
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD', { headers: { Accept: 'application/json' } });
    if (!r.ok) return res.status(502).json({ error: 'Service de taux indisponible' });
    const data = await r.json();
    if (!data?.rates || data.result !== 'success') {
      return res.status(502).json({ error: 'Réponse de taux invalide' });
    }
    res.json({ base: 'USD', rates: data.rates, updated_at: data.time_last_update_utc || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Upload de fichiers (reçus, avatars…)
// Stockage local sous server/uploads/ pour le dev. En production, remplacez
// ce handler par un upload vers S3 / Cloudflare R2 / Cloudinary : le disque
// local d'un serveur Node hébergé (Railway, Render, Fly...) n'est pas
// persistant entre déploiements.
// ---------------------------------------------------------------------------
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

miscRouter.post('/uploads', requireAuth, async (req, res) => {
  const { filename, data_url } = req.body || {};
  if (!data_url || !data_url.startsWith('data:')) {
    return res.status(400).json({ error: 'data_url (base64) requis' });
  }
  try {
    const [, meta, b64] = data_url.match(/^data:(.+);base64,(.+)$/) || [];
    if (!b64) return res.status(400).json({ error: 'data_url invalide' });
    const ext = (filename && path.extname(filename)) || `.${(meta.split('/')[1] || 'bin').split('+')[0]}`;
    const safeName = `${crypto.randomUUID()}${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, safeName), Buffer.from(b64, 'base64'));
    const base = process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 8787}`;
    res.status(201).json({ file_url: `${base}/uploads/${safeName}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Assistant IA (portage de entry (1).ts). Nécessite ANTHROPIC_API_KEY.
// ---------------------------------------------------------------------------
miscRouter.post('/ai-assistant', requireAuth, async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(501).json({ error: "Assistant IA non configuré (ANTHROPIC_API_KEY manquant côté serveur)." });
  }
  const message = String(req.body?.message || '').slice(0, 1000);
  const context = String(req.body?.context || '').slice(0, 4000);
  if (!message.trim()) return res.status(400).json({ error: 'Message vide' });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: "Tu es l'assistant financier de Kolo. Réponds en français, de façon concise.",
        messages: [{ role: 'user', content: context ? `Contexte:\n${context}\n\nQuestion: ${message}` : message }],
      }),
    });
    const data = await r.json();
    const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
    res.json({ reply: text || "Désolé, je n'ai pas pu générer de réponse." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Invitation par email (portage de entry (3).ts). Nécessite RESEND_API_KEY,
// sinon le lien est simplement loggé côté serveur (utile en dev).
// ---------------------------------------------------------------------------
miscRouter.post('/invite', requireAuth, async (req, res) => {
  const { to, householdName, inviteCode } = req.body || {};
  if (!to || !inviteCode) return res.status(400).json({ error: 'to et inviteCode requis' });

  const subject = `Invitation à rejoindre ${householdName || 'un foyer'} sur Kolo`;
  const body = `Vous avez été invité·e à rejoindre "${householdName || 'un foyer'}" sur Kolo.\nCode d'invitation : ${inviteCode}`;

  if (!process.env.RESEND_API_KEY) {
    console.log(`[invite] Pas de fournisseur email configuré. À envoyer à ${to} :\n${subject}\n${body}`);
    return res.json({ ok: true, delivered: false });
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Kolo <onboarding@resend.dev>',
        to,
        subject,
        text: body,
      }),
    });
    res.json({ ok: r.ok, delivered: r.ok });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Paiement Stripe (portage de entry (4).ts et entry (5).ts).
// Nécessite STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET + les price IDs Stripe
// réels (ceux archivés dans legacy-base44 appartiennent au compte Stripe de
// Base44 et ne fonctionneront pas ici).
// ---------------------------------------------------------------------------
const PRICE_ENV = {
  starter: 'STRIPE_PRICE_STARTER',
  pro: 'STRIPE_PRICE_PRO',
  premium: 'STRIPE_PRICE_PREMIUM',
  family: 'STRIPE_PRICE_FAMILY',
};

miscRouter.post('/checkout/create', requireAuth, async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(501).json({ error: 'Paiement non configuré (STRIPE_SECRET_KEY manquant).' });
  }
  const { plan } = req.body || {};
  const priceId = process.env[PRICE_ENV[plan]];
  if (!priceId) return res.status(400).json({ error: `Plan inconnu ou price Stripe non configuré : ${plan}` });

  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontend}/Settings?checkout=success`,
      cancel_url: `${frontend}/Abonnement?checkout=cancelled`,
      client_reference_id: req.user.household_id || '',
      customer_email: req.user.email,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Le webhook a besoin du corps brut (raw) pour vérifier la signature Stripe —
// il est monté séparément dans index.js avec express.raw().
export async function stripeWebhookHandler(req, res) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(501).json({ error: 'Webhook Stripe non configuré.' });
  }
  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const householdId = session.client_reference_id;
      if (householdId) {
        await query(
          `insert into subscriptions (household_id, plan, status, stripe_customer_id, stripe_subscription_id)
           values ($1, 'pro', 'active', $2, $3)
           on conflict (household_id) do update set status = 'active', stripe_customer_id = $2, stripe_subscription_id = $3`,
          [householdId, session.customer, session.subscription]
        );
      }
    }
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      await query(`update subscriptions set status = 'expired' where stripe_subscription_id = $1`, [sub.id]);
    }
    res.json({ received: true });
  } catch (err) {
    console.error('stripe webhook error:', err.message);
    res.status(400).json({ error: `Webhook signature invalide : ${err.message}` });
  }
}
