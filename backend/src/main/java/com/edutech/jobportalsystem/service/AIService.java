package com.edutech.jobportalsystem.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AIService {

    private static final Logger logger = LoggerFactory.getLogger(AIService.class);
    private final RestTemplate restTemplate = new RestTemplate();

    // Rate Limiting (RPM)
    private final Map<String, Long> lastRequestTime = new ConcurrentHashMap<>();
    private static final long COOLDOWN_MS = 5000; // 5 seconds (12 RPM) for absolute safety

    // Daily Limit Tracking (Requests per day)
    private final Map<String, Integer> dailyUsage = new ConcurrentHashMap<>();
    private LocalDate lastResetDate = LocalDate.now();
    
    // Limits (Aggressively safe for Free Tiers)
    private static final int GROQ_DAILY_LIMIT = 950;       // Groq Cloud Llama 70B limit is 1,000 RPD
    private static final int HF_DAILY_LIMIT = 1000;        // HF is adaptive, increased for better fallback
    private static final int OPENROUTER_DAILY_LIMIT = 48;  // OpenRouter free models limit is 50 RPD

    // Groq Config (Primary - Groq Cloud)
    @Value("${app.ai.groq.api-key:${GROQ_API_KEY:}}")
    private String groqApiKey;
    @Value("${app.ai.groq.model:${GROQ_MODEL:llama-3.3-70b-versatile}}")
    private String groqModel;
    @Value("${app.ai.groq.url:${GROQ_URL:https://api.groq.com/openai/v1/chat/completions}}")
    private String groqUrl;

    // Hugging Face Config
    @Value("${app.ai.huggingface.api-key}")
    private String hfApiKey;
    @Value("${app.ai.huggingface.url}")
    private String hfUrl;

    // OpenRouter Config
    @Value("${app.ai.openrouter.api-key}")
    private String openRouterApiKey;
    @Value("${app.ai.openrouter.model}")
    private String openRouterModel;
    @Value("${app.ai.openrouter.url}")
    private String openRouterUrl;

    public String generateContent(String prompt) {
        return generateContent(prompt, null);
    }

    public String generateContent(String prompt, String systemPrompt) {
        checkAndResetDailyLimits();

        // 1. Try Groq (Primary - Fast & Reliable)
        String response = tryGroq(prompt, systemPrompt);
        if (response != null) return response;

        // 2. Try Hugging Face (Fallback 1)
        logger.warn("Groq failed or limit reached. Trying Hugging Face fallback...");
        response = tryHuggingFace(prompt);
        if (response != null) return response;

        // 3. Try OpenRouter (Fallback 2)
        logger.warn("Hugging Face failed or limit reached. Trying OpenRouter fallback...");
        response = tryOpenRouter(prompt, systemPrompt);
        if (response != null) return response;

        logger.error("All AI providers failed or limits exceeded for today.");
        return "AI services are currently at capacity for today. Please try again tomorrow.";
    }

    /**
     * prioritized translation with failover.
     * Tries public mirrors first to save AI tokens, falls back to AI.
     */
    public String translateWithFailover(String text, String targetLang) {
        if (text == null || text.isBlank()) return text;

        // List of public mirrors (low reliability but free)
        String[] mirrors = {
            "https://libretranslate.de",
            "https://translate.terraprint.co",
            "https://translate.argosopentech.com"
        };

        for (String baseUrl : mirrors) {
            try {
                Map<String, String> payload = new HashMap<>();
                payload.put("q", text);
                payload.put("source", "auto");
                payload.put("target", targetLang != null ? targetLang : "en");
                payload.put("format", "text");

                Map<?, ?> response = restTemplate.postForObject(baseUrl + "/translate", payload, Map.class);
                Object translated = response != null ? response.get("translatedText") : null;
                if (translated instanceof String && !((String) translated).isBlank()) {
                    logger.info("Translation successful using mirror: {}", baseUrl);
                    return (String) translated;
                }
            } catch (Exception e) {
                logger.warn("Translation mirror {} failed: {}", baseUrl, e.getMessage());
            }
        }

        // Final fallback: Use our AI (reliable but consumes tokens)
        logger.info("All translation mirrors failed. Falling back to AI...");
        return translateText(text, targetLang);
    }

    /**
     * Specialized translation using AI
     */
    public String translateText(String text, String targetLang) {
        if (text == null || text.isBlank()) return text;
        
        String systemPrompt = "You are a professional translator. Translate the following text to " + targetLang + ". " +
                "Respond ONLY with the translated text. Do not include any explanations, greetings, or notes. " +
                "Maintain the original formatting, punctuation, and technical terms if appropriate.";
        
        return generateContent(text, systemPrompt);
    }

    private void checkAndResetDailyLimits() {
        if (!LocalDate.now().equals(lastResetDate)) {
            dailyUsage.clear();
            lastResetDate = LocalDate.now();
            logger.info("Daily AI usage limits have been reset.");
        }
    }

    private boolean isAllowed(String provider, int dailyLimit) {
        // RPM check
        long now = System.currentTimeMillis();
        long lastTime = lastRequestTime.getOrDefault(provider, 0L);
        if (now - lastTime < COOLDOWN_MS) return false;

        // Daily limit check
        int usage = dailyUsage.getOrDefault(provider, 0);
        if (usage >= dailyLimit) {
            logger.warn("Daily limit reached for {}: {}/{}", provider, usage, dailyLimit);
            return false;
        }

        return true;
    }

    private void incrementUsage(String provider) {
        dailyUsage.put(provider, dailyUsage.getOrDefault(provider, 0) + 1);
        lastRequestTime.put(provider, System.currentTimeMillis());
    }

    private String tryGroq(String prompt, String systemPrompt) {
        if (isKeyInvalid(groqApiKey)) return null;
        if (!isAllowed("groq", GROQ_DAILY_LIMIT)) return null;

        try {
            // Groq Cloud is OpenAI compatible
            String res = callOpenAICompatibleAPI(groqUrl, groqApiKey, groqModel, prompt, systemPrompt);
            if (res != null) {
                incrementUsage("groq");
                return res;
            }
            return null;
        } catch (Exception e) {
            logger.error("Groq API error: {}", e.getMessage());
            return null;
        }
    }

    private String tryOpenRouter(String prompt, String systemPrompt) {
        if (!isAllowed("openrouter", OPENROUTER_DAILY_LIMIT)) return null;
        if (isKeyInvalid(openRouterApiKey)) return null;
        
        try {
            String res = callOpenAICompatibleAPI(openRouterUrl, openRouterApiKey, openRouterModel, prompt, systemPrompt);
            if (res != null) incrementUsage("openrouter");
            return res;
        } catch (Exception e) {
            logger.error("OpenRouter error: {}", e.getMessage());
            return null;
        }
    }

    private String tryHuggingFace(String prompt) {
        if (!isAllowed("huggingface", HF_DAILY_LIMIT)) return null;
        if (isKeyInvalid(hfApiKey)) return null;
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(hfApiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("inputs", prompt);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            // HF Inference API usually returns a List of Maps
            Object rawResponse = restTemplate.postForObject(hfUrl, entity, Object.class);

            if (rawResponse instanceof List) {
                List<Map<String, Object>> responseList = (List<Map<String, Object>>) rawResponse;
                if (!responseList.isEmpty()) {
                    incrementUsage("huggingface");
                    Object genText = responseList.get(0).get("generated_text");
                    return genText != null ? genText.toString() : null;
                }
            } else if (rawResponse instanceof Map) {
                Map<String, Object> responseMap = (Map<String, Object>) rawResponse;
                if (responseMap.containsKey("generated_text")) {
                    incrementUsage("huggingface");
                    return responseMap.get("generated_text").toString();
                }
            }
            return null;
        } catch (Exception e) {
            logger.error("Hugging Face error: {}", e.getMessage());
            // Log full error for debugging if it's a 4xx/5xx
            return null;
        }
    }

    private String callOpenAICompatibleAPI(String url, String apiKey, String model, String prompt, String systemPrompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        List<Map<String, String>> messages = new ArrayList<>();
        
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            messages.add(Map.of("role", "system", "content", systemPrompt));
        }
        
        messages.add(Map.of("role", "user", "content", prompt));
        body.put("messages", messages);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        try {
            Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);

            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
        } catch (Exception e) {
            logger.error("API Error ({}): {}", url, e.getMessage());
        }
        return null;
    }

    private boolean isKeyInvalid(String key) {
        return key == null || key.isBlank() || key.startsWith("YOUR_") || key.length() < 8;
    }
}
