package com.edutech.jobportalsystem.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Component
public class JobScraperScheduler {

    private static final Logger logger = LoggerFactory.getLogger(JobScraperScheduler.class);

    private static final int DETECT_SAMPLE_CHARS = 1000;
    private static final int TRANSLATE_MAX_CHARS = 3800;
    private static final Pattern EMOJI_PATTERN = Pattern.compile("[\\x{1F300}-\\x{1FAFF}\\x{1F1E6}-\\x{1F1FF}\\x{2600}-\\x{27BF}]");

    @Value("${app.translate.url:https://libretranslate.de}")
    private String translateUrl;

    @Value("${app.translate.key:}")
    private String translateKey;

    @Autowired
    private JobIngestionService jobIngestionService;

    private final RestTemplate restTemplate = new RestTemplate();

    @Scheduled(cron = "0 0 0 * * *")
    public void scheduleDailyJobScraping() {
        logger.info("Starting SUPREME REAL-WORLD job scraping task (Target: 500+)...");
        List<Map<String, String>> allJobs = new ArrayList<>();
        
        try {
            // Source 1: Remotive (Increased limit)
            allJobs.addAll(fetchRemotiveJobs(600));

            // Source 2: Arbeitnow (Increased pagination)
            allJobs.addAll(fetchArbeitnowJobs(5, 500));

            // Source 3: We Work Remotely
            allJobs.addAll(scrapeWeWorkRemotely(300));
            
            // Source 4: Hacker News (Deep Pagination)
            allJobs.addAll(scrapeHackerNewsJobs(10));
            
            // Source 5: Remote.co
            allJobs.addAll(scrapeRemoteCo(200));

            if (allJobs.isEmpty()) {
                logger.error("Scrapers failed to find data.");
            } else {
                List<Map<String, String>> normalizedJobs = normalizeJobs(allJobs);
                if (normalizedJobs.isEmpty()) {
                    logger.error("Normalization removed all scraped jobs.");
                } else {
                    jobIngestionService.ingestJobs(normalizedJobs);
                }
                jobIngestionService.runStaleJobCleanupAsync();
                logger.info("Supreme Ingestion Success! {} REAL roles with links added.", allJobs.size());
            }
        } catch (Exception e) {
            logger.error("Scraping error", e);
        }
    }

    private List<Map<String, String>> fetchRemotiveJobs(int limit) {
        List<Map<String, String>> jobs = new ArrayList<>();
        try {
            String url = "https://remotive.com/api/remote-jobs";
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.containsKey("jobs")) {
                List<Map<String, Object>> jobsList = (List<Map<String, Object>>) response.get("jobs");
                for (Map<String, Object> jobData : jobsList) {
                    // Preserve HTML but sanitize slightly
                    String rawDesc = (String) jobData.get("description");
                    
                    List<String> tags = (List<String>) jobData.get("tags");
                    String skills = (tags != null) ? String.join(", ", tags) : "IT, Software";

                    jobs.add(Map.of(
                        "title", (String) jobData.get("title"),
                        "companyName", (String) jobData.get("company_name"),
                        "location", jobData.get("candidate_required_location") != null ? (String) jobData.get("candidate_required_location") : "Remote",
                        "applicationLink", (String) jobData.get("url"),
                        "jobType", (String) jobData.get("job_type") != null ? (String) jobData.get("job_type") : "Full-time",
                        "requiredSkills", skills,
                        "howToApply", "Apply directly on Remotive via the link below.",
                        "description", rawDesc // Full HTML description
                    ));
                    if (jobs.size() >= limit) break;
                }
            }
        } catch (Exception e) { logger.error("Remotive failed: {}", e.getMessage()); }
        return jobs;
    }

    private List<Map<String, String>> fetchArbeitnowJobs(int pages, int limit) {
        List<Map<String, String>> jobs = new ArrayList<>();
        try {
            for (int p = 1; p <= pages; p++) {
                String url = "https://www.arbeitnow.com/api/job-board-api?page=" + p;
                Map<String, Object> response = restTemplate.getForObject(url, Map.class);
                if (response != null && response.containsKey("data")) {
                    List<Map<String, Object>> jobsList = (List<Map<String, Object>>) response.get("data");
                    for (Map<String, Object> jobData : jobsList) {
                        String companyName = (String) jobData.get("company_name");
                        List<String> tags = (List<String>) jobData.get("tags");
                        String skills = (tags != null) ? String.join(", ", tags) : "Technology";
                        String rawDesc = (String) jobData.get("description");
                        
                        jobs.add(Map.of(
                            "title", (String) jobData.get("title"),
                            "companyName", companyName != null ? companyName : "Company",
                            "location", (String) jobData.get("location"),
                            "applicationLink", (String) jobData.get("url"),
                            "requiredSkills", skills,
                            "howToApply", "Apply via the official Arbeitnow portal.",
                            "description", rawDesc // Full HTML description
                        ));
                        if (jobs.size() >= limit) break;
                    }
                }
                Thread.sleep(500); 
                if (jobs.size() >= limit) break;
            }
        } catch (Exception e) { logger.error("Arbeitnow failed: {}", e.getMessage()); }
        return jobs;
    }

    private List<Map<String, String>> scrapeWeWorkRemotely(int limit) {
        List<Map<String, String>> jobs = new ArrayList<>();
        try {
            Document doc = Jsoup.connect("https://weworkremotely.com/remote-jobs").timeout(20000).get();
            Elements jobLinks = doc.select("section.jobs article ul li a[href^=/remote-jobs/]");
            for (Element a : jobLinks) {
                if (a.selectFirst("span.title") == null) continue;
                String detailUrl = a.absUrl("href");
                String company = a.selectFirst("span.company").text();
                String title = a.selectFirst("span.title").text();
                String region = a.selectFirst("span.region") != null ? a.selectFirst("span.region").text() : "Remote";
                
                // Second hop to get full description
                String fullDesc = "<h3>About the Role</h3><p>Full details available on the application portal.</p>";
                try {
                    Document detailDoc = Jsoup.connect(detailUrl).timeout(10000).get();
                    Element descElement = detailDoc.selectFirst("#job-details");
                    if (descElement != null) {
                        fullDesc = descElement.html();
                    }
                } catch (Exception e) { logger.warn("Failed to fetch WWR detail: {}", detailUrl); }

                jobs.add(Map.of(
                    "title", title,
                    "companyName", company,
                    "location", region,
                    "applicationLink", detailUrl,
                    "howToApply", "Click apply on the WWR detail page.",
                    "description", fullDesc
                ));
                if (jobs.size() >= limit) break;
            }
        } catch (Exception e) { logger.error("WWR failed: {}", e.getMessage()); }
        return jobs;
    }

    private List<Map<String, String>> scrapeRemoteCo(int limit) {
        List<Map<String, String>> jobs = new ArrayList<>();
        try {
            Document doc = Jsoup.connect("https://remote.co/remote-jobs/it")
                    .userAgent("Mozilla/5.0")
                    .timeout(20000).get();
            Elements cards = doc.select("a.job_listing");
            for (Element card : cards) {
                String detailUrl = card.absUrl("href");
                Element titleElement = card.selectFirst("h3");
                Element companyElement = card.selectFirst("div.company_name");
                
                if (titleElement != null) {
                    String company = companyElement != null ? companyElement.text() : "Remote.co Employer";
                    
                    // Second hop
                    String fullDesc = "<h3>Job Description</h3><p>Please view details on Remote.co</p>";
                    try {
                        Document detailDoc = Jsoup.connect(detailUrl).timeout(10000).get();
                        Element descElement = detailDoc.selectFirst(".job_description");
                        if (descElement != null) {
                            fullDesc = descElement.html();
                        }
                    } catch (Exception e) { logger.warn("Failed Remote.co detail: {}", detailUrl); }

                    jobs.add(Map.of(
                        "title", titleElement.text(),
                        "companyName", company,
                        "location", "Remote",
                        "applicationLink", detailUrl,
                        "howToApply", "Apply on Remote.co portal.",
                        "description", fullDesc
                    ));
                }
                if (jobs.size() >= limit) break;
            }
        } catch (Exception e) { logger.error("Remote.co failed: {}", e.getMessage()); }
        return jobs;
    }

    private List<Map<String, String>> scrapeHackerNewsJobs(int maxPages) {
        List<Map<String, String>> jobs = new ArrayList<>();
        try {
            for (int i = 1; i <= maxPages; i++) {
                Document doc = Jsoup.connect("https://news.ycombinator.com/jobs" + (i > 1 ? "?p=" + i : "")).timeout(10000).get();
                Elements rows = doc.select("tr.athing");
                if (rows.isEmpty()) break;
                for (Element row : rows) {
                    Element a = row.selectFirst("td.title a.storylink");
                    if (a != null) {
                        String fullTitle = a.text();
                        String company = "HN Startup";
                        if (fullTitle.contains(" is hiring ")) {
                            company = fullTitle.split(" is hiring ")[0];
                        } else if (fullTitle.contains("|")) {
                            company = fullTitle.split("\\|")[0].trim();
                        }
                        
                        jobs.add(Map.of(
                            "title", fullTitle,
                            "companyName", company,
                            "location", "Remote Friendly / Global",
                            "applicationLink", a.absUrl("href"),
                            "requiredSkills", "Startups, Engineering",
                            "howToApply", "Check the YC/HN link for specific application instructions (usually email or a portal).",
                            "description", "### STARTUP ROLE (HN/YC)\n" + fullTitle + "\n\n" +
                                           "### HIGHLIGHTS\n" +
                                           "• **Company:** " + company + "\n" +
                                           "• **Source:** Y Combinator / Hacker News\n" +
                                           "• **Ecosystem:** High-growth tech startup"
                        ));
                    }
                }
                Thread.sleep(1500);
                if (jobs.size() >= 200) break;
            }
        } catch (Exception e) { logger.error("HN failed: {}", e.getMessage()); }
        return jobs;
    }

    private List<Map<String, String>> normalizeJobs(List<Map<String, String>> jobs) {
        List<Map<String, String>> normalized = new ArrayList<>();
        for (Map<String, String> job : jobs) {
            Map<String, String> cleaned = normalizeJobPayload(job);
            if (cleaned != null) {
                normalized.add(cleaned);
            }
        }
        return normalized;
    }

    private Map<String, String> normalizeJobPayload(Map<String, String> job) {
        if (job == null) return null;

        String originalTitle = normalizeText(job.get("title"));
        String title = originalTitle;
        if (title == null || title.isBlank()) return null;

        String companyName = normalizeText(job.getOrDefault("companyName", "Unknown Company"));
        String location = normalizeText(job.getOrDefault("location", "Remote"));
        String jobType = normalizeText(job.getOrDefault("jobType", "Full-Time"));
        String applicationLink = normalizeText(job.get("applicationLink"));
        String requiredSkills = normalizeText(job.get("requiredSkills"));
        String howToApply = normalizeText(job.get("howToApply"));
        String description = normalizeText(stripHtml(job.get("description")));

        String lang = detectLanguage(title + " " + description);
        if (!"en".equalsIgnoreCase(lang)) {
            title = translateText(title, lang);
            companyName = translateText(companyName, lang);
            location = translateText(location, lang);
            jobType = translateText(jobType, lang);
            description = translateText(description, lang);
            requiredSkills = translateText(requiredSkills, lang);
            howToApply = translateText(howToApply, lang);

            if (title == null || title.isBlank() || title.equalsIgnoreCase(originalTitle)) {
                logger.warn("Skipping non-English job because translation did not produce usable English text: {}", originalTitle);
                return null;
            }
        }

        String formattedDescription = formatTemplate(title, companyName, location, jobType, description, requiredSkills, applicationLink);

        Map<String, String> out = new HashMap<>();
        out.put("title", title);
        out.put("companyName", companyName);
        out.put("location", location);
        if (applicationLink != null && !applicationLink.isBlank()) out.put("applicationLink", applicationLink);
        if (jobType != null && !jobType.isBlank()) out.put("jobType", jobType);
        if (requiredSkills != null && !requiredSkills.isBlank()) out.put("requiredSkills", requiredSkills);
        if (howToApply != null && !howToApply.isBlank()) out.put("howToApply", howToApply);
        out.put("description", formattedDescription);
        return out;
    }

    private String stripHtml(String input) {
        if (input == null) return "";
        return Jsoup.parse(input).text();
    }

    private String normalizeText(String input) {
        if (input == null) return "";
        String text = fixMojibake(input);

        text = text.replace("\u00A0", " ");
        text = text.replaceAll("[\u2013\u2014]", "-");
        text = text.replaceAll("[\u2018\u2019\u201B]", "'");
        text = text.replaceAll("[\u201C\u201D\u201F]", "\"");
        text = text.replace("\u2026", "...");
        text = text.replace("\u200D", "").replace("\uFE0F", "");
        text = EMOJI_PATTERN.matcher(text).replaceAll("");
        return text.replaceAll("\\s+", " ").trim();
    }

    private String fixMojibake(String input) {
        if (input == null) return "";
        String text = input;
        if (!text.matches(".*[\u00C2\u00C3\u00E2\u00F0\uFFFD].*")) {
            return text;
        }

        try {
            String decoded = new String(text.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
            if (countReplacement(decoded) <= countReplacement(text)) {
                return decoded;
            }
        } catch (Exception e) {
            // keep original
        }

        return text;
    }

    private int countReplacement(String text) {
        if (text == null) return 0;
        int count = 0;
        for (int i = 0; i < text.length(); i++) {
            if (text.charAt(i) == '\uFFFD') count++;
        }
        return count;
    }

    private boolean translationEnabled() {
        return translateUrl != null && !translateUrl.isBlank();
    }

    private String detectLanguage(String text) {
        if (!translationEnabled()) return "en";
        String sample = normalizeText(text);
        if (sample.length() > DETECT_SAMPLE_CHARS) {
            sample = sample.substring(0, DETECT_SAMPLE_CHARS);
        }
        if (sample.isBlank()) return "en";

        try {
            Map<String, String> payload = new HashMap<>();
            payload.put("q", sample);
            if (translateKey != null && !translateKey.isBlank()) {
                payload.put("api_key", translateKey);
            }
            List<?> response = restTemplate.postForObject(translateUrl + "/detect", payload, List.class);
            if (response != null && !response.isEmpty() && response.get(0) instanceof Map) {
                Map<?, ?> first = (Map<?, ?>) response.get(0);
                Object lang = first.get("language");
                if (lang instanceof String) {
                    String langStr = (String) lang;
                    if (!langStr.isBlank()) {
                        return langStr;
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Language detect failed: {}", e.getMessage());
        }

        return "en";
    }

    private String translateText(String text, String lang) {
        if (!translationEnabled()) return text;
        if (text == null || text.isBlank()) return text;
        if ("en".equalsIgnoreCase(lang)) return text;

        StringBuilder builder = new StringBuilder();
        int start = 0;
        while (start < text.length()) {
            int end = Math.min(text.length(), start + TRANSLATE_MAX_CHARS);
            String chunk = text.substring(start, end);
            builder.append(translateChunk(chunk, lang));
            start = end;
        }

        return builder.toString();
    }

    private String translateChunk(String chunk, String lang) {
        try {
            Map<String, String> payload = new HashMap<>();
            payload.put("q", chunk);
            payload.put("source", lang == null || lang.isBlank() ? "auto" : lang);
            payload.put("target", "en");
            payload.put("format", "text");
            if (translateKey != null && !translateKey.isBlank()) {
                payload.put("api_key", translateKey);
            }
            Map<?, ?> response = restTemplate.postForObject(translateUrl + "/translate", payload, Map.class);
            Object translated = response != null ? response.get("translatedText") : null;
            if (translated instanceof String) {
                return (String) translated;
            }
            return chunk;
        } catch (Exception e) {
            logger.warn("Translation failed: {}", e.getMessage());
            return chunk;
        }
    }

    private String formatTemplate(String title, String company, String location, String jobType, String description, String skills, String applicationLink) {
        String safeCompany = (company == null || company.isBlank()) ? "Company" : company.trim();
        String safeTitle = (title == null || title.isBlank()) ? "Role" : title.trim();
        String safeLocation = (location == null || location.isBlank()) ? "Remote" : location.trim();
        String safeJobType = (jobType == null || jobType.isBlank()) ? "Full-Time" : jobType.trim();

        String cleanedDescription = description == null ? "" : description.trim();
        
        // If description is already formatted with markdown headers, return it as-is
        if (cleanedDescription.contains("## ") || cleanedDescription.contains("**Position**")) {
            return cleanedDescription;
        }

        // Otherwise, build from scratch
        StringBuilder out = new StringBuilder();
        out.append("## About the Role\n\n");
        out.append(cleanedDescription.isBlank() ? safeCompany + " is hiring for this position." : cleanedDescription).append("\n\n");

        out.append("**Position**: ").append(safeTitle).append("\n");
        out.append("**Location**: ").append(safeLocation).append("\n");
        out.append("**Employment Type**: ").append(safeJobType).append("\n\n");

        String normalizedSkills = normalizeSkills(skills);
        if (!normalizedSkills.isBlank()) {
            out.append("## Key Skills\n\n");
            for (String skill : normalizedSkills.split(", ")) {
                out.append("• ").append(skill).append("\n");
            }
            out.append("\n");
        }

        if (applicationLink != null && !applicationLink.isBlank()) {
            out.append("**[Apply Now](").append(applicationLink).append(")**");
        }

        return out.toString().trim();
    }

    private String normalizeSkills(String requiredSkills) {
        if (requiredSkills == null || requiredSkills.isBlank()) return "";
        String[] parts = requiredSkills.split("[,;|]");
        List<String> cleaned = new ArrayList<>();
        for (String part : parts) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) cleaned.add(trimmed);
            if (cleaned.size() >= 10) break;
        }
        return String.join(", ", cleaned);
    }

    private String firstSentences(String text, int count) {
        if (text == null || text.isBlank()) return "";
        String[] parts = text.split("[.!?]+");
        StringBuilder out = new StringBuilder();
        int added = 0;
        for (String part : parts) {
            String trimmed = part.trim();
            if (trimmed.isEmpty()) continue;
            if (added > 0) out.append(". ");
            out.append(trimmed);
            added++;
            if (added >= count) break;
        }
        if (out.length() > 0) out.append('.');
        return out.toString();
    }
}
