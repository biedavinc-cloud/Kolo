// Décrit chaque entité exposée par /api/entities/:entity.
// table            : table Postgres réelle
// householdScoped  : si true, chaque requête est automatiquement filtrée sur
//                     le household_id de l'utilisateur connecté (équivalent
//                     des règles RLS Base44 définies dans server/legacy-base44/entities/*.jsonc)
// fields            : colonnes accepté en création/mise à jour (protège contre
//                     l'injection de colonnes non prévues)
// defaultSort       : tri par défaut quand list() est appelé sans argument

export const ENTITIES = {
  Account: {
    table: 'accounts',
    householdScoped: true,
    fields: ['name', 'type', 'balance', 'currency'],
    defaultSort: 'created_at asc',
  },
  Category: {
    table: 'categories',
    householdScoped: true,
    fields: ['name', 'type', 'color', 'icon'],
    defaultSort: 'created_at asc',
  },
  Transaction: {
    table: 'transactions',
    householdScoped: true,
    fields: ['account_id', 'category_id', 'profile_id', 'amount', 'type', 'date', 'notes', 'receipt_url'],
    defaultSort: 'date desc',
  },
  Budget: {
    table: 'budgets',
    householdScoped: true,
    fields: ['category_id', 'amount_limit', 'month_year'],
    defaultSort: 'created_at desc',
  },
  RecurringTransaction: {
    table: 'recurring_transactions',
    householdScoped: true,
    fields: ['account_id', 'category_id', 'amount', 'type', 'frequency', 'next_date', 'notes'],
    defaultSort: 'next_date asc',
  },
  SavingsGoal: {
    table: 'savings_goals',
    householdScoped: true,
    fields: ['name', 'target_amount', 'current_amount', 'deadline', 'notes'],
    defaultSort: 'created_at desc',
  },
  Debt: {
    table: 'debts',
    householdScoped: true,
    fields: ['name', 'creditor', 'initial_amount', 'remaining_amount', 'monthly_payment', 'interest_rate', 'account_id', 'notes'],
    defaultSort: 'created_at desc',
  },
  Subscription: {
    table: 'subscriptions',
    householdScoped: true,
    fields: ['plan', 'status', 'trial_end', 'period_end', 'stripe_customer_id', 'stripe_subscription_id'],
    defaultSort: 'created_at desc',
  },
  Notification: {
    table: 'notifications',
    householdScoped: true,
    fields: ['dedupe_key', 'type', 'title', 'message', 'severity', 'read'],
    defaultSort: 'created_at desc',
  },
  HouseholdAuditLog: {
    table: 'household_audit_logs',
    householdScoped: true,
    fields: ['action', 'actor', 'target', 'details'],
    defaultSort: 'created_at desc',
  },
  // Household et User ne sont PAS exposées ici : elles ont une portée spéciale
  // (le foyer/l'utilisateur courant) et sont gérées par des routes dédiées :
  // voir household.routes.js et users.routes.js.

  // --- Entités réservées aux super admins (portée plateforme, pas foyer) ---
  PlatformSetting: {
    table: 'platform_settings',
    householdScoped: false,
    superAdminOnly: true,
    fields: ['maintenance_mode', 'flag_ai_assistant', 'flag_rapports_avances', 'updated_by'],
    defaultSort: 'updated_at desc',
  },
  SuperAdmin: {
    table: 'super_admins',
    householdScoped: false,
    superAdminOnly: true,
    fields: ['email', 'added_by', 'role'],
    defaultSort: 'created_at desc',
  },
  Announcement: {
    table: 'announcements',
    householdScoped: false,
    publicRead: true, // lecture ouverte à tout utilisateur connecté, écriture réservée aux super admins
    fields: ['title', 'message', 'created_by'],
    defaultSort: 'created_at desc',
  },
  AuditLog: {
    table: 'audit_logs',
    householdScoped: false,
    superAdminOnly: true,
    fields: ['action', 'actor_email', 'target', 'details'],
    defaultSort: 'created_at desc',
  },
};
