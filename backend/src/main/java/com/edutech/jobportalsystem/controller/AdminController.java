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

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@org.springframework.web.bind.annotation.PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @org.springframework.web.bind.annotation.PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@org.springframework.web.bind.annotation.PathVariable Long id, @org.springframework.web.bind.annotation.RequestBody com.edutech.jobportalsystem.entity.User user) {
        return ResponseEntity.ok(userService.updateUser(id, user));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@org.springframework.web.bind.annotation.PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(java.util.Map.of("message", "User deleted successfully"));
    }

    @org.springframework.web.bind.annotation.PutMapping("/users/{id}/password")
    public ResponseEntity<?> updatePassword(@org.springframework.web.bind.annotation.PathVariable Long id, @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, String> request) {
        String newPassword = request.get("password");
        if (newPassword == null || newPassword.isBlank()) {
            throw new com.edutech.jobportalsystem.exception.BadRequestException("Password is required");
        }
        userService.adminUpdatePassword(id, newPassword);
        return ResponseEntity.ok(java.util.Map.of("message", "Password updated successfully"));
    }

    @org.springframework.web.bind.annotation.PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateRole(@org.springframework.web.bind.annotation.PathVariable Long id, @org.springframework.web.bind.annotation.RequestBody java.util.Map<String, String> request) {
        String newRole = request.get("role");
        com.edutech.jobportalsystem.entity.User user = new com.edutech.jobportalsystem.entity.User();
        user.setRole(newRole);
        return ResponseEntity.ok(userService.updateUser(id, user));
    }

    @GetMapping("/jobs")
    public ResponseEntity<?> getAllJobs() {
        logger.info("Admin request: fetching all jobs");
        return ResponseEntity.ok(jobService.getAllJobs());
    }

    @org.springframework.web.bind.annotation.PutMapping("/jobs/{id}")
    public ResponseEntity<?> updateJob(@org.springframework.web.bind.annotation.PathVariable Long id, @org.springframework.web.bind.annotation.RequestBody com.edutech.jobportalsystem.entity.Job job) {
        return ResponseEntity.ok(jobService.adminUpdateJob(id, job));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/jobs/{id}")
    public ResponseEntity<?> deleteJob(@org.springframework.web.bind.annotation.PathVariable Long id) {
        jobService.adminDeleteJob(id);
        return ResponseEntity.ok(java.util.Map.of("message", "Job deleted successfully"));
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
