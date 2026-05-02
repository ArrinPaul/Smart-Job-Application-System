package com.edutech.jobportalsystem.service;

import com.edutech.jobportalsystem.entity.Job;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class TranslationService {

    private static final Logger logger = LoggerFactory.getLogger(TranslationService.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final boolean enabled;
    private final String baseUrl;
    private final String apiKey;
    private final String targetLang;
    private final int maxChars;

    @Autowired
    private AIService aiService;

    public TranslationService(ObjectMapper objectMapper,
                              @Value("${app.translate.enabled:true}") boolean enabled,
                              @Value("${app.translate.base-url:https://libretranslate.de}") String baseUrl,
                              @Value("${app.translate.api-key:}") String apiKey,
                              @Value("${app.translate.target:en}") String targetLang,
                              @Value("${app.translate.max-chars:4000}") int maxChars) {
        this.objectMapper = objectMapper;
        this.enabled = enabled;
        this.baseUrl = baseUrl == null ? "" : baseUrl.trim();
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.targetLang = (targetLang == null || targetLang.isBlank()) ? "en" : targetLang.trim();
        this.maxChars = Math.max(500, maxChars);
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    }

    public Job translateJob(Job job) {
        if (!enabled || job == null) {
            return job;
        }

        // Optimization: Only translate if text looks like it has non-English characters
        boolean titleNeedsTranslation = needsTranslation(job.getTitle());
        boolean descNeedsTranslation = needsTranslation(job.getDescription());

        if (!titleNeedsTranslation && !descNeedsTranslation) {
            return job;
        }

        Job copy = copyJob(job);
        if (titleNeedsTranslation) copy.setTitle(translateText(job.getTitle()));
        if (descNeedsTranslation) copy.setDescription(translateText(job.getDescription()));
        return copy;
    }

    public List<Job> translateJobs(List<Job> jobs) {
        if (!enabled || jobs == null) {
            return jobs;
        }

        List<Job> translated = new ArrayList<>(jobs.size());
        int translateCount = 0;
        int maxRealTimeTranslations = 5; // Absolute limit for real-time list translation to avoid timeouts

        for (Job job : jobs) {
            if (translateCount < maxRealTimeTranslations && needsTranslation(job.getTitle())) {
                translated.add(translateJob(job));
                translateCount++;
            } else {
                translated.add(job);
            }
        }
        return translated;
    }

    private boolean needsTranslation(String text) {
        if (text == null || text.isBlank()) return false;
        // Simple regex: contains characters outside the basic Latin range (0-127)
        // This effectively detects most non-English text (German, Spanish, etc.)
        return text.chars().anyMatch(c -> c > 127);
    }

    private String translateText(String text) {
        if (text == null || text.isBlank()) {
            return text;
        }

        // 1) Try LibreTranslate when configured (default: libretranslate.de)
        String libre = translateViaLibreTranslate(text);
        if (libre != null && !libre.isBlank() && !libre.equals(text)) {
            return libre;
        }

        // 2) Fallback to AI Service (optional)
        try {
            if (aiService != null) {
                logger.info("Using AI fallback for translation...");
                String prompt = "Translate the following Job Title/Description into English. Return ONLY the translated text, no intro or outro:\n\n" + text;
                String aiRes = aiService.generateContent(prompt);
                if (aiRes != null && !aiRes.isBlank() && !aiRes.contains("at capacity")) {
                    return aiRes.trim();
                }
            }
        } catch (Exception ex) {
            logger.warn("AI translation failed: {}", ex.getMessage());
        }

        return text;
    }

    private String translateViaLibreTranslate(String text) {
        if (baseUrl.isEmpty()) {
            return null;
        }

        // Split long descriptions instead of truncating.
        List<String> chunks = splitText(text, maxChars);
        if (chunks.isEmpty()) {
            return null;
        }

        StringBuilder out = new StringBuilder();
        for (int i = 0; i < chunks.size(); i++) {
            String chunk = chunks.get(i);
            String translated = translateChunk(chunk, chunk);
            if (translated == null || translated.isBlank()) {
                translated = chunk;
            }
            if (i > 0) {
                out.append("\n");
            }
            out.append(translated.trim());
        }

        String result = out.toString().trim();
        return result.isBlank() ? null : result;
    }

    private String translateChunk(String chunk, String fallback) {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("q", chunk);
            payload.put("source", "auto");
            payload.put("target", targetLang);
            payload.put("format", "text");
            if (!apiKey.isEmpty()) {
                payload.put("api_key", apiKey);
            }

            String body = objectMapper.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/translate"))
                .timeout(Duration.ofSeconds(20))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                logger.warn("Translation request failed with status {}.", response.statusCode());
                return fallback;
            }

            JsonNode node = objectMapper.readTree(response.body());
            String translated = node.path("translatedText").asText();
            if (translated == null || translated.isBlank()) {
                return fallback;
            }

            return translated.trim();
        } catch (Exception ex) {
            logger.warn("Translation failed: {}", ex.getMessage());
            return fallback;
        }
    }

    private List<String> splitText(String text, int limit) {
        if (text.length() <= limit) {
            return List.of(text);
        }

        List<String> chunks = new ArrayList<>();
        String[] lines = text.split("\\n");
        StringBuilder current = new StringBuilder();

        for (String line : lines) {
            if (line.length() > limit) {
                flushCurrent(current, chunks);
                splitLongLine(line, limit, chunks);
                continue;
            }

            if (current.length() + line.length() + 1 > limit) {
                flushCurrent(current, chunks);
            }

            if (current.length() > 0) {
                current.append('\n');
            }
            current.append(line);
        }

        flushCurrent(current, chunks);
        return chunks;
    }

    private void splitLongLine(String line, int limit, List<String> chunks) {
        int start = 0;
        while (start < line.length()) {
            int end = Math.min(start + limit, line.length());
            int cut = line.lastIndexOf(' ', end);
            if (cut <= start + Math.max(60, limit / 2)) {
                cut = end;
            }
            String piece = line.substring(start, cut).trim();
            if (!piece.isEmpty()) {
                chunks.add(piece);
            }
            start = cut;
        }
    }

    private void flushCurrent(StringBuilder current, List<String> chunks) {
        if (current.length() > 0) {
            chunks.add(current.toString());
            current.setLength(0);
        }
    }

    private Job copyJob(Job job) {
        Job copy = new Job();
        copy.setId(job.getId());
        copy.setTitle(job.getTitle());
        copy.setDescription(job.getDescription());
        copy.setLocation(job.getLocation());
        copy.setJobType(job.getJobType());
        copy.setWorkType(job.getWorkType());
        copy.setExperienceRequired(job.getExperienceRequired());
        copy.setRequiredSkills(job.getRequiredSkills());
        copy.setEducationRequired(job.getEducationRequired());
        copy.setSalaryMin(job.getSalaryMin());
        copy.setSalaryMax(job.getSalaryMax());
        copy.setSalaryCurrency(job.getSalaryCurrency());
        copy.setIsActive(job.getIsActive());
        copy.setApplicationLink(job.getApplicationLink());
        copy.setCompanyName(job.getCompanyName());
        copy.setHowToApply(job.getHowToApply());
        copy.setSlug(job.getSlug());
        copy.setPostedBy(job.getPostedBy());
        copy.setCreatedAt(job.getCreatedAt());
        return copy;
    }
}
