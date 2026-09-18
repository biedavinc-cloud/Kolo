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

// PUT /api/entities-users/:id -> super admin uniquement (ou soi-même pour son propre profil)
usersRouter.put('/:id', async (req, res) => {
  if (req.params.id !== req.user.sub && !req.user.is_super_admin) {
    return res.status(403).json({ error: 'Non autorisé' });
  }
  const allowed = req.user.is_super_admin ? ['full_name', 'role', 'household_id'] : ['full_name'];
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
  values.push(req.params.id);
  const { rows } = await query(`update users set ${sets.join(', ')} where id = $${i} returning *`, values);
  if (!rows[0]) return res.status(404).json({ error: 'Introuvable' });
  res.json(publicUser(rows[0]));
});

// GET /api/entities-users/all -> super admin uniquement, tous les utilisateurs de la plateforme
usersRouter.get('/all', requireSuperAdmin, async (_req, res) => {
  const { rows } = await query('select * from users order by created_at desc limit 2000');
  res.json(rows.map(publicUser));
});
