-- Repair the legacy daily_intentions shape.
alter table public.daily_intentions
  add column if not exists intention_text text;

update public.daily_intentions
set intention_text = coalesce(intention_text, text)
where intention_text is null;

alter table public.daily_intentions
  alter column text drop not null;

-- Community links between intentions and existing practices.
create table if not exists public.intention_practice_recommendations (
  id uuid primary key default gen_random_uuid(),
  intention_text text not null,
  practice_id uuid not null references public.practices(id) on delete cascade,
  submitted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (intention_text, practice_id)
);

create table if not exists public.intention_practice_votes (
  recommendation_id uuid not null references public.intention_practice_recommendations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (recommendation_id, user_id)
);

create table if not exists public.daily_practice_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  selection_date date not null,
  intention_text text not null,
  practice_id uuid not null references public.practices(id) on delete cascade,
  source text not null default 'automatic'
    check (source in ('automatic', 'community', 'manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, selection_date)
);

alter table public.intention_practice_recommendations enable row level security;
alter table public.intention_practice_votes enable row level security;
alter table public.daily_practice_selections enable row level security;

drop policy if exists "Practice recommendations are readable" on public.intention_practice_recommendations;
create policy "Practice recommendations are readable"
on public.intention_practice_recommendations for select
using (true);

drop policy if exists "Authenticated users suggest practice matches" on public.intention_practice_recommendations;
create policy "Authenticated users suggest practice matches"
on public.intention_practice_recommendations for insert
to authenticated
with check (submitted_by = auth.uid());

drop policy if exists "Practice votes are readable" on public.intention_practice_votes;
create policy "Practice votes are readable"
on public.intention_practice_votes for select
using (true);

drop policy if exists "Users manage their practice votes" on public.intention_practice_votes;
create policy "Users manage their practice votes"
on public.intention_practice_votes for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users read their daily practice" on public.daily_practice_selections;
create policy "Users read their daily practice"
on public.daily_practice_selections for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users create their daily practice" on public.daily_practice_selections;
create policy "Users create their daily practice"
on public.daily_practice_selections for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users update their daily practice" on public.daily_practice_selections;
create policy "Users update their daily practice"
on public.daily_practice_selections for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create index if not exists intention_practice_recommendations_intention_idx
  on public.intention_practice_recommendations (intention_text);

create index if not exists daily_practice_selections_user_date_idx
  on public.daily_practice_selections (user_id, selection_date);
