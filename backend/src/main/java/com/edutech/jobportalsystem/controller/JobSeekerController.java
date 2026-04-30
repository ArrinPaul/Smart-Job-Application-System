package com.edutech.jobportalsystem.controller;

// File: ./backend/src/main/java/com/edutech/jobportalsystem/controller/JobSeekerController.java

import com.edutech.jobportalsystem.dto.job.ApplyJobRequest;
import com.edutech.jobportalsystem.dto.job.JobRecommendationDTO;
import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.exception.ResourceNotFoundException;
import com.edutech.jobportalsystem.repository.UserRepository;
import com.edutech.jobportalsystem.service.ApplicationService;
import com.edutech.jobportalsystem.service.JobService;
import com.edutech.jobportalsystem.service.JobRecommendationService;
import com.edutech.jobportalsystem.service.ResumeService;
import com.edutech.jobportalsystem.service.TranslationService;
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
import java.util.List;
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

    @Autowired
    private JobRecommendationService jobRecommendationService;

    @Autowired
    private com.edutech.jobportalsystem.service.SmartInsightsService smartInsightsService;

    @Autowired
    private TranslationService translationService;

    @GetMapping("/jobs")
    public ResponseEntity<?> searchJobs(@RequestParam(required = false) @Size(max = 120) String title,
                                       @RequestParam(required = false) @Size(max = 120) String location,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "1000000") int size) {
        logger.info("Job search - title: {}, location: {}, page: {}, size: {}", title, location, page, size);
        List<Job> jobs = jobService.searchJobs(title, location, page, size);
        return ResponseEntity.ok(translationService.translateJobs(jobs));
    }

    @GetMapping("/jobs/{slug}")
    public ResponseEntity<?> getJobBySlug(@PathVariable String slug) {
        logger.info("Fetching job details for slug: {}", slug);
        Job job = jobService.getJobBySlug(slug);
        return ResponseEntity.ok(translationService.translateJob(job));
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

    @GetMapping("/jobseeker/insights/match/{jobId}")
    public ResponseEntity<?> getJobMatchInsights(@PathVariable Long jobId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("User {} fetching insights for job {}", username, jobId);
        return ResponseEntity.ok(smartInsightsService.getMatchInsights(jobId, username));
    }

    /**
     * Get personalized job recommendations for the current user
     * @param limit Maximum number of recommendations to return (default: 10, max: 50)
     * @return List of recommended jobs with match percentages
     */
    @GetMapping("/jobseeker/recommendations")
    public ResponseEntity<List<JobRecommendationDTO>> getJobRecommendations(
            @RequestParam(required = false, defaultValue = "10") int limit) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        
        // Cap limit to 50
        if (limit > 50) limit = 50;
        if (limit < 1) limit = 10;
        
        logger.info("User {} requesting {} job recommendations", user.getId(), limit);
        List<JobRecommendationDTO> recommendations = jobRecommendationService.getRecommendationsForUser(user.getId(), limit);
        return ResponseEntity.ok(recommendations);
    }
}
