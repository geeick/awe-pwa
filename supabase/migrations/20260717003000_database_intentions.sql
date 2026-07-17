create table if not exists public.intentions (
  id uuid primary key default gen_random_uuid(),
  text text not null unique,
  category text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.intentions enable row level security;

drop policy if exists "Anyone can read active intentions"
on public.intentions;

create policy "Anyone can read active intentions"
on public.intentions
for select
using (is_active = true);

insert into public.intentions (text, category, is_active, is_featured, sort_order)
values
  ('Notice what is quietly asking for your attention.', 'attention', true, false, 1),
  ('Let the day remain partly unexplained.', 'mystery', true, false, 2),
  ('Stay near what makes you feel awake.', 'aliveness', true, false, 3),
  ('Make room for what cannot be rushed.', 'patience', true, false, 4),
  ('Carry tenderness into ordinary places.', 'tenderness', true, false, 5),
  ('Look for beauty that does not announce itself.', 'beauty', true, true, 6),
  ('Let wonder interrupt your certainty.', 'wonder', true, true, 7),
  ('Be changed by something small.', 'change', true, false, 8),
  ('Listen for what exists beneath the noise.', 'stillness', true, false, 9),
  ('Allow this day to be enough.', 'acceptance', true, false, 10),
  ('Hold the world gently, without trying to possess it.', 'care', true, false, 11),
  ('Pay attention to what you would usually pass by.', 'attention', true, false, 12),
  ('Let silence tell you what hurry cannot.', 'stillness', true, false, 13),
  ('Remember that everything you love is temporary.', 'impermanence', true, true, 14),
  ('Meet the unknown without demanding an answer.', 'uncertainty', true, false, 15),
  ('Stay soft in a world that rewards hardness.', 'tenderness', true, false, 16),
  ('Let longing point toward what matters.', 'longing', true, false, 17),
  ('Notice the life continuing around you.', 'presence', true, false, 18),
  ('Give your full attention to one fragile thing.', 'care', true, false, 19),
  ('Leave space for mystery.', 'mystery', true, false, 20),
  ('Choose presence over explanation.', 'presence', true, false, 21),
  ('Let yourself be moved without understanding why.', 'wonder', true, false, 22),
  ('Treat the ordinary as if it were sacred.', 'sacred-ordinary', true, true, 23),
  ('Look closely enough for the familiar to become strange.', 'wonder', true, true, 24),
  ('Do not hurry past your own life.', 'presence', true, false, 25),
  ('Honor what is unfinished.', 'acceptance', true, false, 26),
  ('Let today contain both grief and beauty.', 'grief-and-beauty', true, false, 27),
  ('Notice what remains after the moment has passed.', 'memory', true, false, 28),
  ('Be faithful to what quietly matters.', 'meaning', true, false, 29),
  ('Let the world surprise you again.', 'wonder', true, false, 30),
  ('Hold gratitude without denying sorrow.', 'gratitude', true, true, 31),
  ('Listen to the part of you that speaks softly.', 'inner-life', true, false, 32),
  ('Allow beauty to be useful simply because it is beautiful.', 'beauty', true, false, 33),
  ('Meet this moment before naming it.', 'presence', true, false, 34),
  ('Remember that you are passing through.', 'impermanence', true, false, 35),
  ('Let your attention become a form of care.', 'attention', true, true, 36),
  ('Stay with the question a little longer.', 'uncertainty', true, false, 37),
  ('Find something worth remembering.', 'memory', true, false, 38),
  ('Let what is fleeting become precious.', 'impermanence', true, false, 39),
  ('Make peace with not seeing the whole path.', 'uncertainty', true, false, 40),
  ('Notice where the light falls.', 'beauty', true, false, 41),
  ('Let today be lived, not solved.', 'presence', true, true, 42),
  ('Keep company with uncertainty.', 'uncertainty', true, false, 43),
  ('Receive the world before judging it.', 'openness', true, false, 44),
  ('Look for what survives beneath change.', 'change', true, false, 45),
  ('Let your life be touched by the lives around it.', 'connection', true, false, 46),
  ('Protect a small piece of wonder.', 'wonder', true, false, 47),
  ('Give the day permission to be quiet.', 'stillness', true, false, 48),
  ('Pay attention to what returns.', 'attention', true, false, 49),
  ('Carry only what belongs to you.', 'release', true, false, 50),
  ('Let something beautiful remain unshared.', 'beauty', true, false, 51),
  ('Notice what your sadness is trying to protect.', 'inner-life', true, false, 52),
  ('Be present for the life that is actually happening.', 'presence', true, false, 53),
  ('Let memory soften rather than imprison you.', 'memory', true, false, 54),
  ('Find the sacred hiding inside the familiar.', 'sacred-ordinary', true, false, 55),
  ('Do not mistake stillness for emptiness.', 'stillness', true, false, 56),
  ('Let yourself belong to this moment.', 'belonging', true, false, 57),
  ('Notice what disappears when you stop rushing.', 'stillness', true, false, 58),
  ('Hold hope without forcing it to become certainty.', 'hope', true, false, 59),
  ('Make a home inside your own attention.', 'attention', true, false, 60)
on conflict (text) do update
set
  category = excluded.category,
  is_active = excluded.is_active,
  is_featured = excluded.is_featured,
  sort_order = excluded.sort_order;
