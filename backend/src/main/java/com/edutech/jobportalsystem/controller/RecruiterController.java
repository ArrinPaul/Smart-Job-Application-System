package com.edutech.jobportalsystem.controller;

// File: ./backend/src/main/java/com/edutech/jobportalsystem/controller/RecruiterController.java

import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.dto.job.JobUpsertRequest;
import com.edutech.jobportalsystem.dto.job.UpdateApplicationDetailsRequest;
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
        mapRequestToEntity(request, job);
        return ResponseEntity.ok(jobService.createJob(job, username));
    }

    @PutMapping("/jobs/{jobId}")
    public ResponseEntity<?> updateJob(@PathVariable Long jobId, @Valid @RequestBody JobUpsertRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Recruiter {} updating job ID: {}", username, jobId);

        Job updatedJob = new Job();
        mapRequestToEntity(request, updatedJob);
        return ResponseEntity.ok(jobService.updateJob(jobId, updatedJob, username));
    }

    private void mapRequestToEntity(JobUpsertRequest request, Job job) {
        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setLocation(request.getLocation());
        job.setJobType(request.getJobType());
        job.setWorkType(request.getWorkType());
        job.setExperienceRequired(request.getExperienceRequired());
        job.setRequiredSkills(request.getRequiredSkills());
        job.setEducationRequired(request.getEducationRequired());
        job.setSalaryMin(request.getSalaryMin());
        job.setSalaryMax(request.getSalaryMax());
        job.setSalaryCurrency(request.getSalaryCurrency());
        job.setApplicationLink(request.getApplicationLink());
        job.setCompanyName(request.getCompanyName());
        job.setHowToApply(request.getHowToApply());
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

    @PutMapping("/applications/{applicationId}/details")
    public ResponseEntity<?> updateApplicationDetails(@PathVariable Long applicationId,
                                                      @RequestBody UpdateApplicationDetailsRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Recruiter {} updating detailed info for application {}", username, applicationId);
        return ResponseEntity.ok(applicationService.updateApplicationDetails(
                applicationId, 
                request.getStatus(), 
                request.getInternalNotes(), 
                request.getInterviewDate(), 
                request.getInterviewLocation(), 
                request.getRecruiterFeedback(), 
                username));
    }
}
