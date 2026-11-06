-- Sample upcoming matches with manual odds (already inserted into the Phantom project once).
insert into public.matches (home_team, away_team, league, match_date, match_time, status, lock_time, odds) values
  ('الشرطة',        'الزوراء',    'الدوري العراقي',    current_date + 1, '20:00', 'upcoming', ((current_date + 1 + time '20:00') at time zone 'Asia/Baghdad'), 1.35),
  ('القوة الجوية',  'النجف',      'الدوري العراقي',    current_date + 1, '22:00', 'upcoming', ((current_date + 1 + time '22:00') at time zone 'Asia/Baghdad'), 1.10),
  ('ليفربول',       'أرسنال',     'الدوري الإنجليزي',  current_date + 2, '20:30', 'upcoming', ((current_date + 2 + time '20:30') at time zone 'Asia/Baghdad'), 1.60),
  ('ريال مدريد',    'برشلونة',    'الدوري الإسباني',   current_date + 3, '21:00', 'upcoming', ((current_date + 3 + time '21:00') at time zone 'Asia/Baghdad'), 2.00),
  ('بايرن ميونخ',   'إنتر',       'دوري أبطال أوروبا', current_date + 4, '22:00', 'upcoming', ((current_date + 4 + time '22:00') at time zone 'Asia/Baghdad'), 1.80);
