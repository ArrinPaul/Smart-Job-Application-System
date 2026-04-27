-- V10__fix_id_types_for_onboarding.sql
-- Fix ID column types that were incorrectly created as INTEGER/SERIAL instead of BIGINT/BIGSERIAL

ALTER TABLE onboarding_progress ALTER COLUMN id TYPE BIGINT;
ALTER TABLE recruiter_profile ALTER COLUMN id TYPE BIGINT;
ALTER TABLE job_seeker_profile ALTER COLUMN id TYPE BIGINT;
