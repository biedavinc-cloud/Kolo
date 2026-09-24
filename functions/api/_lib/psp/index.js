import * as stripe from './stripe.js';
import * as paystack from './paystack.js';
import * as flutterwave from './flutterwave.js';
import * as payunit from './payunit.js';
import * as paddle from './paddle.js';

export const PROVIDERS = { stripe, paystack, flutterwave, payunit, paddle };

export function availableProviders(env) {
  return Object.values(PROVIDERS)
    .filter((p) => p.isConfigured(env))
    .map((p) => ({ id: p.id, label: p.label }));
}

export function getProvider(env, id) {
  const p = PROVIDERS[id];
  if (!p || !p.isConfigured(env)) return null;
  return p;
}

// Variables lues par chaque PSP — tenu à jour manuellement en miroir de
// isConfigured() dans chaque fichier, pour donner un diagnostic précis
// (jamais les valeurs elles-mêmes, seulement lesquelles sont absentes).
const REQUIRED_VARS = {
  stripe: ['STRIPE_SECRET_KEY'],
  paystack: ['PAYSTACK_SECRET_KEY'],
  flutterwave: ['FLUTTERWAVE_SECRET_KEY'],
  payunit: ['PAYUNIT_API_KEY', 'PAYUNIT_API_USER', 'PAYUNIT_API_PASSWORD', 'PAYUNIT_WEBHOOK_SECRET'],
  paddle: ['PADDLE_API_KEY'],
};

export function diagnoseProviders(env) {
  return Object.entries(PROVIDERS).map(([key, p]) => ({
    id: p.id,
    label: p.label,
    configured: p.isConfigured(env),
    missing: (REQUIRED_VARS[key] || []).filter((v) => !env[v]),
  }));
}
