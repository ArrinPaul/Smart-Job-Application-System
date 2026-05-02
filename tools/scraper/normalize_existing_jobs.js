const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { normalizeJobRecord } = require('./text_normalizer');

try {
  const dotenvPath = path.resolve(__dirname, '../../backend/.env');
  const dotenvPathAlt = path.resolve(__dirname, '../../Backend/.env');
  if (fs.existsSync(dotenvPath)) {
    require('dotenv').config({ path: dotenvPath });
  } else if (fs.existsSync(dotenvPathAlt)) {
    require('dotenv').config({ path: dotenvPathAlt });
  }
} catch {
  // ignore
}

const LOG = console;
const BATCH_SIZE = Number(process.env.NORMALIZE_BATCH_SIZE || 100);
const LIMIT = Number(process.env.NORMALIZE_LIMIT || 0);

function slugify(value, id) {
  const base = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const slug = base.slice(0, 200) || 'job';
  if (!id) return slug;

  // Truncate slug to make space for ID, ensuring total length is within limits
  const idSuffix = `-${id}`;
  return slug.slice(0, 200 - idSuffix.length) + idSuffix;
}

async function getTableColumns(client, tableName) {
  const result = await client.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );
  return new Set(result.rows.map((row) => row.column_name));
}

async function removeDuplicateJobs(client, columns) {
  const hasId = columns.has('id');
  const hasTitle = columns.has('title');
  const hasCompanyName = columns.has('company_name');

  if (!hasId || !hasTitle || !hasCompanyName) {
    LOG.warn('Skipping duplicate cleanup: jobs table is missing id/title/company_name columns.');
    return 0;
  }

  const locationExpression = columns.has('location')
    ? "LOWER(COALESCE(NULLIF(TRIM(location), ''), 'remote'))"
    : "'remote'";

  const sql = `
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY
            LOWER(COALESCE(NULLIF(TRIM(title), ''), 'untitled')),
            LOWER(COALESCE(NULLIF(TRIM(company_name), ''), 'unknown')),
            ${locationExpression}
          ORDER BY id DESC
        ) AS rn
      FROM jobs
    )
    DELETE FROM jobs j
    USING ranked r
    WHERE j.id = r.id
      AND r.rn > 1
    RETURNING j.id
  `;

  const result = await client.query(sql);
  return result.rowCount || 0;
}

async function normalizeRow(row) {
  const normalized = await normalizeJobRecord(row, {
    fieldMap: {
      title: 'title',
      description: 'description',
      companyName: 'company_name',
      location: 'location',
      jobType: 'job_type',
      requiredSkills: 'required_skills',
      howToApply: 'how_to_apply',
      applicationLink: 'application_link',
      source: 'source',
      postedDate: 'posted_date'
    },
    strictEnglish: true
  });

  if (!normalized) return null;

  const newSlug = slugify(`${normalized.title}-${normalized.companyName}`, row.id);

  return {
    id: row.id,
    slug: newSlug,
    title: normalized.title,
    description: normalized.description,
    requiredSkills: normalized.requiredSkills || '',
    howToApply: normalized.howToApply || '',
    companyName: normalized.companyName,
    location: normalized.location,
    jobType: normalized.jobType
  };
}

async function main() {
  const dbHost = process.env.SUPABASE_DB_HOST;
  const dbUser = process.env.SUPABASE_DB_USER;
  const dbPass = process.env.SUPABASE_DB_PASSWORD;
  const dbName = process.env.SUPABASE_DB_NAME || 'postgres';
  const dbPort = process.env.SUPABASE_DB_PORT || 5432;

  if (!dbHost || !dbUser || !dbPass) {
    LOG.error('Database credentials are missing. Check your .env file.');
    process.exit(1);
  }

  const client = new Client({
    host: dbHost,
    port: Number(dbPort),
    database: dbName,
    user: dbUser,
    password: dbPass,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000
  });

  await client.connect();
  LOG.info('Connected. Starting normalization...');

  const columns = await getTableColumns(client, 'jobs');
  const removedDuplicates = await removeDuplicateJobs(client, columns);
  if (removedDuplicates > 0) {
    LOG.info(`Removed ${removedDuplicates} duplicate jobs before normalization.`);
  } else {
    LOG.info('No duplicate jobs found before normalization.');
  }

  let offset = 0;
  let processed = 0;
  let updated = 0;

  while (true) {
    if (LIMIT > 0 && processed >= LIMIT) break;

    const rows = await client.query(
      `SELECT id, slug, title, description, required_skills, how_to_apply, company_name, location, job_type, application_link
       FROM jobs
       ORDER BY id
       LIMIT $1 OFFSET $2`,
      [BATCH_SIZE, offset]
    );

    if (!rows.rows.length) break;

    for (const row of rows.rows) {
      if (LIMIT > 0 && processed >= LIMIT) break;
      processed += 1;

      const normalized = await normalizeRow(row);
      if (!normalized) continue;

      const changed =
        normalized.slug !== (row.slug || '') ||
        normalized.title !== (row.title || '') ||
        normalized.description !== (row.description || '') ||
        normalized.requiredSkills !== (row.required_skills || '') ||
        normalized.howToApply !== (row.how_to_apply || '') ||
        normalized.companyName !== (row.company_name || '') ||
        normalized.location !== (row.location || '') ||
        normalized.jobType !== (row.job_type || '');

      if (!changed) continue;

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
          normalized.slug,
          normalized.id
        ]
      );

      updated += 1;
    }

    offset += BATCH_SIZE;
    LOG.info(`Processed ${processed} rows, updated ${updated}.`);
  }

  LOG.info(`Normalization complete. Processed ${processed}, updated ${updated}.`);
  await client.end();
}

main().catch((e) => {
  LOG.error('Normalization failed:', e.message || e);
  process.exit(1);
});
