const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

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
const OUT_FILE = path.join(__dirname, 'last_scrape.json');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomDelay = () => delay(1200 + Math.floor(Math.random() * 1200));

const TRANSLATE_URL = (process.env.LIBRETRANSLATE_URL || 'https://libretranslate.de').replace(/\/$/, '');
const TRANSLATE_KEY = process.env.LIBRETRANSLATE_KEY || '';
const TRANSLATE_ENABLED = process.env.TRANSLATE_DISABLED !== 'true' && Boolean(TRANSLATE_URL);
const TRANSLATE_MAX_CHARS = Number(process.env.TRANSLATE_MAX_CHARS || 3800);

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
    // fallback to original text
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

function getHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache'
  };
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

async function normalizeJob(job) {
  const rawTitle = (job.title || '').trim();
  if (!rawTitle) return null;

  const rawDescription = job.description || '';
  const rawSkills = normalizeSkills(job.requiredSkills);
  const rawCompany = job.companyName || 'Unknown Company';
  const rawLocation = job.location || 'Remote';
  const rawJobType = job.jobType || 'Full-Time';

  let title = normalizeText(rawTitle);
  let companyName = normalizeText(rawCompany);
  let location = normalizeText(rawLocation);
  let jobType = normalizeText(rawJobType);
  let description = normalizeText(stripHtml(rawDescription));
  let requiredSkills = normalizeText(rawSkills);

  const lang = await detectLanguage(`${title} ${description}`);
  if (lang && lang.toLowerCase() !== 'en') {
    title = await translateText(title, lang);
    description = await translateText(description, lang);
    requiredSkills = await translateText(requiredSkills, lang);
  }

  const templateDescription = formatTemplate({
    title,
    companyName,
    location,
    jobType,
    requiredSkills,
    description,
    applicationLink: (job.applicationLink || '').trim()
  });

  return {
    title,
    companyName: companyName || 'Unknown Company',
    location: location || 'Remote',
    applicationLink: (job.applicationLink || '').trim(),
    description: templateDescription,
    requiredSkills,
    jobType: jobType || 'Full-Time',
    source: (job.source || 'scraper').trim(),
    postedDate: job.postedDate || new Date().toISOString()
  };
}

function dedupeJobs(jobs) {
  const seen = new Map();
  for (const j of jobs) {
    const key = `${j.title || ''}||${j.companyName || ''}`.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!key || key === '||') continue;
    if (!seen.has(key)) seen.set(key, j);
  }
  return Array.from(seen.values());
}

async function fetchRemotive(limit = 250) {
  try {
    const res = await axios.get('https://remotive.com/api/remote-jobs', { timeout: 25000, headers: getHeaders() });
    const jobs = Array.isArray(res.data?.jobs) ? res.data.jobs : [];
    return jobs.slice(0, limit).map((j) => ({
      title: j.title,
      companyName: j.company_name,
      location: j.candidate_required_location || 'Remote',
      applicationLink: j.url,
      jobType: j.job_type || 'Full-Time',
      requiredSkills: Array.isArray(j.tags) ? j.tags.join(', ') : '',
      description: j.description || '',
      source: 'Remotive'
    }));
  } catch (e) {
    LOG.warn('Remotive fetch failed:', e.message);
    return [];
  }
}

async function fetchArbeitNow(pages = 3, limit = 250) {
  const out = [];
  for (let p = 1; p <= pages; p++) {
    try {
      const res = await axios.get(`https://www.arbeitnow.com/api/job-board-api?page=${p}`, { timeout: 25000, headers: getHeaders() });
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      for (const j of data) {
        out.push({
          title: j.title,
          companyName: j.company_name || 'Company',
          location: j.location || 'Remote',
          applicationLink: j.url || '',
          requiredSkills: Array.isArray(j.tags) ? j.tags.join(', ') : '',
          description: j.description || '',
          source: 'ArbeitNow'
        });
        if (out.length >= limit) break;
      }
      if (out.length >= limit) break;
      await randomDelay();
    } catch (e) {
      LOG.warn('ArbeitNow page', p, 'failed:', e.message);
    }
  }
  return out;
}

async function fetchRemoteOK(limit = 250) {
  try {
    const res = await axios.get('https://remoteok.com/api', {
      timeout: 30000,
      headers: {
        ...getHeaders(),
        Referer: 'https://remoteok.com/'
      }
    });

    const rows = Array.isArray(res.data) ? res.data.slice(1) : [];
    const out = [];

    for (const row of rows) {
      const title = (row.position || row.title || '').trim();
      if (!title) continue;
      out.push({
        title,
        companyName: (row.company || 'RemoteOK Employer').trim(),
        location: (row.location || 'Remote').trim() || 'Remote',
        applicationLink: row.url || row.apply_url || '',
        requiredSkills: Array.isArray(row.tags) ? row.tags.join(', ') : '',
        description: row.description || '',
        source: 'RemoteOK'
      });
      if (out.length >= limit) break;
    }

    return out;
  } catch (e) {
    LOG.warn('RemoteOK fetch failed:', e.message);
    return [];
  }
}

async function fetchHackerNews(maxPages = 3) {
  const out = [];

  for (let p = 1; p <= maxPages; p++) {
    try {
      const url = `https://news.ycombinator.com/jobs${p > 1 ? `?p=${p}` : ''}`;
      const res = await axios.get(url, { timeout: 20000, headers: getHeaders() });
      const $ = cheerio.load(res.data);

      $('tr.athing').each((_, el) => {
        const a = $(el).find('span.titleline a').first();
        if (!a.length) return;
        const fullTitle = a.text().trim();
        if (!fullTitle) return;
        out.push({
          title: fullTitle,
          companyName: fullTitle.split('|')[0].trim() || 'HN Startup',
          location: 'Remote Friendly',
          applicationLink: a.attr('href') || '',
          description: '',
          source: 'HackerNews'
        });
      });

      await randomDelay();
    } catch (e) {
      LOG.warn('HN page', p, 'failed:', e.message);
      if (e.response?.status === 429) break;
    }
  }

  return out;
}

async function fetchRemoteCo(limit = 120) {
  const out = [];

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await axios.get('https://remote.co/remote-jobs/it?page=1', {
        timeout: 45000,
        headers: {
          ...getHeaders(),
          Referer: 'https://remote.co/'
        }
      });

      const $ = cheerio.load(res.data);
      $('a[href*="/job-details/"]').each((_, el) => {
        if (out.length >= limit) return;
        const a = $(el);
        const title = a.text().replace(/\s+/g, ' ').trim();
        if (!title || title.length < 3) return;

        const container = a.closest('article, section, li, div');
        const company = container.find('h3').first().text().replace(/\s+/g, ' ').trim() || 'Remote.co Employer';
        const href = a.attr('href') || '';
        const link = href ? new URL(href, 'https://remote.co').toString() : '';

        out.push({
          title,
          companyName: company,
          location: 'Remote',
          applicationLink: link,
          description: '',
          source: 'Remote.co'
        });
      });

      return out.slice(0, limit);
    } catch (e) {
      if (attempt < 2) {
        await delay(2000);
      } else {
        LOG.warn('Remote.co fetch failed:', e.message);
      }
    }
  }

  return [];
}

async function run() {
  LOG.info('Starting stable scrape run...');

  const sources = [
    { name: 'Remotive', fn: fetchRemotive(250) },
    { name: 'ArbeitNow', fn: fetchArbeitNow(3, 250) },
    { name: 'RemoteOK', fn: fetchRemoteOK(250) },
    { name: 'HackerNews', fn: fetchHackerNews(3) },
    { name: 'Remote.co', fn: fetchRemoteCo(150) }
  ];

  const results = await Promise.all(sources.map(async (s) => {
    const jobs = await s.fn;
    LOG.info(`Source ${s.name}: ${jobs.length} jobs`);
    return jobs;
  }));

  let allJobs = results.flat();
  LOG.info('Raw jobs:', allJobs.length);

  allJobs = dedupeJobs(allJobs);
  LOG.info('After dedupe:', allJobs.length);

  const normalizedJobs = [];
  for (const job of allJobs) {
    const normalized = await normalizeJob(job);
    if (normalized) normalizedJobs.push(normalized);
  }
  allJobs = normalizedJobs;
  LOG.info('After normalization:', allJobs.length);

  fs.writeFileSync(OUT_FILE, JSON.stringify(allJobs, null, 2), 'utf8');
  LOG.info('Saved', OUT_FILE);

  LOG.info('Starting database sync...');
  const syncResult = spawnSync(process.execPath, ['sync_to_supabase.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: process.env
  });

  if (syncResult.status !== 0) {
    throw new Error(`Database sync failed with exit code ${syncResult.status}`);
  }

  LOG.info('Database sync completed.');
}

run().catch((e) => {
  LOG.error('Scraper fatal:', e.message || e);
  process.exit(1);
});

