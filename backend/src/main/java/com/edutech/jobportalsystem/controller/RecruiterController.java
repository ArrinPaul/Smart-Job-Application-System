package com.edutech.jobportalsystem.controller;

// File: ./backend/src/main/java/com/edutech/jobportalsystem/controller/RecruiterController.java

import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.service.ApplicationService;
import com.edutech.jobportalsystem.service.JobService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/recruiter")
public class RecruiterController {

    private static final Logger logger = LoggerFactory.getLogger(RecruiterController.class);

    @Autowired
    private JobService jobService;

    @Autowired
    private ApplicationService applicationService;

    @PostMapping("/job")
    public ResponseEntity<?> createJob(@RequestBody Job job) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Recruiter {} creating job: {}", username, job.getTitle());
        return ResponseEntity.ok(jobService.createJob(job, username));
    }

    @PutMapping("/job/{jobId}")
    public ResponseEntity<?> updateJob(@PathVariable Long jobId, @RequestBody Job updatedJob) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Recruiter {} updating job ID: {}", username, jobId);
        return ResponseEntity.ok(jobService.updateJob(jobId, updatedJob, username));
    }

    @DeleteMapping("/job/{jobId}")
    public ResponseEntity<?> deleteJob(@PathVariable Long jobId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Recruiter {} deleting job ID: {}", username, jobId);
        jobService.deleteJob(jobId, username);
        return ResponseEntity.ok(Map.of("message", "Job deleted successfully"));
    }

    @GetMapping("/applications")
    public ResponseEntity<?> getRecruiterApplications() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Recruiter {} fetching applications", username);
        return ResponseEntity.ok(applicationService.getApplicationsForRecruiter(username));
    }

    @PutMapping("/application/update/{applicationId}")
    public ResponseEntity<?> updateApplicationStatus(@PathVariable Long applicationId, @RequestParam String status) {
        logger.info("Updating application {} to status: {}", applicationId, status);
        return ResponseEntity.ok(applicationService.updateApplicationStatus(applicationId, status));
    }
}
