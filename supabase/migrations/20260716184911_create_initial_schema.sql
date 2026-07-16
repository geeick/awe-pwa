create extension if not exists pgcrypto;

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    avatar_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.practices (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    slug text not null unique,
    description text not null,
    instructions text not null,
    category text not null,
    duration_minutes integer not null check (duration_minutes > 0),
    benefit text,
    icon text,
    is_featured boolean not null default false,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.daily_intentions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    intention_date date not null default current_date,
    text text not null check (
        char_length(trim(text)) between 1 and 140
    ),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, intention_date)
);

create table public.practice_completions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    practice_id uuid not null references public.practices(id) on delete cascade,
    completed_at timestamptz not null default now(),
    reflection text,
    duration_minutes integer check (
        duration_minutes is null or duration_minutes > 0
    )
);

create table public.daily_moods (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    mood_date date not null default current_date,
    mood text not null check (
        mood in ('hard', 'okay', 'good', 'great', 'amazing')
    ),
    note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, mood_date)
);

create table public.journal_entries (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text,
    body text not null,
    entry_type text not null default 'reflection' check (
        entry_type in (
            'reflection',
            'prayer',
            'gratitude',
            'awe',
            'freeform'
        )
    ),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.saved_quotes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    quote_text text not null,
    author text,
    source_title text,
    reflection text,
    created_at timestamptz not null default now()
);

create index daily_intentions_user_id_idx
    on public.daily_intentions(user_id);

create index practice_completions_user_id_idx
    on public.practice_completions(user_id);

create index practice_completions_practice_id_idx
    on public.practice_completions(practice_id);

create index daily_moods_user_id_idx
    on public.daily_moods(user_id);

create index journal_entries_user_id_idx
    on public.journal_entries(user_id);

create index saved_quotes_user_id_idx
    on public.saved_quotes(user_id);

alter table public.profiles enable row level security;
alter table public.practices enable row level security;
alter table public.daily_intentions enable row level security;
alter table public.practice_completions enable row level security;
alter table public.daily_moods enable row level security;
alter table public.journal_entries enable row level security;
alter table public.saved_quotes enable row level security;

create policy "Anyone can view active practices"
on public.practices
for select
to anon, authenticated
using (is_active = true);

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can view their own intentions"
on public.daily_intentions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own intentions"
on public.daily_intentions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own intentions"
on public.daily_intentions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own intentions"
on public.daily_intentions
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can view their own completions"
on public.practice_completions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own completions"
on public.practice_completions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own completions"
on public.practice_completions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own completions"
on public.practice_completions
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can view their own moods"
on public.daily_moods
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own moods"
on public.daily_moods
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own moods"
on public.daily_moods
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own moods"
on public.daily_moods
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can view their own journal entries"
on public.journal_entries
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own journal entries"
on public.journal_entries
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own journal entries"
on public.journal_entries
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own journal entries"
on public.journal_entries
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can view their own saved quotes"
on public.saved_quotes
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own saved quotes"
on public.saved_quotes
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own saved quotes"
on public.saved_quotes
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own saved quotes"
on public.saved_quotes
for delete
to authenticated
using ((select auth.uid()) = user_id);

insert into public.practices (
    title,
    slug,
    description,
    instructions,
    category,
    duration_minutes,
    benefit,
    icon,
    is_featured
)
values
(
    'Awe Walk',
    'awe-walk',
    'Take a slow walk outside and notice something that fills you with awe.',
    'Walk without rushing. Look for scale, complexity, beauty, age, motion, or anything that reminds you that you are part of something larger.',
    'wonder',
    10,
    'Cultivates wonder',
    'tree',
    true
),
(
    'Secular Prayer',
    'secular-prayer',
    'Turn your hopes and values into deliberate words.',
    'Write or speak three sentences beginning with “May I,” “May we,” or “Let me.” You do not need to address a supernatural being.',
    'reflection',
    5,
    'Clarifies intention',
    'sparkles',
    false
),
(
    'Deep Listening',
    'deep-listening',
    'Listen to one piece of music without multitasking.',
    'Put away other distractions. Follow the rhythm, texture, silence, and emotional movement of the music.',
    'attention',
    8,
    'Strengthens presence',
    'music',
    false
),
(
    'Compassion Letter',
    'compassion-letter',
    'Write to yourself as you would write to someone you deeply care about.',
    'Describe what is difficult, acknowledge it honestly, and respond with patience rather than judgment.',
    'compassion',
    10,
    'Builds self-compassion',
    'letter',
    false
),
(
    'Commonplace Reflection',
    'commonplace-reflection',
    'Reflect on a quote from a book, essay, poem, or speech.',
    'Copy the quote, explain why it matters to you, and connect it to one choice you can make today.',
    'reading',
    7,
    'Connects ideas to life',
    'book',
    false
);