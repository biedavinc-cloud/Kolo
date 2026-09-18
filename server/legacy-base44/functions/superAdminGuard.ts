// Garde partagée : contexte Super Admin Kolo avec rôles délégués.
// Les fondateurs sont codés en dur (accès total) ; les délégués vivent dans
// l'entité SuperAdmin avec un rôle : "admin" (contrôle total hors équipe)
// ou "analyste" (lecture seule).
const CORE_SUPER_ADMINS = ['vincentnogue2@gmail.com', 'vincentnogue@yahoo.com'];

export async function getSuperAdminContext(base44) {
  const user = await db.auth.me();
  if (!user) {
    return { user: null, error: Response.json({ error: 'Non autorisé' }, { status: 401 }) };
  }
  const email = (user.email || '').toLowerCase().trim();
  const supers = await db.asServiceRole.entities.SuperAdmin.list();
  const record = supers.find((s) => (s.email || '').toLowerCase().trim() === email);
  const isFounder = CORE_SUPER_ADMINS.includes(email);
  if (!isFounder && !record) {
    return { user: null, error: Response.json({ error: 'Accès refusé' }, { status: 403 }) };
  }
  return {
    user,
    email,
    isFounder,
    role: isFounder ? 'founder' : (record?.role || 'admin'),
  };
}

export async function requireSuperAdmin(base44) {
  return getSuperAdminContext(base44);
}

// Journalisation des actions sensibles (audit trail)
export async function writeAudit(svc, actorEmail, action, target, details) {
  await svc.entities.AuditLog.create({
    action,
    actor_email: actorEmail,
    target: target || '-',
    details: details || '-',
  });
}