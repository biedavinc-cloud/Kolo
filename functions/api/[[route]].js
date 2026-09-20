import { Hono } from 'hono';
import { makeQuery } from './_lib/db.js';
import { hashPassword, verifyPassword, signToken, verifyToken, publicUser } from './_lib/auth.js';
import { ENTITIES } from './_lib/entities.config.js';

const app = new Hono().basePath('/api');

// Equivalent of the Express server's helmet() — lost in the port to Hono,
// restored here (minimal set relevant to a JSON API, no inline-script needs).
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Cross-Origin-Resource-Policy', 'cross-origin');
});

// --- middleware: attach db + auth to context -------------------------------

app.use('*', async (c, next) => {
  let queryFn;
  c.set('query', (text, params) => {
    if (!queryFn) queryFn = makeQuery(c.env);
    return queryFn(text, params);
  });
  const header = c.req.header('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      c.set('user', await verifyToken(c.env, token));
    } catch {
      c.set('user', null);
    }
  } else {
    c.set('user', null);
  }
  await next();
});

function requireAuth(c, next) {
  if (!c.get('user')) return c.json({ error: 'Non autorisé' }, 401);
  return next();
}
function requireSuperAdmin(c, next) {
  if (!c.get('user')?.is_super_admin) return c.json({ error: 'Réservé aux super administrateurs' }, 403);
  return next();
}

// --- health ------------------------------------------------------------

app.get('/health', (c) => c.json({ ok: true }));

app.get('/health/db', async (c) => {
  try {
    const query = c.get('query');
    await query('select 1', []);
    return c.json({ ok: true, db: 'connected' });
  } catch (err) {
    return c.json({ ok: false, db: 'unreachable', detail: `${err.name}: ${err.message}` }, 500);
  }
});

// --- auth ----------------------------------------------------------------

// Best-effort rate limiting for auth endpoints: per-isolate in-memory counter
// (Express had express-rate-limit; there's no KV/Durable Object bound here to
// do this properly across the whole edge, so this only throttles bursts that
// happen to land on the same warm isolate — better than nothing, not a real
// substitute for one bound to Cloudflare KV/Durable Objects later).
const authAttempts = new Map();
function rateLimitAuth(c, next) {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const entry = authAttempts.get(ip);
  if (entry && now - entry.start < windowMs) {
    if (entry.count >= 20) {
      return c.json({ error: 'Trop de tentatives, réessayez plus tard.' }, 429);
    }
    entry.count += 1;
  } else {
    authAttempts.set(ip, { start: now, count: 1 });
  }
  return next();
}

async function isSuperAdmin(query, email) {
  const { rows } = await query('select role from super_admins where email = $1', [email]);
  return rows[0]?.role || null;
}
async function loadUserPayload(query, userRow) {
  const superAdminRole = await isSuperAdmin(query, userRow.email);
  return { ...userRow, is_super_admin: !!superAdminRole, super_admin_role: superAdminRole };
}

app.post('/auth/register', rateLimitAuth, async (c) => {
  const query = c.get('query');
  const body = await c.req.json().catch(() => ({}));
  const { email, password, full_name } = body || {};
  if (!email || !password) return c.json({ error: 'Email et mot de passe requis' }, 400);
  if (String(password).length < 8) {
    return c.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, 400);
  }
  const existing = await query('select id from users where email = $1', [email.toLowerCase()]);
  if (existing.rows.length) return c.json({ error: 'Un compte existe déjà avec cet email' }, 409);
  const password_hash = await hashPassword(password);
  const { rows } = await query(
    `insert into users (email, password_hash, full_name) values ($1, $2, $3) returning *`,
    [email.toLowerCase(), password_hash, full_name || null]
  );
  const user = await loadUserPayload(query, rows[0]);
  const token = await signToken(c.env, user);
  return c.json({ token, user: publicUser(user) }, 201);
});

app.post('/auth/login', rateLimitAuth, async (c) => {
  const query = c.get('query');
  const body = await c.req.json().catch(() => ({}));
  const { email, password } = body || {};
  if (!email || !password) return c.json({ error: 'Email et mot de passe requis' }, 400);
  const { rows } = await query('select * from users where email = $1', [String(email).toLowerCase()]);
  const row = rows[0];
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    return c.json({ error: 'Identifiants invalides' }, 401);
  }
  const user = await loadUserPayload(query, row);
  const token = await signToken(c.env, user);
  return c.json({ token, user: publicUser(user) });
});

app.get('/auth/me', requireAuth, async (c) => {
  const query = c.get('query');
  const { rows } = await query('select * from users where id = $1', [c.get('user').sub]);
  if (!rows[0]) return c.json({ error: 'Utilisateur introuvable' }, 404);
  const user = await loadUserPayload(query, rows[0]);
  return c.json(publicUser(user));
});

app.put('/auth/me', requireAuth, async (c) => {
  const query = c.get('query');
  const body = (await c.req.json().catch(() => ({}))) || {};
  const REAL_COLUMNS = ['full_name', 'household_id'];

  const columnUpdates = [];
  const values = [];
  let i = 1;
  for (const key of REAL_COLUMNS) {
    if (key in body) {
      columnUpdates.push(`${key} = $${i++}`);
      values.push(body[key]);
    }
  }
  // Everything else (display_name, phone_*, avatar_url, notif_*,
  // display_currency…) is free-form profile data, merged into `users.data`.
  const dataPatch = Object.fromEntries(Object.entries(body).filter(([k]) => !REAL_COLUMNS.includes(k)));
  if (Object.keys(dataPatch).length > 0) {
    columnUpdates.push(`data = data || $${i++}::jsonb`);
    values.push(JSON.stringify(dataPatch));
  }

  if (!columnUpdates.length) return c.json({ error: 'Aucun champ à mettre à jour' }, 400);
  values.push(c.get('user').sub);
  const { rows } = await query(`update users set ${columnUpdates.join(', ')} where id = $${i} returning *`, values);
  const user = await loadUserPayload(query, rows[0]);
  return c.json(publicUser(user));
});

app.post('/auth/logout', (c) => c.json({ ok: true }));

app.post('/auth/reset-password-request', async (c) => {
  const query = c.get('query');
  const body = await c.req.json().catch(() => ({}));
  const { email } = body || {};
  if (email) {
    const { rows } = await query('select id, email from users where email = $1', [String(email).toLowerCase()]);
    if (rows[0]) {
      const resetToken = await signToken(c.env, { id: rows[0].id }, { purpose: 'reset', expiresIn: '15m' });
      if (!c.env.RESEND_API_KEY) {
        console.log(`[reset-password] Pas de fournisseur email configuré. Lien pour ${email}:`);
        console.log(`  ${c.env.FRONTEND_URL || 'http://localhost:5173'}/ResetPassword?token=${resetToken}`);
      }
    }
  }
  return c.json({ ok: true });
});

app.post('/auth/reset-password', async (c) => {
  const query = c.get('query');
  const body = await c.req.json().catch(() => ({}));
  const { token, password } = body || {};
  if (!token || !password) return c.json({ error: 'Token et mot de passe requis' }, 400);
  try {
    const payload = await verifyToken(c.env, token);
    if (payload.purpose !== 'reset') throw new Error('bad purpose');
    const password_hash = await hashPassword(password);
    await query('update users set password_hash = $1 where id = $2', [password_hash, payload.sub]);
    return c.json({ ok: true });
  } catch {
    return c.json({ error: 'Lien de réinitialisation invalide ou expiré' }, 400);
  }
});

app.post('/auth/login-with-provider', (c) =>
  c.json({ error: 'Connexion via fournisseur externe non configurée.' }, 501)
);

// --- household -------------------------------------------------------------

function genInviteCode() {
  return [...crypto.getRandomValues(new Uint8Array(4))].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

app.get('/household', requireAuth, async (c) => {
  const query = c.get('query');
  const user = c.get('user');
  if (!user.household_id) return c.json(null);
  const { rows } = await query('select * from households where id = $1', [user.household_id]);
  return c.json(rows[0] || null);
});

async function reissueToken(c, query, userId) {
  const { rows } = await query('select * from users where id = $1', [userId]);
  const user = await loadUserPayload(query, rows[0]);
  return signToken(c.env, user);
}

app.post('/household', requireAuth, async (c) => {
  const query = c.get('query');
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));
  const { name, currency } = body || {};
  if (!name) return c.json({ error: 'Nom du foyer requis' }, 400);
  const invite_code = genInviteCode();
  const { rows } = await query(
    `insert into households (name, currency, invite_code, created_by_id) values ($1, $2, $3, $4) returning *`,
    [name, currency || 'EUR', invite_code, user.sub]
  );
  const household = rows[0];
  await query('update users set household_id = $1 where id = $2', [household.id, user.sub]);
  // The session token still has the old (null) household_id — reissue one
  // now so the very next request (e.g. bulk-creating default categories)
  // isn't rejected as "no household associated with this account".
  const token = await reissueToken(c, query, user.sub);
  return c.json({ ...household, token }, 201);
});

app.put('/household', requireAuth, async (c) => {
  const query = c.get('query');
  const user = c.get('user');
  if (!user.household_id) return c.json({ error: 'Aucun foyer associé' }, 403);
  const body = (await c.req.json().catch(() => ({}))) || {};
  const allowed = ['name', 'currency'];
  const sets = [];
  const values = [];
  let i = 1;
  for (const key of allowed) {
    if (key in body) {
      sets.push(`${key} = $${i++}`);
      values.push(body[key]);
    }
  }
  if (!sets.length) return c.json({ error: 'Aucun champ à mettre à jour' }, 400);
  values.push(user.household_id);
  const { rows } = await query(`update households set ${sets.join(', ')} where id = $${i} returning *`, values);
  return c.json(rows[0]);
});

app.post('/household/join', requireAuth, async (c) => {
  const query = c.get('query');
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));
  const { invite_code } = body || {};
  if (!invite_code) return c.json({ error: "Code d'invitation requis" }, 400);
  const { rows } = await query('select * from households where invite_code = $1', [invite_code.toUpperCase()]);
  if (!rows[0]) return c.json({ error: 'Code invalide' }, 404);
  if (rows[0].suspended) return c.json({ error: 'Ce foyer est suspendu' }, 403);

  const plan = await effectivePlan(query, rows[0].id);
  const memberLimit = PLAN_LIMITS[plan]?.members;
  if (memberLimit !== null && memberLimit !== undefined) {
    const { rows: countRows } = await query('select count(*)::int as count from users where household_id = $1', [
      rows[0].id,
    ]);
    if (countRows[0].count >= memberLimit) {
      return c.json(
        { error: `Ce foyer a atteint sa limite de ${memberLimit} membre(s) pour son plan actuel.` },
        403
      );
    }
  }

  await query('update users set household_id = $1 where id = $2', [rows[0].id, user.sub]);
  const token = await reissueToken(c, query, user.sub);
  return c.json({ ...rows[0], token });
});

// --- entities-users ----------------------------------------------------

app.get('/entities-users/all', requireAuth, requireSuperAdmin, async (c) => {
  const query = c.get('query');
  const { rows } = await query('select * from users order by created_at desc limit 2000');
  return c.json(rows.map(publicUser));
});

app.get('/entities-users', requireAuth, async (c) => {
  const query = c.get('query');
  const user = c.get('user');
  if (!user.household_id) return c.json([]);
  const { rows } = await query('select * from users where household_id = $1', [user.household_id]);
  return c.json(rows.map(publicUser));
});

app.put('/entities-users/:id', requireAuth, async (c) => {
  const query = c.get('query');
  const user = c.get('user');
  const id = c.req.param('id');
  if (id !== user.sub && !user.is_super_admin) return c.json({ error: 'Non autorisé' }, 403);
  const body = (await c.req.json().catch(() => ({}))) || {};
  const allowed = user.is_super_admin ? ['full_name', 'role', 'household_id'] : ['full_name'];
  const sets = [];
  const values = [];
  let i = 1;
  for (const key of allowed) {
    if (key in body) {
      sets.push(`${key} = $${i++}`);
      values.push(body[key]);
    }
  }
  if (!sets.length) return c.json({ error: 'Aucun champ à mettre à jour' }, 400);
  values.push(id);
  const { rows } = await query(`update users set ${sets.join(', ')} where id = $${i} returning *`, values);
  if (!rows[0]) return c.json({ error: 'Introuvable' }, 404);
  return c.json(publicUser(rows[0]));
});

// --- generic entities --------------------------------------------------

function getEntityConfig(c, next) {
  const cfg = ENTITIES[c.req.param('entity')];
  if (!cfg) return c.json({ error: `Entité inconnue : ${c.req.param('entity')}` }, 404);
  const isWrite = c.req.method !== 'GET';
  const user = c.get('user');
  if ((cfg.superAdminOnly || (cfg.publicRead && isWrite)) && !user?.is_super_admin) {
    return c.json({ error: 'Réservé aux super administrateurs' }, 403);
  }
  c.set('entityConfig', cfg);
  return next();
}

function parseSort(sort, fallback) {
  if (!sort) return fallback;
  const desc = sort.startsWith('-');
  let col = desc ? sort.slice(1) : sort;
  // Alias hérité des noms de champs base44 (created_date) vers la vraie
  // colonne Postgres (created_at) — plusieurs pages du frontend trient
  // encore par "-created_date" (Notification, Announcement, HouseholdAuditLog).
  if (col === 'created_date') col = 'created_at';
  if (col === 'updated_date') col = 'updated_at';
  if (!/^[a-z_]+$/.test(col)) return fallback;
  return `${col} ${desc ? 'desc' : 'asc'}`;
}

function scopeClause(cfg, user, startIndex) {
  const clauses = [];
  const values = [];
  let i = startIndex;
  if (cfg.publicRead) {
    // open read
  } else if (cfg.householdScoped) {
    if (!user.household_id) return { clauses: ['1 = 0'], values: [], next: i };
    clauses.push(`household_id = $${i++}`);
    values.push(user.household_id);
  }
  return { clauses, values, next: i };
}

function buildInsert(cfg, user, body) {
  const cols = [];
  const placeholders = [];
  const values = [];
  let i = 1;
  for (const field of cfg.fields) {
    if (field in body) {
      cols.push(field);
      placeholders.push(`$${i++}`);
      values.push(body[field]);
    }
  }
  if (cfg.householdScoped) {
    cols.push('household_id');
    placeholders.push(`$${i++}`);
    values.push(user.household_id);
  }
  return { cols, placeholders, values };
}

const entities = new Hono();
entities.use('*', requireAuth);
entities.use('/:entity/*', getEntityConfig);
entities.use('/:entity', getEntityConfig);

entities.get('/:entity', async (c) => {
  const query = c.get('query');
  const cfg = c.get('entityConfig');
  const user = c.get('user');
  const where = [];
  const values = [];
  let i = 1;

  const scope = scopeClause(cfg, user, i);
  where.push(...scope.clauses);
  values.push(...scope.values);
  i = scope.next;

  const filterParam = c.req.query('filter');
  if (filterParam) {
    let filterObj = {};
    try {
      filterObj = JSON.parse(filterParam);
    } catch {
      return c.json({ error: 'filter doit être un JSON valide' }, 400);
    }
    for (const [key, val] of Object.entries(filterObj)) {
      if (!cfg.fields.includes(key) && key !== 'household_id') continue;
      where.push(`${key} = $${i++}`);
      values.push(val);
    }
  }

  const sort = parseSort(c.req.query('sort'), cfg.defaultSort);
  const limit = Math.min(parseInt(c.req.query('limit') || '', 10) || 1000, 5000);
  // created_at est aussi exposé sous created_date : plusieurs pages du
  // frontend (héritées des conventions base44) lisent encore ce nom-là.
  const sql = `select *, created_at as created_date from ${cfg.table} ${where.length ? 'where ' + where.join(' and ') : ''} order by ${sort} limit $${i}`;
  values.push(limit);

  const { rows } = await query(sql, values);
  return c.json(rows);
});

entities.get('/:entity/:id', async (c) => {
  const query = c.get('query');
  const cfg = c.get('entityConfig');
  const user = c.get('user');
  const id = c.req.param('id');
  const where = [`id = $1`];
  const values = [id];
  if (cfg.householdScoped && !cfg.publicRead) {
    where.push(`household_id = $2`);
    values.push(user.household_id);
  }
  const { rows } = await query(`select *, created_at as created_date from ${cfg.table} where ${where.join(' and ')}`, values);
  if (!rows[0]) return c.json({ error: 'Introuvable' }, 404);
  return c.json(rows[0]);
});

entities.post('/:entity/bulk', async (c) => {
  const query = c.get('query');
  const cfg = c.get('entityConfig');
  const user = c.get('user');
  const body = await c.req.json().catch(() => []);
  const items = Array.isArray(body) ? body : [];
  const created = [];
  for (const item of items) {
    const { cols, placeholders, values } = buildInsert(cfg, user, item);
    const { rows } = await query(
      `insert into ${cfg.table} (${cols.join(', ')}) values (${placeholders.join(', ')}) returning *`,
      values
    );
    created.push(rows[0]);
  }
  return c.json(created, 201);
});

entities.post('/:entity', async (c) => {
  const query = c.get('query');
  const cfg = c.get('entityConfig');
  const user = c.get('user');
  if (cfg.householdScoped && !user.household_id) {
    return c.json({ error: 'Aucun foyer associé à ce compte' }, 403);
  }

  // Application côté serveur des limites du plan (le contrôle client peut
  // être contourné — celui-ci ne peut pas, il ne dépend que du JWT vérifié
  // et du compte réel en base).
  if (cfg.table === 'accounts') {
    const plan = await effectivePlan(query, user.household_id);
    const limit = PLAN_LIMITS[plan]?.accounts;
    if (limit !== null && limit !== undefined) {
      const { rows: countRows } = await query('select count(*)::int as count from accounts where household_id = $1', [
        user.household_id,
      ]);
      if (countRows[0].count >= limit) {
        return c.json(
          { error: `Votre plan (${plan}) autorise ${limit} compte(s) au maximum. Passez à un plan supérieur.` },
          403
        );
      }
    }
  }

  const body = (await c.req.json().catch(() => ({}))) || {};
  const { cols, placeholders, values } = buildInsert(cfg, user, body);
  const { rows } = await query(
    `insert into ${cfg.table} (${cols.join(', ')}) values (${placeholders.join(', ')}) returning *`,
    values
  );
  return c.json(rows[0], 201);
});

entities.put('/:entity/bulk', async (c) => {
  const query = c.get('query');
  const cfg = c.get('entityConfig');
  const user = c.get('user');
  const body = await c.req.json().catch(() => []);
  const items = Array.isArray(body) ? body : [];
  const updated = [];
  for (const item of items) {
    const { id, ...fields } = item;
    if (!id) continue;
    const sets = [];
    const values = [];
    let i = 1;
    for (const field of cfg.fields) {
      if (field in fields) {
        sets.push(`${field} = $${i++}`);
        values.push(fields[field]);
      }
    }
    if (!sets.length) continue;
    const where = [`id = $${i++}`];
    values.push(id);
    if (cfg.householdScoped) {
      where.push(`household_id = $${i++}`);
      values.push(user.household_id);
    }
    const { rows } = await query(`update ${cfg.table} set ${sets.join(', ')} where ${where.join(' and ')} returning *`, values);
    if (rows[0]) updated.push(rows[0]);
  }
  return c.json(updated);
});

entities.put('/:entity/:id', async (c) => {
  const query = c.get('query');
  const cfg = c.get('entityConfig');
  const user = c.get('user');
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => ({}))) || {};
  const sets = [];
  const values = [];
  let i = 1;
  for (const field of cfg.fields) {
    if (field in body) {
      sets.push(`${field} = $${i++}`);
      values.push(body[field]);
    }
  }
  if (!sets.length) return c.json({ error: 'Aucun champ à mettre à jour' }, 400);
  const where = [`id = $${i++}`];
  values.push(id);
  if (cfg.householdScoped) {
    where.push(`household_id = $${i++}`);
    values.push(user.household_id);
  }
  const { rows } = await query(`update ${cfg.table} set ${sets.join(', ')} where ${where.join(' and ')} returning *`, values);
  if (!rows[0]) return c.json({ error: 'Introuvable' }, 404);
  return c.json(rows[0]);
});

entities.delete('/:entity/:id', async (c) => {
  const query = c.get('query');
  const cfg = c.get('entityConfig');
  const user = c.get('user');
  const id = c.req.param('id');
  const where = [`id = $1`];
  const values = [id];
  if (cfg.householdScoped) {
    where.push(`household_id = $2`);
    values.push(user.household_id);
  }
  const { rows } = await query(`delete from ${cfg.table} where ${where.join(' and ')} returning id`, values);
  if (!rows[0]) return c.json({ error: 'Introuvable' }, 404);
  return c.json({ ok: true });
});

app.route('/entities', entities);

// --- superadmin --------------------------------------------------------

const PLAN_PRICES = { starter: 3, pro: 14, premium: 39, family: 89 };
const PLAN_LIMITS = {
  starter: { accounts: 1, members: 1 },
  pro: { accounts: 3, members: 5 },
  premium: { accounts: 10, members: 10 },
  family: { accounts: null, members: 20 },
};
const PLAN_AI_ENABLED = { starter: false, pro: true, premium: true, family: true };

// Abonnement effectif d'un foyer : essai gratuit (accès complet, comme
// premium) tant qu'il n'a pas expiré, sinon le plan souscrit (starter par
// défaut) — même logique que useSubscription.js côté client, dupliquée ici
// car c'est le serveur qui doit faire foi pour appliquer les limites.
async function effectivePlan(query, householdId) {
  const { rows } = await query('select plan, status, trial_end from subscriptions where household_id = $1', [
    householdId,
  ]);
  const sub = rows[0];
  if (!sub) return 'premium'; // pas encore de ligne subscription -> essai gratuit par défaut
  const today = new Date().toISOString().slice(0, 10);
  const isTrialActive = sub.status === 'trial' && (!sub.trial_end || sub.trial_end >= today);
  if (isTrialActive) return 'premium';
  return sub.plan || 'starter';
}

async function writeAudit(query, user, action, target, details) {
  await query('insert into audit_logs (action, actor_email, target, details) values ($1, $2, $3, $4)', [
    action,
    user.email,
    target || null,
    details ? JSON.stringify(details) : null,
  ]);
}

const superadmin = new Hono();
superadmin.use('*', requireAuth, requireSuperAdmin);

superadmin.get('/dashboard', async (c) => {
  const query = c.get('query');
  const [
    { rows: tenants },
    { rows: users },
    { rows: settingsRows },
    { rows: audit },
    { rows: announcements },
    { rows: kpiRows },
    { rows: mrrByPlanRows },
  ] = await Promise.all([
    query(`
      select h.id, h.name, h.currency, h.suspended, h.created_at as created_date,
             owner.email as owner_email,
             s.plan, s.status, s.trial_end, s.period_end,
             (select count(*)::int from accounts a where a.household_id = h.id) as accounts,
             (select count(*)::int from transactions t where t.household_id = h.id) as transactions
      from households h
      left join users owner on owner.id = h.created_by_id
      left join subscriptions s on s.household_id = h.id
      order by h.created_at desc
      limit 500
    `),
    query(`
      select id, email, full_name, role, household_id, created_at as created_date
      from users order by created_at desc limit 1000
    `),
    query('select * from platform_settings order by updated_at desc limit 1'),
    query('select *, created_at as created_date from audit_logs order by created_at desc limit 50'),
    query('select *, created_at as created_date from announcements order by created_at desc limit 20'),
    query(`
      select
        (select count(*)::int from households) as households_total,
        (select count(*)::int from households where not suspended) as households_active,
        (select count(*)::int from households where suspended) as households_suspended,
        (select count(*)::int from subscriptions where status = 'active') as subscriptions_active,
        (select count(*)::int from subscriptions where status = 'trial') as subscriptions_trial,
        (select count(*)::int from subscriptions where status = 'expired') as subscriptions_expired,
        (select count(*)::int from super_admins) as super_admins
    `),
    query(`
      select plan, count(*)::int as count from subscriptions where status = 'active' group by plan
    `),
  ]);

  const kpis = kpiRows[0] || {};
  const mrr_by_plan = Object.fromEntries(
    mrrByPlanRows.map((r) => [r.plan, (PLAN_PRICES[r.plan] || 0) * r.count])
  );
  kpis.mrr = Object.values(mrr_by_plan).reduce((s, v) => s + v, 0);

  return c.json({
    kpis,
    tenants: tenants.map((t) => ({ ...t, status: t.suspended ? 'suspended' : t.status || 'trial' })),
    users,
    settings: settingsRows[0] || null,
    audit,
    announcements,
    mrr_by_plan,
  });
});

// Dispatcher générique d'actions sensibles (miroir de l'ancien
// `superAdminAction` base44) — regroupe suspend/unsuspend, ajustement
// d'abonnement, suppression de foyer, diffusion, feature flags et
// inspection en lecture seule d'un foyer.
superadmin.post('/action', async (c) => {
  const query = c.get('query');
  const user = c.get('user');
  const body = await c.req.json().catch(() => ({}));
  const { action } = body || {};

  switch (action) {
    case 'suspend_household':
    case 'unsuspend_household': {
      const suspended = action === 'suspend_household';
      const { rows } = await query('update households set suspended = $1 where id = $2 returning *', [
        suspended,
        body.household_id,
      ]);
      if (!rows[0]) return c.json({ error: 'Foyer introuvable' }, 404);
      await writeAudit(query, user, suspended ? 'household.suspend' : 'household.unsuspend', body.household_id);
      return c.json(rows[0]);
    }

    case 'adjust_subscription': {
      const { household_id, plan, status } = body;
      const { rows } = await query(
        `insert into subscriptions (household_id, plan, status) values ($1, $2, $3)
         on conflict (household_id) do update set plan = coalesce($2, subscriptions.plan), status = coalesce($3, subscriptions.status)
         returning *`,
        [household_id, plan || null, status || null]
      );
      await writeAudit(query, user, 'subscription.adjust', household_id, { plan, status });
      return c.json(rows[0]);
    }

    case 'delete_household': {
      const { household_id } = body;
      const { rows } = await query('delete from households where id = $1 returning id, name', [household_id]);
      if (!rows[0]) return c.json({ error: 'Foyer introuvable' }, 404);
      await writeAudit(query, user, 'household.delete', household_id, { name: rows[0].name });
      return c.json({ ok: true });
    }

    case 'broadcast': {
      const { title, message } = body;
      if (!title?.trim() || !message?.trim()) return c.json({ error: 'Titre et message requis' }, 400);
      const { rows } = await query(
        'insert into announcements (title, message, created_by) values ($1, $2, $3) returning *',
        [title.trim(), message.trim(), user.email]
      );
      await writeAudit(query, user, 'announcement.broadcast', null, { title });
      return c.json(rows[0], 201);
    }

    case 'set_maintenance':
    case 'set_flag': {
      const { rows: existing } = await query('select id from platform_settings order by updated_at desc limit 1');
      const patch =
        action === 'set_maintenance'
          ? { maintenance_mode: !!body.value }
          : { [body.flag]: !!body.value };
      let row;
      if (existing[0]) {
        const { rows } = await query(
          `update platform_settings set
             maintenance_mode = coalesce($1, maintenance_mode),
             flag_ai_assistant = coalesce($2, flag_ai_assistant),
             flag_rapports_avances = coalesce($3, flag_rapports_avances),
             updated_by = $4
           where id = $5 returning *`,
          [patch.maintenance_mode, patch.flag_ai_assistant, patch.flag_rapports_avances, user.email, existing[0].id]
        );
        row = rows[0];
      } else {
        const { rows } = await query(
          `insert into platform_settings (maintenance_mode, flag_ai_assistant, flag_rapports_avances, updated_by)
           values ($1, $2, $3, $4) returning *`,
          [
            !!patch.maintenance_mode,
            patch.flag_ai_assistant !== false,
            patch.flag_rapports_avances !== false,
            user.email,
          ]
        );
        row = rows[0];
      }
      await writeAudit(query, user, `platform_settings.${action}`, null, patch);
      return c.json(row);
    }

    case 'inspect_household': {
      const { household_id } = body;
      const [{ rows: households }, { rows: subs }, { rows: accounts }, { rows: transactions }, { rows: budgets }] =
        await Promise.all([
          query('select id, name, currency, suspended, created_at as created_date from households where id = $1', [
            household_id,
          ]),
          query('select plan, status from subscriptions where household_id = $1', [household_id]),
          query('select id, name, balance, currency from accounts where household_id = $1 order by created_at', [
            household_id,
          ]),
          query(
            'select id, amount, type, date, notes from transactions where household_id = $1 order by date desc limit 20',
            [household_id]
          ),
          query('select id, month_year, amount_limit from budgets where household_id = $1 order by month_year desc', [
            household_id,
          ]),
        ]);
      if (!households[0]) return c.json({ error: 'Foyer introuvable' }, 404);
      return c.json({
        household: households[0],
        subscription: subs[0] || null,
        accounts,
        transactions,
        budgets,
      });
    }

    default:
      return c.json({ error: `Action inconnue : ${action}` }, 400);
  }
});

superadmin.get('/households', async (c) => {
  const query = c.get('query');
  const { rows } = await query(`
    select h.*, s.plan, s.status as subscription_status, s.trial_end, s.period_end
    from households h
    left join subscriptions s on s.household_id = h.id
    order by h.created_at desc
    limit 500
  `);
  return c.json(rows);
});

superadmin.post('/households/:id/suspend', async (c) => {
  const query = c.get('query');
  const body = await c.req.json().catch(() => ({}));
  const suspended = !!body?.suspended;
  const id = c.req.param('id');
  const { rows } = await query('update households set suspended = $1 where id = $2 returning *', [suspended, id]);
  if (!rows[0]) return c.json({ error: 'Foyer introuvable' }, 404);
  await writeAudit(query, c.get('user'), suspended ? 'household.suspend' : 'household.unsuspend', id);
  return c.json(rows[0]);
});

superadmin.put('/households/:id/subscription', async (c) => {
  const query = c.get('query');
  const body = await c.req.json().catch(() => ({}));
  const { plan, status } = body || {};
  const id = c.req.param('id');
  const { rows } = await query(
    `insert into subscriptions (household_id, plan, status) values ($1, $2, $3)
     on conflict (household_id) do update set plan = coalesce($2, subscriptions.plan), status = coalesce($3, subscriptions.status)
     returning *`,
    [id, plan || null, status || null]
  );
  await writeAudit(query, c.get('user'), 'subscription.adjust', id, { plan, status });
  return c.json(rows[0]);
});

superadmin.put('/platform-settings', async (c) => {
  const query = c.get('query');
  const body = (await c.req.json().catch(() => ({}))) || {};
  const { maintenance_mode, flag_ai_assistant, flag_rapports_avances } = body;
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
      [maintenance_mode, flag_ai_assistant, flag_rapports_avances, c.get('user').email, existing[0].id]
    );
    row = rows[0];
  } else {
    const { rows } = await query(
      `insert into platform_settings (maintenance_mode, flag_ai_assistant, flag_rapports_avances, updated_by)
       values ($1, $2, $3, $4) returning *`,
      [!!maintenance_mode, flag_ai_assistant !== false, flag_rapports_avances !== false, c.get('user').email]
    );
    row = rows[0];
  }
  await writeAudit(query, c.get('user'), 'platform_settings.update', null, body);
  return c.json(row);
});

superadmin.get('/team', async (c) => {
  const query = c.get('query');
  const { rows } = await query('select * from super_admins order by created_at desc');
  return c.json(rows);
});

superadmin.post('/team', async (c) => {
  const query = c.get('query');
  const user = c.get('user');
  const coreAdmins = (c.env.CORE_SUPER_ADMIN_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!coreAdmins.includes(user.email)) return c.json({ error: "Seuls les fondateurs peuvent gérer l'équipe" }, 403);
  const body = await c.req.json().catch(() => ({}));
  const { email, role } = body || {};
  if (!email || !['admin', 'analyste'].includes(role)) {
    return c.json({ error: 'email et role (admin|analyste) requis' }, 400);
  }
  const { rows } = await query(
    `insert into super_admins (email, added_by, role) values ($1, $2, $3)
     on conflict (email) do update set role = $3 returning *`,
    [email.toLowerCase(), user.email, role]
  );
  await writeAudit(query, user, 'superadmin.team.add', email, { role });
  return c.json(rows[0], 201);
});

superadmin.delete('/team/:email', async (c) => {
  const query = c.get('query');
  const user = c.get('user');
  const coreAdmins = (c.env.CORE_SUPER_ADMIN_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!coreAdmins.includes(user.email)) return c.json({ error: "Seuls les fondateurs peuvent gérer l'équipe" }, 403);
  const email = c.req.param('email');
  await query('delete from super_admins where email = $1', [email.toLowerCase()]);
  await writeAudit(query, user, 'superadmin.team.remove', email);
  return c.json({ ok: true });
});

app.route('/superadmin', superadmin);

// --- misc ----------------------------------------------------------------

app.get('/exchange-rates', async (c) => {
  const r = await fetch('https://open.er-api.com/v6/latest/USD', { headers: { Accept: 'application/json' } });
  if (!r.ok) return c.json({ error: 'Service de taux indisponible' }, 502);
  const data = await r.json();
  if (!data?.rates || data.result !== 'success') return c.json({ error: 'Réponse de taux invalide' }, 502);
  return c.json({ base: 'USD', rates: data.rates, updated_at: data.time_last_update_utc || null });
});

// File storage needs an object store in this runtime (no local disk in
// Workers) — wire up a Cloudflare R2 bucket binding to enable this.
app.post('/uploads', requireAuth, async (c) =>
  c.json({ error: "L'envoi de fichiers n'est pas encore configuré (bucket R2 requis)." }, 501)
);

app.post('/ai-assistant', requireAuth, async (c) => {
  if (!c.env.ANTHROPIC_API_KEY) {
    return c.json({ error: 'Assistant IA non configuré (ANTHROPIC_API_KEY manquant).' }, 501);
  }
  const query = c.get('query');
  const user = c.get('user');
  const plan = user.household_id ? await effectivePlan(query, user.household_id) : 'starter';
  if (!PLAN_AI_ENABLED[plan]) {
    return c.json({ error: "L'assistant IA n'est pas inclus dans votre plan actuel." }, 403);
  }
  const body = await c.req.json().catch(() => ({}));
  const message = String(body?.message || '').slice(0, 1000);
  const context = String(body?.context || '').slice(0, 4000);
  if (!message.trim()) return c.json({ error: 'Message vide' }, 400);
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': c.env.ANTHROPIC_API_KEY,
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
  return c.json({ reply: text || "Désolé, je n'ai pas pu générer de réponse." });
});

app.post('/invite', requireAuth, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { to, householdName, inviteCode } = body || {};
  if (!to || !inviteCode) return c.json({ error: 'to et inviteCode requis' }, 400);
  const subject = `Invitation à rejoindre ${householdName || 'un foyer'} sur Kolo`;
  const text = `Vous avez été invité·e à rejoindre "${householdName || 'un foyer'}" sur Kolo.\nCode d'invitation : ${inviteCode}`;
  if (!c.env.RESEND_API_KEY) {
    console.log(`[invite] Pas de fournisseur email configuré. À envoyer à ${to}:\n${subject}\n${text}`);
    return c.json({ ok: true, delivered: false });
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${c.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: c.env.EMAIL_FROM || 'Kolo <onboarding@resend.dev>', to, subject, text }),
  });
  return c.json({ ok: r.ok, delivered: r.ok });
});

// Stripe needs its Node SDK (not loaded here to keep the Worker bundle small
// and avoid Node-runtime assumptions); until it's wired up for this runtime,
// checkout/webhook stay gracefully "not configured", same as when the
// Express server had no STRIPE_SECRET_KEY set.
app.post('/checkout/create', requireAuth, (c) => c.json({ error: 'Paiement non configuré.' }, 501));
app.post('/checkout/webhook', (c) => c.json({ error: 'Webhook Stripe non configuré.' }, 501));

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => {
  console.error(err);
  // Detail temporarily included so the actual cause is visible in the
  // browser Network tab while we're bringing this deployment up — remove
  // once things are confirmed stable.
  return c.json({ error: 'Erreur serveur inattendue', detail: `${err.name}: ${err.message}` }, 500);
});

export const onRequest = (context) => app.fetch(context.request, context.env, context);
