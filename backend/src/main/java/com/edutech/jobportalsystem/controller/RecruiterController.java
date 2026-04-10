package com.edutech.jobportalsystem.controller;

// File: ./backend/src/main/java/com/edutech/jobportalsystem/controller/RecruiterController.java

import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.dto.job.JobUpsertRequest;
import com.edutech.jobportalsystem.dto.job.UpdateApplicationStatusRequest;
import com.edutech.jobportalsystem.service.ApplicationService;
import com.edutech.jobportalsystem.service.JobService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/recruiter")
public class RecruiterController {

    private static final Logger logger = LoggerFactory.getLogger(RecruiterController.class);

    @Autowired
    private JobService jobService;

    @Autowired
    private ApplicationService applicationService;

    @PostMapping("/jobs")
    public ResponseEntity<?> createJob(@Valid @RequestBody JobUpsertRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Recruiter {} creating job: {}", username, request.getTitle());

        Job job = new Job();
        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setLocation(request.getLocation());
        return ResponseEntity.ok(jobService.createJob(job, username));
    }

    @PutMapping("/jobs/{jobId}")
    public ResponseEntity<?> updateJob(@PathVariable Long jobId, @Valid @RequestBody JobUpsertRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Recruiter {} updating job ID: {}", username, jobId);

        Job updatedJob = new Job();
        updatedJob.setTitle(request.getTitle());
        updatedJob.setDescription(request.getDescription());
        updatedJob.setLocation(request.getLocation());
        return ResponseEntity.ok(jobService.updateJob(jobId, updatedJob, username));
    }

    @DeleteMapping("/jobs/{jobId}")
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

    @GetMapping("/jobs")
    public ResponseEntity<?> getRecruiterJobs() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Recruiter {} fetching their jobs", username);
        return ResponseEntity.ok(jobService.getJobsByRecruiter(username));
    }

    @PutMapping("/applications/{applicationId}/status")
    public ResponseEntity<?> updateApplicationStatus(@PathVariable Long applicationId,
                                                     @Valid @RequestBody UpdateApplicationStatusRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Recruiter {} updating application {} to status: {}", username, applicationId, request.getStatus());
        return ResponseEntity.ok(applicationService.updateApplicationStatus(applicationId, request.getStatus(), username));
    }
}
