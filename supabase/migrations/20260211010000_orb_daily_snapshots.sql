-- Daily snapshot of all 15 setup states (the "atoms")
-- One row per setup per day. Never overwritten. Append-only history.
-- Score is derived from these, not stored here.
create table if not exists orb_daily_snapshots (
  id bigint generated always as identity primary key,
  date date not null,
  setup_id text not null references orb_setup_definitions(id),
  status text not null check (status in ('active', 'watching', 'inactive')),
  entry_price numeric,
  active_day integer,
  conditions_met jsonb,
  reason text,
  gauge_current_value numeric,
  gauge_progress_pct numeric,
  created_at timestamptz default now(),
  unique(date, setup_id)
);

-- Index for fast date-range queries and per-setup history
create index if not exists idx_orb_daily_snapshots_date on orb_daily_snapshots(date);
create index if not exists idx_orb_daily_snapshots_setup on orb_daily_snapshots(setup_id, date);

-- RLS: public read
alter table orb_daily_snapshots enable row level security;
create policy "Public read orb_daily_snapshots" on orb_daily_snapshots for select using (true);
