alter table public.starred_intentions
add column if not exists is_public boolean not null default false;

create index if not exists starred_intentions_public_created_at_idx
on public.starred_intentions (created_at desc)
where is_public = true;

create policy "Authenticated users can view public intentions"
on public.starred_intentions
for select
to authenticated
using (
  is_public = true
  or user_id = (select auth.uid())
);
