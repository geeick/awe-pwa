create table public.starred_intentions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    text text not null check (char_length(trim(text)) between 1 and 140),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index starred_intentions_user_id_idx
    on public.starred_intentions(user_id);

create unique index starred_intentions_user_text_unique_idx
    on public.starred_intentions(user_id, lower(trim(text)));

alter table public.starred_intentions enable row level security;

create policy "Users can view their own starred intentions"
on public.starred_intentions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own starred intentions"
on public.starred_intentions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own starred intentions"
on public.starred_intentions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own starred intentions"
on public.starred_intentions
for delete
to authenticated
using ((select auth.uid()) = user_id);
