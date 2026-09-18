import { verifyToken } from '../auth.js';

// Attache req.user (payload JWT) si un token valide est fourni. Ne bloque jamais.
export function attachUser(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      req.user = null;
    }
  }
  next();
}

// Bloque la requête si non authentifié.
export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Non autorisé' });
  next();
}

// Bloque si l'utilisateur n'a pas household_id (onboarding non terminé).
export function requireHousehold(req, res, next) {
  if (!req.user?.household_id) {
    return res.status(403).json({ error: "Aucun foyer associé à ce compte" });
  }
  next();
}

export function requireSuperAdmin(req, res, next) {
  if (!req.user?.is_super_admin) {
    return res.status(403).json({ error: 'Réservé aux super administrateurs' });
  }
  next();
}
