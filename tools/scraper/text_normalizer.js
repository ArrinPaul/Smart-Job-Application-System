const axios = require('axios');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function postWithRetry(url, payload, options, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.post(url, payload, options);
    } catch (error) {
      if (i === retries - 1) throw error;
      await delay(1000 * (i + 1));
    }
  }
}

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
    // keep original text when decoding fails
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

function normalizeMarkdownBlock(text) {
  if (!text) return '';
  let out = String(text)
    .replace(/\r\n/g, '\n')
    .replace(/\\n/g, '\n');

  out = out
    .replace(/([^\n])\s*(#{1,6})\s+/g, '$1\n\n$2 ')
    .replace(/([^\n])\s*(\*\*\w+\*\*:\s+)/g, '$1\n$2')
    .replace(/\n{3,}/g, '\n\n');

  return out.trim();
}

function firstSentences(text, count = 3) {
  if (!text) return '';
  const parts = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  return parts.slice(0, count).join('. ') + (parts.length ? '.' : '');
}

function normalizeSkills(requiredSkills) {
  if (!requiredSkills) return '';

  const values = Array.isArray(requiredSkills)
    ? requiredSkills
    : String(requiredSkills).split(/[,;|]/);

  return values
    .map((value) => normalizeText(value))
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
  const rawDescription = String(job.description || '').trim();
  const rawHasMarkdown = /(^|\n)\s*##\s+/m.test(rawDescription) || rawDescription.includes('**Position**');

  // If description is already formatted with markdown headers, preserve and normalize it
  if (rawHasMarkdown) {
    return normalizeMarkdownBlock(rawDescription);
  }

  const cleanedDescription = stripHtml(rawDescription);

  // Otherwise, build from scratch
  let out = '';
  out += `## About the Role\n\n`;
  out += (cleanedDescription || `${company} is hiring for this position.`) + '\n\n';

  out += `**Position**: ${title}\n`;
  out += `**Location**: ${location}\n`;
  out += `**Employment Type**: ${jobType}\n\n`;

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

function toCanonicalJob(job, fieldMap = {}) {
  return {
    title: job?.[fieldMap.title || 'title'],
    companyName: job?.[fieldMap.companyName || 'companyName'],
    location: job?.[fieldMap.location || 'location'],
    applicationLink: job?.[fieldMap.applicationLink || 'applicationLink'],
    jobType: job?.[fieldMap.jobType || 'jobType'],
    requiredSkills: job?.[fieldMap.requiredSkills || 'requiredSkills'],
    howToApply: job?.[fieldMap.howToApply || 'howToApply'],
    description: job?.[fieldMap.description || 'description'],
    source: job?.[fieldMap.source || 'source'],
    postedDate: job?.[fieldMap.postedDate || 'postedDate']
  };
}

async function normalizeJobRecord(job, options = {}) {
  const source = toCanonicalJob(job, options.fieldMap);
  const title = normalizeText(source.title || '');
  if (!title) return null;

  const description = stripHtml(source.description || '');
  const companyName = normalizeText(source.companyName || 'Unknown Company');
  const location = normalizeText(source.location || 'Remote');
  const jobType = normalizeText(source.jobType || 'Full-Time');
  const requiredSkills = normalizeSkills(source.requiredSkills);
  const howToApply = normalizeText(source.howToApply || '');

  const formattedDescription = formatTemplate({
    title,
    companyName,
    location,
    jobType,
    requiredSkills,
    description,
    applicationLink: normalizeText(source.applicationLink || '')
  });

  const normalized = {
    title,
    companyName: companyName || 'Unknown Company',
    location: location || 'Remote',
    applicationLink: normalizeText(source.applicationLink || ''),
    description: formattedDescription,
    requiredSkills,
    jobType: jobType || 'Full-Time'
  };

  if (howToApply) {
    normalized.howToApply = howToApply;
  }

  if (source.source) normalized.source = normalizeText(source.source) || source.source;
  if (source.postedDate) normalized.postedDate = source.postedDate;

  return normalized;
}

module.exports = {
  firstSentences,
  formatTemplate,
  normalizeJobRecord,
  normalizeSkills,
  normalizeText,
  removeEmoji,
  stripHtml
};
