-- Migration: Add slug to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
