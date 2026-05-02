-- Add advanced recruitment workflow fields to applications table
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS interview_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS interview_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS ai_match_score INTEGER,
ADD COLUMN IF NOT EXISTS recruiter_feedback TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have an updated_at value
UPDATE applications SET updated_at = applied_at WHERE updated_at IS NULL;
