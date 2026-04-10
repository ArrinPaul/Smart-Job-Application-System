package com.edutech.jobportalsystem.controller;

// File: ./backend/src/main/java/com/edutech/jobportalsystem/controller/JobSeekerController.java

import com.edutech.jobportalsystem.dto.job.ApplyJobRequest;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.exception.ResourceNotFoundException;
import com.edutech.jobportalsystem.repository.UserRepository;
import com.edutech.jobportalsystem.service.ApplicationService;
import com.edutech.jobportalsystem.service.JobService;
import com.edutech.jobportalsystem.service.ResumeService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@Validated
public class JobSeekerController {

    private static final Logger logger = LoggerFactory.getLogger(JobSeekerController.class);

    @Autowired
    private JobService jobService;

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private ResumeService resumeService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/jobs")
    public ResponseEntity<?> searchJobs(@RequestParam(required = false) @Size(max = 120) String title,
                                       @RequestParam(required = false) @Size(max = 120) String location) {
        logger.info("Job search - title: {}, location: {}", title, location);
        return ResponseEntity.ok(jobService.searchJobs(title, location));
    }

    @PostMapping("/job/apply")
    public ResponseEntity<?> applyJob(@Valid @RequestBody ApplyJobRequest body) {
        Long jobId = body.getJobId();
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        logger.info("User {} applying for job {}", user.getId(), jobId);
        applicationService.applyForJob(jobId, user.getId());
        return ResponseEntity.ok(Map.of("message", "Applied successfully"));
    }

    @PostMapping("/jobseeker/resume")
    public ResponseEntity<?> uploadResume(@RequestParam("file") MultipartFile file) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("User {} uploading resume", username);
        return ResponseEntity.ok(resumeService.uploadResume(file, username));
    }

    @GetMapping("/jobseeker/applications")
    public ResponseEntity<?> getMyApplications() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("User {} fetching their applications", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        return ResponseEntity.ok(applicationService.getApplicationsByApplicant(user));
    }
}
