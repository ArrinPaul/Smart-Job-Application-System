-- Enable Supabase Realtime for core tables used by the app.
-- This migration is idempotent and safe to re-run.

-- Ensure the publication exists (normally created by Supabase).
do $$
begin
  if not exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;
end $$;

-- Add tables to realtime publication (ignore duplicates).
do $$
begin
  begin
    alter publication supabase_realtime add table public.users;
  exception when duplicate_object then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.jobs;
  exception when duplicate_object then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.applications;
  exception when duplicate_object then
    null;
  end;

  begin
    alter publication supabase_realtime add table public.resumes;
  exception when duplicate_object then
    null;
  end;
end $$;

-- For UPDATE/DELETE payload fidelity in realtime streams.
alter table if exists public.users replica identity full;
alter table if exists public.jobs replica identity full;
alter table if exists public.applications replica identity full;
alter table if exists public.resumes replica identity full;
