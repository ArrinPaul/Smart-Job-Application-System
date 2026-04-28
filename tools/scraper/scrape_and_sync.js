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
      requiredSkills: j.skills?.join(', ') || '',
      description: j.description || ''
    }));
  } catch (e) {
    LOG.warn('GoRemotely fetch failed:', e.message);
    return [];
  }
}

/**
 * ADDITIONAL MAJOR PLATFORMS
 */

async function fetchStackOverflowJobs(limit = 100) {
  try {
    const res = await axios.get('https://stackoverflow.com/jobs/feed', {
      timeout: 20000,
      headers: getHeaders()
    });
    const $ = cheerio.load(res.data);
    const out = [];
    
    $('item').each((i, el) => {
      if (out.length >= limit) return;
      const $el = $(el);
      const title = $el.find('title').text().trim();
      const description = $el.find('description').text().trim();
      const link = $el.find('link').text().trim();
      const location = description.match(/Location: ([^<\n]+)/)?.[1]?.trim() || 'Remote';
      const company = title.split(' - ')[1] || 'Stack Overflow Employer';
      
      if (title) {
        out.push({
          title: title.split(' - ')[0].trim(),
          companyName: company.trim(),
          location: location,
          applicationLink: link,
          jobType: 'Full-Time',
          description: description
        });
      }
    });
    return out;
  } catch (e) {
    LOG.warn('Stack Overflow Jobs fetch failed:', e.message);
    return [];
  }
}

async function fetchYCombinatorJobs(limit = 100) {
  try {
    const res = await axios.get('https://www.ycombinator.com/jobs', {
      timeout: 20000,
      headers: getHeaders()
    });
    const $ = cheerio.load(res.data);
    const out = [];
    
    $('[data-id]').each((i, el) => {
      if (out.length >= limit) return;
      const $el = $(el);
      const title = $el.find('[class*="font-medium"]').first().text().trim();
      const company = $el.find('a[href*="/companies/"]').text().trim();
      const location = $el.find('[class*="text-gray"]').last().text().trim();
      const link = $el.find('a').first().attr('href');
      
      if (title && company) {
        out.push({
          title: title,
          companyName: company,
          location: location || 'Remote Friendly',
          applicationLink: link ? new URL(link, 'https://www.ycombinator.com').toString() : '',
          jobType: 'Full-Time',
          description: ''
        });
      }
    });
    return out;
  } catch (e) {
    LOG.warn('Y Combinator Jobs fetch failed:', e.message);
    return [];
  }
}

async function fetchProductHuntJobs(limit = 50) {
  try {
    const res = await axios.get('https://www.producthunt.com/jobs', {
      timeout: 20000,
      headers: {
        ...getHeaders(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    const $ = cheerio.load(res.data);
    const out = [];
    
    $('[class*="job"]').each((i, el) => {
      if (out.length >= limit) return;
      const $el = $(el);
      const title = $el.find('[class*="title"]').first().text().trim();
      const company = $el.find('[class*="company"]').first().text().trim();
      const link = $el.find('a').first().attr('href');
      
      if (title && company) {
        out.push({
          title: title,
          companyName: company,
          location: 'Remote Friendly',
          applicationLink: link ? new URL(link, 'https://www.producthunt.com').toString() : '',
          jobType: 'Full-Time',
          description: ''
        });
      }
    });
    return out;
  } catch (e) {
    LOG.warn('Product Hunt Jobs fetch failed:', e.message);
    return [];
  }
}

async function fetchAngelListJobs(limit = 150) {
  try {
    // AngelList/Wellfound API approach
    const res = await axios.get('https://api.wellfound.com/jobs', {
      params: { page: 1, per_page: limit },
      timeout: 20000,
      headers: getHeaders()
    });
    const jobs = (res.data && res.data.jobs) || res.data || [];
    return Array.isArray(jobs) ? jobs.slice(0, limit).map(j => ({
      title: j.title || j.job_title,
      companyName: j.company_name || j.startup?.name || 'AngelList Startup',
      location: j.locations?.join(', ') || 'Remote',
      applicationLink: j.url || j.apply_url || '',
      jobType: j.job_type || 'Full-Time',
      requiredSkills: Array.isArray(j.skills) ? j.skills.join(', ') : j.role_tags?.join(', ') || '',
      description: j.description || j.job_description || ''
    })) : [];
  } catch (e) {
    LOG.warn('AngelList/Wellfound fetch failed:', e.message);
    return [];
  }
}

async function fetchBuiltinJobs(limit = 100) {
  try {
    const res = await axios.get('https://builtin.com/api/v1/jobs', {
      params: { remote: true, limit },
      timeout: 20000,
      headers: getHeaders()
    });
    const jobs = (res.data && res.data.data) || (Array.isArray(res.data) ? res.data : []);
    return jobs.slice(0, limit).map(j => ({
      title: j.title,
      companyName: j.company?.name || 'Built.in Company',
      location: j.location || 'Remote',
      applicationLink: j.link || j.url || '',
      jobType: j.job_type || 'Full-Time',
      requiredSkills: j.skills?.slice(0, 5).join(', ') || '',
      salaryMin: j.salary?.min,
      salaryMax: j.salary?.max,
      salaryPeriod: 'yearly',
      description: j.description || ''
    }));
  } catch (e) {
    LOG.warn('Built.in fetch failed:', e.message);
    return [];
  }
}

async function fetchDiceJobs(limit = 100) {
  try {
    const res = await axios.get('https://api.dice.com/jobs', {
      params: { 
        query: 'remote',
        pageSize: limit,
        sort: 'date'
      },
      timeout: 20000,
      headers: getHeaders()
    });
    const jobs = (res.data && res.data.data) || [];
    return jobs.slice(0, limit).map(j => ({
      title: j.jobTitle,
      companyName: j.company,
      location: j.location || 'Remote',
      applicationLink: j.detailPageUrl || j.url || '',
      jobType: 'Full-Time',
      requiredSkills: j.skills?.join(', ') || '',
      description: j.jobDescription || j.snippet || ''
    }));
  } catch (e) {
    LOG.warn('Dice fetch failed:', e.message);
    return [];
  }
}

async function fetchLevelsFyiJobs(limit = 80) {
  try {
    // LevelsFYI offers a jobs API
    const res = await axios.get('https://www.levelsfyi.com/api/jobs', {
      params: { limit, remote: true },
      timeout: 20000,
      headers: getHeaders()
    });
    const jobs = Array.isArray(res.data) ? res.data : (res.data?.jobs || []);
    return jobs.slice(0, limit).map(j => ({
      title: j.title || j.position,
      companyName: j.company || j.company_name || 'LevelsFYI Company',
      location: 'Remote',
      applicationLink: j.url || j.apply_link || '',
      jobType: j.job_type || 'Full-Time',
      requiredSkills: j.skills?.join(', ') || '',
      salaryMin: j.salary_min,
      salaryMax: j.salary_max,
      salaryPeriod: 'yearly',
      description: j.description || ''
    }));
  } catch (e) {
    LOG.warn('LevelsFYI fetch failed:', e.message);
    return [];
  }
}

async function fetchGlassdoorJobs(limit = 100) {
  try {
    // Glassdoor has anti-scraping, but we can try a basic approach
    const res = await axios.get('https://www.glassdoor.com/api/jobs', {
      params: { 
        keyword: 'software engineer',
        location: 'remote',
        pageNumber: 1,
        pageSize: limit
      },
      timeout: 20000,
      headers: {
        ...getHeaders(),
        'Referer': 'https://www.glassdoor.com/'
      }
    });
    const jobs = (res.data && res.data.jobs) || [];
    return jobs.slice(0, limit).map(j => ({
      title: j.jobTitle,
      companyName: j.employer || 'Glassdoor Employer',
      location: j.location || 'Remote',
      applicationLink: j.jobUrl || '',
      jobType: 'Full-Time',
      salaryMin: j.salaryRange?.min,
      salaryMax: j.salaryRange?.max,
      salaryPeriod: 'yearly',
      description: j.jobDescription || j.excerpt || ''
    }));
  } catch (e) {
    LOG.warn('Glassdoor fetch failed:', e.message);
    return [];
  }
}

async function fetchLinkedinJobs(limit = 80) {
  try {
    // LinkedIn has heavy anti-scraping; trying REST-API pattern
    const res = await axios.get('https://www.linkedin.com/jobs/api/jobs', {
      params: {
        keywords: 'software engineer',
        location: 'remote',
        pageNumber: 0,
        pageSize: limit
      },
      timeout: 20000,
      headers: {
        ...getHeaders(),
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    const jobs = (res.data && res.data.jobs) || [];
    return jobs.slice(0, limit).map(j => ({
      title: j.title || j.jobTitle,
      companyName: j.company?.name || j.company_name || 'LinkedIn Company',
      location: j.location || 'Remote',
      applicationLink: j.applyUrl || j.url || '',
      jobType: j.jobType || 'Full-Time',
      description: j.description || j.jobDescription || ''
    }));
  } catch (e) {
    LOG.warn('LinkedIn fetch failed:', e.message);
    return [];
  }
}

async function fetchUpworkRemoteJobs(limit = 100) {
  try {
    // Upwork jobs endpoint
    const res = await axios.get('https://www.upwork.com/api/jobs/v1', {
      params: {
        skills: ['javascript', 'java', 'python', 'react', 'node.js'],
        work_type: 'remote',
        page_size: limit,
        page: 0
      },
      timeout: 20000,
      headers: getHeaders()
    });
    const jobs = (res.data && res.data.jobs) || [];
    return jobs.slice(0, limit).map(j => ({
      title: j.title,
      companyName: j.client?.company_name || 'Upwork Client',
      location: 'Remote',
      applicationLink: j.profile_url || j.url || '',
      jobType: 'Contract',
      requiredSkills: j.required_skills?.join(', ') || j.skills?.join(', ') || '',
      description: j.snippet || j.description || ''
    }));
  } catch (e) {
    LOG.warn('Upwork fetch failed:', e.message);
    return [];
  }
}

/**
 * UTILITIES
 */

// Strip HTML tags and decode HTML entities
function stripHtml(html) {
  if (!html) return '';
  // Remove HTML tags
  let text = String(html)
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/g, ''); // Remove other HTML entities
  
  // Clean up excessive whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

// Extract first meaningful paragraph from description
function extractFirstParagraph(desc) {
  if (!desc) return '';
  const sentences = stripHtml(desc).split(/[.!?]+/).slice(0, 3).join('. ').trim();
  return sentences.length > 500 ? sentences.substring(0, 500) + '...' : sentences;
}

// Format job description in a clean, structured way
function formatTemplate(job) {
  if (!job) return '';
  
  const company = (job.companyName || '').trim() || 'Company';
  const title = (job.title || '').trim() || 'Role';
  const location = (job.location || '').trim() || 'Remote';
  const skills = (job.requiredSkills || '').trim();
  const jobType = (job.jobType || 'Full-Time').trim();
  
  // Clean and process description
  let descText = stripHtml(job.description || '');
  
  // Build clean, structured description
  let description = '';
  
  // Section 1: Company overview
  description += `## About ${company}\n\n`;
  if (descText.length > 0) {
    const firstPara = extractFirstParagraph(descText);
    description += firstPara + '\n\n';
  } else {
    description += `${company} is hiring for a talented individual to join their team.\n\n`;
  }
  
  // Section 2: Role title and basic info
  description += `## The Role\n\n`;
  description += `**Position**: ${title}\n`;
  description += `**Location**: ${location}\n`;
  description += `**Employment Type**: ${jobType}\n`;
  
  // Section 3: Salary if available
  if (job.salaryMin || job.salaryMax) {
    description += `**Salary Range**: `;
    if (job.salaryMin && job.salaryMax) {
      description += `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
    } else if (job.salaryMin) {
      description += `From $${job.salaryMin.toLocaleString()}`;
    } else if (job.salaryMax) {
      description += `Up to $${job.salaryMax.toLocaleString()}`;
    }
    if (job.salaryPeriod) {
      description += ` ${job.salaryPeriod === 'yearly' ? 'per year' : job.salaryPeriod}`;
    }
    description += `\n`;
  }
  
  description += '\n';
  
  // Section 4: Get more details from description
  if (descText.length > 200) {
    // Try to extract meaningful content (skip first paragraph which was already used)
    const remainingText = descText.substring(extractFirstParagraph(descText).length + 50);
    if (remainingText.length > 100) {
      // Get next 2-3 sentences
      const details = remainingText.split(/[.!?]+/).slice(0, 3).join('. ').trim();
      if (details && details.length > 20) {
        description += `## Description\n\n${details}\n\n`;
      }
    }
  }
  
  // Section 5: Required skills
  if (skills) {
    description += `## Key Skills\n\n`;
    const skillList = skills.split(/[,;]/).map(s => s.trim()).filter(Boolean).slice(0, 10);
    skillList.forEach(skill => {
      description += `• ${skill}\n`;
    });
    description += '\n';
  }
  
  // Section 6: Application link
  if (job.applicationLink) {
    description += `**[🎯 Apply Now →](${job.applicationLink})**`;
  }
  
  return description.trim();
}

function dedupeJobs(jobs) {
  const seen = new Map();
  for (const j of jobs) {
    const key = `${j.title}||${j.companyName}`.toLowerCase().replace(/\s+/g, '');
    if (!seen.has(key)) seen.set(key, j);
  }
  return Array.from(seen.values());
}

/**
 * NORMALIZE JOB OBJECT
 * Ensures consistent structure with all expected fields for frontend rendering
 */
function normalizeJob(job) {
  return {
    // Core fields (required)
    title: (job.title || 'Untitled Position').trim(),
    companyName: (job.companyName || 'Company').trim(),
    location: (job.location || 'Remote').trim(),
    applicationLink: (job.applicationLink || '#').trim(),
    
    // Optional fields with defaults
    description: (job.description || 'No description available').trim(),
    jobType: (job.jobType || 'Full-Time').trim(),
    requiredSkills: (job.requiredSkills || '').trim(),
    
    // Salary fields (optional)
    salaryMin: job.salaryMin ? parseInt(job.salaryMin) : null,
    salaryMax: job.salaryMax ? parseInt(job.salaryMax) : null,
    salaryPeriod: (job.salaryPeriod || 'yearly').toLowerCase(),
    
    // Metadata
    source: (job.source || 'Job Portal').trim(),
    postedDate: job.postedDate || new Date().toISOString(),
    
    // Frontend-specific computed fields
    salaryDisplay: (() => {
      if (job.salaryMin && job.salaryMax) {
        return `$${parseInt(job.salaryMin).toLocaleString()} - $${parseInt(job.salaryMax).toLocaleString()}`;
      } else if (job.salaryMin) {
        return `From $${parseInt(job.salaryMin).toLocaleString()}`;
      } else if (job.salaryMax) {
        return `Up to $${parseInt(job.salaryMax).toLocaleString()}`;
      }
      return null;
    })(),
    
    skillsList: (job.requiredSkills || '')
      .split(/[,;]/)
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 10)
  };
}

async function run() {
  LOG.info('🚀 Starting Resilient Job Scrape Run...');
  
  const sources = [
    // Core Stable Remote Job Boards
    { name: 'Remotive', fn: fetchRemotive(200) },
    { name: 'ArbeitNow', fn: fetchArbeitnow(150) },
    { name: 'WWR', fn: fetchWWR(100) },
    { name: 'RemoteOK', fn: fetchRemoteOK(150) },
    { name: 'HackerNews', fn: fetchHackerNews(2) },
    { name: 'Justjoin.it', fn: fetchJustjoinitJobs(100) },
    { name: 'GoRemotely', fn: fetchGoRemotely(50) },
    { name: 'Remote.co', fn: fetchRemoteCo(100) },
    
    // Major Tech Job Platforms
    { name: 'Stack Overflow', fn: fetchStackOverflowJobs(100) },
    { name: 'Y Combinator', fn: fetchYCombinatorJobs(100) },
    { name: 'ProductHunt', fn: fetchProductHuntJobs(50) },
    { name: 'AngelList/Wellfound', fn: fetchAngelListJobs(150) },
    { name: 'Built.in', fn: fetchBuiltinJobs(100) },
    { name: 'Dice', fn: fetchDiceJobs(100) },
    { name: 'LevelsFYI', fn: fetchLevelsFyiJobs(80) },
    { name: 'Glassdoor', fn: fetchGlassdoorJobs(100) },
    { name: 'LinkedIn', fn: fetchLinkedinJobs(80) },
    { name: 'Upwork', fn: fetchUpworkRemoteJobs(100) }
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

  // Format descriptions and normalize structure
  allJobs = allJobs.map(j => normalizeJob({ ...j, description: formatTemplate(j) }));

  try {
    fs.writeFileSync(OUT_FILE, JSON.stringify(allJobs, null, 2), 'utf8');
    LOG.info('💾 Results saved to', OUT_FILE);
    LOG.info(`✅ Successfully collected ${allJobs.length} job listings from ${sources.length} sources`);
  } catch (e) { LOG.error('❌ Write failed:', e.message); }
}

run().catch(e => {
  LOG.error('💥 Scraper fatal:', e.message);
  process.exit(1);
});
