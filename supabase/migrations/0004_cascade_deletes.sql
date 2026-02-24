-- Drop existing foreign key constraints
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.predictions DROP CONSTRAINT IF EXISTS predictions_user_id_fkey;
ALTER TABLE public.predictions DROP CONSTRAINT IF EXISTS predictions_fixture_id_fkey;
ALTER TABLE public.gameweek_standings DROP CONSTRAINT IF EXISTS gameweek_standings_user_id_fkey;
ALTER TABLE public.gameweek_standings DROP CONSTRAINT IF EXISTS gameweek_standings_gameweek_id_fkey;

-- Re-add constraints with ON DELETE CASCADE
ALTER TABLE public.users 
  ADD CONSTRAINT users_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.predictions 
  ADD CONSTRAINT predictions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  
ALTER TABLE public.predictions 
  ADD CONSTRAINT predictions_fixture_id_fkey 
  FOREIGN KEY (fixture_id) REFERENCES public.fixtures(id) ON DELETE CASCADE;

ALTER TABLE public.gameweek_standings 
  ADD CONSTRAINT gameweek_standings_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.gameweek_standings 
  ADD CONSTRAINT gameweek_standings_gameweek_id_fkey 
  FOREIGN KEY (gameweek_id) REFERENCES public.gameweeks(id) ON DELETE CASCADE;
