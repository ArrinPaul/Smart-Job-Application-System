package com.edutech.jobportalsystem.controller;

import com.edutech.jobportalsystem.service.JobIngestionService;
import com.edutech.jobportalsystem.service.JobScraperScheduler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/public")
public class PublicJobController {

    private static final Logger logger = LoggerFactory.getLogger(PublicJobController.class);

    @Autowired
    private JobIngestionService jobIngestionService;

    @Autowired
    private JobScraperScheduler jobScraperScheduler;

    @Autowired
    private com.edutech.jobportalsystem.service.AIService aiService;

    @GetMapping("/portal-stats")
    public ResponseEntity<?> getPortalStats() {
        logger.info("Public request: fetching portal stats");
        return ResponseEntity.ok(jobService.getPublicPortalStats());
    }

    @PostMapping("/translate")
    public ResponseEntity<?> translate(@RequestBody Map<String, String> request) {
        String text = request.get("q");
        String target = request.getOrDefault("target", "English");
        
        logger.info("Public request: translating text to {}", target);
        String translated = aiService.translateWithFailover(text, target);
        
        // Return format compatible with LibreTranslate to avoid frontend changes
        return ResponseEntity.ok(Map.of(
            "translatedText", translated,
            "detectedLanguage", Map.of("language", "auto", "confidence", 1.0)
        ));
    }

    @PostMapping("/ingest-real-jobs")
    public ResponseEntity<?> ingestRealJobs(@RequestBody List<Map<String, String>> jobData) {
        logger.info("Public ingestion request: ingesting {} jobs", jobData.size());
        return ResponseEntity.ok(jobIngestionService.ingestJobs(jobData));
    }

    @PostMapping("/trigger-scrape")
    public ResponseEntity<?> triggerScraping() {
        logger.info("Public request: manual job scraping triggered");
        jobScraperScheduler.scheduleDailyJobScraping();
        return ResponseEntity.ok(Map.of("message", "Scraping task started successfully"));
    }
}
