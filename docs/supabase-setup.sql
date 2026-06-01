-- TechPulse Supabase setup
-- Run this in Supabase Dashboard -> SQL Editor.

create table if not exists public.techpulse_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists techpulse_state_updated_at on public.techpulse_state;
create trigger techpulse_state_updated_at
before update on public.techpulse_state
for each row
execute function public.set_updated_at();

alter table public.techpulse_state enable row level security;

-- This table is server-owned. The backend writes with the service role key.
-- No browser/anon policies are added intentionally.
