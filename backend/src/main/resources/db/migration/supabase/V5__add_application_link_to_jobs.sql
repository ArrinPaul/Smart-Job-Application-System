-- Migration: Add application_link to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_link TEXT;
