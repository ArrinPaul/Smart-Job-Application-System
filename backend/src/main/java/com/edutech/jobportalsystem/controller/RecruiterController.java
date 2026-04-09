package com.edutech.jobportalsystem.controller;

// File: ./src/main/java/com/edutech/jobportalsystem/controller/RecruiterController.java

import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.service.ApplicationService;
import com.edutech.jobportalsystem.service.JobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/recruiter")
public class RecruiterController {

    @Autowired
    private JobService jobService;

    @Autowired
    private ApplicationService applicationService;

    @PostMapping("/job")
    public ResponseEntity<?> createJob(@RequestBody Job job) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            return ResponseEntity.ok(jobService.createJob(job, username));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/job/{jobId}")
    public ResponseEntity<?> updateJob(@PathVariable Long jobId, @RequestBody Job updatedJob) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            return ResponseEntity.ok(jobService.updateJob(jobId, updatedJob, username));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/job/{jobId}")
    public ResponseEntity<?> deleteJob(@PathVariable Long jobId) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            jobService.deleteJob(jobId, username);
            return ResponseEntity.ok(Map.of("message", "Job deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/applications")
    public ResponseEntity<?> getRecruiterApplications() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            return ResponseEntity.ok(applicationService.getApplicationsForRecruiter(username));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/application/update/{applicationId}")
    public ResponseEntity<?> updateApplicationStatus(@PathVariable Long applicationId, @RequestParam String status) {
        try {
            return ResponseEntity.ok(applicationService.updateApplicationStatus(applicationId, status));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
