alter table public.daily_intentions
  add column if not exists intention_text text;
