package com.edutech.jobportalsystem.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TranslationService {

    private static final Logger logger = LoggerFactory.getLogger(TranslationService.class);
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, String> translationCache = new ConcurrentHashMap<>();

    @Value("${translation.enabled:true}")
    private boolean translationEnabled;

    @Value("${libretranslate.enabled:true}")
    private boolean libreTranslateEnabled;

    @Value("${libretranslate.url:https://api.libretranslate.com/translate}")
    private String libreTranslateUrl;

    @Value("${mymemory.enabled:true}")
    private boolean myMemoryEnabled;

    @Value("${mymemory.url:https://api.mymemory.translated.net/get}")
    private String myMemoryUrl;

    @Value("${google.translate.api-key:}")
    private String googleApiKey;

    @Value("${google.translate.enabled:false}")
    private boolean googleTranslateEnabled;

    @Value("${aws.translate.enabled:false}")
    private boolean awsTranslateEnabled;

    @Value("${deepl.api-key:}")
    private String deeplApiKey;

    @Value("${deepl.url:https://api-free.deepl.com/v1/translate}")
    private String deeplUrl;

    @Value("${deepl.enabled:false}")
    private boolean deeplEnabled;

    public String translate(String text, String targetLanguage) {
        if (!translationEnabled || text == null || text.isBlank()) {
            return text;
        }

        String cacheKey = targetLanguage + "::" + text;
        if (translationCache.containsKey(cacheKey)) {
            return translationCache.get(cacheKey);
        }

        String result = text;

        // Try each service in fallback order
        result = tryLibreTranslate(text, targetLanguage, result);
        if (!result.equals(text)) {
            translationCache.put(cacheKey, result);
            return result;
        }

        result = tryMyMemory(text, targetLanguage, result);
        if (!result.equals(text)) {
            translationCache.put(cacheKey, result);
            return result;
        }

        result = tryGoogleTranslate(text, targetLanguage, result);
        if (!result.equals(text)) {
            translationCache.put(cacheKey, result);
            return result;
        }

        result = tryAwsTranslate(text, targetLanguage, result);
        if (!result.equals(text)) {
            translationCache.put(cacheKey, result);
            return result;
        }

        result = tryDeepL(text, targetLanguage, result);
        translationCache.put(cacheKey, result);
        return result;
    }

    public String translateToEnglish(String text) {
        return translate(text, "EN");
    }

    private String tryLibreTranslate(String text, String targetLanguage, String fallback) {
        if (!libreTranslateEnabled) return fallback;
        try {
            String payload = "{\"q\":\"" + escapeJson(text) + "\",\"source\":\"auto\",\"target\":\"" + targetLanguage.toLowerCase() + "\"}";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> request = new HttpEntity<>(payload, headers);
            String response = restTemplate.postForObject(libreTranslateUrl, request, String.class);
            JsonNode node = objectMapper.readTree(response);
            String translated = node.get("translatedText").asText();
            if (translated != null && !translated.isBlank()) {
                logger.debug("LibreTranslate: Translated {} chars", text.length());
                return translated;
            }
        } catch (Exception e) {
            logger.debug("LibreTranslate failed: {}", e.getMessage());
        }
        return fallback;
    }

    private String detectLanguage(String text) {
        if (text == null || text.length() < 12) return "en";
        
        String[] germanWords = {"und", "der", "die", "das", "ein", "eine", "mit", "für", "auf"};
        String[] spanishWords = {"y", "de", "la", "el", "los", "las", "para", "con", "por"};
        String[] frenchWords = {"et", "le", "les", "des", "pour", "dans", "sur", "une"};
        
        String lowerText = text.toLowerCase();
        int germanScore = 0, spanishScore = 0, frenchScore = 0;
        
        for (String word : germanWords) {
            germanScore += countWord(lowerText, word);
        }
        for (String word : spanishWords) {
            spanishScore += countWord(lowerText, word);
        }
        for (String word : frenchWords) {
            frenchScore += countWord(lowerText, word);
        }
        
        // Check for non-Latin scripts
        if (text.matches(".*[\\u0400-\\u04FF].*")) return "ru"; // Cyrillic
        if (text.matches(".*[\\u3040-\\u30FF].*")) return "ja"; // Japanese
        if (text.matches(".*[\\u4E00-\\u9FFF].*")) return "zh"; // Chinese
        
        if (germanScore > spanishScore && germanScore > frenchScore && germanScore > 0) return "de";
        if (spanishScore > germanScore && spanishScore > frenchScore && spanishScore > 0) return "es";
        if (frenchScore > germanScore && frenchScore > spanishScore && frenchScore > 0) return "fr";
        
        return "en";
    }
    
    private int countWord(String text, String word) {
        int count = 0;
        int index = 0;
        while ((index = text.indexOf(word, index)) != -1) {
            // Check word boundaries
            if ((index == 0 || !Character.isLetterOrDigit(text.charAt(index - 1))) &&
                (index + word.length() == text.length() || !Character.isLetterOrDigit(text.charAt(index + word.length())))) {
                count++;
            }
            index += word.length();
        }
        return count;
    }

    private String tryMyMemory(String text, String targetLanguage, String fallback) {
        if (!myMemoryEnabled) return fallback;
        try {
            String sourceLang = detectLanguage(text);
            String targetLang = targetLanguage.equals("EN") ? "en" : targetLanguage.toLowerCase();
            
            // Skip if already in target language
            if (sourceLang.equals(targetLang)) return fallback;
            
            String url = myMemoryUrl + "?q=" + java.net.URLEncoder.encode(text, "UTF-8") + "&langpair=" + sourceLang + "|" + targetLang;
            String response = restTemplate.getForObject(url, String.class);
            JsonNode node = objectMapper.readTree(response);
            String translated = node.get("responseData").get("translatedText").asText();
            if (translated != null && !translated.isBlank() && !translated.equals(text)) {
                logger.debug("MyMemory: Translated {} chars from {} to {}", text.length(), sourceLang, targetLang);
                return translated;
            }
        } catch (Exception e) {
            logger.debug("MyMemory failed: {}", e.getMessage());
        }
        return fallback;
    }

    private String tryGoogleTranslate(String text, String targetLanguage, String fallback) {
        if (!googleTranslateEnabled || googleApiKey == null || googleApiKey.startsWith("YOUR_")) {
            return fallback;
        }
        try {
            String payload = "{\"q\":\"" + escapeJson(text) + "\",\"target\":\"" + targetLanguage.toLowerCase() + "\",\"key\":\"" + googleApiKey + "\"}";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> request = new HttpEntity<>(payload, headers);
            String response = restTemplate.postForObject(
                "https://translation.googleapis.com/language/translate/v2",
                request,
                String.class
            );
            JsonNode node = objectMapper.readTree(response);
            String translated = node.get("data").get("translations").get(0).get("translatedText").asText();
            if (translated != null && !translated.isBlank()) {
                logger.debug("Google Translate: Translated {} chars", text.length());
                return translated;
            }
        } catch (Exception e) {
            logger.debug("Google Translate failed: {}", e.getMessage());
        }
        return fallback;
    }

    private String tryAwsTranslate(String text, String targetLanguage, String fallback) {
        if (!awsTranslateEnabled) {
            return fallback;
        }
        // AWS requires SDK setup - placeholder for future implementation
        logger.debug("AWS Translate: Skipping (requires AWS SDK)");
        return fallback;
    }

    private String tryDeepL(String text, String targetLanguage, String fallback) {
        if (!deeplEnabled || deeplApiKey == null || deeplApiKey.startsWith("YOUR_")) {
            return fallback;
        }
        try {
            String payload = "{\"text\":\"" + escapeJson(text) + "\",\"target_lang\":\"" + targetLanguage + "\",\"auth_key\":\"" + deeplApiKey + "\"}";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> request = new HttpEntity<>(payload, headers);
            String response = restTemplate.postForObject(deeplUrl, request, String.class);
            JsonNode node = objectMapper.readTree(response);
            String translated = node.get("translations").get(0).get("text").asText();
            if (translated != null && !translated.isBlank()) {
                logger.debug("DeepL: Translated {} chars", text.length());
                return translated;
            }
        } catch (Exception e) {
            logger.debug("DeepL failed: {}", e.getMessage());
        }
        return fallback;
    }

    private String escapeJson(String text) {
        return text
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r");
    }

    private String encodeValue(String value) {
        try {
            return java.net.URLEncoder.encode(value, "UTF-8");
        } catch (java.io.UnsupportedEncodingException e) {
            return value;
        }
    }

    public void clearCache() {
        translationCache.clear();
        logger.info("Translation cache cleared");
    }

    public boolean isConfigured() {
        return translationEnabled && (libreTranslateEnabled || myMemoryEnabled);
    }
}
