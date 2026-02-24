-- ============================================================
-- SEED SCRIPT: GafferScore Test Data
-- 5 Gameweeks · 10 Fixtures/week · 25 Fake users · Random predictions
-- ============================================================

-- ── Step 1: Create 25 fake users in auth.users + public.users ──
-- We insert directly into auth.users with minimal fields so RLS works.
-- The passwords are irrelevant because these are test bots.

INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at, instance_id, aud, role, encrypted_password, email_confirmed_at, confirmation_token)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'elgaffer@test.com',     '{"nickname":"ElGaffer"}',     now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000002', 'scoremaster@test.com',  '{"nickname":"ScoreMaster"}',  now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000003', 'pitchking@test.com',    '{"nickname":"PitchKing"}',    now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000004', 'tacticaltom@test.com',  '{"nickname":"TacticalTom"}',  now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000005', 'matchdaymike@test.com', '{"nickname":"MatchdayMike"}', now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000006', 'bootroom@test.com',     '{"nickname":"BootRoom"}',     now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000007', 'formguide@test.com',    '{"nickname":"FormGuide"}',    now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000008', 'topbinsfc@test.com',    '{"nickname":"TopBinsFC"}',    now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000009', 'setpiecepro@test.com',  '{"nickname":"SetPiecePro"}',  now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000010', 'wingplay@test.com',     '{"nickname":"WingPlay"}',     now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000011', 'midfielderx@test.com',  '{"nickname":"MidfielderX"}',  now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000012', 'counterpress@test.com', '{"nickname":"CounterPress"}', now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000013', 'deadballdave@test.com', '{"nickname":"DeadBallDave"}', now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000014', 'crossbarkid@test.com',  '{"nickname":"CrossbarKid"}',  now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000015', 'offsidetrap@test.com',  '{"nickname":"OffsideTrap"}',  now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000016', 'doubleswoop@test.com',  '{"nickname":"DoubleSwoop"}',  now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000017', 'penaltyking@test.com',  '{"nickname":"PenaltyKing"}',  now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000018', 'varcheck@test.com',     '{"nickname":"VarCheck"}',     now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000019', 'finalwhistle@test.com', '{"nickname":"FinalWhistle"}', now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000020', 'halftimehero@test.com', '{"nickname":"HalfTimeHero"}', now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000021', 'boxtobox@test.com',     '{"nickname":"BoxToBox"}',     now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000022', 'sweepkeeper@test.com',  '{"nickname":"SweepKeeper"}',  now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000023', 'pressingfc@test.com',   '{"nickname":"PressingFC"}',   now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000024', 'scoutreport@test.com',  '{"nickname":"ScoutReport"}',  now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), ''),
  ('a0000000-0000-0000-0000-000000000025', 'freekickace@test.com',  '{"nickname":"FreeKickAce"}',  now(), now(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), '')
ON CONFLICT (id) DO NOTHING;

-- Public users table
INSERT INTO public.users (id, nickname) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'ElGaffer'),
  ('a0000000-0000-0000-0000-000000000002', 'ScoreMaster'),
  ('a0000000-0000-0000-0000-000000000003', 'PitchKing'),
  ('a0000000-0000-0000-0000-000000000004', 'TacticalTom'),
  ('a0000000-0000-0000-0000-000000000005', 'MatchdayMike'),
  ('a0000000-0000-0000-0000-000000000006', 'BootRoom'),
  ('a0000000-0000-0000-0000-000000000007', 'FormGuide'),
  ('a0000000-0000-0000-0000-000000000008', 'TopBinsFC'),
  ('a0000000-0000-0000-0000-000000000009', 'SetPiecePro'),
  ('a0000000-0000-0000-0000-000000000010', 'WingPlay'),
  ('a0000000-0000-0000-0000-000000000011', 'MidfielderX'),
  ('a0000000-0000-0000-0000-000000000012', 'CounterPress'),
  ('a0000000-0000-0000-0000-000000000013', 'DeadBallDave'),
  ('a0000000-0000-0000-0000-000000000014', 'CrossbarKid'),
  ('a0000000-0000-0000-0000-000000000015', 'OffsideTrap'),
  ('a0000000-0000-0000-0000-000000000016', 'DoubleSwoop'),
  ('a0000000-0000-0000-0000-000000000017', 'PenaltyKing'),
  ('a0000000-0000-0000-0000-000000000018', 'VarCheck'),
  ('a0000000-0000-0000-0000-000000000019', 'FinalWhistle'),
  ('a0000000-0000-0000-0000-000000000020', 'HalfTimeHero'),
  ('a0000000-0000-0000-0000-000000000021', 'BoxToBox'),
  ('a0000000-0000-0000-0000-000000000022', 'SweepKeeper'),
  ('a0000000-0000-0000-0000-000000000023', 'PressingFC'),
  ('a0000000-0000-0000-0000-000000000024', 'ScoutReport'),
  ('a0000000-0000-0000-0000-000000000025', 'FreeKickAce')
ON CONFLICT (id) DO NOTHING;


-- ── Step 2: Gameweeks (GW14-GW18) ──
-- GW14-17 are finished, GW18 is the current gameweek with future kickoffs
INSERT INTO public.gameweeks (id, name, start_date, end_date, is_current) VALUES
  (14, 'Gameweek 14', '2026-01-17 12:00:00+00', '2026-01-19 22:00:00+00', false),
  (15, 'Gameweek 15', '2026-01-24 12:00:00+00', '2026-01-26 22:00:00+00', false),
  (16, 'Gameweek 16', '2026-01-31 12:00:00+00', '2026-02-02 22:00:00+00', false),
  (17, 'Gameweek 17', '2026-02-07 12:00:00+00', '2026-02-09 22:00:00+00', false),
  (18, 'Gameweek 18', '2026-02-28 12:00:00+00', '2026-03-02 22:00:00+00', true)
ON CONFLICT (id) DO UPDATE SET is_current = EXCLUDED.is_current;

-- Reset sequence so future inserts don't collide
SELECT setval('gameweeks_id_seq', 18);


-- ── Step 3: Fixtures ──
-- GW14 (finished)
INSERT INTO public.fixtures (id, gameweek_id, home_team, away_team, home_short, away_short, kickoff_time, status, home_score, away_score) VALUES
  (1,  14, 'Arsenal',          'Chelsea',           'ARS','CHE', '2026-01-17 15:00+00', 'finished', 2, 1),
  (2,  14, 'Manchester City',  'Liverpool',         'MCI','LIV', '2026-01-17 17:30+00', 'finished', 1, 1),
  (3,  14, 'Tottenham',        'Manchester United',  'TOT','MUN', '2026-01-18 14:00+00', 'finished', 3, 0),
  (4,  14, 'Newcastle United', 'Aston Villa',       'NEW','AVL', '2026-01-18 14:00+00', 'finished', 2, 2),
  (5,  14, 'Brighton',         'West Ham',          'BHA','WHU', '2026-01-18 16:30+00', 'finished', 1, 0),
  (6,  14, 'Everton',          'Wolverhampton',     'EVE','WOL', '2026-01-19 14:00+00', 'finished', 0, 1),
  (7,  14, 'Fulham',           'Crystal Palace',    'FUL','CRY', '2026-01-19 14:00+00', 'finished', 1, 1),
  (8,  14, 'Bournemouth',      'Nottingham Forest', 'BOU','NFO', '2026-01-19 14:00+00', 'finished', 2, 3),
  (9,  14, 'Brentford',        'Leicester City',    'BRE','LEI', '2026-01-19 16:30+00', 'finished', 4, 1),
  (10, 14, 'Ipswich Town',     'Southampton',       'IPS','SOU', '2026-01-19 14:00+00', 'finished', 1, 0)
ON CONFLICT (id) DO NOTHING;

-- GW15 (finished)
INSERT INTO public.fixtures (id, gameweek_id, home_team, away_team, home_short, away_short, kickoff_time, status, home_score, away_score) VALUES
  (11, 15, 'Chelsea',          'Arsenal',           'CHE','ARS', '2026-01-24 15:00+00', 'finished', 0, 1),
  (12, 15, 'Liverpool',        'Manchester City',   'LIV','MCI', '2026-01-24 17:30+00', 'finished', 2, 0),
  (13, 15, 'Manchester United','Tottenham',          'MUN','TOT', '2026-01-25 14:00+00', 'finished', 1, 2),
  (14, 15, 'Aston Villa',      'Newcastle United',  'AVL','NEW', '2026-01-25 14:00+00', 'finished', 3, 1),
  (15, 15, 'West Ham',         'Brighton',          'WHU','BHA', '2026-01-25 16:30+00', 'finished', 2, 2),
  (16, 15, 'Wolverhampton',    'Everton',           'WOL','EVE', '2026-01-26 14:00+00', 'finished', 1, 0),
  (17, 15, 'Crystal Palace',   'Fulham',            'CRY','FUL', '2026-01-26 14:00+00', 'finished', 0, 0),
  (18, 15, 'Nottingham Forest','Bournemouth',        'NFO','BOU', '2026-01-26 14:00+00', 'finished', 1, 1),
  (19, 15, 'Leicester City',   'Brentford',         'LEI','BRE', '2026-01-26 16:30+00', 'finished', 0, 2),
  (20, 15, 'Southampton',      'Ipswich Town',      'SOU','IPS', '2026-01-26 14:00+00', 'finished', 1, 3)
ON CONFLICT (id) DO NOTHING;

-- GW16 (finished)
INSERT INTO public.fixtures (id, gameweek_id, home_team, away_team, home_short, away_short, kickoff_time, status, home_score, away_score) VALUES
  (21, 16, 'Arsenal',          'Tottenham',         'ARS','TOT', '2026-01-31 15:00+00', 'finished', 2, 0),
  (22, 16, 'Manchester City',  'Chelsea',           'MCI','CHE', '2026-01-31 17:30+00', 'finished', 3, 1),
  (23, 16, 'Liverpool',        'Manchester United',  'LIV','MUN', '2026-02-01 14:00+00', 'finished', 4, 0),
  (24, 16, 'Newcastle United', 'Brighton',          'NEW','BHA', '2026-02-01 14:00+00', 'finished', 1, 1),
  (25, 16, 'Aston Villa',      'West Ham',          'AVL','WHU', '2026-02-01 16:30+00', 'finished', 2, 0),
  (26, 16, 'Everton',          'Fulham',            'EVE','FUL', '2026-02-02 14:00+00', 'finished', 1, 2),
  (27, 16, 'Wolverhampton',    'Crystal Palace',    'WOL','CRY', '2026-02-02 14:00+00', 'finished', 0, 0),
  (28, 16, 'Bournemouth',      'Brentford',         'BOU','BRE', '2026-02-02 14:00+00', 'finished', 1, 1),
  (29, 16, 'Nottingham Forest','Leicester City',     'NFO','LEI', '2026-02-02 16:30+00', 'finished', 2, 1),
  (30, 16, 'Ipswich Town',     'Southampton',       'IPS','SOU', '2026-02-02 14:00+00', 'finished', 0, 0)
ON CONFLICT (id) DO NOTHING;

-- GW17 (finished)
INSERT INTO public.fixtures (id, gameweek_id, home_team, away_team, home_short, away_short, kickoff_time, status, home_score, away_score) VALUES
  (31, 17, 'Chelsea',          'Liverpool',         'CHE','LIV', '2026-02-07 15:00+00', 'finished', 1, 3),
  (32, 17, 'Tottenham',        'Manchester City',   'TOT','MCI', '2026-02-07 17:30+00', 'finished', 2, 2),
  (33, 17, 'Manchester United','Arsenal',            'MUN','ARS', '2026-02-08 14:00+00', 'finished', 0, 1),
  (34, 17, 'Brighton',         'Aston Villa',       'BHA','AVL', '2026-02-08 14:00+00', 'finished', 3, 2),
  (35, 17, 'West Ham',         'Newcastle United',  'WHU','NEW', '2026-02-08 16:30+00', 'finished', 0, 2),
  (36, 17, 'Fulham',           'Everton',           'FUL','EVE', '2026-02-09 14:00+00', 'finished', 2, 0),
  (37, 17, 'Crystal Palace',   'Wolverhampton',     'CRY','WOL', '2026-02-09 14:00+00', 'finished', 1, 0),
  (38, 17, 'Brentford',        'Bournemouth',       'BRE','BOU', '2026-02-09 14:00+00', 'finished', 2, 1),
  (39, 17, 'Leicester City',   'Nottingham Forest', 'LEI','NFO', '2026-02-09 16:30+00', 'finished', 1, 4),
  (40, 17, 'Southampton',      'Ipswich Town',      'SOU','IPS', '2026-02-09 14:00+00', 'finished', 2, 2)
ON CONFLICT (id) DO NOTHING;

-- GW18 (current — future kickoffs, pending status)
INSERT INTO public.fixtures (id, gameweek_id, home_team, away_team, home_short, away_short, kickoff_time, status) VALUES
  (41, 18, 'Arsenal',          'Manchester City',   'ARS','MCI', '2026-02-28 15:00+00', 'pending'),
  (42, 18, 'Liverpool',        'Chelsea',           'LIV','CHE', '2026-02-28 17:30+00', 'pending'),
  (43, 18, 'Tottenham',        'Brighton',          'TOT','BHA', '2026-03-01 14:00+00', 'pending'),
  (44, 18, 'Manchester United','Newcastle United',   'MUN','NEW', '2026-03-01 14:00+00', 'pending'),
  (45, 18, 'Aston Villa',      'Everton',           'AVL','EVE', '2026-03-01 16:30+00', 'pending'),
  (46, 18, 'West Ham',         'Fulham',            'WHU','FUL', '2026-03-02 14:00+00', 'pending'),
  (47, 18, 'Wolverhampton',    'Bournemouth',       'WOL','BOU', '2026-03-02 14:00+00', 'pending'),
  (48, 18, 'Crystal Palace',   'Brentford',         'CRY','BRE', '2026-03-02 14:00+00', 'pending'),
  (49, 18, 'Nottingham Forest','Southampton',        'NFO','SOU', '2026-03-02 16:30+00', 'pending'),
  (50, 18, 'Ipswich Town',     'Leicester City',    'IPS','LEI', '2026-03-02 14:00+00', 'pending')
ON CONFLICT (id) DO NOTHING;

-- Reset fixture sequence
SELECT setval('fixtures_id_seq', 50);


-- ── Step 4: Generate predictions for all 25 users on finished gameweeks (GW14-17) ──
-- We'll use a DO block with random scores. The trigger handles point calculation.
-- But since the trigger fires on fixture UPDATE (not prediction INSERT), we'll
-- calculate points inline using the same logic as the trigger.

DO $$
DECLARE
  v_user RECORD;
  v_fixture RECORD;
  v_pred_h INTEGER;
  v_pred_a INTEGER;
  v_points INTEGER;
  v_dist INTEGER;
BEGIN
  FOR v_user IN SELECT id FROM public.users LOOP
    FOR v_fixture IN
      SELECT id, home_score, away_score
      FROM public.fixtures
      WHERE status = 'finished'
    LOOP
      -- Generate random predictions (0-4 range for realism)
      v_pred_h := floor(random() * 5)::INTEGER;
      v_pred_a := floor(random() * 5)::INTEGER;

      -- Calculate distance
      v_dist := ABS(v_pred_h - v_fixture.home_score) + ABS(v_pred_a - v_fixture.away_score);

      -- Calculate points
      IF v_pred_h = v_fixture.home_score AND v_pred_a = v_fixture.away_score THEN
        v_points := 50;  -- Exact score
      ELSIF (v_pred_h > v_pred_a AND v_fixture.home_score > v_fixture.away_score)
         OR (v_pred_h < v_pred_a AND v_fixture.home_score < v_fixture.away_score)
         OR (v_pred_h = v_pred_a AND v_fixture.home_score = v_fixture.away_score) THEN
        v_points := 20;  -- Correct outcome
      ELSE
        v_points := 0;
      END IF;

      INSERT INTO public.predictions (user_id, fixture_id, predicted_home_score, predicted_away_score, points_earned, distance)
      VALUES (v_user.id, v_fixture.id, v_pred_h, v_pred_a, v_points, v_dist)
      ON CONFLICT (user_id, fixture_id) DO NOTHING;

    END LOOP;
  END LOOP;
END $$;


-- ── Step 5: Snapshot standings for finished gameweeks ──
-- This populates gameweek_standings so trend arrows work.
SELECT public.snapshot_gameweek_standings(14);
SELECT public.snapshot_gameweek_standings(15);
SELECT public.snapshot_gameweek_standings(16);
SELECT public.snapshot_gameweek_standings(17);
