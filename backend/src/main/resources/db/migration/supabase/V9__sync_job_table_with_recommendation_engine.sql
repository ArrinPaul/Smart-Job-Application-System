-- V9__sync_job_table_with_recommendation_engine.sql
-- Synchronize jobs table with the JobRecommendationService and updated Job entity

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS job_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS work_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS experience_required INTEGER,
ADD COLUMN IF NOT EXISTS required_skills TEXT,
ADD COLUMN IF NOT EXISTS education_required VARCHAR(255),
ADD COLUMN IF NOT EXISTS salary_min BIGINT,
ADD COLUMN IF NOT EXISTS salary_max BIGINT,
ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(10) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add indexes for common matching queries
CREATE INDEX IF NOT EXISTS idx_jobs_matching ON jobs (experience_required, salary_min, salary_max);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs (is_active);
