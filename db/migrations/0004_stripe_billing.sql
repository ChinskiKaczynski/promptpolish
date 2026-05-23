-- migration: create_stripe_billing_tables
-- purpose: map Stripe customers and subscriptions to authenticated users
-- affected tables: stripe_customers, subscriptions

create table if not exists public.stripe_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text unique not null,
  stripe_price_id text not null,
  plan_slug text not null,
  status text not null,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Optimize lookup on stripe_customer_id for webhook events
create index if not exists idx_subscriptions_stripe_customer_id on subscriptions(stripe_customer_id);
create index if not exists idx_stripe_customers_customer_id on stripe_customers(stripe_customer_id);

-- Enable RLS
alter table public.stripe_customers enable row level security;
alter table public.subscriptions enable row level security;

-- Policy: Users can select only their own records
create policy "users_read_own_stripe_customer" on public.stripe_customers
  for select to authenticated using (auth.uid() = user_id);

create policy "users_read_own_subscription" on public.subscriptions
  for select to authenticated using (auth.uid() = user_id);

-- Explicitly disallow client-side modifications (public and authenticated write/insert/update/delete)
create policy "block_client_write_stripe_customer" on public.stripe_customers
  for all to public using (false) with check (false);

create policy "block_client_write_subscription" on public.subscriptions
  for all to public using (false) with check (false);
