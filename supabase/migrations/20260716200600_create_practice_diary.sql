create table public.practice_diary_entries (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    practice_id uuid references public.practices(id) on delete set null,
    practice_title text not null,
    notes text,
    photo_paths text[] not null default '{}',
    status text not null default 'draft' check (status in ('draft', 'completed')),
    duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index practice_diary_entries_user_created_idx
    on public.practice_diary_entries(user_id, created_at desc);

alter table public.practice_diary_entries enable row level security;

create policy "Users can view their own practice diary"
on public.practice_diary_entries
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own practice diary entries"
on public.practice_diary_entries
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own practice diary entries"
on public.practice_diary_entries
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own practice diary entries"
on public.practice_diary_entries
for delete
to authenticated
using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'practice-diary',
    'practice-diary',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Users can view their own diary photos"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'practice-diary'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can upload their own diary photos"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'practice-diary'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can update their own diary photos"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'practice-diary'
    and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
    bucket_id = 'practice-diary'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can delete their own diary photos"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'practice-diary'
    and (storage.foldername(name))[1] = (select auth.uid())::text
);
