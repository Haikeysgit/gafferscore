-- Users Table (extends Supabase Auth)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  nickname TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Gameweeks
CREATE TABLE public.gameweeks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_current BOOLEAN DEFAULT false
);

-- Fixtures
CREATE TABLE public.fixtures (
  id SERIAL PRIMARY KEY,
  gameweek_id INTEGER REFERENCES public.gameweeks(id) NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_short TEXT NOT NULL,
  away_short TEXT NOT NULL,
  home_logo TEXT,
  away_logo TEXT,
  kickoff_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'finished')),
  home_score INTEGER,
  away_score INTEGER
);

-- Predictions
CREATE TABLE public.predictions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  fixture_id INTEGER REFERENCES public.fixtures(id) NOT NULL,
  predicted_home_score INTEGER NOT NULL,
  predicted_away_score INTEGER NOT NULL,
  points_earned INTEGER DEFAULT 0,
  distance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, fixture_id)
);

-- Gameweek Standings (Records closing global rank per gameweek for history)
CREATE TABLE public.gameweek_standings (
  id SERIAL PRIMARY KEY,
  gameweek_id INTEGER REFERENCES public.gameweeks(id) NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  rank INTEGER NOT NULL,
  points INTEGER NOT NULL,
  exact_scores INTEGER NOT NULL,
  distance INTEGER NOT NULL,
  UNIQUE(gameweek_id, user_id)
);

-- RLS Enforcement
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gameweeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gameweek_standings ENABLE ROW LEVEL SECURITY;

-- Add RLS Policies

-- Users: Anyone can read nicknames. Users can only update their own row.
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Gameweeks & Fixtures: Publicly readable
CREATE POLICY "Gameweeks and fixtures are viewable by everyone." ON public.gameweeks FOR SELECT USING (true);
CREATE POLICY "Fixtures are viewable by everyone." ON public.fixtures FOR SELECT USING (true);

-- Predictions: Block INSERT/UPDATE if past kickoff_time
CREATE POLICY "Users can insert predictions before kickoff" ON public.predictions FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.fixtures 
    WHERE id = fixture_id AND now() < kickoff_time
  )
);

CREATE POLICY "Users can update predictions before kickoff" ON public.predictions FOR UPDATE
USING (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.fixtures 
    WHERE id = fixture_id AND now() < kickoff_time
  )
);

-- Predictions Privacy: Unfinished matches predictions only viewable by self. Finished viewable by all.
CREATE POLICY "Can view own predictions or finished matches" ON public.predictions FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.fixtures 
    WHERE id = fixture_id AND status = 'finished'
  )
);

-- Gameweek Standings: Publicly readable
CREATE POLICY "Standings are viewable by everyone." ON public.gameweek_standings FOR SELECT USING (true);
