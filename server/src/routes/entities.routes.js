import { Router } from 'express';
import { query } from '../db.js';
import { ENTITIES } from '../entities.config.js';
import { requireAuth } from '../middleware/auth.js';

export const entitiesRouter = Router();
entitiesRouter.use(requireAuth);

function getConfig(req, res, next) {
  const cfg = ENTITIES[req.params.entity];
  if (!cfg) return res.status(404).json({ error: `Entité inconnue : ${req.params.entity}` });
  const isWrite = req.method !== 'GET';
  // Les entités superAdminOnly sont bloquées pour tout non-admin (lecture + écriture).
  // Les entités publicRead (ex: Announcement) sont en lecture libre mais l'écriture
  // reste réservée aux super admins.
  if ((cfg.superAdminOnly || (cfg.publicRead && isWrite)) && !req.user.is_super_admin) {
    return res.status(403).json({ error: 'Réservé aux super administrateurs' });
  }
  req.entityConfig = cfg;
  next();
}
entitiesRouter.use('/:entity', getConfig);

function parseSort(sort, fallback) {
  if (!sort) return fallback;
  const desc = sort.startsWith('-');
  const col = desc ? sort.slice(1) : sort;
  // n'autorise que des noms de colonnes simples pour éviter toute injection SQL
  if (!/^[a-z_]+$/.test(col)) return fallback;
  return `${col} ${desc ? 'desc' : 'asc'}`;
}

function scopeClause(cfg, req, startIndex) {
  const clauses = [];
  const values = [];
  let i = startIndex;
  if (cfg.publicRead) {
    // lecture ouverte, pas de filtre supplémentaire
  } else if (cfg.householdScoped) {
    if (!req.user.household_id) return { clauses: ['1 = 0'], values: [] }; // aucun foyer -> aucune donnée
    clauses.push(`household_id = $${i++}`);
    values.push(req.user.household_id);
  } else if (!cfg.superAdminOnly) {
    // Entité globale non-superadmin (ex: Household) : gérée par des routes dédiées,
    // ici on ne restreint pas davantage au niveau générique.
  }
  return { clauses, values, next: i };
}

// GET /api/entities/:entity  -> list() / filter()
entitiesRouter.get('/:entity', async (req, res) => {
  const cfg = req.entityConfig;
  const where = [];
  const values = [];
  let i = 1;

  const scope = scopeClause(cfg, req, i);
  where.push(...scope.clauses);
  values.push(...scope.values);
  i = scope.next ?? i;

  if (req.query.filter) {
    let filterObj = {};
    try {
      filterObj = JSON.parse(req.query.filter);
    } catch {
      return res.status(400).json({ error: 'filter doit être un JSON valide' });
    }
    for (const [key, val] of Object.entries(filterObj)) {
      if (!cfg.fields.includes(key) && key !== 'household_id') continue;
      where.push(`${key} = $${i++}`);
      values.push(val);
    }
  }

  const sort = parseSort(req.query.sort, cfg.defaultSort);
  const limit = Math.min(parseInt(req.query.limit, 10) || 1000, 5000);
  const sql = `select * from ${cfg.table} ${where.length ? 'where ' + where.join(' and ') : ''} order by ${sort} limit $${i}`;
  values.push(limit);

  try {
    const { rows } = await query(sql, values);
    res.json(rows);
  } catch (err) {
    console.error(`list ${cfg.table} error:`, err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/entities/:entity/:id
entitiesRouter.get('/:entity/:id', async (req, res) => {
  const cfg = req.entityConfig;
  const where = [`id = $1`];
  const values = [req.params.id];
  if (cfg.householdScoped && !cfg.publicRead) {
    where.push(`household_id = $2`);
    values.push(req.user.household_id);
  }
  const { rows } = await query(`select * from ${cfg.table} where ${where.join(' and ')}`, values);
  if (!rows[0]) return res.status(404).json({ error: 'Introuvable' });
  res.json(rows[0]);
});

function buildInsert(cfg, req, body) {
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
    values.push(req.user.household_id);
  }
  return { cols, placeholders, values };
}

// POST /api/entities/:entity  -> create()
entitiesRouter.post('/:entity', async (req, res) => {
  const cfg = req.entityConfig;
  if (cfg.householdScoped && !req.user.household_id) {
    return res.status(403).json({ error: 'Aucun foyer associé à ce compte' });
  }
  const { cols, placeholders, values } = buildInsert(cfg, req, req.body || {});
  try {
    const { rows } = await query(
      `insert into ${cfg.table} (${cols.join(', ')}) values (${placeholders.join(', ')}) returning *`,
      values
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(`create ${cfg.table} error:`, err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/entities/:entity/bulk -> bulkCreate()
entitiesRouter.post('/:entity/bulk', async (req, res) => {
  const cfg = req.entityConfig;
  const items = Array.isArray(req.body) ? req.body : [];
  const created = [];
  try {
    for (const item of items) {
      const { cols, placeholders, values } = buildInsert(cfg, req, item);
      const { rows } = await query(
        `insert into ${cfg.table} (${cols.join(', ')}) values (${placeholders.join(', ')}) returning *`,
        values
      );
      created.push(rows[0]);
    }
    res.status(201).json(created);
  } catch (err) {
    console.error(`bulkCreate ${cfg.table} error:`, err);
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/entities/:entity/:id  -> update()
entitiesRouter.put('/:entity/:id', async (req, res) => {
  const cfg = req.entityConfig;
  const body = req.body || {};
  const sets = [];
  const values = [];
  let i = 1;
  for (const field of cfg.fields) {
    if (field in body) {
      sets.push(`${field} = $${i++}`);
      values.push(body[field]);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });

  const where = [`id = $${i++}`];
  values.push(req.params.id);
  if (cfg.householdScoped) {
    where.push(`household_id = $${i++}`);
    values.push(req.user.household_id);
  }

  const { rows } = await query(
    `update ${cfg.table} set ${sets.join(', ')} where ${where.join(' and ')} returning *`,
    values
  );
  if (!rows[0]) return res.status(404).json({ error: 'Introuvable' });
  res.json(rows[0]);
});

// PUT /api/entities/:entity/bulk -> bulkUpdate() ; body: [{id, ...fields}]
entitiesRouter.put('/:entity/bulk', async (req, res) => {
  const cfg = req.entityConfig;
  const items = Array.isArray(req.body) ? req.body : [];
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
      values.push(req.user.household_id);
    }
    const { rows } = await query(
      `update ${cfg.table} set ${sets.join(', ')} where ${where.join(' and ')} returning *`,
      values
    );
    if (rows[0]) updated.push(rows[0]);
  }
  res.json(updated);
});

// DELETE /api/entities/:entity/:id
entitiesRouter.delete('/:entity/:id', async (req, res) => {
  const cfg = req.entityConfig;
  const where = [`id = $1`];
  const values = [req.params.id];
  if (cfg.householdScoped) {
    where.push(`household_id = $2`);
    values.push(req.user.household_id);
  }
  const { rows } = await query(`delete from ${cfg.table} where ${where.join(' and ')} returning id`, values);
  if (!rows[0]) return res.status(404).json({ error: 'Introuvable' });
  res.json({ ok: true });
});
