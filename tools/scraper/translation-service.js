const axios = require('axios');

const translationCache = new Map();

// Simple language detection based on character patterns and word hints
function detectLanguage(text) {
  if (!text || text.length < 12) return 'en';
  
  const german_words = ['und', 'der', 'die', 'das', 'ein', 'eine', 'mit', 'für', 'auf'];
  const spanish_words = ['y', 'de', 'la', 'el', 'los', 'las', 'para', 'con', 'por'];
  const french_words = ['et', 'le', 'les', 'des', 'pour', 'dans', 'sur', 'une'];
  
  const lowerText = text.toLowerCase();
  let germanScore = 0, spanishScore = 0, frenchScore = 0;
  
  german_words.forEach(w => germanScore += (lowerText.match(new RegExp(`\\b${w}\\b`, 'g')) || []).length);
  spanish_words.forEach(w => spanishScore += (lowerText.match(new RegExp(`\\b${w}\\b`, 'g')) || []).length);
  french_words.forEach(w => frenchScore += (lowerText.match(new RegExp(`\\b${w}\\b`, 'g')) || []).length);
  
  // Check for non-Latin characters
  if (/[\u0400-\u04FF]/.test(text)) return 'ru'; // Cyrillic for Russian
  if (/[\u3040-\u30FF]/.test(text)) return 'ja'; // Japanese
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh'; // Chinese
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko'; // Korean
  
  if (germanScore > spanishScore && germanScore > frenchScore && germanScore > 0) return 'de';
  if (spanishScore > germanScore && spanishScore > frenchScore && spanishScore > 0) return 'es';
  if (frenchScore > germanScore && frenchScore > spanishScore && frenchScore > 0) return 'fr';
  
  return 'en';
}

class TranslationService {
  constructor() {
    this.enabled = process.env.TRANSLATION_ENABLED !== 'false';
    this.libreTranslateUrl = process.env.LIBRETRANSLATE_URL || 'https://api.libretranslate.com/translate';
    this.myMemoryUrl = process.env.MYMEMORY_URL || 'https://api.mymemory.translated.net/get';
    this.googleApiKey = process.env.GOOGLE_TRANSLATE_API_KEY || '';
    this.deeplApiKey = process.env.DEEPL_API_KEY || '';
  }

  isConfigured() {
    return this.enabled;
  }

  async translateToEnglish(text) {
    return this.translate(text, 'EN');
  }

  async translate(text, targetLanguage = 'EN') {
    if (!this.enabled || !text) return text;

    const cacheKey = `${targetLanguage}::${text}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey);
    }

    let result = text;

    // Try each service in fallback order
    result = await this.tryLibreTranslate(text, targetLanguage, result);
    if (result !== text) {
      translationCache.set(cacheKey, result);
      return result;
    }

    result = await this.tryMyMemory(text, targetLanguage, result);
    if (result !== text) {
      translationCache.set(cacheKey, result);
      return result;
    }

    result = await this.tryGoogleTranslate(text, targetLanguage, result);
    if (result !== text) {
      translationCache.set(cacheKey, result);
      return result;
    }

    result = await this.tryDeepL(text, targetLanguage, result);
    translationCache.set(cacheKey, result);
    return result;
  }

  async tryLibreTranslate(text, targetLanguage, fallback) {
    if (process.env.LIBRETRANSLATE_ENABLED === 'false') return fallback;
    try {
      const payload = {
        q: text,
        source: 'auto',
        target: targetLanguage.toLowerCase(),
      };
      const response = await axios.post(this.libreTranslateUrl, payload, { timeout: 30000 });
      if (response.data && response.data.translatedText) {
        console.log(`LibreTranslate: Translated ${text.length} chars`);
        return response.data.translatedText;
      }
    } catch (error) {
      console.debug(`LibreTranslate failed: ${error.message}`);
    }
    return fallback;
  }

  async tryMyMemory(text, targetLanguage, fallback) {
    if (process.env.MYMEMORY_ENABLED === 'false') return fallback;
    try {
      const sourceLang = detectLanguage(text);
      const targetLang = targetLanguage === 'EN' ? 'en' : targetLanguage.toLowerCase();
      
      // Skip if already in target language
      if (sourceLang === targetLang) return fallback;
      
      const url = `${this.myMemoryUrl}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
      const response = await axios.get(url, { timeout: 30000 });
      if (response.data && response.data.responseData && response.data.responseData.translatedText && response.data.responseData.translatedText !== text) {
        console.log(`MyMemory: Translated ${text.length} chars`);
        return response.data.responseData.translatedText;
      }
    } catch (error) {
      console.debug(`MyMemory failed: ${error.message}`);
    }
    return fallback;
  }

  async tryGoogleTranslate(text, targetLanguage, fallback) {
    if (process.env.GOOGLE_TRANSLATE_ENABLED !== 'true' || !this.googleApiKey || this.googleApiKey.startsWith('YOUR_')) {
      return fallback;
    }
    try {
      const payload = {
        q: text,
        target: targetLanguage.toLowerCase(),
        key: this.googleApiKey,
      };
      const response = await axios.post('https://translation.googleapis.com/language/translate/v2', payload, { timeout: 30000 });
      if (response.data && response.data.data && response.data.data.translations && response.data.data.translations.length > 0) {
        console.log(`Google Translate: Translated ${text.length} chars`);
        return response.data.data.translations[0].translatedText;
      }
    } catch (error) {
      console.debug(`Google Translate failed: ${error.message}`);
    }
    return fallback;
  }

  async tryDeepL(text, targetLanguage, fallback) {
    if (process.env.DEEPL_ENABLED !== 'true' || !this.deeplApiKey || this.deeplApiKey.startsWith('YOUR_')) {
      return fallback;
    }
    try {
      const response = await axios.post(
        process.env.DEEPL_URL || 'https://api-free.deepl.com/v1/translate',
        {
          text,
          target_lang: targetLanguage,
          auth_key: this.deeplApiKey,
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      if (response.data && response.data.translations && response.data.translations.length > 0) {
        console.log(`DeepL: Translated ${text.length} chars`);
        return response.data.translations[0].text;
      }
    } catch (error) {
      console.debug(`DeepL failed: ${error.message}`);
    }
    return fallback;
  }

  clearCache() {
    translationCache.clear();
  }
}

module.exports = TranslationService;
