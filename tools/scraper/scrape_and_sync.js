const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
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
const OUT_FILE = path.join(__dirname, 'last_scrape.json');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomDelay = () => delay(1200 + Math.floor(Math.random() * 1200));

function getHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache'
  };
}

async function normalizeJob(job) {
  const normalized = await normalizeJobRecord(job, { strictEnglish: true });
  if (!normalized) return null;

  return {
    ...normalized,
    source: (normalized.source || job.source || 'scraper').trim(),
    postedDate: normalized.postedDate || job.postedDate || new Date().toISOString()
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

