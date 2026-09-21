import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.js';
import { publicUser } from '../auth.js';

export const usersRouter = Router();
usersRouter.use(requireAuth);

// GET /api/entities-users -> membres du foyer courant (equiv. entities.User.list())
usersRouter.get('/', async (req, res) => {
  if (!req.user.household_id) return res.json([]);
  const { rows } = await query('select * from users where household_id = $1', [req.user.household_id]);
  res.json(rows.map(publicUser));
});

// PUT /api/entities-users/:id -> soi-même, un admin de foyer (pour les membres
// de son foyer), ou un super admin (pour tout le monde)
usersRouter.put('/:id', async (req, res) => {
  const user = req.user;
  const id = req.params.id;
  const isSelf = id === user.sub;
  const isHouseholdAdmin = !user.is_super_admin && user.role === 'admin' && !!user.household_id;

  if (!isSelf && !user.is_super_admin && !isHouseholdAdmin) {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  const body = req.body || {};
  const sets = [];
  const values = [];
  let i = 1;

  if (user.is_super_admin) {
    for (const key of ['full_name', 'role', 'household_id']) {
      if (key in body) {
        sets.push(`${key} = $${i++}`);
        values.push(body[key]);
      }
    }
  } else if (isSelf) {
    if ('full_name' in body) {
      sets.push(`full_name = $${i++}`);
      values.push(body.full_name);
    }
  } else if (isHouseholdAdmin) {
    if ('role' in body && ['admin', 'user'].includes(body.role)) {
      sets.push(`role = $${i++}`);
      values.push(body.role);
    }
    if ('household_id' in body && body.household_id === null) {
      sets.push(`household_id = $${i++}`);
      values.push(null);
    }
  }

  if (!sets.length) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
  const where = [`id = $${i++}`];
  values.push(id);
  if (isHouseholdAdmin) {
    where.push(`household_id = $${i++}`);
    values.push(user.household_id);
  }
  const { rows } = await query(`update users set ${sets.join(', ')} where ${where.join(' and ')} returning *`, values);
  if (!rows[0]) return res.status(404).json({ error: 'Introuvable ou non autorisé' });
  res.json(publicUser(rows[0]));
});

// GET /api/entities-users/all -> super admin uniquement, tous les utilisateurs de la plateforme
usersRouter.get('/all', requireSuperAdmin, async (_req, res) => {
  const { rows } = await query('select * from users order by created_at desc limit 2000');
  res.json(rows.map(publicUser));
});
