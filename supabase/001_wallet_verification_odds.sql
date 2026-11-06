-- =====================================================================
-- Phantom: wallet + verification + stars + manual odds
-- APPLIED to the Phantom project (separate from predictions-app) on 2026-11-06.
-- Kept here for the record and to reuse on another project (needs table public.prediction_users with bigint id,
-- public.matches, public.predictions, and the existing calculate_prediction_points trigger).
-- =====================================================================

-- 1) Manual odds (1.00 - 2.00), set by admins directly in the database
alter table public.matches
  add column if not exists odds numeric(3,2) not null default 1.00
  check (odds >= 1.00 and odds <= 2.00);

-- Odds are frozen per prediction at save time (set by a trigger, not by the client)
alter table public.predictions
  add column if not exists odds_at_prediction numeric(3,2)
  check (odds_at_prediction >= 1.00 and odds_at_prediction <= 2.00);

-- 2) Account / wallet tables (no client access: only via the functions below)
create table if not exists public.gate_config (
  id int primary key default 1 check (id = 1),
  enforce_from timestamptz not null
);
-- Phantom is new: every account created after this moment must verify before predicting.
insert into public.gate_config (id, enforce_from) values (1, now()) on conflict (id) do nothing;

create table if not exists public.user_accounts (
  user_id bigint primary key references public.prediction_users(id) on delete cascade,
  balance bigint not null default 0 check (balance >= 0),
  verified_at timestamptz,
  badge text check (badge in ('red', 'green', 'yellow')),
  referral_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id bigint generated always as identity primary key,
  user_id bigint not null references public.prediction_users(id) on delete cascade,
  direction text not null check (direction in ('credit', 'debit')),
  kind text not null check (kind in ('topup', 'adjust')),
  amount bigint not null check (amount > 0),
  balance_after bigint not null,
  description text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists wallet_tx_user_idx on public.wallet_transactions (user_id, created_at desc);

create table if not exists public.topup_codes (
  code text primary key check (code ~ '^[0-9]{12}$'),
  amount bigint not null check (amount > 0),
  status text not null default 'unused' check (status in ('unused', 'used', 'disabled')),
  used_by bigint references public.prediction_users(id),
  used_at timestamptz,
  batch_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.redeem_attempts (
  id bigint generated always as identity primary key,
  user_id bigint,
  success boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists redeem_attempts_user_idx on public.redeem_attempts (user_id, created_at desc);

alter table public.gate_config enable row level security;
alter table public.user_accounts enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.topup_codes enable row level security;
alter table public.redeem_attempts enable row level security;
revoke all on public.gate_config, public.user_accounts, public.wallet_transactions,
              public.topup_codes, public.redeem_attempts from anon, authenticated;

-- 3) Gate + odds lock on predictions
create or replace function public.predictions_gate_and_odds()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from timestamptz; v_created timestamptz; v_verified timestamptz; v_odds numeric(3,2);
begin
  if tg_op = 'UPDATE' then
    if new.predicted_home is not distinct from old.predicted_home
       and new.predicted_away is not distinct from old.predicted_away then
      new.odds_at_prediction := old.odds_at_prediction;
      return new;
    end if;
  end if;

  select enforce_from into v_from from public.gate_config where id = 1;
  select created_at into v_created from public.prediction_users where id = new.user_id;

  if v_created >= v_from then
    select verified_at into v_verified from public.user_accounts where user_id = new.user_id;
    if v_verified is null then
      raise exception 'not_verified';
    end if;
  end if;

  select odds into v_odds from public.matches where id = new.match_id;
  new.odds_at_prediction := coalesce(v_odds, 1.00);
  return new;
end $$;
revoke all on function public.predictions_gate_and_odds() from public, anon, authenticated;

drop trigger if exists trg_predictions_gate_odds on public.predictions;
create trigger trg_predictions_gate_odds
  before insert or update on public.predictions
  for each row execute function public.predictions_gate_and_odds();

-- 4) Scoring: base points (25 exact / 5 outcome / 1 wrong) x odds locked at prediction time
create or replace function public.calculate_prediction_points()
returns trigger
language plpgsql
as $function$
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

-- 5) Redeem a 12-digit code: credits balance, verifies the account (one use per code)
create or replace function public.redeem_topup_code(p_user_id bigint, p_code text, p_referral text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := regexp_replace(coalesce(p_code, ''), '\D', '', 'g');
  v_ref text := nullif(btrim(coalesce(p_referral, '')), '');
  v_row public.topup_codes%rowtype;
  v_acc public.user_accounts%rowtype;
  v_fails int;
begin
  if not exists (select 1 from public.prediction_users where id = p_user_id) then
    return jsonb_build_object('ok', false, 'error', 'invalid_user');
  end if;
  if v_ref is not null and char_length(v_ref) > 32 then
    return jsonb_build_object('ok', false, 'error', 'invalid_referral');
  end if;

  select count(*) into v_fails from public.redeem_attempts
   where user_id = p_user_id and success = false and created_at > now() - interval '15 minutes';
  if v_fails >= 5 then
    return jsonb_build_object('ok', false, 'error', 'too_many_attempts');
  end if;

  if char_length(v_code) <> 12 then
    insert into public.redeem_attempts (user_id, success) values (p_user_id, false);
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  select * into v_row from public.topup_codes where code = v_code for update;
  if not found or v_row.status <> 'unused' then
    insert into public.redeem_attempts (user_id, success) values (p_user_id, false);
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  update public.topup_codes set status = 'used', used_by = p_user_id, used_at = now() where code = v_code;

  insert into public.user_accounts (user_id) values (p_user_id) on conflict (user_id) do nothing;
  update public.user_accounts
     set balance = balance + v_row.amount,
         verified_at = coalesce(verified_at, now()),
         referral_code = coalesce(referral_code, v_ref)
   where user_id = p_user_id
   returning * into v_acc;

  insert into public.wallet_transactions (user_id, direction, kind, amount, balance_after, description)
  values (p_user_id, 'credit', 'topup', v_row.amount, v_acc.balance, 'تعبئة رصيد بكود');
  insert into public.redeem_attempts (user_id, success) values (p_user_id, true);

  return jsonb_build_object('ok', true, 'amount', v_row.amount, 'balance', v_acc.balance,
                            'verified', true, 'badge', v_acc.badge);
end $$;

-- 6) Read / badge functions used by the app
create or replace function public.get_account(p_user_id bigint)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_acc public.user_accounts%rowtype; v_from timestamptz; v_created timestamptz; v_pts int; v_rank int;
begin
  select created_at, total_points, rank into v_created, v_pts, v_rank
    from public.prediction_users where id = p_user_id;
  if not found then return null; end if;
  select * into v_acc from public.user_accounts where user_id = p_user_id;
  select enforce_from into v_from from public.gate_config where id = 1;
  return jsonb_build_object(
    'balance', coalesce(v_acc.balance, 0),
    'verified', v_acc.verified_at is not null,
    'badge', v_acc.badge,
    'can_predict', (v_acc.verified_at is not null) or (v_created < v_from),
    'total_points', v_pts,
    'rank', v_rank
  );
end $$;

create or replace function public.set_badge(p_user_id bigint, p_badge text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_badge not in ('red', 'green', 'yellow') then
    return jsonb_build_object('ok', false, 'error', 'invalid_badge');
  end if;
  update public.user_accounts set badge = p_badge where user_id = p_user_id and verified_at is not null;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_verified');
  end if;
  return jsonb_build_object('ok', true, 'badge', p_badge);
end $$;

create or replace function public.get_badges()
returns table (user_id bigint, badge text)
language sql
security definer
stable
set search_path = public
as $$
  select a.user_id, a.badge from public.user_accounts a where a.badge is not null and a.verified_at is not null;
$$;

create or replace function public.get_points_history(p_user_id bigint)
returns table (
  match_id bigint, home_team text, away_team text, league text, match_date date,
  predicted_home int, predicted_away int, final_home int, final_away int,
  odds numeric, points_earned int, running_total bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select t.match_id, t.home_team, t.away_team, t.league, t.match_date,
         t.predicted_home, t.predicted_away, t.final_home, t.final_away,
         t.odds, t.points_earned, t.running_total
  from (
    select m.id as match_id, m.home_team, m.away_team, m.league, m.match_date,
           p.predicted_home, p.predicted_away,
           m.home_score as final_home, m.away_score as final_away,
           coalesce(p.odds_at_prediction, 1.00) as odds,
           p.points_earned,
           (sum(coalesce(p.points_earned, 0)) over (order by m.match_date, m.id))::bigint as running_total
      from public.predictions p
      join public.matches m on m.id = p.match_id
     where p.user_id = p_user_id
  ) t
  order by t.match_date desc, t.match_id desc;
$$;

create or replace function public.get_wallet_history(p_user_id bigint, p_limit int default 50)
returns table (id bigint, direction text, kind text, amount bigint, balance_after bigint, description text, created_at timestamptz)
language sql
security definer
stable
set search_path = public
as $$
  select w.id, w.direction, w.kind, w.amount, w.balance_after, w.description, w.created_at
    from public.wallet_transactions w
   where w.user_id = p_user_id
   order by w.created_at desc, w.id desc
   limit least(coalesce(p_limit, 50), 200);
$$;

-- 7) Admin only (SQL editor / dashboard; NOT callable by the app)
create or replace function public.generate_topup_codes(p_amount bigint, p_count int)
returns table (new_code text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_batch uuid := gen_random_uuid();
  v_n bigint; v_code text; i int;
begin
  if p_amount is null or p_amount <= 0 or p_count is null or p_count < 1 or p_count > 5000 then
    raise exception 'invalid_input';
  end if;
  for i in 1..p_count loop
    loop
      v_n := ((('x' || encode(gen_random_bytes(8), 'hex'))::bit(64)::bigint) & 9223372036854775807) % 1000000000000;
      v_code := lpad(v_n::text, 12, '0');
      begin
        insert into public.topup_codes (code, amount, batch_id) values (v_code, p_amount, v_batch);
        exit;
      exception when unique_violation then
        null;
      end;
    end loop;
    new_code := v_code;
    return next;
  end loop;
end $$;

-- 8) Function permissions
revoke all on function public.redeem_topup_code(bigint, text, text) from public, anon, authenticated;
revoke all on function public.get_account(bigint) from public, anon, authenticated;
revoke all on function public.set_badge(bigint, text) from public, anon, authenticated;
revoke all on function public.get_badges() from public, anon, authenticated;
revoke all on function public.get_points_history(bigint) from public, anon, authenticated;
revoke all on function public.get_wallet_history(bigint, int) from public, anon, authenticated;
revoke all on function public.generate_topup_codes(bigint, int) from public, anon, authenticated;

grant execute on function public.redeem_topup_code(bigint, text, text) to anon, authenticated;
grant execute on function public.get_account(bigint) to anon, authenticated;
grant execute on function public.set_badge(bigint, text) to anon, authenticated;
grant execute on function public.get_badges() to anon, authenticated;
grant execute on function public.get_points_history(bigint) to anon, authenticated;
grant execute on function public.get_wallet_history(bigint, int) to anon, authenticated;
-- generate_topup_codes: no grant on purpose
