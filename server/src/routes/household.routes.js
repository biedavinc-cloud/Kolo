import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const householdRouter = Router();
householdRouter.use(requireAuth);

function genInviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// GET /api/household -> le foyer courant de l'utilisateur (equiv. entities.Household.get)
householdRouter.get('/', async (req, res) => {
  if (!req.user.household_id) return res.json(null);
  const { rows } = await query('select * from households where id = $1', [req.user.household_id]);
  res.json(rows[0] || null);
});

// POST /api/household -> crée un foyer et y rattache l'utilisateur courant
householdRouter.post('/', async (req, res) => {
  const { name, currency } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Nom du foyer requis' });
  try {
    const invite_code = genInviteCode();
    const { rows } = await query(
      `insert into households (name, currency, invite_code, created_by_id) values ($1, $2, $3, $4) returning *`,
      [name, currency || 'EUR', invite_code, req.user.sub]
    );
    const household = rows[0];
    await query('update users set household_id = $1 where id = $2', [household.id, req.user.sub]);
    res.status(201).json(household);
  } catch (err) {
    console.error('create household error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/household -> met à jour le foyer courant
householdRouter.put('/', async (req, res) => {
  if (!req.user.household_id) return res.status(403).json({ error: 'Aucun foyer associé' });
  const allowed = ['name', 'currency', 'suspended'];
  const sets = [];
  const values = [];
  let i = 1;
  for (const key of allowed) {
    if (key in (req.body || {})) {
      sets.push(`${key} = $${i++}`);
      values.push(req.body[key]);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
  values.push(req.user.household_id);
  const { rows } = await query(`update households set ${sets.join(', ')} where id = $${i} returning *`, values);
  res.json(rows[0]);
});

// POST /api/household/join -> rejoint un foyer via son code d'invitation
householdRouter.post('/join', async (req, res) => {
  const { invite_code } = req.body || {};
  if (!invite_code) return res.status(400).json({ error: "Code d'invitation requis" });
  const { rows } = await query('select * from households where invite_code = $1', [invite_code.toUpperCase()]);
  if (!rows[0]) return res.status(404).json({ error: 'Code invalide' });
  if (rows[0].suspended) return res.status(403).json({ error: 'Ce foyer est suspendu' });
  await query('update users set household_id = $1 where id = $2', [rows[0].id, req.user.sub]);
  res.json(rows[0]);
});
