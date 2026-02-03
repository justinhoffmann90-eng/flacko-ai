create table if not exists tweet_drafts (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  type text not null,
  content text not null,
  status text default 'pending',
  created_at timestamptz default now()
);

create index if not exists tweet_drafts_date_idx on tweet_drafts (date);
create index if not exists tweet_drafts_status_idx on tweet_drafts (status);
