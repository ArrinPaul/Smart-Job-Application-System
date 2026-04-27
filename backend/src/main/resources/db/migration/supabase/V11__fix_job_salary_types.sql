-- V11__fix_job_salary_types.sql
-- Fix salary column types in jobs table to match Hibernate expectation (NUMERIC/DECIMAL)

ALTER TABLE jobs ALTER COLUMN salary_min TYPE DECIMAL(12, 2);
ALTER TABLE jobs ALTER COLUMN salary_max TYPE DECIMAL(12, 2);
