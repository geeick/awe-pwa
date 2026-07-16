alter table public.daily_check_ins
  add column if not exists reflection_text text;
