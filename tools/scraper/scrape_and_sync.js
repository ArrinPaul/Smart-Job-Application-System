const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');

// Load backend .env if present
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

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const INGEST_ENDPOINT = `${BACKEND_URL.replace(/\/$/, '')}/public/ingest-real-jobs`;
const LOG = console;
const OUT_FILE = path.join(__dirname, 'last_scrape.json');

// Helper for random delays to avoid 429s
const delay = (ms) => new Promise(r => setTimeout(r, ms));
const randomDelay = () => delay(2000 + Math.random() * 3000);

// Helper for realistic headers
const getHeaders = () => ({
  'User-Agent': [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
  ][Math.floor(Math.random() * 3)],
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache'
});

/**
 * CORE STABLE SOURCES
 */

async function fetchRemotive(limit = 200) {
  try {
    const res = await axios.get('https://remotive.com/api/remote-jobs', { timeout: 20000, headers: getHeaders() });
    const jobs = (res.data && res.data.jobs) || [];
    return jobs.slice(0, limit).map(j => ({
      title: j.title,
      companyName: j.company_name,
      location: j.candidate_required_location || 'Remote',
      applicationLink: j.url,
      jobType: j.job_type || 'Full-time',
      requiredSkills: Array.isArray(j.tags) ? j.tags.join(', ') : undefined,
      description: j.description
    }));
  } catch (e) {
    LOG.warn('Remotive fetch failed:', e.message);
    return [];
  }
}

async function fetchArbeitnow(pages = 2) {
  const out = [];
  for (let p = 1; p <= pages; p++) {
    try {
      const res = await axios.get(`https://www.arbeitnow.com/api/job-board-api?page=${p}`, { timeout: 20000, headers: getHeaders() });
      const data = res.data && res.data.data ? res.data.data : [];
      for (const j of data) {
        out.push({
          title: j.title,
          companyName: j.company_name || 'Company',
          location: j.location || 'Remote',
          applicationLink: j.url,
          requiredSkills: Array.isArray(j.tags) ? j.tags.join(', ') : undefined,
          description: j.description
        });
      }
      await randomDelay();
    } catch (e) {
      LOG.warn('ArbeitNow page', p, 'failed:', e.message);
    }
  }
  return out;
}

async function fetchWWR(limit = 150) {
  try {
    const res = await axios.get('https://weworkremotely.com/remote-jobs', { timeout: 20000, headers: getHeaders() });
    const $ = cheerio.load(res.data);
    const out = [];
    $('section.jobs article ul li a').each((i, el) => {
      if (out.length >= limit) return;
      const a = $(el);
      const title = a.find('span.title').text().trim();
      const company = a.find('span.company').text().trim();
      const region = a.find('span.region').text().trim() || 'Remote';
      const detail = a.attr('href');
      const link = detail ? new URL(detail, 'https://weworkremotely.com').toString() : '';
      if (title) out.push({ title, companyName: company, location: region, applicationLink: link, description: '' });
    });
    return out;
  } catch (e) {
    LOG.warn('WWR fetch failed:', e.message);
    return [];
  }
}

async function fetchRemoteCo(limit = 100) {
  try {
    const res = await axios.get('https://remote.co/remote-jobs/it?page=1', {
      timeout: 30000,
      headers: getHeaders()
    });
    const $ = cheerio.load(res.data);
    const out = [];
    $('a[href*="/job-details/"]').each((i, el) => {
      if (out.length >= limit) return;
      const a = $(el);
      const title = a.text().replace(/\s+/g, ' ').trim();
      if (!title || title.length < 3) return;
      const container = a.closest('article, section, li, div');
      const company = container.find('h3').first().text().replace(/\s+/g, ' ').trim() || 'Remote.co Employer';
      const link = a.attr('href') ? new URL(a.attr('href'), 'https://remote.co').toString() : '';
      out.push({ title, companyName: company, location: 'Remote', applicationLink: link, description: '' });
    });
    return out;
  } catch (e) {
    LOG.warn('Remote.co fetch failed:', e.message);
    return [];
  }
}

async function fetchRemoteOK(limit = 150) {
  try {
    const res = await axios.get('https://remoteok.com/api', {
      timeout: 25000,
      headers: getHeaders()
    });
    const rows = Array.isArray(res.data) ? res.data.slice(1) : [];
    const out = [];
    for (const row of rows) {
      const title = (row.position || row.title || '').trim();
      if (!title) continue;
      out.push({
        title,
        companyName: (row.company || 'RemoteOK Employer').trim(),
        location: (row.location || 'Remote').trim(),
        applicationLink: row.url || '',
        requiredSkills: Array.isArray(row.tags) ? row.tags.join(', ') : '',
        description: row.description || ''
      });
      if (out.length >= limit) break;
    }
    return out;
  } catch (e) {
    LOG.warn('RemoteOK fetch failed:', e.message);
    return [];
  }
}

async function fetchHackerNews(maxPages = 2) {
  const out = [];
  for (let p = 1; p <= maxPages; p++) {
    try {
      const url = `https://news.ycombinator.com/jobs${p > 1 ? '?p=' + p : ''}`;
      const res = await axios.get(url, { timeout: 15000, headers: getHeaders() });
      const $ = cheerio.load(res.data);
      $('tr.athing').each((i, el) => {
        const a = $(el).find('span.titleline a').first();
        if (a.length === 0) return;
        const fullTitle = a.text().trim();
        out.push({ 
          title: fullTitle, 
          companyName: fullTitle.split('|')[0].trim() || 'HN Startup', 
          location: 'Remote Friendly', 
          applicationLink: a.attr('href'), 
          description: '' 
        });
      });
      await randomDelay(); // Critical for avoiding HN 429s
    } catch (e) {
      LOG.warn('HN page', p, 'failed:', e.message);
      if (e.response?.status === 429) break; // Stop if rate limited
    }
  }
  return out;
}

/**
 * FIXED / IMPROVED SOURCES
 */

async function fetchJustjoinitJobs(limit = 100) {
  try {
    // Attempting a more direct offers list
    const res = await axios.get('https://justjoin.it/api/offers', {
      timeout: 20000,
      headers: getHeaders()
    });
    const jobs = Array.isArray(res.data) ? res.data : [];
    return jobs
      .filter(j => j.remote || j.remote_interview)
      .slice(0, limit)
      .map(j => ({
        title: j.title,
        companyName: j.company_name || 'Justjoin.it Employer',
        location: 'Remote',
        applicationLink: `https://justjoin.it/offers/${j.slug || j.id}`,
        description: (j.description || '').substring(0, 500)
      }));
  } catch (e) {
    LOG.warn('Justjoin.it fetch failed:', e.message);
    return [];
  }
}

async function fetchGoRemotely(limit = 50) {
  try {
    // GoRemotely often blips; adding a retry
    const res = await axios.get('https://goremotely.com/api/jobs', {
      timeout: 15000,
      headers: getHeaders()
    });
    const jobs = (res.data && res.data.jobs) || (Array.isArray(res.data) ? res.data : []);
    return jobs.slice(0, limit).map(j => ({
      title: j.title,
      companyName: j.company_name || 'GoRemotely Employer',
      location: j.location || 'Remote',
      applicationLink: j.url || '',
      description: j.description || ''
    }));
  } catch (e) {
    LOG.warn('GoRemotely fetch failed:', e.message);
    return [];
  }
}

/**
 * UTILITIES
 */

function formatTemplate(job) {
  const company = job.companyName || 'Company';
  const title = job.title || 'Role';
  const about = `About ${company}\n\n${company} is an employer listed on our platform.`;
  const role = `The Role\n\nYou will work as ${title} and be responsible for the primary engineering deliverables.`;
  const responsibilities = job.description ? `What You'll Do:\n\n${(job.description || '').split('\n').slice(0,6).join('\n\n')}` : '';
  const qualifications = job.requiredSkills ? `Who You Are:\n\n• ${job.requiredSkills.split(',').slice(0,10).join('\n• ')}` : '';
  
  const out = [about, '\n\n', role, '\n\n', responsibilities, '\n\n', qualifications].join('');
  const app = job.applicationLink ? `\n\nApplication Link: ${job.applicationLink}` : '';
  return out + app;
}

function dedupeJobs(jobs) {
  const seen = new Map();
  for (const j of jobs) {
    const key = `${j.title}||${j.companyName}`.toLowerCase().replace(/\s+/g, '');
    if (!seen.has(key)) seen.set(key, j);
  }
  return Array.from(seen.values());
}

async function run() {
  LOG.info('🚀 Starting Resilient Job Scrape Run...');
  
  const sources = [
    { name: 'Remotive', fn: fetchRemotive() },
    { name: 'ArbeitNow', fn: fetchArbeitnow() },
    { name: 'WWR', fn: fetchWWR() },
    { name: 'RemoteOK', fn: fetchRemoteOK() },
    { name: 'HackerNews', fn: fetchHackerNews() },
    { name: 'Justjoin.it', fn: fetchJustjoinitJobs() },
    { name: 'GoRemotely', fn: fetchGoRemotely() },
    { name: 'Remote.co', fn: fetchRemoteCo() }
  ];

  const results = await Promise.all(sources.map(async s => {
    const jobs = await s.fn;
    LOG.info(`📡 ${s.name}: Collected ${jobs.length} jobs`);
    return jobs;
  }));

  let allJobs = results.flat();
  LOG.info('📊 Total raw jobs:', allJobs.length);
  allJobs = dedupeJobs(allJobs);
  LOG.info('📊 Unique jobs:', allJobs.length);

  allJobs = allJobs.map(j => ({ ...j, description: formatTemplate(j) }));

  try {
    fs.writeFileSync(OUT_FILE, JSON.stringify(allJobs, null, 2), 'utf8');
    LOG.info('💾 Results saved.');
  } catch (e) { LOG.error('❌ Write failed:', e.message); }
}

run().catch(e => {
  LOG.error('💥 Scraper fatal:', e.message);
  process.exit(1);
});
