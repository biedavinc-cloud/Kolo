import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { requireSuperAdmin } from '../../shared/superAdminGuard.ts';

// Prix mensuels des plans (USD) — source : produits Stripe Kolo
const PLAN_PRICES = { starter: 3, pro: 14, premium: 39, family: 89 };

// Tableau de bord global : KPIs, foyers (tenants), réglages plateforme, audit.
// Strictement réservé aux super administrateurs — lecture seule.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const guard = await requireSuperAdmin(base44);
    if (guard.error) return guard.error;

    const svc = db.asServiceRole;
    const [households, subscriptions, accounts, transactions, settingsList, audit, supers] =
      await Promise.all([
        svc.entities.Household.list('-created_date', 500),
        svc.entities.Subscription.list('-created_date', 500),
        svc.entities.Account.list('-created_date', 500),
        svc.entities.Transaction.list('-created_date', 500),
        svc.entities.PlatformSetting.list('-created_date', 10),
        svc.entities.AuditLog.list('-created_date', 50),
        svc.entities.SuperAdmin.list('-created_date', 100),
      ]);

    const subByHousehold = {};
    subscriptions.forEach((s) => {
      if (!subByHousehold[s.household_id]) subByHousehold[s.household_id] = s;
    });
    const accountsByHousehold = {};
    accounts.forEach((a) => {
      accountsByHousehold[a.household_id] = (accountsByHousehold[a.household_id] || 0) + 1;
    });
    const txByHousehold = {};
    transactions.forEach((t) => {
      txByHousehold[t.household_id] = (txByHousehold[t.household_id] || 0) + 1;
    });

    const tenants = households.map((h) => {
      const sub = subByHousehold[h.id];
      return {
        id: h.id,
        name: h.name,
        currency: h.currency,
        suspended: !!h.suspended,
        created_date: h.created_date,
        owner_email: h.created_by,
        accounts: accountsByHousehold[h.id] || 0,
        transactions: txByHousehold[h.id] || 0,
        plan: sub ? sub.plan : null,
        status: sub ? sub.status : null,
        trial_end: sub ? sub.trial_end : null,
        period_end: sub ? sub.period_end : null,
      };
    });

    const activeSubs = subscriptions.filter((s) => s.status === 'active');
    const kpis = {
      households_total: households.length,
      households_active: households.filter((h) => !h.suspended).length,
      households_suspended: households.filter((h) => !!h.suspended).length,
      subscriptions_active: activeSubs.length,
      subscriptions_trial: subscriptions.filter((s) => s.status === 'trial').length,
      subscriptions_expired: subscriptions.filter((s) => s.status === 'expired').length,
      mrr: activeSubs.reduce((sum, s) => sum + (PLAN_PRICES[s.plan] || 0), 0),
      super_admins: supers.length + 2,
    };

    const settingsRecord = settingsList[0] || null;
    const settings = settingsRecord
      ? {
          id: settingsRecord.id,
          maintenance_mode: !!settingsRecord.maintenance_mode,
          flag_ai_assistant: settingsRecord.flag_ai_assistant !== false,
          flag_rapports_avances: settingsRecord.flag_rapports_avances !== false,
          updated_by: settingsRecord.updated_by,
        }
      : { id: null, maintenance_mode: false, flag_ai_assistant: true, flag_rapports_avances: true, updated_by: null };

    // Utilisateurs de la plateforme + diffusions globales
    const [users, announcements] = await Promise.all([
      svc.entities.User.list('-created_date', 500),
      svc.entities.Announcement.list('-created_date', 10),
    ]);

    const mrrByPlan = {};
    activeSubs.forEach((s) => {
      mrrByPlan[s.plan] = (mrrByPlan[s.plan] || 0) + (PLAN_PRICES[s.plan] || 0);
    });

    // Paiements réels récents (Stripe) — non bloquant
    let payments = [];
    try {
      const stripeRes = await fetch('https://api.stripe.com/v1/invoices?limit=20&status=paid', {
        headers: { Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}` },
      });
      if (stripeRes.ok) {
        const stripeJson = await stripeRes.json();
        payments = stripeJson.data.map((inv) => ({
          id: inv.id,
          amount: inv.amount_paid / 100,
          currency: (inv.currency || 'usd').toUpperCase(),
          date: new Date(inv.created * 1000).toISOString(),
          customer_email: inv.customer_email || null,
        }));
      } else {
        console.error('stripe invoices status:', stripeRes.status);
      }
    } catch (e) {
      console.error('stripe invoices error:', e.message);
    }

    return Response.json({
      kpis,
      tenants,
      settings,
      audit,
      mrr_by_plan: mrrByPlan,
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name || null,
        role: u.role || 'user',
        household_id: u.data?.household_id || null,
        created_date: u.created_date,
      })),
      payments,
      announcements,
    });
  } catch (error) {
    console.error('superAdminDashboard error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}