const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireSuperAdmin, writeAudit } from '../../shared/superAdminGuard.ts';

const PLANS = ['starter', 'pro', 'premium', 'family'];
const STATUSES = ['trial', 'active', 'expired'];
const FLAGS = ['flag_ai_assistant', 'flag_rapports_avances'];

// Actions sensibles du Super Admin : inspection foyers, suspension, suppression,
// ajustement d'abonnement, maintenance et feature flags. Chaque action est auditée.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await requireSuperAdmin(base44);
    if (guard.error) return guard.error;

    const svc = db.asServiceRole;
    const actor = guard.email;
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || '');

    // RBAC : les analystes délégués ont un accès en lecture seule
    if (guard.role === 'analyste' && action !== 'inspect_household') {
      return Response.json({ error: 'Votre rôle analyste est en lecture seule' }, { status: 403 });
    }

    // --- Inspection d'un foyer (lecture seule, "vue du foyer") ---
    if (action === 'inspect_household') {
      const id = String(body?.household_id || '');
      if (!id) return Response.json({ error: 'Foyer introuvable' }, { status: 400 });
      const [household, accounts, transactions, budgets, subs] = await Promise.all([
        svc.entities.Household.get(id),
        svc.entities.Account.filter({ household_id: id }),
        svc.entities.Transaction.filter({ household_id: id }, '-created_date', 20),
        svc.entities.Budget.filter({ household_id: id }),
        svc.entities.Subscription.filter({ household_id: id }),
      ]);
      if (!household) return Response.json({ error: 'Foyer introuvable' }, { status: 404 });
      return Response.json({
        household: {
          id: household.id,
          name: household.name,
          currency: household.currency,
          suspended: !!household.suspended,
          created_date: household.created_date,
          owner_email: household.created_by,
        },
        accounts,
        transactions,
        budgets,
        subscription: subs[0] || null,
      });
    }

    // --- Suspendre / réactiver un foyer ---
    if (action === 'suspend_household' || action === 'unsuspend_household') {
      const id = String(body?.household_id || '');
      const household = await svc.entities.Household.get(id).catch(() => null);
      if (!household) return Response.json({ error: 'Foyer introuvable' }, { status: 404 });
      const suspended = action === 'suspend_household';
      await svc.entities.Household.update(id, { suspended });
      await writeAudit(svc, actor, suspended ? 'foyer.suspendu' : 'foyer.reactive', household.name, `ID ${id}`);
      return Response.json({ ok: true });
    }

    // --- Suppression définitive d'un foyer (cascade) ---
    if (action === 'delete_household') {
      const id = String(body?.household_id || '');
      const household = await svc.entities.Household.get(id).catch(() => null);
      if (!household) return Response.json({ error: 'Foyer introuvable' }, { status: 404 });
      await svc.entities.Transaction.deleteMany({ household_id: id });
      await svc.entities.Account.deleteMany({ household_id: id });
      await svc.entities.Budget.deleteMany({ household_id: id });
      await svc.entities.Category.deleteMany({ household_id: id });
      await svc.entities.RecurringTransaction.deleteMany({ household_id: id });
      await svc.entities.SavingsGoal.deleteMany({ household_id: id });
      await svc.entities.Debt.deleteMany({ household_id: id });
      await svc.entities.Subscription.deleteMany({ household_id: id });
      await svc.entities.Household.delete(id);
      await writeAudit(svc, actor, 'foyer.supprime', household.name, `Suppression définitive — ID ${id}`);
      return Response.json({ ok: true });
    }

    // --- Ajustement manuel d'un abonnement (plan, statut, périodes) ---
    if (action === 'adjust_subscription') {
      const id = String(body?.household_id || '');
      const household = await svc.entities.Household.get(id).catch(() => null);
      if (!household) return Response.json({ error: 'Foyer introuvable' }, { status: 404 });

      const data = {};
      if (body.plan !== undefined) {
        if (!PLANS.includes(body.plan)) return Response.json({ error: 'Plan inconnu' }, { status: 400 });
        data.plan = body.plan;
      }
      if (body.status !== undefined) {
        if (!STATUSES.includes(body.status)) return Response.json({ error: 'Statut inconnu' }, { status: 400 });
        data.status = body.status;
      }
      if (body.period_end !== undefined) data.period_end = body.period_end || null;
      if (body.trial_end !== undefined) data.trial_end = body.trial_end || null;
      if (Object.keys(data).length === 0) return Response.json({ error: 'Aucune modification' }, { status: 400 });

      const subs = await svc.entities.Subscription.filter({ household_id: id });
      if (subs.length > 0) {
        await svc.entities.Subscription.update(subs[0].id, data);
      } else {
        await svc.entities.Subscription.create({
          household_id: id,
          plan: data.plan || 'starter',
          status: data.status || 'active',
          period_end: data.period_end,
          trial_end: data.trial_end,
        });
      }
      await writeAudit(
        svc,
        actor,
        'abonnement.ajuste',
        household.name,
        JSON.stringify(data)
      );
      return Response.json({ ok: true });
    }

    // --- Mode maintenance global ---
    if (action === 'set_maintenance') {
      const value = body.value === true;
      const settingsList = await svc.entities.PlatformSetting.list();
      if (settingsList.length > 0) {
        await svc.entities.PlatformSetting.update(settingsList[0].id, {
          maintenance_mode: value,
          updated_by: actor,
        });
      } else {
        await svc.entities.PlatformSetting.create({ maintenance_mode: value, updated_by: actor });
      }
      await writeAudit(svc, actor, 'plateforme.maintenance', '-', value ? 'Activée' : 'Désactivée');
      return Response.json({ ok: true });
    }

    // --- Feature flags distants ---
    if (action === 'set_flag') {
      const flag = String(body?.flag || '');
      if (!FLAGS.includes(flag)) return Response.json({ error: 'Flag inconnu' }, { status: 400 });
      const value = body.value === true;
      const settingsList = await svc.entities.PlatformSetting.list();
      if (settingsList.length > 0) {
        await svc.entities.PlatformSetting.update(settingsList[0].id, {
          [flag]: value,
          updated_by: actor,
        });
      } else {
        await svc.entities.PlatformSetting.create({ [flag]: value, updated_by: actor });
      }
      await writeAudit(svc, actor, 'plateforme.flag', flag, value ? 'Activé' : 'Désactivé');
      return Response.json({ ok: true });
    }

    // --- Diffusion d'une notification globale à tous les utilisateurs ---
    if (action === 'broadcast') {
      const title = String(body?.title || '').trim();
      const message = String(body?.message || '').trim();
      if (!title || !message) return Response.json({ error: 'Titre et message requis' }, { status: 400 });
      await svc.entities.Announcement.create({ title, message, created_by: actor });
      await writeAudit(svc, actor, 'plateforme.diffusion', title, message.slice(0, 120));
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Action inconnue' }, { status: 400 });
  } catch (error) {
    console.error('superAdminAction error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}