-- Add company_name column to jobs table for scraped jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
