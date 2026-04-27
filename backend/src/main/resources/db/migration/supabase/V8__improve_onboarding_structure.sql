-- V8__improve_onboarding_structure.sql
-- Enhance onboarding system with progress tracking and role-specific profiles

-- ============================================
-- 1. ENHANCE USERS TABLE
-- ============================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP;

-- ============================================
-- 2. CREATE ONBOARDING_PROGRESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS onboarding_progress (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    current_step INTEGER NOT NULL DEFAULT 1,
    max_step_reached INTEGER NOT NULL DEFAULT 1,
    step1_completed BOOLEAN NOT NULL DEFAULT FALSE,
    step2_completed BOOLEAN NOT NULL DEFAULT FALSE,
    step3_completed BOOLEAN NOT NULL DEFAULT FALSE,
    step4_completed BOOLEAN NOT NULL DEFAULT FALSE,
    step5_completed BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_current_step ON onboarding_progress(current_step);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_completed_at ON onboarding_progress(completed_at);

-- ============================================
-- 3. CREATE RECRUITER_PROFILE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS recruiter_profile (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    company_website VARCHAR(255),
    company_logo_url VARCHAR(512),
    industry VARCHAR(100),
    company_size VARCHAR(50),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recruiter_profile_user_id ON recruiter_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_profile_verified ON recruiter_profile(verified);
CREATE INDEX IF NOT EXISTS idx_recruiter_profile_company_name ON recruiter_profile(company_name);

-- ============================================
-- 4. CREATE JOB_SEEKER_PROFILE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS job_seeker_profile (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    professional_headline VARCHAR(255),
    skills TEXT,
    experience_years INTEGER,
    current_company VARCHAR(255),
    current_designation VARCHAR(255),
    education TEXT,
    profile_completion_percentage INTEGER NOT NULL DEFAULT 0,
    open_to_opportunities BOOLEAN NOT NULL DEFAULT TRUE,
    expected_salary_min NUMERIC(12, 2),
    expected_salary_max NUMERIC(12, 2),
    salary_currency VARCHAR(10) DEFAULT 'INR',
    work_preference VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_seeker_profile_user_id ON job_seeker_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_job_seeker_profile_open_to_opportunities ON job_seeker_profile(open_to_opportunities);
CREATE INDEX IF NOT EXISTS idx_job_seeker_profile_skills ON job_seeker_profile(skills);
CREATE INDEX IF NOT EXISTS idx_job_seeker_profile_experience ON job_seeker_profile(experience_years);

-- ============================================
-- 5. MIGRATE EXISTING DATA (if any)
-- ============================================
-- For existing users, create onboarding_progress records
INSERT INTO onboarding_progress (user_id, step1_completed, step2_completed, step3_completed, step4_completed, step5_completed, current_step, completed_at)
SELECT 
    id,
    onboarding_completed,
    onboarding_completed,
    onboarding_completed,
    onboarding_completed,
    onboarding_completed,
    CASE WHEN onboarding_completed = TRUE THEN 5 ELSE 1 END,
    onboarding_completed_at
FROM users
WHERE NOT EXISTS (SELECT 1 FROM onboarding_progress WHERE user_id = users.id)
ON CONFLICT (user_id) DO NOTHING;

-- Create recruiter profiles for recruiters who have data
INSERT INTO recruiter_profile (user_id, company_name, company_website)
SELECT 
    id,
    company_name,
    website
FROM users
WHERE role = 'RECRUITER' 
AND company_name IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM recruiter_profile WHERE user_id = users.id)
ON CONFLICT (user_id) DO NOTHING;

-- Create job seeker profiles for job seekers who have data
INSERT INTO job_seeker_profile (user_id, professional_headline, skills)
SELECT 
    id,
    headline,
    skills
FROM users
WHERE role = 'JOB_SEEKER'
AND (headline IS NOT NULL OR skills IS NOT NULL)
AND NOT EXISTS (SELECT 1 FROM job_seeker_profile WHERE user_id = users.id)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 6. ADD COMMENTS
-- ============================================
COMMENT ON TABLE onboarding_progress IS 'Tracks user progress through the 5-step onboarding flow';
COMMENT ON TABLE recruiter_profile IS 'Role-specific data for recruiters including company information';
COMMENT ON TABLE job_seeker_profile IS 'Role-specific data for job seekers including skills and preferences';
