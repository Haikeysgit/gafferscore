-- ============================================================
-- PENALTY DISTANCE CONSTANT
-- If a user misses a prediction entirely, they receive this
-- penalty distance instead of 0. This prevents the exploit
-- where missing a match gives an unfair tiebreaker advantage.
-- ============================================================
-- We use 20 as the penalty: equivalent to being off by 10 goals
-- on each side, which no real prediction would ever reach.


-- ============================================================
-- TRIGGER: Calculate user points when a match finishes
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_user_points()
RETURNS TRIGGER AS $$
DECLARE
  v_penalty_distance CONSTANT INTEGER := 20;
  v_status_just_finished BOOLEAN;
  v_score_corrected BOOLEAN;
BEGIN
  -- Detect if this is the first time the match finishes
  v_status_just_finished := (NEW.status = 'finished' AND OLD.status != 'finished');

  -- Detect if scores changed on an already-finished match (score correction)
  v_score_corrected := (
    NEW.status = 'finished' AND OLD.status = 'finished'
    AND (NEW.home_score IS DISTINCT FROM OLD.home_score
      OR NEW.away_score IS DISTINCT FROM OLD.away_score)
  );

  IF v_status_just_finished OR v_score_corrected THEN

    -- Step 1: Recalculate points for real predictions only.
    -- Excludes penalty rows (predicted scores < 0) so their
    -- penalty distance is never overwritten by accidental math.
    UPDATE public.predictions p
    SET
      distance = ABS(p.predicted_home_score - NEW.home_score)
               + ABS(p.predicted_away_score - NEW.away_score),
      points_earned = CASE
          -- Exact score match = 50 pts (20 outcome + 30 exact)
          WHEN p.predicted_home_score = NEW.home_score
           AND p.predicted_away_score = NEW.away_score THEN 50
          -- Correct outcome: Home Win
          WHEN p.predicted_home_score > p.predicted_away_score
           AND NEW.home_score > NEW.away_score THEN 20
          -- Correct outcome: Away Win
          WHEN p.predicted_home_score < p.predicted_away_score
           AND NEW.home_score < NEW.away_score THEN 20
          -- Correct outcome: Draw
          WHEN p.predicted_home_score = p.predicted_away_score
           AND NEW.home_score = NEW.away_score THEN 20
          -- Wrong outcome
          ELSE 0
      END
    WHERE p.fixture_id = NEW.id
      AND p.predicted_home_score >= 0
      AND p.predicted_away_score >= 0;

    -- Step 2: Auto-insert penalty rows for users who missed this fixture.
    -- Only runs on first finish, not on score corrections.
    IF v_status_just_finished THEN
      INSERT INTO public.predictions (user_id, fixture_id, predicted_home_score, predicted_away_score, points_earned, distance)
      SELECT
        u.id,
        NEW.id,
        -1,  -- sentinel value: indicates "no prediction made"
        -1,
        0,   -- zero points for missing
        v_penalty_distance
      FROM public.users u
      WHERE NOT EXISTS (
        SELECT 1 FROM public.predictions p
        WHERE p.user_id = u.id AND p.fixture_id = NEW.id
      );
    END IF;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER calculate_points_after_match
AFTER UPDATE ON public.fixtures
FOR EACH ROW
EXECUTE FUNCTION public.calculate_user_points();


-- ============================================================
-- RPC: Get the Leaderboard
-- p_type = 'global' or 'weekly'
-- Uses ROW_NUMBER (not RANK) to guarantee every rank is unique.
-- Tiebreaker chain: Points DESC -> Exact Scores DESC ->
--   Distance ASC -> Nickname ASC (alphabetical, final breaker)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_type TEXT, p_gameweek_id INTEGER DEFAULT NULL)
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
  -- Resolve the previous gameweek once for arrow comparison
  IF p_gameweek_id IS NOT NULL THEN
    SELECT g.id INTO v_previous_gameweek_id
    FROM public.gameweeks g
    WHERE g.start_date < (SELECT gw.start_date FROM public.gameweeks gw WHERE gw.id = p_gameweek_id)
    ORDER BY g.start_date DESC LIMIT 1;
  END IF;

  IF p_type = 'weekly' THEN
    RETURN QUERY
    WITH weekly_stats AS (
      SELECT
        p.user_id,
        u.nickname,
        SUM(p.points_earned)                              AS total_points,
        COUNT(*) FILTER (WHERE p.points_earned = 50)      AS exact_scores,
        SUM(p.distance)                                   AS total_distance
      FROM public.predictions p
      JOIN public.fixtures f ON p.fixture_id = f.id
      JOIN public.users u    ON p.user_id    = u.id
      WHERE f.gameweek_id = p_gameweek_id AND f.status = 'finished'
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
                   ws.nickname ASC          -- absolute final tiebreaker
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
        SELECT gs.rank FROM public.gameweek_standings gs
        WHERE gs.user_id = r.user_id AND gs.gameweek_id = v_previous_gameweek_id
      ), NULL::INTEGER) AS previous_rank
    FROM ranked r;

  ELSE
    -- Global leaderboard
    RETURN QUERY
    WITH global_stats AS (
      SELECT
        p.user_id,
        u.nickname,
        SUM(p.points_earned)                              AS total_points,
        COUNT(*) FILTER (WHERE p.points_earned = 50)      AS exact_scores,
        SUM(p.distance)                                   AS total_distance
      FROM public.predictions p
      JOIN public.fixtures f ON p.fixture_id = f.id
      JOIN public.users u    ON p.user_id    = u.id
      WHERE f.status = 'finished'
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
                   gs.nickname ASC          -- absolute final tiebreaker
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
        SELECT gs.rank FROM public.gameweek_standings gs
        WHERE gs.user_id = gr.user_id
        ORDER BY gs.gameweek_id DESC LIMIT 1
      ), NULL::INTEGER) AS previous_rank
    FROM ranked gr;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- RPC: Snapshot standings at the end of a gameweek
-- Call this from the cron job after all fixtures in a gameweek
-- have been marked 'finished'. It inserts or updates the
-- gameweek_standings table so we can compute trend arrows.
-- ============================================================
CREATE OR REPLACE FUNCTION public.snapshot_gameweek_standings(p_gameweek_id INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Snapshot the GLOBAL leaderboard at this point in time.
  -- The global leaderboard's trend arrows compare against this
  -- table, so it must store global ranks — not weekly ranks.
  INSERT INTO public.gameweek_standings (gameweek_id, user_id, rank, points, exact_scores, distance)
  SELECT
    p_gameweek_id,
    lb.user_id,
    lb.current_rank::INTEGER,
    lb.total_points::INTEGER,
    lb.exact_scores::INTEGER,
    lb.total_distance::INTEGER
  FROM public.get_leaderboard('global', NULL) lb
  ON CONFLICT (gameweek_id, user_id)
  DO UPDATE SET
    rank         = EXCLUDED.rank,
    points       = EXCLUDED.points,
    exact_scores = EXCLUDED.exact_scores,
    distance     = EXCLUDED.distance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
