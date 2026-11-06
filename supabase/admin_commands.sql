-- ===== Phantom admin commands (Supabase SQL Editor, project "alienuenu@gmail.com's Project") =====

-- Add a match with its odds (1.00 - 2.00; the database rejects anything else)
insert into public.matches (home_team, away_team, league, match_date, match_time, status, lock_time, odds)
values ('فريق أ', 'فريق ب', 'الدوري', current_date + 1, '20:00', 'upcoming',
        ((current_date + 1 + time '20:00') at time zone 'Asia/Baghdad'), 1.40);

-- Change a match's odds
update public.matches set odds = 1.35 where id = 1;

-- Finish a match (points are calculated automatically: 25 / 5 / 1 x odds)
update public.matches set status = 'finished', home_score = 2, away_score = 1 where id = 1;

-- Generate 12-digit top-up codes: 50 codes worth 10000 each
select * from public.generate_topup_codes(10000, 50);

-- Follow up on codes
select code, amount, status, used_by, used_at from public.topup_codes order by created_at desc limit 100;

-- Disable an unused code
-- update public.topup_codes set status = 'disabled' where code = '123456789012' and status = 'unused';
