const axios = require('axios');
const cheerio = require('cheerio');

const path = require('path');
// Load backend .env if present and not already loaded
try {
  const dotenvPath = path.resolve(__dirname, '../../backend/.env');
  require('dotenv').config({ path: dotenvPath });
} catch (e) {
  // ignore
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const INGEST_ENDPOINT = `${BACKEND_URL.replace(/\/$/, '')}/public/ingest-real-jobs`;
const LOG = console;
const fs = require('fs');
const OUT_FILE = path.join(__dirname, 'last_scrape.json');

async function fetchRemotive(limit = 200) {
  try {
    const res = await axios.get('https://remotive.com/api/remote-jobs', { timeout: 20000 });
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
    LOG.warn('Remotive fetch failed', e.message || e);
    return [];
  }
}

async function fetchArbeitnow(pages = 3) {
  const out = [];
  for (let p = 1; p <= pages; p++) {
    try {
      const res = await axios.get(`https://www.arbeitnow.com/api/job-board-api?page=${p}`, { timeout: 20000 });
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
    } catch (e) {
      LOG.warn('ArbeitNow page', p, 'failed', e.message || e);
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return out;
}

async function fetchWWR(limit = 200) {
  try {
    const res = await axios.get('https://weworkremotely.com/remote-jobs', { timeout: 20000 });
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
      out.push({ title, companyName: company, location: region, applicationLink: link, description: '' });
    });
    return out.slice(0, limit);
  } catch (e) {
    LOG.warn('WWR fetch failed', e.message || e);
    return [];
  }
}

async function fetchRemoteCo(limit = 200) {
  const url = 'https://remote.co/remote-jobs/it?page=1';
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await axios.get(url, {
        timeout: 45000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
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
      return out.slice(0, limit);
    } catch (e) {
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      LOG.warn('Remote.co fetch failed', e.message || e);
      return [];
    }
  }
}

async function fetchRemoteOK(limit = 200) {
  try {
    const res = await axios.get('https://remoteok.com/api', {
      timeout: 20000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const rows = Array.isArray(res.data) ? res.data.slice(1) : [];
    const out = [];
    for (const row of rows) {
      const title = (row.position || row.title || '').trim();
      if (!title) continue;
      const company = (row.company || row.company_name || 'RemoteOK Employer').trim();
      const location = (row.location || row.candidate_required_location || 'Remote').trim() || 'Remote';
      const link = row.url || row.apply || row.apply_url || row.href || '';
      const skills = Array.isArray(row.tags) ? row.tags.filter(Boolean).join(', ') : '';
      out.push({
        title,
        companyName: company,
        location,
        applicationLink: link,
        requiredSkills: skills || undefined,
        description: row.description || ''
      });
      if (out.length >= limit) break;
    }
    return out;
  } catch (e) {
    LOG.warn('RemoteOK fetch failed', e.message || e);
    return [];
  }
}

async function fetchMuseJobs(pages = 3, limit = 200) {
  try {
    const out = [];
    for (let page = 1; page <= pages; page++) {
      const res = await axios.get(`https://www.themuse.com/api/public/jobs?page=${page}`, {
        timeout: 20000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const rows = Array.isArray(res.data?.results) ? res.data.results : [];
      for (const row of rows) {
        const title = (row.name || row.title || '').trim();
        if (!title) continue;
        const company = (row.company?.name || row.company_name || 'The Muse Employer').trim();
        const location = Array.isArray(row.locations) && row.locations.length > 0
          ? String(row.locations[0].name || 'Remote').trim() || 'Remote'
          : 'Remote';
        const link = row.refs?.landing_page || row.refs?.job_page || row.refs?.apply || '';
        const skills = Array.isArray(row.categories)
          ? row.categories.map(cat => cat.name).filter(Boolean).join(', ')
          : '';
        out.push({
          title,
          companyName: company,
          location,
          applicationLink: link,
          requiredSkills: skills || undefined,
          description: row.contents || row.snippet || ''
        });
        if (out.length >= limit) break;
      }
      if (out.length >= limit) break;
      await new Promise(r => setTimeout(r, 400));
    }
    return out;
  } catch (e) {
    LOG.warn('The Muse fetch failed', e.message || e);
    return [];
  }
}

async function fetchHackerNews(maxPages = 3) {
  const out = [];
  try {
    for (let p = 1; p <= maxPages; p++) {
      const url = 'https://news.ycombinator.com/jobs' + (p > 1 ? '?p=' + p : '');
      const res = await axios.get(url, { timeout: 15000 });
      const $ = cheerio.load(res.data);
      $('tr.athing').each((i, el) => {
        const a = $(el).find('td.title a.storylink');
        if (a.length === 0) return;
        const fullTitle = a.text().trim();
        let company = 'HN Startup';
        if (fullTitle.includes(' is hiring ')) {
          company = fullTitle.split(' is hiring ')[0];
        } else if (fullTitle.includes('|')) {
          company = fullTitle.split('|')[0].trim();
        }
        out.push({ title: fullTitle, companyName: company, location: 'Remote Friendly / Global', applicationLink: a.attr('href'), description: '' });
      });
      await new Promise(r => setTimeout(r, 1200));
    }
  } catch (e) { LOG.warn('HN fetch failed', e.message || e); }
  return out;
}

function formatTemplate(job) {
  // Build a structured description similar to the Lemon.io example when possible
  const company = job.companyName || 'Company';
  const title = job.title || 'Role';
  const about = job.companyOverview || `About ${company}\n\n${company} is an employer listed on our platform.`;
  const role = `The Role\n\nYou will work as ${title} and be responsible for the primary engineering deliverables.`;
  const responsibilities = job.highlights || job.description ? `What You'll Do:\n\n${(job.description || '').split('\n').slice(0,6).join('\n\n')}` : '';
  const qualifications = job.requiredSkills ? `Who You Are:\n\n• ${job.requiredSkills.split(',').slice(0,10).join('\n• ')}` : '';
  const why = job.why || '';

  const out = [about, '\n\n', role, '\n\n', responsibilities, '\n\n', qualifications, '\n\n', why].join('');
  // Append application link
  const app = job.applicationLink ? `\n\nApplication Link: ${job.applicationLink}` : '';
  return out + app;
}

function dedupeJobs(jobs) {
  const seen = new Map();
  for (const j of jobs) {
    const key = ((j.title || '') + '||' + (j.companyName || '')).toLowerCase().trim();
    if (!seen.has(key)) seen.set(key, j);
  }
  return Array.from(seen.values());
}

function normalizeJobs(jobs) {
  return jobs
    .map(job => {
      const title = typeof job.title === 'string' ? job.title.trim() : '';
      if (!title) return null;
      return {
        ...job,
        title,
        companyName: typeof job.companyName === 'string' && job.companyName.trim() ? job.companyName.trim() : 'Unknown Company',
        location: typeof job.location === 'string' && job.location.trim() ? job.location.trim() : 'Remote',
        applicationLink: typeof job.applicationLink === 'string' ? job.applicationLink.trim() : '',
        description: typeof job.description === 'string' ? job.description.trim() : '',
        requiredSkills: typeof job.requiredSkills === 'string' ? job.requiredSkills.trim() : job.requiredSkills
      };
    })
    .filter(Boolean);
}

async function postToBackend(jobs) {
  if (!jobs || jobs.length === 0) {
    LOG.info('No jobs to post');
    return;
  }
  try {
    const res = await axios.post(INGEST_ENDPOINT, jobs, { timeout: 60000 });
    LOG.info('Backend ingestion response:', res.status, res.data?.length || 'ok');
  } catch (e) {
    LOG.warn('Backend post skipped or failed:', e.response ? e.response.status : e.code || e.message);
  }
}

async function run() {
  LOG.info('Starting scrape run...');
  const [r1, r2, r3, r4, r5, r6, r7] = await Promise.all([
    fetchRemotive(500),
    fetchArbeitnow(3),
    fetchWWR(200),
    fetchRemoteCo(200),
    fetchHackerNews(5),
    fetchRemoteOK(250),
    fetchMuseJobs(3, 200)
  ]);
  let jobs = [...r1, ...r2, ...r3, ...r4, ...r5, ...r6, ...r7];
  LOG.info('Raw jobs collected:', jobs.length);
  jobs = dedupeJobs(jobs);
  LOG.info('After dedupe:', jobs.length);
  jobs = normalizeJobs(jobs);
  LOG.info('After normalization:', jobs.length);

  // Format job descriptions into Lemon-like template where possible
  jobs = jobs.map(j => {
    const copy = Object.assign({}, j);
    copy.description = formatTemplate(copy);
    return copy;
  });
  try {
    fs.writeFileSync(OUT_FILE, JSON.stringify(jobs, null, 2), 'utf8');
    LOG.info('Wrote last_scrape.json for downstream sync');
  } catch (e) { LOG.warn('Failed to write last_scrape.json', e.message || e); }
  await postToBackend(jobs);
  LOG.info('Scrape run complete');

  // Optional webhook notification if WEBHOOK_NOTIFY_URL provided
  const webhook = process.env.WEBHOOK_NOTIFY_URL;
  if (webhook) {
    try {
      const summary = { collected: jobs.length, timestamp: new Date().toISOString() };
      await axios.post(webhook, summary, { timeout: 10000 });
      LOG.info('Sent summary to webhook');
    } catch (e) { LOG.warn('Webhook notify failed', e.message || e); }
  }
}

run().catch(e => {
  LOG.error('Scraper failed', e.message || e);
  process.exit(1);
});
