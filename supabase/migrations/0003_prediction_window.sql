-- ============================================================
-- MIGRATION: Add 14-day rolling prediction window to RLS
-- Predictions can only be inserted/updated if:
--   1. The user owns the prediction
--   2. The match hasn't started yet (now() < kickoff_time)
--   3. The match is within 14 days (kickoff_time <= now() + interval '14 days')
-- ============================================================

-- Drop old policies (handles both original and any 7-day version)
DROP POLICY IF EXISTS "Users can insert predictions before kickoff" ON public.predictions;
DROP POLICY IF EXISTS "Users can update predictions before kickoff" ON public.predictions;
DROP POLICY IF EXISTS "Users can insert predictions within 7-day window" ON public.predictions;
DROP POLICY IF EXISTS "Users can update predictions within 7-day window" ON public.predictions;
DROP POLICY IF EXISTS "Users can insert predictions within 14-day window" ON public.predictions;
DROP POLICY IF EXISTS "Users can update predictions within 14-day window" ON public.predictions;

-- New INSERT policy with 14-day window
CREATE POLICY "Users can insert predictions within 14-day window" ON public.predictions
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.fixtures 
    WHERE id = fixture_id 
      AND now() < kickoff_time
      AND kickoff_time <= now() + interval '14 days'
  )
);

-- New UPDATE policy with 14-day window
CREATE POLICY "Users can update predictions within 14-day window" ON public.predictions
FOR UPDATE USING (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.fixtures 
    WHERE id = fixture_id 
      AND now() < kickoff_time
      AND kickoff_time <= now() + interval '14 days'
  )
);
