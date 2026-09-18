import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { hashPassword, verifyPassword, signToken, publicUser } from '../auth.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

async function isSuperAdmin(email) {
  const { rows } = await query('select role from super_admins where email = $1', [email]);
  return rows[0]?.role || null;
}

async function loadUserPayload(userRow) {
  const superAdminRole = await isSuperAdmin(userRow.email);
  return {
    ...userRow,
    is_super_admin: !!superAdminRole,
    super_admin_role: superAdminRole,
  };
}

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères' });
    }
    const existing = await query('select id from users where email = $1', [email.toLowerCase()]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email' });
    }
    const password_hash = await hashPassword(password);
    const { rows } = await query(
      `insert into users (email, password_hash, full_name) values ($1, $2, $3) returning *`,
      [email.toLowerCase(), password_hash, full_name || null]
    );
    const user = await loadUserPayload(rows[0]);
    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }
    const { rows } = await query('select * from users where email = $1', [String(email).toLowerCase()]);
    const row = rows[0];
    if (!row || !(await verifyPassword(password, row.password_hash))) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    const user = await loadUserPayload(row);
    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const { rows } = await query('select * from users where id = $1', [req.user.sub]);
  if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
  const user = await loadUserPayload(rows[0]);
  res.json(publicUser(user));
});

authRouter.put('/me', requireAuth, async (req, res) => {
  const allowed = ['full_name', 'household_id'];
  const updates = [];
  const values = [];
  let i = 1;
  for (const key of allowed) {
    if (key in (req.body || {})) {
      updates.push(`${key} = $${i++}`);
      values.push(req.body[key]);
    }
  }
  if (!updates.length) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
  values.push(req.user.sub);
  const { rows } = await query(
    `update users set ${updates.join(', ')} where id = $${i} returning *`,
    values
  );
  const user = await loadUserPayload(rows[0]);
  res.json(publicUser(user));
});

authRouter.post('/logout', (_req, res) => {
  // JWT sans état : la déconnexion se fait côté client en supprimant le token.
  res.json({ ok: true });
});

authRouter.post('/reset-password-request', async (req, res) => {
  const { email } = req.body || {};
  if (email) {
    const { rows } = await query('select id, email from users where email = $1', [String(email).toLowerCase()]);
    if (rows[0]) {
      const resetToken = jwt.sign({ sub: rows[0].id, purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '15m' });
      // TODO: envoyer resetToken par email (voir server/src/routes/misc.routes.js — nécessite RESEND_API_KEY ou SMTP_*).
      if (!process.env.RESEND_API_KEY) {
        console.log(`[reset-password] Pas de fournisseur email configuré. Lien de réinitialisation pour ${email} :`);
        console.log(`  ${process.env.FRONTEND_URL || 'http://localhost:5173'}/ResetPassword?token=${resetToken}`);
      }
    }
  }
  // Toujours une réponse générique, pour ne pas révéler si l'email existe.
  res.json({ ok: true });
});

authRouter.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'Token et mot de passe requis' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.purpose !== 'reset') throw new Error('bad purpose');
    const password_hash = await hashPassword(password);
    await query('update users set password_hash = $1 where id = $2', [password_hash, payload.sub]);
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: 'Lien de réinitialisation invalide ou expiré' });
  }
});

// Connexion via provider externe (Google/Apple) : nécessite la configuration OAuth
// réelle (client id/secret) côté hébergeur — non portée automatiquement depuis Base44.
authRouter.post('/login-with-provider', (_req, res) => {
  res.status(501).json({ error: "Connexion via fournisseur externe non configurée. Voir server/README.md." });
});
