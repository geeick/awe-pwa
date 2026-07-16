create table if not exists public.intention_world_items (
  id uuid primary key default gen_random_uuid(),
  intention_text text not null,
  content_type text not null check (content_type in ('quote','poem','passage','photo','book','music','artwork','film','fact','reflection','prompt','practice')),
  title text,
  body text,
  creator text,
  external_url text,
  image_path text,
  practice_id uuid references public.practices(id) on delete set null,
  submitted_by uuid references auth.users(id) on delete set null,
  is_approved boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.intention_world_votes (
  item_id uuid not null references public.intention_world_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, user_id)
);

create index if not exists intention_world_items_intention_idx
  on public.intention_world_items (intention_text, is_approved, created_at desc);

alter table public.intention_world_items enable row level security;
alter table public.intention_world_votes enable row level security;

drop policy if exists "Anyone can read approved intention world items" on public.intention_world_items;
create policy "Anyone can read approved intention world items"
  on public.intention_world_items for select
  using (is_approved = true);

drop policy if exists "Signed in users can contribute intention world items" on public.intention_world_items;
create policy "Signed in users can contribute intention world items"
  on public.intention_world_items for insert
  to authenticated
  with check (submitted_by = auth.uid());

drop policy if exists "Users can update their intention world items" on public.intention_world_items;
create policy "Users can update their intention world items"
  on public.intention_world_items for update
  to authenticated
  using (submitted_by = auth.uid())
  with check (submitted_by = auth.uid());

drop policy if exists "Anyone can read intention world votes" on public.intention_world_votes;
create policy "Anyone can read intention world votes"
  on public.intention_world_votes for select
  using (true);

drop policy if exists "Users can add their own intention world votes" on public.intention_world_votes;
create policy "Users can add their own intention world votes"
  on public.intention_world_votes for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can remove their own intention world votes" on public.intention_world_votes;
create policy "Users can remove their own intention world votes"
  on public.intention_world_votes for delete
  to authenticated
  using (user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('intention-world', 'intention-world', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload intention world photos" on storage.objects;
create policy "Users can upload intention world photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'intention-world'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can read intention world photos" on storage.objects;
create policy "Users can read intention world photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'intention-world');

insert into public.intention_world_items (intention_text, content_type, body, creator, title)
select '__general__', 'quote', 'The world is full of magic things, patiently waiting for our senses to grow sharper.', 'W. B. Yeats', 'Today’s companion'
where not exists (
  select 1 from public.intention_world_items
  where intention_text = '__general__' and body = 'The world is full of magic things, patiently waiting for our senses to grow sharper.'
);

insert into public.intention_world_items (intention_text, content_type, body, creator)
select '__general__', 'quote', 'Heaven is under our feet as well as over our heads.', 'Henry David Thoreau'
where not exists (
  select 1 from public.intention_world_items
  where intention_text = '__general__' and body = 'Heaven is under our feet as well as over our heads.'
);

insert into public.intention_world_items (intention_text, content_type, body, creator)
select '__general__', 'quote', 'Live in each season as it passes; breathe the air, drink the drink, taste the fruit.', 'Henry David Thoreau'
where not exists (
  select 1 from public.intention_world_items
  where intention_text = '__general__' and body like 'Live in each season as it passes%'
);

insert into public.intention_world_items (intention_text, content_type, body, creator)
select '__general__', 'quote', 'Wherever you are, be all there.', 'Jim Elliot'
where not exists (
  select 1 from public.intention_world_items
  where intention_text = '__general__' and body = 'Wherever you are, be all there.'
);

insert into public.intention_world_items (intention_text, content_type, body)
select '__general__', 'prompt', 'What did this intention help you notice that you might otherwise have missed?'
where not exists (
  select 1 from public.intention_world_items
  where intention_text = '__general__' and content_type = 'prompt'
);
