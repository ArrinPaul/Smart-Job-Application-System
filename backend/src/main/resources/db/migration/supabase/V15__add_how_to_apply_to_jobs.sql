-- Add how_to_apply column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS how_to_apply TEXT;
