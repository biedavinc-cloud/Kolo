import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Gestion de l'équipe Super Admin — réservée aux fondateurs.
// Rôles délégués : "admin" (contrôle total hors équipe) ou "analyste" (lecture seule).
const CORE_SUPER_ADMINS = ['vincentnogue2@gmail.com', 'vincentnogue@yahoo.com'];
const DELEGATED_ROLES = ['admin', 'analyste'];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await db.auth.me();
    if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 });

    // Seuls les fondateurs gèrent l'équipe, les rôles et les accès
    const email = (user.email || '').toLowerCase().trim();
    if (!CORE_SUPER_ADMINS.includes(email)) {
      return Response.json({ error: "Seul un fondateur peut gérer l'équipe" }, { status: 403 });
    }

    const svc = db.asServiceRole;
    const body = await req.json();
    const action = String(body?.action || '');

    if (action === 'add') {
      const newEmail = String(body?.email || '').toLowerCase().trim();
      const role = String(body?.role || 'admin');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return Response.json({ error: 'Adresse email invalide' }, { status: 400 });
      }
      if (!DELEGATED_ROLES.includes(role)) {
        return Response.json({ error: 'Rôle inconnu' }, { status: 400 });
      }
      const supers = await svc.entities.SuperAdmin.list();
      const exists =
        CORE_SUPER_ADMINS.includes(newEmail) ||
        supers.some((s) => (s.email || '').toLowerCase().trim() === newEmail);
      if (exists) {
        return Response.json({ error: 'Ce collaborateur existe déjà' }, { status: 400 });
      }
      await svc.entities.SuperAdmin.create({
        email: newEmail,
        added_by: user.email,
        role,
      });
      await svc.entities.AuditLog.create({
        action: 'equipe.ajout',
        actor_email: user.email,
        target: newEmail,
        details: `Rôle : ${role}`,
      });
      return Response.json({ ok: true });
    }

    if (action === 'set_role') {
      const id = String(body?.id || '');
      const role = String(body?.role || '');
      if (!DELEGATED_ROLES.includes(role)) {
        return Response.json({ error: 'Rôle inconnu' }, { status: 400 });
      }
      const supers = await svc.entities.SuperAdmin.list();
      const record = supers.find((s) => s.id === id);
      if (!record) return Response.json({ error: 'Collaborateur introuvable' }, { status: 404 });
      await svc.entities.SuperAdmin.update(id, { role });
      await svc.entities.AuditLog.create({
        action: 'equipe.role',
        actor_email: user.email,
        target: record.email,
        details: `Nouveau rôle : ${role}`,
      });
      return Response.json({ ok: true });
    }

    if (action === 'remove') {
      const id = String(body?.id || '');
      const supers = await svc.entities.SuperAdmin.list();
      const record = supers.find((s) => s.id === id);
      if (!record) return Response.json({ error: 'Collaborateur introuvable' }, { status: 404 });
      if (CORE_SUPER_ADMINS.includes((record.email || '').toLowerCase().trim())) {
        return Response.json({ error: 'Un fondateur ne peut pas être retiré' }, { status: 400 });
      }
      await svc.entities.SuperAdmin.delete(id);
      await svc.entities.AuditLog.create({
        action: 'equipe.retrait',
        actor_email: user.email,
        target: record.email,
        details: 'Retrait des accès',
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Action inconnue' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}