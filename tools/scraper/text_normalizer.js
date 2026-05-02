const axios = require('axios');

const TRANSLATE_URL = (process.env.LIBRETRANSLATE_URL || 'https://libretranslate.de').replace(/\/$/, '');
const TRANSLATE_KEY = process.env.LIBRETRANSLATE_KEY || '';
const TRANSLATE_ENABLED = process.env.TRANSLATE_DISABLED !== 'true' && Boolean(TRANSLATE_URL);
const TRANSLATE_MAX_CHARS = Number(process.env.TRANSLATE_MAX_CHARS || 3800);

const languageCache = new Map();
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
    .replace(/([^\n])\s*(\*\*[^*\n]+\*\*:)/g, '$1\n$2')
    .replace(/([^\n])\s*(Position|Location|Employment Type|Description|The Role|Key Skills|Responsibilities):/gi, '$1\n$2:')
    .replace(/([^\n])\s*(•\s+)/g, '$1\n$2')
    .replace(/\n{3,}/g, '\n\n');

  const lines = out.split('\n');
  const seen = new Set();
  const cleaned = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      cleaned.push('');
      continue;
    }

    const headingMatch = trimmed.match(/^#{1,6}\s+(.*)$/);
    if (headingMatch) {
      const heading = headingMatch[1].trim();
      const key = heading.toLowerCase();

      for (let idx = cleaned.length - 1; idx >= 0; idx -= 1) {
        const previous = cleaned[idx].trim();
        if (!previous) continue;
        if (previous.toLowerCase() === key) {
          cleaned.splice(idx, 1);
        }
        break;
      }

      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
    }

    cleaned.push(line);
  }

  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
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

async function detectLanguage(text) {
  if (!TRANSLATE_ENABLED) return 'en';

  const sample = normalizeText(text).slice(0, 1000).trim();
  if (!sample) return 'en';
  if (languageCache.has(sample)) return languageCache.get(sample);

  try {
    const payload = { q: sample };
    if (TRANSLATE_KEY) payload.api_key = TRANSLATE_KEY;
    const res = await postWithRetry(`${TRANSLATE_URL}/detect`, payload, { timeout: 15000 });
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
  for (let index = 0; index < text.length; index += TRANSLATE_MAX_CHARS) {
    chunks.push(text.slice(index, index + TRANSLATE_MAX_CHARS));
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
      const res = await postWithRetry(`${TRANSLATE_URL}/translate`, payload, { timeout: 20000 });
      translatedChunks.push(res.data?.translatedText || chunk);
    } catch {
      translatedChunks.push(chunk);
    }
  }

  return translatedChunks.join('');
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
  const rawTitle = normalizeText(source.title || '');
  if (!rawTitle) return null;

  const rawDescription = stripHtml(source.description || '');
  const rawCompany = normalizeText(source.companyName || 'Unknown Company');
  const rawLocation = normalizeText(source.location || 'Remote');
  const rawJobType = normalizeText(source.jobType || 'Full-Time');
  const rawSkills = normalizeSkills(source.requiredSkills);
  const rawHowToApply = normalizeText(source.howToApply || '');

  const sample = [rawTitle, rawDescription, rawSkills, rawHowToApply].filter(Boolean).join(' ');
  const language = await detectLanguage(sample);

  let title = rawTitle;
  let companyName = rawCompany;
  let location = rawLocation;
  let jobType = rawJobType;
  let description = rawDescription;
  let requiredSkills = rawSkills;
  let howToApply = rawHowToApply;

  if (language && language.toLowerCase() !== 'en') {
    title = normalizeText(await translateText(rawTitle, language));
    companyName = normalizeText(await translateText(rawCompany, language)) || rawCompany;
    location = normalizeText(await translateText(rawLocation, language)) || rawLocation;
    jobType = normalizeText(await translateText(rawJobType, language)) || rawJobType;
    description = normalizeText(await translateText(rawDescription, language));
    requiredSkills = normalizeText(await translateText(rawSkills, language)) || rawSkills;
    howToApply = normalizeText(await translateText(rawHowToApply, language)) || rawHowToApply;

    const translationFailed = title === rawTitle && description === rawDescription;
    if (options.strictEnglish !== false && translationFailed) {
      return null;
    }
  }

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
  detectLanguage,
  firstSentences,
  formatTemplate,
  normalizeJobRecord,
  normalizeSkills,
  normalizeText,
  removeEmoji,
  stripHtml,
  translateText
};