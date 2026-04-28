-- Optimize performance for Smart Job Portal
-- Add indexes for frequently searched and filtered columns

-- Jobs table optimizations
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_slug ON jobs(slug);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);

-- Onboarding and Profiles
CREATE INDEX IF NOT EXISTS idx_job_seeker_profile_user_id ON job_seeker_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_profile_user_id ON recruiter_profile(user_id);

-- Applications
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
