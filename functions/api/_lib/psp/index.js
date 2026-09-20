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
