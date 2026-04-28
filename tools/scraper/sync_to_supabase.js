const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

try {
  const dotenvPath = path.resolve(__dirname, '../../backend/.env');
  const dotenvPathAlt = path.resolve(__dirname, '../../Backend/.env');
  
  if (fs.existsSync(dotenvPath)) {
    require('dotenv').config({ path: dotenvPath });
  } else if (fs.existsSync(dotenvPathAlt)) {
    require('dotenv').config({ path: dotenvPathAlt });
  }
} catch (e) {
  // ignore
}

const LOG = console;
const OUT_FILE = path.join(__dirname, 'last_scrape.json');
const GLOBAL_RECRUITER_USERNAME = 'global.recruiter';
const GLOBAL_RECRUITER_EMAIL = 'global.recruiter@jobportal.local';

function loadJobsFromFile() {
  if (!fs.existsSync(OUT_FILE)) {
    return [];
  }
  const raw = fs.readFileSync(OUT_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200) || 'job';
}

function normalizeJob(job) {
  const title = typeof job.title === 'string' ? job.title.trim() : '';
  if (!title) return null;
  return {
    ...job,
    title,
    companyName: typeof job.companyName === 'string' && job.companyName.trim() ? job.companyName.trim() : 'Unknown Company',
    location: typeof job.location === 'string' && job.location.trim() ? job.location.trim() : 'Remote',
    applicationLink: typeof job.applicationLink === 'string' ? job.applicationLink.trim() : '',
    description: typeof job.description === 'string' ? job.description.trim() : '',
    requiredSkills: typeof job.requiredSkills === 'string' ? job.requiredSkills.trim() : job.requiredSkills,
    jobType: typeof job.jobType === 'string' ? job.jobType.trim() : '',
    workType: typeof job.workType === 'string' ? job.workType.trim() : ''
  };
}

async function ensureRecruiter(client) {
  const existing = await client.query(
    'SELECT id FROM users WHERE username = $1 OR email = $2 LIMIT 1',
    [GLOBAL_RECRUITER_USERNAME, GLOBAL_RECRUITER_EMAIL]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const password = await bcrypt.hash(`global-${Date.now()}-${Math.random()}`, 10);
  const inserted = await client.query(
    `INSERT INTO users (username, password, email, role, failed_login_attempts, email_verified, token_version, mfa_enabled)
     VALUES ($1, $2, $3, 'RECRUITER', 0, true, 0, false)
     RETURNING id`,
    [GLOBAL_RECRUITER_USERNAME, password, GLOBAL_RECRUITER_EMAIL]
  );
  return inserted.rows[0].id;
}

async function getTableColumns(client, tableName) {
  const result = await client.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );
  return new Set(result.rows.map(row => row.column_name));
}

function buildInsertPlan(columns, recruiterId, job) {
  const slug = job.slug || slugify(`${job.title}-${job.companyName}`);
  const candidate = {
    slug,
    title: job.title,
    description: job.description || `About ${job.companyName}\n\n${job.title}`,
    location: job.location,
    application_link: job.applicationLink || null,
    company_name: job.companyName,
    how_to_apply: job.howToApply || null,
    job_type: job.jobType || null,
    work_type: job.workType || null,
    required_skills: job.requiredSkills || null,
    salary_currency: job.salaryCurrency || null,
    salary_min: job.salaryMin || null,
    salary_max: job.salaryMax || null,
    is_active: true,
    recruiter_id: recruiterId
  };

  const insertColumns = Object.keys(candidate).filter(column => columns.has(column));
  const values = insertColumns.map(column => candidate[column]);
  const conflictTarget = columns.has('slug') ? 'slug' : 'title';
  const updateColumns = insertColumns.filter(column => column !== conflictTarget && column !== 'recruiter_id');

  return { insertColumns, values, conflictTarget, updateColumns, slug };
}

async function main() {
  // Prioritize environment variables (e.g. from GitHub Secrets), fallback to .env for local dev
  const dbHost = process.env.SUPABASE_DB_HOST;
  const dbUser = process.env.SUPABASE_DB_USER;
  const dbPass = process.env.SUPABASE_DB_PASSWORD;
  const dbName = process.env.SUPABASE_DB_NAME || 'postgres';
  const dbPort = process.env.SUPABASE_DB_PORT || 5432;

  if (!dbHost) { LOG.error('Missing SUPABASE_DB_HOST'); }
  if (!dbUser) { LOG.error('Missing SUPABASE_DB_USER'); }
  if (!dbPass) { LOG.error('Missing SUPABASE_DB_PASSWORD'); }

  if (!dbHost || !dbUser || !dbPass) {
    LOG.error('Database credentials are missing. Check your GitHub Secrets or local .env file.');
    process.exit(1);
  }

  let jobs = loadJobsFromFile();
  if (!jobs.length) {
    LOG.warn('last_scrape.json is empty or missing; nothing to sync');
    return;
  }

  jobs = jobs.map(normalizeJob).filter(Boolean);
  LOG.info(`Loaded ${jobs.length} normalized jobs from last_scrape.json`);

  const client = new Client({
    host: dbHost,
    port: Number(dbPort),
    database: dbName,
    user: dbUser,
    password: dbPass,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000, // 15s timeout
  });

  LOG.info(`Connecting to Supabase at ${process.env.SUPABASE_DB_HOST}...`);
  await client.connect();
  LOG.info('Connected to database successfully.');
  try {
    const columns = await getTableColumns(client, 'jobs');
    const recruiterId = await ensureRecruiter(client);

    let inserted = 0;
    let updated = 0;

    for (const job of jobs) {
      const title = typeof job.title === 'string' ? job.title.trim() : '';
      if (!title) continue;

      const plan = buildInsertPlan(columns, recruiterId, job);
      if (!plan.insertColumns.includes('title')) {
        continue;
      }

      const placeholders = plan.insertColumns.map((_, index) => `$${index + 1}`);
      const updateSet = plan.updateColumns.map(column => `${column} = EXCLUDED.${column}`).join(', ');
      const sql = `
        INSERT INTO jobs (${plan.insertColumns.join(', ')})
        VALUES (${placeholders.join(', ')})
        ON CONFLICT (${plan.conflictTarget}) DO UPDATE SET
          ${updateSet || `${plan.conflictTarget} = EXCLUDED.${plan.conflictTarget}`}
        RETURNING (xmax = 0) AS inserted
      `;

      const result = await client.query(sql, plan.values);
      if (result.rows[0] && result.rows[0].inserted) {
        inserted += 1;
      } else {
        updated += 1;
      }
    }

    LOG.info(`Synced ${inserted + updated} jobs into Supabase Postgres (${inserted} inserted, ${updated} updated).`);
  } finally {
    await client.end();
  }
}

main().catch(error => {
  LOG.error('Postgres upsert failed', error.message || error);
  process.exit(1);
});