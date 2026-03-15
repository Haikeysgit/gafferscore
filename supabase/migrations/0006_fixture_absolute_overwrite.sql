-- ============================================================
-- MIGRATION: Absolute overwrite support for live fixture sync
-- 1. Add api_match_id as the authoritative external key
-- 2. Expand fixture statuses to raw football-data.org values
-- 3. Rework point calculation so only full-time fixtures score,
--    and points are reversed if a fixture leaves full-time
-- ============================================================

ALTER TABLE public.fixtures
ADD COLUMN IF NOT EXISTS api_match_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS fixtures_api_match_id_unique_idx
ON public.fixtures (api_match_id)
WHERE api_match_id IS NOT NULL;

ALTER TABLE public.fixtures
DROP CONSTRAINT IF EXISTS fixtures_status_check;

UPDATE public.fixtures
SET status = CASE status
  WHEN 'pending' THEN 'SCHEDULED'
  WHEN 'live' THEN 'IN_PLAY'
  WHEN 'finished' THEN 'FINISHED'
  ELSE status
END;

ALTER TABLE public.fixtures
ALTER COLUMN status SET DEFAULT 'SCHEDULED';

ALTER TABLE public.fixtures
ADD CONSTRAINT fixtures_status_check CHECK (
  status IN (
    'SCHEDULED',
    'TIMED',
    'IN_PLAY',
    'PAUSED',
    'HALFTIME',
    'EXTRA_TIME',
    'PENALTY_SHOOTOUT',
    'FINISHED',
    'AWARDED',
    'POSTPONED',
    'SUSPENDED',
    'CANCELLED'
  )
);

CREATE OR REPLACE FUNCTION public.is_fixture_full_time(p_status TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_status IN ('FINISHED', 'AWARDED');
$$;

CREATE OR REPLACE FUNCTION public.calculate_user_points()
RETURNS TRIGGER AS $$
DECLARE
  v_penalty_distance CONSTANT INTEGER := 20;
  v_old_full_time BOOLEAN := public.is_fixture_full_time(OLD.status);
  v_new_full_time BOOLEAN := public.is_fixture_full_time(NEW.status);
  v_status_just_finished BOOLEAN := v_new_full_time AND NOT v_old_full_time;
  v_score_corrected BOOLEAN := (
    v_new_full_time AND v_old_full_time
    AND (
      NEW.home_score IS DISTINCT FROM OLD.home_score
      OR NEW.away_score IS DISTINCT FROM OLD.away_score
    )
  );
  v_full_time_reverted BOOLEAN := v_old_full_time AND NOT v_new_full_time;
BEGIN
  IF v_full_time_reverted THEN
    UPDATE public.predictions
    SET
      points_earned = 0,
      distance = 0
    WHERE fixture_id = NEW.id
      AND predicted_home_score >= 0
      AND predicted_away_score >= 0;

    DELETE FROM public.predictions
    WHERE fixture_id = NEW.id
      AND predicted_home_score = -1
      AND predicted_away_score = -1;

    RETURN NEW;
  END IF;

  IF v_status_just_finished OR v_score_corrected THEN
    UPDATE public.predictions p
    SET
      distance = ABS(p.predicted_home_score - NEW.home_score)
               + ABS(p.predicted_away_score - NEW.away_score),
      points_earned = CASE
        WHEN p.predicted_home_score = NEW.home_score
         AND p.predicted_away_score = NEW.away_score THEN 50
        WHEN p.predicted_home_score > p.predicted_away_score
         AND NEW.home_score > NEW.away_score THEN 20
        WHEN p.predicted_home_score < p.predicted_away_score
         AND NEW.home_score < NEW.away_score THEN 20
        WHEN p.predicted_home_score = p.predicted_away_score
         AND NEW.home_score = NEW.away_score THEN 20
        ELSE 0
      END
    WHERE p.fixture_id = NEW.id
      AND p.predicted_home_score >= 0
      AND p.predicted_away_score >= 0;

    IF v_status_just_finished THEN
      INSERT INTO public.predictions (
        user_id,
        fixture_id,
        predicted_home_score,
        predicted_away_score,
        points_earned,
        distance
      )
      SELECT
        u.id,
        NEW.id,
        -1,
        -1,
        0,
        v_penalty_distance
      FROM public.users u
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.predictions p
        WHERE p.user_id = u.id
          AND p.fixture_id = NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Can view own predictions or finished matches" ON public.predictions;

CREATE POLICY "Can view own predictions or finished matches"
ON public.predictions
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1
    FROM public.fixtures
    WHERE id = fixture_id
      AND public.is_fixture_full_time(status)
  )
);

CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_type TEXT,
  p_gameweek_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  nickname TEXT,
  total_points BIGINT,
  exact_scores BIGINT,
  total_distance BIGINT,
  current_rank BIGINT,
  previous_rank INTEGER
) AS $$
DECLARE
  v_previous_gameweek_id INTEGER;
BEGIN
  IF p_gameweek_id IS NOT NULL THEN
    SELECT g.id INTO v_previous_gameweek_id
    FROM public.gameweeks g
    WHERE g.start_date < (
      SELECT gw.start_date
      FROM public.gameweeks gw
      WHERE gw.id = p_gameweek_id
    )
    ORDER BY g.start_date DESC
    LIMIT 1;
  END IF;

  IF p_type = 'weekly' THEN
    RETURN QUERY
    WITH weekly_stats AS (
      SELECT
        p.user_id,
        u.nickname,
        SUM(p.points_earned)                         AS total_points,
        COUNT(*) FILTER (WHERE p.points_earned = 50) AS exact_scores,
        SUM(p.distance)                              AS total_distance
      FROM public.predictions p
      JOIN public.fixtures f ON p.fixture_id = f.id
      JOIN public.users u ON p.user_id = u.id
      WHERE f.gameweek_id = p_gameweek_id
        AND public.is_fixture_full_time(f.status)
      GROUP BY p.user_id, u.nickname
    ),
    ranked AS (
      SELECT
        ws.user_id,
        ws.nickname,
        ws.total_points::BIGINT,
        ws.exact_scores::BIGINT,
        ws.total_distance::BIGINT,
        ROW_NUMBER() OVER (
          ORDER BY ws.total_points DESC,
                   ws.exact_scores DESC,
                   ws.total_distance ASC,
                   ws.nickname ASC
        ) AS current_rank
      FROM weekly_stats ws
    )
    SELECT
      r.user_id,
      r.nickname,
      r.total_points,
      r.exact_scores,
      r.total_distance,
      r.current_rank,
      COALESCE((
        SELECT gs.rank
        FROM public.gameweek_standings gs
        WHERE gs.user_id = r.user_id
          AND gs.gameweek_id = v_previous_gameweek_id
      ), NULL::INTEGER) AS previous_rank
    FROM ranked r;
  ELSE
    RETURN QUERY
    WITH global_stats AS (
      SELECT
        p.user_id,
        u.nickname,
        SUM(p.points_earned)                         AS total_points,
        COUNT(*) FILTER (WHERE p.points_earned = 50) AS exact_scores,
        SUM(p.distance)                              AS total_distance
      FROM public.predictions p
      JOIN public.fixtures f ON p.fixture_id = f.id
      JOIN public.users u ON p.user_id = u.id
      WHERE public.is_fixture_full_time(f.status)
      GROUP BY p.user_id, u.nickname
    ),
    ranked AS (
      SELECT
        gs.user_id,
        gs.nickname,
        gs.total_points::BIGINT,
        gs.exact_scores::BIGINT,
        gs.total_distance::BIGINT,
        ROW_NUMBER() OVER (
          ORDER BY gs.total_points DESC,
                   gs.exact_scores DESC,
                   gs.total_distance ASC,
                   gs.nickname ASC
        ) AS current_rank
      FROM global_stats gs
    )
    SELECT
      gr.user_id,
      gr.nickname,
      gr.total_points,
      gr.exact_scores,
      gr.total_distance,
      gr.current_rank,
      COALESCE((
        SELECT gs.rank
        FROM public.gameweek_standings gs
        WHERE gs.user_id = gr.user_id
        ORDER BY gs.gameweek_id DESC
        LIMIT 1
      ), NULL::INTEGER) AS previous_rank
    FROM ranked gr;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
