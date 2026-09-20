import { planById, TRIAL_DAYS } from '../../../shared/plans.js';

// Calcule l'état réel de l'abonnement d'un foyer, coté serveur — c'est cette
// version qui fait autorité, pas l'équivalent côté client (src/lib/useSubscription.js,
// qui ne sert qu'à l'affichage). Sans ce module, un utilisateur pouvait
// continuer à écrire des données après expiration de son essai/abonnement en
// appelant l'API directement, en contournant l'UI.
export async function getSubscriptionState(query, householdId) {
  if (!householdId) return { plan: 'starter', isExpired: false, isTrial: false, subscription: null };

  const { rows } = await query('select * from subscriptions where household_id = $1', [householdId]);
  let subscription = rows[0];

  if (!subscription) {
    const trialEnd = new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString().slice(0, 10);
    const inserted = await query(
      `insert into subscriptions (household_id, plan, status, trial_end) values ($1, 'starter', 'trial', $2)
       on conflict (household_id) do nothing returning *`,
      [householdId, trialEnd]
    );
    subscription = inserted.rows[0] || (await query('select * from subscriptions where household_id = $1', [householdId])).rows[0];
  }

  const today = new Date().toISOString().slice(0, 10);
  const isTrial = subscription.status === 'trial' && (!subscription.trial_end || subscription.trial_end >= today);
  const isExpired =
    subscription.status === 'expired' ||
    (subscription.status === 'trial' && subscription.trial_end && subscription.trial_end < today);
  // Pendant l'essai : accès complet (Premium), comme côté frontend. Ensuite : plan choisi.
  const plan = isTrial ? 'premium' : subscription.plan || 'starter';

  return { plan, isExpired, isTrial, subscription };
}

// Middleware Hono : bloque les écritures (pas les lectures) sur les entités
// d'un foyer dont l'abonnement est expiré. Les entités superAdminOnly ou
// publicRead (annonces, réglages plateforme) ne sont pas concernées.
export function requireActiveSubscription(cfg) {
  return async (c, next) => {
    if (c.req.method === 'GET') return next();
    if (!cfg.householdScoped) return next();
    const user = c.get('user');
    if (!user?.household_id) return next(); // pas de foyer -> la route elle-même renverra une erreur adaptée
    const query = c.get('query');
    const { isExpired } = await getSubscriptionState(query, user.household_id);
    if (isExpired) {
      return c.json({ error: "Abonnement expiré. Choisissez un plan pour continuer à modifier vos données.", code: 'subscription_expired' }, 402);
    }
    return next();
  };
}

// Vérifie qu'ajouter une nouvelle ressource ne dépasse pas la limite du plan
// (comptes bancaires, membres du foyer…). limitKey référence
// plan.limits[limitKey] ; null/undefined = illimité.
export async function checkPlanLimit(query, householdId, limitKey, countQuery, countParams) {
  const { plan } = await getSubscriptionState(query, householdId);
  const limit = planById(plan).limits[limitKey];
  if (limit === null || limit === undefined) return { ok: true };
  const { rows } = await query(countQuery, countParams);
  const current = Number(rows[0]?.count || 0);
  if (current >= limit) {
    return { ok: false, limit, current };
  }
  return { ok: true };
}
