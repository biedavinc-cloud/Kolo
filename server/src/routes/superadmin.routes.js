import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js';

export const superadminRouter = Router();
superadminRouter.use(requireAuth, requireSuperAdmin);

const PLAN_PRICES = { starter: 3, pro: 14, premium: 39, family: 89 };

async function writeAudit(req, action, target, details) {
  await query(
    'insert into audit_logs (action, actor_email, target, details) values ($1, $2, $3, $4)',
    [action, req.user.email, target || null, details ? JSON.stringify(details) : null]
  );
}

// GET /api/superadmin/dashboard -> KPIs plateforme, foyers, réglages, audit
superadminRouter.get('/dashboard', async (_req, res) => {
  const [{ rows: householdsCount }, { rows: subs }, { rows: settings }, { rows: audit }] = await Promise.all([
    query('select count(*)::int as count from households'),
    query("select plan, status, count(*)::int as count from subscriptions group by plan, status"),
    query('select * from platform_settings order by updated_at desc limit 1'),
    query('select * from audit_logs order by created_at desc limit 50'),
  ]);

  const mrr = subs.reduce((sum, s) => {
    if (s.status !== 'active') return sum;
    return sum + (PLAN_PRICES[s.plan] || 0) * s.count;
  }, 0);

  res.json({
    households_count: householdsCount[0]?.count || 0,
    subscriptions_by_plan_status: subs,
    mrr_estimate_usd: mrr,
    platform_settings: settings[0] || null,
    recent_audit: audit,
  });
});

// GET /api/superadmin/households -> liste des foyers (tenants) avec leur abonnement
superadminRouter.get('/households', async (_req, res) => {
  const { rows } = await query(`
    select h.*, s.plan, s.status as subscription_status, s.trial_end, s.period_end
    from households h
    left join subscriptions s on s.household_id = h.id
    order by h.created_at desc
    limit 500
  `);
  res.json(rows);
});

// POST /api/superadmin/households/:id/suspend  { suspended: true|false }
superadminRouter.post('/households/:id/suspend', async (req, res) => {
  const suspended = !!req.body?.suspended;
  const { rows } = await query('update households set suspended = $1 where id = $2 returning *', [suspended, req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Foyer introuvable' });
  await writeAudit(req, suspended ? 'household.suspend' : 'household.unsuspend', req.params.id);
  res.json(rows[0]);
});

// PUT /api/superadmin/households/:id/subscription  { plan, status }
superadminRouter.put('/households/:id/subscription', async (req, res) => {
  const { plan, status } = req.body || {};
  const { rows } = await query(
    `insert into subscriptions (household_id, plan, status)
     values ($1, $2, $3)
     on conflict (household_id) do update set plan = coalesce($2, subscriptions.plan), status = coalesce($3, subscriptions.status)
     returning *`,
    [req.params.id, plan || null, status || null]
  );
  await writeAudit(req, 'subscription.adjust', req.params.id, { plan, status });
  res.json(rows[0]);
});

// PUT /api/superadmin/platform-settings
superadminRouter.put('/platform-settings', async (req, res) => {
  const { maintenance_mode, flag_ai_assistant, flag_rapports_avances } = req.body || {};
  const { rows: existing } = await query('select id from platform_settings order by updated_at desc limit 1');
  let row;
  if (existing[0]) {
    const { rows } = await query(
      `update platform_settings set
         maintenance_mode = coalesce($1, maintenance_mode),
         flag_ai_assistant = coalesce($2, flag_ai_assistant),
         flag_rapports_avances = coalesce($3, flag_rapports_avances),
         updated_by = $4
       where id = $5 returning *`,
      [maintenance_mode, flag_ai_assistant, flag_rapports_avances, req.user.email, existing[0].id]
    );
    row = rows[0];
  } else {
    const { rows } = await query(
      `insert into platform_settings (maintenance_mode, flag_ai_assistant, flag_rapports_avances, updated_by)
       values ($1, $2, $3, $4) returning *`,
      [!!maintenance_mode, flag_ai_assistant !== false, flag_rapports_avances !== false, req.user.email]
    );
    row = rows[0];
  }
  await writeAudit(req, 'platform_settings.update', null, req.body);
  res.json(row);
});

// Équipe Super Admin (portage de entry (2).ts)
const CORE_SUPER_ADMINS = (process.env.CORE_SUPER_ADMIN_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);

superadminRouter.get('/team', async (_req, res) => {
  const { rows } = await query('select * from super_admins order by created_at desc');
  res.json(rows);
});

superadminRouter.post('/team', async (req, res) => {
  if (!CORE_SUPER_ADMINS.includes(req.user.email)) {
    return res.status(403).json({ error: "Seuls les fondateurs peuvent gérer l'équipe" });
  }
  const { email, role } = req.body || {};
  if (!email || !['admin', 'analyste'].includes(role)) {
    return res.status(400).json({ error: 'email et role (admin|analyste) requis' });
  }
  const { rows } = await query(
    `insert into super_admins (email, added_by, role) values ($1, $2, $3)
     on conflict (email) do update set role = $3 returning *`,
    [email.toLowerCase(), req.user.email, role]
  );
  await writeAudit(req, 'superadmin.team.add', email, { role });
  res.status(201).json(rows[0]);
});

superadminRouter.delete('/team/:email', async (req, res) => {
  if (!CORE_SUPER_ADMINS.includes(req.user.email)) {
    return res.status(403).json({ error: "Seuls les fondateurs peuvent gérer l'équipe" });
  }
  await query('delete from super_admins where email = $1', [req.params.email.toLowerCase()]);
  await writeAudit(req, 'superadmin.team.remove', req.params.email);
  res.json({ ok: true });
});
