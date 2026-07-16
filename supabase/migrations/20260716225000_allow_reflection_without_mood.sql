alter table public.daily_check_ins
  alter column mood_label drop not null;

alter table public.daily_check_ins
  alter column mood_score drop not null;
