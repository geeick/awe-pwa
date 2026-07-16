create table if not exists public.daily_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  check_in_date date not null default current_date,
  mood_label text not null,
  mood_score integer not null check (mood_score between 1 and 5),
  reflection_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, check_in_date)
);

create table if not exists public.daily_intentions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  intention_date date not null default current_date,
  intention_text text not null,
  reflected_on boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, intention_date)
);

alter table public.daily_check_ins enable row level security;
alter table public.daily_intentions enable row level security;

create policy "Users can read their own daily check-ins"
on public.daily_check_ins for select
using (auth.uid() = user_id);

create policy "Users can insert their own daily check-ins"
on public.daily_check_ins for insert
with check (auth.uid() = user_id);

create policy "Users can update their own daily check-ins"
on public.daily_check_ins for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own daily check-ins"
on public.daily_check_ins for delete
using (auth.uid() = user_id);

create policy "Users can read their own daily intentions"
on public.daily_intentions for select
using (auth.uid() = user_id);

create policy "Users can insert their own daily intentions"
on public.daily_intentions for insert
with check (auth.uid() = user_id);

create policy "Users can update their own daily intentions"
on public.daily_intentions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own daily intentions"
on public.daily_intentions for delete
using (auth.uid() = user_id);
