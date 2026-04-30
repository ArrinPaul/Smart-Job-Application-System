const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Client } = require('pg');

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
const TRANSLATE_URL = (process.env.LIBRETRANSLATE_URL || 'https://libretranslate.de').replace(/\/$/, '');
const TRANSLATE_KEY = process.env.LIBRETRANSLATE_KEY || '';
const TRANSLATE_ENABLED = process.env.TRANSLATE_DISABLED !== 'true' && Boolean(TRANSLATE_URL);
const TRANSLATE_MAX_CHARS = Number(process.env.TRANSLATE_MAX_CHARS || 3800);
const BATCH_SIZE = Number(process.env.NORMALIZE_BATCH_SIZE || 100);
const LIMIT = Number(process.env.NORMALIZE_LIMIT || 0);

const languageCache = new Map();

function countReplacement(text) {
  const matches = String(text || '').match(/\uFFFD/g);
  return matches ? matches.length : 0;
}

function fixMojibake(input) {
  if (!input) return '';
  const text = String(input);
  if (!/[\u00C2\u00C3\u00E2\u00F0\uFFFD]/.test(text)) return text;

  try {
    const decoded = Buffer.from(text, 'latin1').toString('utf8');
    if (countReplacement(decoded) <= countReplacement(text)) {
      return decoded;
    }
  } catch {
    // fallback
  }

  return text;
}

function removeEmoji(text) {
  if (!text) return '';
  return String(text)
    .replace(/[\u{1F300}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\u200D/g, '')
    .replace(/\uFE0F/g, '');
}

function normalizeText(text) {
  if (!text) return '';
  let out = fixMojibake(text);
  out = out.replace(/\u00A0/g, ' ');
  out = out.replace(/[\u2013\u2014]/g, '-');
  out = out.replace(/[\u2018\u2019\u201B]/g, "'");
  out = out.replace(/[\u201C\u201D\u201F]/g, '"');
  out = out.replace(/\u2026/g, '...');
  out = removeEmoji(out);
  return out.replace(/\s+/g, ' ').trim();
}

function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstSentences(text, count = 3) {
  if (!text) return '';
  const parts = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  return parts.slice(0, count).join('. ') + (parts.length ? '.' : '');
}

function normalizeSkills(requiredSkills) {
  if (!requiredSkills) return '';
  return String(requiredSkills)
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10)
    .join(', ');
}

function formatTemplate(job) {
  const company = (job.companyName || 'Company').trim();
  const title = (job.title || 'Role').trim();
  const location = (job.location || 'Remote').trim();
  const jobType = (job.jobType || 'Full-Time').trim();
  const skills = normalizeSkills(job.requiredSkills);
  const cleanedDescription = stripHtml(job.description || '');

  let out = '';
  out += `## About ${company}\n\n`;
  out += (firstSentences(cleanedDescription, 3) || `${company} is hiring for this position.`) + '\n\n';

  out += '## The Role\n\n';
  out += `**Position**: ${title}\n`;
  out += `**Location**: ${location}\n`;
  out += `**Employment Type**: ${jobType}\n\n`;

  if (cleanedDescription.length > 160) {
    const extra = firstSentences(cleanedDescription.slice(Math.min(240, cleanedDescription.length)), 3);
    if (extra && extra.length > 30) {
      out += `## Description\n\n${extra}\n\n`;
    }
  }

  if (skills) {
    out += '## Key Skills\n\n';
    skills.split(', ').forEach((skill) => {
      out += `• ${skill}\n`;
    });
    out += '\n';
  }

  if (job.applicationLink) {
    out += `**[Apply Now](${job.applicationLink})**`;
  }

  return out.trim();
}

async function detectLanguage(text) {
  if (!TRANSLATE_ENABLED) return 'en';
  const sample = normalizeText(text).slice(0, 1000).trim();
  if (!sample) return 'en';
  if (languageCache.has(sample)) return languageCache.get(sample);

  try {
    const payload = { q: sample };
    if (TRANSLATE_KEY) payload.api_key = TRANSLATE_KEY;
    const res = await axios.post(`${TRANSLATE_URL}/detect`, payload, { timeout: 15000 });
    const lang = Array.isArray(res.data) && res.data[0] && res.data[0].language ? res.data[0].language : 'en';
    languageCache.set(sample, lang);
    return lang;
  } catch {
    return 'en';
  }
}

async function translateText(text, sourceLang) {
  if (!TRANSLATE_ENABLED || !text) return text;
  if (sourceLang && sourceLang.toLowerCase() === 'en') return text;

  const chunks = [];
  for (let i = 0; i < text.length; i += TRANSLATE_MAX_CHARS) {
    chunks.push(text.slice(i, i + TRANSLATE_MAX_CHARS));
  }

  const translatedChunks = [];
  for (const chunk of chunks) {
    const payload = {
      q: chunk,
      source: sourceLang || 'auto',
      target: 'en',
      format: 'text'
    };
    if (TRANSLATE_KEY) payload.api_key = TRANSLATE_KEY;

    try {
      const res = await axios.post(`${TRANSLATE_URL}/translate`, payload, { timeout: 20000 });
      translatedChunks.push(res.data?.translatedText || chunk);
    } catch {
      translatedChunks.push(chunk);
    }
  }

  return translatedChunks.join('');
}

async function normalizeRow(row) {
  const rawTitle = (row.title || '').trim();
  if (!rawTitle) return null;

  const rawDescription = row.description || '';
  const rawSkills = row.required_skills || '';
  const rawCompany = row.company_name || 'Unknown Company';
  const rawLocation = row.location || 'Remote';
  const rawJobType = row.job_type || 'Full-Time';
  const rawHowToApply = row.how_to_apply || '';

  let title = normalizeText(rawTitle);
  let companyName = normalizeText(rawCompany);
  let location = normalizeText(rawLocation);
  let jobType = normalizeText(rawJobType);
  let description = normalizeText(stripHtml(rawDescription));
  let requiredSkills = normalizeText(rawSkills);
  let howToApply = normalizeText(rawHowToApply);

  const lang = await detectLanguage(`${title} ${description}`);
  if (lang && lang.toLowerCase() !== 'en') {
    title = await translateText(title, lang);
    description = await translateText(description, lang);
    requiredSkills = await translateText(requiredSkills, lang);
    howToApply = await translateText(howToApply, lang);
  }

  const formattedDescription = formatTemplate({
    title,
    companyName,
    location,
    jobType,
    requiredSkills,
    description,
    applicationLink: row.application_link || ''
  });

  return {
    id: row.id,
    title,
    description: formattedDescription,
    requiredSkills,
    howToApply,
    companyName,
    location,
    jobType
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

  let offset = 0;
  let processed = 0;
  let updated = 0;

  while (true) {
    if (LIMIT > 0 && processed >= LIMIT) break;

    const rows = await client.query(
      `SELECT id, title, description, required_skills, how_to_apply, company_name, location, job_type, application_link
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
             job_type = $7
         WHERE id = $8`,
        [
          normalized.title,
          normalized.description,
          normalized.requiredSkills || null,
          normalized.howToApply || null,
          normalized.companyName || null,
          normalized.location || null,
          normalized.jobType || null,
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
