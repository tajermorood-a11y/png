-- Phantom: server-side auth (bcrypt), profile/announcement RPCs, and match lock enforcement

create table if not exists public.login_attempts (
  id bigint generated always as identity primary key,
  username text not null,
  success boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists login_attempts_idx on public.login_attempts (username, created_at desc);
alter table public.login_attempts enable row level security;
revoke all on public.login_attempts from anon, authenticated;

-- internal helper: the safe user payload (never includes password_hash)
create or replace function public.phantom_user_json(p_id bigint)
returns jsonb language sql security definer stable set search_path = public as $$
  select jsonb_build_object('id', id, 'username', username, 'display_name', display_name,
                            'avatar_option_id', avatar_option_id, 'total_points', total_points, 'rank', rank)
    from public.prediction_users where id = p_id;
$$;

create or replace function public.phantom_register(p_username text, p_password text, p_display_name text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_u text := lower(btrim(coalesce(p_username, '')));
  v_name text := nullif(btrim(coalesce(p_display_name, '')), '');
  v_id bigint;
begin
  if v_u !~ '^[a-z0-9_]{3,20}$' then return jsonb_build_object('ok', false, 'error', 'invalid_username'); end if;
  if char_length(coalesce(p_password, '')) < 6 or char_length(p_password) > 72 then
    return jsonb_build_object('ok', false, 'error', 'invalid_password');
  end if;
  if v_name is not null and char_length(v_name) > 30 then return jsonb_build_object('ok', false, 'error', 'invalid_name'); end if;
  if exists (select 1 from public.prediction_users where lower(username) = v_u) then
    return jsonb_build_object('ok', false, 'error', 'username_taken');
  end if;
  begin
    insert into public.prediction_users (username, password_hash, display_name)
    values (v_u, crypt(p_password, gen_salt('bf', 10)), coalesce(v_name, v_u))
    returning id into v_id;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'username_taken');
  end;
  return jsonb_build_object('ok', true, 'user', public.phantom_user_json(v_id));
end $$;

create or replace function public.phantom_login(p_username text, p_password text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_u text := lower(btrim(coalesce(p_username, '')));
  v_row public.prediction_users%rowtype;
  v_fails int; v_ok boolean := false;
begin
  delete from public.login_attempts where created_at < now() - interval '1 day';
  select count(*) into v_fails from public.login_attempts
   where username = v_u and success = false and created_at > now() - interval '15 minutes';
  if v_fails >= 8 then return jsonb_build_object('ok', false, 'error', 'too_many_attempts'); end if;

  select * into v_row from public.prediction_users where lower(username) = v_u limit 1;
  if found then
    begin
      v_ok := v_row.password_hash = crypt(coalesce(p_password, ''), v_row.password_hash);
    exception when others then v_ok := false;
    end;
  end if;

  if not v_ok then
    insert into public.login_attempts (username, success) values (v_u, false);
    return jsonb_build_object('ok', false, 'error', 'invalid_credentials');
  end if;
  return jsonb_build_object('ok', true, 'user', public.phantom_user_json(v_row.id));
end $$;

create or replace function public.update_profile(p_user_id bigint, p_display_name text, p_avatar_option_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_name text := btrim(coalesce(p_display_name, ''));
begin
  if char_length(v_name) < 1 or char_length(v_name) > 30 then
    return jsonb_build_object('ok', false, 'error', 'invalid_name');
  end if;
  if not exists (select 1 from public.avatar_options where id = p_avatar_option_id and is_active) then
    return jsonb_build_object('ok', false, 'error', 'invalid_avatar');
  end if;
  update public.prediction_users set display_name = v_name, avatar_option_id = p_avatar_option_id where id = p_user_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'invalid_user'); end if;
  return jsonb_build_object('ok', true, 'user', public.phantom_user_json(p_user_id));
end $$;

create or replace function public.mark_announcement_seen(p_user_id bigint, p_id bigint)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.prediction_users
     set last_seen_announcement_id = greatest(coalesce(last_seen_announcement_id, 0), p_id)
   where id = p_user_id;
  return found;
end $$;

-- Gate + odds lock + MATCH LOCK: predictions can only be saved while the match is open
create or replace function public.predictions_gate_and_odds()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_from timestamptz; v_created timestamptz; v_verified timestamptz;
  v_odds numeric(3,2); v_status text; v_lock timestamptz;
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
    if v_verified is null then raise exception 'not_verified'; end if;
  end if;

  select odds, status, lock_time into v_odds, v_status, v_lock from public.matches where id = new.match_id;
  if not found or v_status <> 'upcoming' or (v_lock is not null and v_lock <= now()) then
    raise exception 'match_locked';
  end if;

  new.odds_at_prediction := coalesce(v_odds, 1.00);
  return new;
end $$;

revoke all on function public.phantom_user_json(bigint) from public, anon, authenticated;
revoke all on function public.phantom_register(text, text, text) from public, anon, authenticated;
revoke all on function public.phantom_login(text, text) from public, anon, authenticated;
revoke all on function public.update_profile(bigint, text, bigint) from public, anon, authenticated;
revoke all on function public.mark_announcement_seen(bigint, bigint) from public, anon, authenticated;
grant execute on function public.phantom_register(text, text, text) to anon, authenticated;
grant execute on function public.phantom_login(text, text) to anon, authenticated;
grant execute on function public.update_profile(bigint, text, bigint) to anon, authenticated;
grant execute on function public.mark_announcement_seen(bigint, bigint) to anon, authenticated;
