const axios = require('axios');
const cheerio = require('cheerio');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const INGEST_ENDPOINT = `${BACKEND_URL.replace(/\/$/, '')}/public/ingest-real-jobs`;
const LOG = console;

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

function dedupeJobs(jobs) {
  const seen = new Map();
  for (const j of jobs) {
    const key = ((j.title || '') + '||' + (j.companyName || '')).toLowerCase().trim();
    if (!seen.has(key)) seen.set(key, j);
  }
  return Array.from(seen.values());
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
    LOG.error('Failed to POST to backend:', e.response ? e.response.status : e.message);
  }
}

async function run() {
  LOG.info('Starting scrape run...');
  const [r1, r2] = await Promise.all([fetchRemotive(500), fetchArbeitnow(3)]);
  let jobs = [...r1, ...r2];
  LOG.info('Raw jobs collected:', jobs.length);
  jobs = dedupeJobs(jobs);
  LOG.info('After dedupe:', jobs.length);
  await postToBackend(jobs);
  LOG.info('Scrape run complete');
}

run().catch(e => {
  LOG.error('Scraper failed', e.message || e);
  process.exit(1);
});
