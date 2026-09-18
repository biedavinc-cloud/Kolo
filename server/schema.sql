-- Kolo — schéma Postgres (Neon)
-- Généré à partir des définitions d'entités Base44 (server/legacy-base44/entities/*.jsonc)
-- Idempotent : peut être rejoué sans danger (IF NOT EXISTS partout).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Foyers
-- ---------------------------------------------------------------------------
create table if not exists households (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  currency      text not null default 'EUR',
  invite_code   text unique,
  suspended     boolean not null default false,
  created_by_id uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Utilisateurs
-- ---------------------------------------------------------------------------
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  full_name     text,
  role          text not null default 'user' check (role in ('admin', 'user')),
  household_id  uuid references households(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table households
  add constraint households_created_by_fk foreign key (created_by_id) references users(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Comptes
-- ---------------------------------------------------------------------------
create table if not exists accounts (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name         text not null,
  type         text not null default 'checking' check (type in ('checking', 'savings', 'cash', 'credit')),
  balance      numeric(14,2) not null default 0,
  currency     text not null default 'EUR',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_accounts_household on accounts(household_id);

-- ---------------------------------------------------------------------------
-- Catégories
-- ---------------------------------------------------------------------------
create table if not exists categories (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name         text not null,
  type         text not null default 'expense' check (type in ('income', 'expense')),
  color        text not null default '#6D7175',
  icon         text not null default 'Tag',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_categories_household on categories(household_id);

-- ---------------------------------------------------------------------------
-- Transactions
-- ---------------------------------------------------------------------------
create table if not exists transactions (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  account_id   uuid not null references accounts(id) on delete cascade,
  category_id  uuid references categories(id) on delete set null,
  profile_id   uuid references users(id) on delete set null,
  amount       numeric(14,2) not null,
  type         text not null default 'expense' check (type in ('income', 'expense')),
  date         date not null,
  notes        text,
  receipt_url  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_transactions_household on transactions(household_id);
create index if not exists idx_transactions_date on transactions(household_id, date desc);

-- ---------------------------------------------------------------------------
-- Budgets
-- ---------------------------------------------------------------------------
create table if not exists budgets (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id  uuid not null references categories(id) on delete cascade,
  amount_limit numeric(14,2) not null,
  month_year   text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_budgets_household on budgets(household_id);

-- ---------------------------------------------------------------------------
-- Transactions récurrentes
-- ---------------------------------------------------------------------------
create table if not exists recurring_transactions (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  account_id   uuid not null references accounts(id) on delete cascade,
  category_id  uuid references categories(id) on delete set null,
  amount       numeric(14,2) not null,
  type         text not null default 'expense' check (type in ('income', 'expense')),
  frequency    text not null,
  next_date    date not null,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_recurring_household on recurring_transactions(household_id);

-- ---------------------------------------------------------------------------
-- Objectifs d'épargne
-- ---------------------------------------------------------------------------
create table if not exists savings_goals (
  id             uuid primary key default gen_random_uuid(),
  household_id   uuid not null references households(id) on delete cascade,
  name           text not null,
  target_amount  numeric(14,2) not null,
  current_amount numeric(14,2) not null default 0,
  deadline       date,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_goals_household on savings_goals(household_id);

-- ---------------------------------------------------------------------------
-- Dettes
-- ---------------------------------------------------------------------------
create table if not exists debts (
  id               uuid primary key default gen_random_uuid(),
  household_id     uuid not null references households(id) on delete cascade,
  name             text not null,
  creditor         text,
  initial_amount   numeric(14,2) not null,
  remaining_amount numeric(14,2) not null,
  monthly_payment  numeric(14,2),
  interest_rate    numeric(6,3),
  account_id       uuid references accounts(id) on delete set null,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_debts_household on debts(household_id);

-- ---------------------------------------------------------------------------
-- Abonnements (Stripe)
-- ---------------------------------------------------------------------------
create table if not exists subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  household_id         uuid not null unique references households(id) on delete cascade,
  plan                 text not null default 'starter' check (plan in ('starter', 'pro', 'premium', 'family')),
  status               text not null default 'trial' check (status in ('trial', 'active', 'expired')),
  trial_end            timestamptz,
  period_end           timestamptz,
  stripe_customer_id   text,
  stripe_subscription_id text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists notifications (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  dedupe_key   text,
  type         text,
  title        text not null,
  message      text,
  severity     text not null default 'info',
  read         boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_notifications_household on notifications(household_id);

-- ---------------------------------------------------------------------------
-- Journaux d'audit (par foyer + plateforme)
-- ---------------------------------------------------------------------------
create table if not exists household_audit_logs (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  action       text not null,
  actor        text,
  target       text,
  details      jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists idx_household_audit_household on household_audit_logs(household_id);

create table if not exists audit_logs (
  id          uuid primary key default gen_random_uuid(),
  action      text not null,
  actor_email text,
  target      text,
  details     jsonb,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Réglages plateforme (ligne unique) + Super Admins + Annonces
-- ---------------------------------------------------------------------------
create table if not exists platform_settings (
  id                     uuid primary key default gen_random_uuid(),
  maintenance_mode       boolean not null default false,
  flag_ai_assistant      boolean not null default true,
  flag_rapports_avances  boolean not null default true,
  updated_by             text,
  updated_at             timestamptz not null default now()
);

create table if not exists super_admins (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  added_by   text,
  role       text not null default 'analyste' check (role in ('admin', 'analyste')),
  created_at timestamptz not null default now()
);

create table if not exists announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  message    text,
  created_by text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at automatique
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  for t in select unnest(array[
    'households','users','accounts','categories','transactions','budgets',
    'recurring_transactions','savings_goals','debts','subscriptions','notifications'
  ])
  loop
    execute format('drop trigger if exists trg_set_updated_at on %I;', t);
    execute format('create trigger trg_set_updated_at before update on %I for each row execute function set_updated_at();', t);
  end loop;
end $$;
