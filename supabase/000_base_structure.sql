-- Phantom base: SAME structure as Tawaqoati (tables, triggers, policies), in its own Supabase project.
-- APPLIED on 2026-11-06. Run this BEFORE 001_wallet_verification_odds.sql on any fresh project.

create table public.announcements (
  id bigserial primary key,
  message text not null,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create table public.avatar_options (
  id bigserial primary key,
  type text not null default 'local',
  source text not null,
  label text,
  is_active boolean not null default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table public.prediction_users (
  id bigserial primary key,
  username text not null,
  password_hash text not null,
  display_name text not null,
  avatar_id integer default 1,
  total_points integer not null default 0,
  rank integer,
  last_seen_announcement_id bigint,
  created_at timestamptz default now(),
  avatar_option_id bigint default 1 references public.avatar_options(id),
  constraint prediction_users_username_key unique (username)
);

create table public.matches (
  id bigserial primary key,
  home_team text not null,
  away_team text not null,
  home_logo text,
  away_logo text,
  league text not null default 'دوري غير محدد',
  match_date date not null default current_date,
  match_time text default '20:00',
  status text not null default 'upcoming',
  home_score integer,
  away_score integer,
  lock_time timestamptz,
  created_at timestamptz default now(),
  odds numeric(3,2) not null default 1.00 check (odds >= 1.00 and odds <= 2.00)
);
create index idx_matches_date on public.matches (match_date);

create table public.predictions (
  id bigserial primary key,
  user_id bigint not null references public.prediction_users(id) on delete cascade,
  match_id bigint not null references public.matches(id) on delete cascade,
  predicted_home integer not null,
  predicted_away integer not null,
  points_earned integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  odds_at_prediction numeric(3,2) check (odds_at_prediction >= 1.00 and odds_at_prediction <= 2.00),
  unique (user_id, match_id)
);
create index idx_predictions_user on public.predictions (user_id);
create index idx_predictions_match on public.predictions (match_id);

create table public.friend_challenges (
  id bigserial primary key,
  user_id bigint not null references public.prediction_users(id) on delete cascade,
  friend_id bigint not null references public.prediction_users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, friend_id)
);

create or replace function public.set_predictions_updated_at()
returns trigger language plpgsql as $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;

create or replace function public.update_all_ranks()
returns trigger language plpgsql as $function$
BEGIN
  UPDATE public.prediction_users pu
  SET rank = sub.rank
  FROM (
    SELECT id, DENSE_RANK() OVER (ORDER BY total_points DESC) AS rank
    FROM public.prediction_users
  ) sub
  WHERE pu.id = sub.id;
  RETURN NULL;
END; $function$;

-- Scoring: base points (25 exact / 5 outcome / 1 wrong) x odds locked at prediction time
create or replace function public.calculate_prediction_points()
returns trigger language plpgsql as $function$
BEGIN
  IF NEW.status = 'finished'
     AND NEW.home_score IS NOT NULL
     AND NEW.away_score IS NOT NULL
     AND (OLD.status != 'finished' OR OLD.home_score IS NULL) THEN

    UPDATE public.predictions p
    SET points_earned = round(
      (CASE
        WHEN p.predicted_home = NEW.home_score AND p.predicted_away = NEW.away_score THEN 25
        WHEN (p.predicted_home > p.predicted_away AND NEW.home_score > NEW.away_score)
          OR (p.predicted_home < p.predicted_away AND NEW.home_score < NEW.away_score)
          OR (p.predicted_home = p.predicted_away AND NEW.home_score = NEW.away_score)
        THEN 5
        ELSE 1
      END) * coalesce(p.odds_at_prediction, 1.00)
    )::int
    WHERE p.match_id = NEW.id;

    UPDATE public.prediction_users pu
    SET total_points = (
      SELECT COALESCE(SUM(points_earned), 0)
      FROM public.predictions
      WHERE user_id = pu.id AND points_earned IS NOT NULL
    );
  END IF;
  RETURN NEW;
END; $function$;

create trigger trg_calculate_points after update on public.matches
  for each row execute function public.calculate_prediction_points();
create trigger trg_update_ranks after insert or update of total_points on public.prediction_users
  for each statement execute function public.update_all_ranks();
create trigger trg_predictions_updated_at before update on public.predictions
  for each row execute function public.set_predictions_updated_at();

-- RLS: same policies as Tawaqoati so the app code works unchanged
alter table public.announcements enable row level security;
alter table public.avatar_options enable row level security;
alter table public.prediction_users enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.friend_challenges enable row level security;

create policy public_read_announcements on public.announcements for select to public using (true);
create policy public_write_announcements on public.announcements for all to public using (true) with check (true);
create policy admin_all_avatars on public.avatar_options for all to public using (true) with check (true);
create policy public_read_avatars on public.avatar_options for select to public using (true);
create policy public_all_friends on public.friend_challenges for all to public using (true) with check (true);
create policy public_read_matches on public.matches for select to public using (true);
create policy public_update_pred_users on public.prediction_users for update to public using (true) with check (true);
create policy public_read_pred_users on public.prediction_users for select to public using (true);
create policy public_insert_pred_users on public.prediction_users for insert to public with check (true);
create policy public_read_predictions on public.predictions for select to public using (true);
create policy public_insert_predictions on public.predictions for insert to public with check (true);
create policy public_update_predictions on public.predictions for update to public using (true);

-- Avatar options (app config; prediction_users.avatar_option_id defaults to 1)
insert into public.avatar_options (id, type, source, label, is_active, sort_order) values
  (1, 'local', '1', 'أفاتار 1', true, 1),
  (2, 'local', '2', 'أفاتار 2', true, 2),
  (3, 'local', '3', 'أفاتار 3', true, 3),
  (4, 'local', '4', 'أفاتار 4', true, 4),
  (5, 'local', '5', 'أفاتار 5', true, 5),
  (6, 'remote', 'https://www.footyrenders.com/render/kevin-de-bruyne-74-248x540.png', 'أفاتار 6', true, 6),
  (7, 'local', '7', 'أفاتار 7', true, 7),
  (8, 'local', '8', 'أفاتار 8', true, 8),
  (9, 'local', '9', 'أفاتار 9', true, 9),
  (10, 'local', '10', 'أفاتار 10', true, 10),
  (11, 'local', '11', 'أفاتار 11', true, 11),
  (12, 'local', '12', 'avatar-2', false, 12);
select setval(pg_get_serial_sequence('public.avatar_options', 'id'), 12);
