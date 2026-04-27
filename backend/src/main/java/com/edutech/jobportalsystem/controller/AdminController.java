package com.edutech.jobportalsystem.controller;

// File: ./backend/src/main/java/com/edutech/jobportalsystem/controller/AdminController.java

import com.edutech.jobportalsystem.service.JobService;
import com.edutech.jobportalsystem.service.UserService;
import com.edutech.jobportalsystem.service.AdminDashboardService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private JobService jobService;

    @Autowired
    private AdminDashboardService adminDashboardService;

    @Autowired
    private com.edutech.jobportalsystem.service.JobIngestionService jobIngestionService;

    @Autowired
    private com.edutech.jobportalsystem.service.JobScraperScheduler jobScraperScheduler;

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        logger.info("Admin request: fetching all users");
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/jobs")
    public ResponseEntity<?> getAllJobs() {
        logger.info("Admin request: fetching all jobs");
        return ResponseEntity.ok(jobService.getAllJobs());
    }

    @GetMapping("/dashboard/summary")
    public ResponseEntity<?> getDashboardSummary() {
        logger.info("Admin request: fetching dashboard summary");
        return ResponseEntity.ok(adminDashboardService.getDashboardSummary());
    }

    @GetMapping("/system/status")
    public ResponseEntity<?> getSystemStatus() {
        logger.info("Admin request: fetching system status");
        return ResponseEntity.ok(adminDashboardService.getSystemStatus());
    }

    @org.springframework.web.bind.annotation.PostMapping("/ingest-real-jobs")
    public ResponseEntity<?> ingestRealJobs(@org.springframework.web.bind.annotation.RequestBody java.util.List<java.util.Map<String, String>> jobData) {
        logger.info("Admin request: ingesting {} real jobs", jobData.size());
        return ResponseEntity.ok(jobIngestionService.ingestJobs(jobData));
    }

    @org.springframework.web.bind.annotation.PostMapping("/scrape-now")
    public ResponseEntity<?> triggerScraping() {
        logger.warn("Admin request: manual job scraping triggered");
        jobScraperScheduler.scheduleDailyJobScraping();
        return ResponseEntity.ok(java.util.Map.of("message", "Scraping task started successfully"));
    }
}
