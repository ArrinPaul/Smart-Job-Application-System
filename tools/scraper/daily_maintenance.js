const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { Client } = require('pg');
const { normalizeJobRecord } = require('./text_normalizer');

// Load environment variables
try {
  const dotenvPath = path.resolve(__dirname, '../../backend/.env');
  if (fs.existsSync(dotenvPath)) {
    require('dotenv').config({ path: dotenvPath });
  }
} catch (e) {
  // ignore
}

const LOG = console;
const BATCH_SIZE = 50;

function slugify(value, id) {
  const base = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const slug = base.slice(0, 200) || 'job';
  if (!id) return slug;

  const idSuffix = `-${id}`;
  return slug.slice(0, 200 - idSuffix.length) + idSuffix;
}

/**
 * PHASE 1: Scrape and Initial Sync
 * This uses the existing scrape_and_sync logic but integrated.
 */
async function runScrapeAndSync() {
  LOG.info('--- PHASE 1: Scraping and Initial Sync ---');
  
  const result = spawnSync(process.execPath, ['scrape_and_sync.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: process.env
  });

  if (result.status !== 0) {
    throw new Error(`Scrape and Sync failed with exit code ${result.status}`);
  }
  LOG.info('Scrape and Initial Sync completed.');
}

/**
 * PHASE 2: Deep Normalization (Emoji Removal, Formatting)
 * This iterates through ALL jobs in the database and ensures they are normalized.
 */
async function runDeepNormalization() {
  LOG.info('--- PHASE 2: Deep Normalization (Cleanup) ---');
  
  const dbHost = process.env.SUPABASE_DB_HOST;
  const dbUser = process.env.SUPABASE_DB_USER;
  const dbPass = process.env.SUPABASE_DB_PASSWORD;
  const dbName = process.env.SUPABASE_DB_NAME || 'postgres';
  const dbPort = process.env.SUPABASE_DB_PORT || 5432;

  if (!dbHost || !dbUser || !dbPass) {
    throw new Error('Database credentials missing for normalization phase.');
  }

  const client = new Client({
    host: dbHost,
    port: Number(dbPort),
    database: dbName,
    user: dbUser,
    password: dbPass,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  LOG.info('Connected to Supabase for normalization.');

  // 1. Remove Duplicates
  LOG.info('Removing duplicate jobs...');
  const removedDuplicates = await removeDuplicateJobs(client);
  LOG.info(`Removed ${removedDuplicates} duplicate jobs.`);

  // 2. Normalize Rows
  let offset = 0;
  let processed = 0;
  let updated = 0;

  while (true) {
    const rows = await client.query(
      `SELECT id, slug, title, description, required_skills, how_to_apply, company_name, location, job_type, application_link
       FROM jobs
       ORDER BY id
       LIMIT $1 OFFSET $2`,
      [BATCH_SIZE, offset]
    );

    if (!rows.rows.length) break;

    for (const row of rows.rows) {
      processed += 1;
      
      const normalized = await normalizeJobRecord(row, {
        fieldMap: {
          title: 'title',
          description: 'description',
          companyName: 'company_name',
          location: 'location',
          jobType: 'job_type',
          requiredSkills: 'required_skills',
          howToApply: 'how_to_apply',
          applicationLink: 'application_link'
        },
        strictEnglish: true
      });

      if (!normalized) continue;

      const newSlug = slugify(`${normalized.title}-${normalized.companyName}`, row.id);
      const changed =
        newSlug !== (row.slug || '') ||
        normalized.title !== (row.title || '') ||
        normalized.description !== (row.description || '') ||
        normalized.requiredSkills !== (row.required_skills || '') ||
        normalized.howToApply !== (row.how_to_apply || '') ||
        normalized.companyName !== (row.company_name || '') ||
        normalized.location !== (row.location || '') ||
        normalized.jobType !== (row.job_type || '');

      if (changed) {
        await client.query(
          `UPDATE jobs
           SET title = $1,
               description = $2,
               required_skills = $3,
               how_to_apply = $4,
               company_name = $5,
               location = $6,
               job_type = $7,
               slug = $8
           WHERE id = $9`,
          [
            normalized.title,
            normalized.description,
            normalized.requiredSkills || null,
            normalized.howToApply || null,
            normalized.companyName || null,
            normalized.location || null,
            normalized.jobType || null,
            newSlug,
            row.id
          ]
        );
        updated += 1;
      }
    }

    offset += BATCH_SIZE;
    if (processed % 100 === 0) {
        LOG.info(`Processed ${processed} rows, updated ${updated}...`);
    }
  }

  LOG.info(`Normalization complete. Total Processed: ${processed}, Total Updated: ${updated}.`);
  await client.end();
}

/**
 * Utility to remove duplicates based on title and company
 */
async function removeDuplicateJobs(client) {
  const sql = `
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY
            LOWER(COALESCE(NULLIF(TRIM(title), ''), 'untitled')),
            LOWER(COALESCE(NULLIF(TRIM(company_name), ''), 'unknown'))
          ORDER BY id DESC
        ) AS rn
      FROM jobs
    )
    DELETE FROM jobs j
    USING ranked r
    WHERE j.id = r.id
      AND r.rn > 1
  `;
  const result = await client.query(sql);
  return result.rowCount || 0;
}

async function main() {
  const startTime = new Date();
  LOG.info(`Daily Maintenance started at ${startTime.toISOString()}`);

  try {
    // 1. Scrape new jobs, dedupe them, and sync to DB
    await runScrapeAndSync();

    // 2. Run normalization on all jobs in DB (Remove Emojis, Fix Text)
    await runDeepNormalization();

    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    LOG.info(`Daily Maintenance finished successfully in ${duration}s`);
  } catch (e) {
    LOG.error('Maintenance failed:', e.message);
    process.exit(1);
  }
}

main();
