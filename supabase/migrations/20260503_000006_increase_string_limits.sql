-- Migration to fix length issues in job tables
-- Increase length of title and location to prevent "value too long" errors

DO $$ 
BEGIN 
    -- 1. Jobs table
    ALTER TABLE jobs ALTER COLUMN title TYPE varchar(512);
    ALTER TABLE jobs ALTER COLUMN location TYPE varchar(512);
    ALTER TABLE jobs ALTER COLUMN company_name TYPE varchar(512);
    
    -- 2. Recruiter Profile
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recruiter_profile') THEN
        ALTER TABLE recruiter_profile ALTER COLUMN company_name TYPE varchar(512);
    END IF;

    -- 3. Job Seeker Profile
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_seeker_profile') THEN
        ALTER TABLE job_seeker_profile ALTER COLUMN professional_headline TYPE varchar(512);
        ALTER TABLE job_seeker_profile ALTER COLUMN current_company TYPE varchar(512);
        ALTER TABLE job_seeker_profile ALTER COLUMN current_designation TYPE varchar(512);
    END IF;

    -- 4. Users Table (for global fields)
    ALTER TABLE users ALTER COLUMN company_name TYPE varchar(512);
    ALTER TABLE users ALTER COLUMN headline TYPE varchar(512);
    ALTER TABLE users ALTER COLUMN full_name TYPE varchar(512);
    ALTER TABLE users ALTER COLUMN location TYPE varchar(512);
END $$;
