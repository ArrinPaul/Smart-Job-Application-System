-- Performance and maintenance improvements (non-breaking)
-- Safe to run on existing production data.

-- Users: optimize admin and auth-related filters
create index if not exists idx_users_role
    on users (role);

create index if not exists idx_users_email_verified
    on users (email_verified);

create index if not exists idx_users_last_login_at
    on users (last_login_at desc);

-- Jobs: optimize common recruiter/job seeker sorting and filtering
create index if not exists idx_jobs_title_location
    on jobs (lower(title), lower(location));

create index if not exists idx_jobs_recruiter_created_at
    on jobs (recruiter_id, created_at desc);

-- Applications: optimize recruiter queue and job seeker history views
create index if not exists idx_applications_job_status_applied_at
    on applications (job_id, status, applied_at desc);

create index if not exists idx_applications_applicant_status_applied_at
    on applications (applicant_id, status, applied_at desc);

-- Resumes: optimize owner and recency lookups
create index if not exists idx_resumes_uploaded_at
    on resumes (uploaded_at desc);
