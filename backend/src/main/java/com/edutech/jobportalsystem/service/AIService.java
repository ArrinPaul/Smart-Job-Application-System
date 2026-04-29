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
    private static final long COOLDOWN_MS = 3000; // 3 seconds (20 RPM)

    // Daily Limit Tracking (Requests per day)
    private final Map<String, Integer> dailyUsage = new ConcurrentHashMap<>();
    private LocalDate lastResetDate = LocalDate.now();
    
    // Limits (Free Tier safe)
    private static final int GROQ_DAILY_LIMIT = 100;
    private static final int HF_DAILY_LIMIT = 500;
    private static final int OPENROUTER_DAILY_LIMIT = 100;

    // Groq Config
    @Value("${app.ai.groq.api-key}")
    private String groqApiKey;
    @Value("${app.ai.groq.model}")
    private String groqModel;
    @Value("${app.ai.groq.url}")
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
        checkAndResetDailyLimits();

        // Try Groq (Primary - LPU Speed)
        String response = tryGroq(prompt);
        if (response != null) return response;

        // Try Hugging Face (Fallback 1)
        logger.warn("Groq failed or limit reached. Trying Hugging Face fallback...");
        response = tryHuggingFace(prompt);
        if (response != null) return response;

        // Try OpenRouter (Fallback 2)
        logger.warn("Hugging Face failed or limit reached. Trying OpenRouter fallback...");
        response = tryOpenRouter(prompt);
        if (response != null) return response;

        logger.error("All AI providers failed or limits exceeded for today.");
        return "AI career services are currently at capacity for today. Please try again tomorrow.";
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

    private String tryGroq(String prompt) {
        if (!isAllowed("groq", GROQ_DAILY_LIMIT)) return null;
        if (isKeyInvalid(groqApiKey)) return null;
        
        try {
            String res = callOpenAICompatibleAPI(groqUrl, groqApiKey, groqModel, prompt);
            if (res != null) incrementUsage("groq");
            return res;
        } catch (Exception e) {
            logger.error("Groq error: {}", e.getMessage());
            return null;
        }
    }

    private String tryOpenRouter(String prompt) {
        if (!isAllowed("openrouter", OPENROUTER_DAILY_LIMIT)) return null;
        if (isKeyInvalid(openRouterApiKey)) return null;
        
        try {
            String res = callOpenAICompatibleAPI(openRouterUrl, openRouterApiKey, openRouterModel, prompt);
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
            List<Map<String, Object>> response = restTemplate.postForObject(hfUrl, entity, List.class);

            if (response != null && !response.isEmpty()) {
                incrementUsage("huggingface");
                return (String) response.get(0).get("generated_text");
            }
            return null;
        } catch (Exception e) {
            logger.error("Hugging Face error: {}", e.getMessage());
            return null;
        }
    }

    private String callOpenAICompatibleAPI(String url, String apiKey, String model, String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "user", "content", prompt));
        body.put("messages", messages);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);

        if (response != null && response.containsKey("choices")) {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (!choices.isEmpty()) {
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                return (String) message.get("content");
            }
        }
        return null;
    }

    private boolean isKeyInvalid(String key) {
        return key == null || key.isBlank() || key.contains("YOUR_") || key.length() < 10;
    }
}
