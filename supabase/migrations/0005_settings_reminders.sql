-- Add favorite_club column to users (stores 3-letter EPL abbreviation)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS favorite_club TEXT;

-- Add reminder_sent flag to gameweeks (anti-spam for email reminders)
ALTER TABLE public.gameweeks ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
