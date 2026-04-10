package com.edutech.jobportalsystem.service;

// File: ./backend/src/main/java/com/edutech/jobportalsystem/service/ApplicationService.java

import com.edutech.jobportalsystem.entity.Application;
import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.entity.Resume;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.exception.BadRequestException;
import com.edutech.jobportalsystem.exception.ResourceNotFoundException;
import com.edutech.jobportalsystem.repository.ApplicationRepository;
import com.edutech.jobportalsystem.repository.JobRepository;
import com.edutech.jobportalsystem.repository.ResumeRepository;
import com.edutech.jobportalsystem.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class ApplicationService {

    private static final Logger logger = LoggerFactory.getLogger(ApplicationService.class);
    private static final Set<String> VALID_STATUSES = Set.of("APPLIED", "SHORTLISTED", "REJECTED", "HIRED");

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ResumeRepository resumeRepository;

    public Application applyForJob(Long jobId, Long userId) {
        logger.info("User ID {} applying for job ID {}", userId, jobId);
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));
        User applicant = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (applicationRepository.existsByApplicantAndJob(applicant, job)) {
            logger.warn("User {} already applied for job {}", userId, jobId);
            throw new BadRequestException("Already applied for this job");
        }

        Resume resume = resumeRepository.findByOwner(applicant).orElse(null);

        Application application = new Application();
        application.setApplicant(applicant);
        application.setJob(job);
        application.setResume(resume);
        Application savedApp = applicationRepository.save(application);
        logger.info("Application successful for user {} on job {}", userId, jobId);
        return savedApp;
    }

    public List<Application> getApplicationsForRecruiter(String recruiterUsername) {
        logger.debug("Fetching applications for recruiter: {}", recruiterUsername);
        User recruiter = userRepository.findByUsername(recruiterUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", recruiterUsername));
        List<Job> jobs = jobRepository.findByPostedBy(recruiter);
        return applicationRepository.findByJobIn(jobs);
    }

    public List<Application> getApplicationsByApplicant(User applicant) {
        return applicationRepository.findByApplicant(applicant);
    }

    public Application updateApplicationStatus(Long applicationId, String newStatus, String recruiterUsername) {
        logger.info("Updating application {} status to {}", applicationId, newStatus);
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", applicationId));

        String sanitizedStatus = newStatus == null ? "" : newStatus.trim().toUpperCase();
        if (!VALID_STATUSES.contains(sanitizedStatus)) {
            throw new BadRequestException("Invalid application status");
        }

        if (!application.getJob().getPostedBy().getUsername().equals(recruiterUsername)) {
            throw new BadRequestException("Not authorized to update this application");
        }

        application.setStatus(sanitizedStatus);
        return applicationRepository.save(application);
    }

    public List<Application> getAllApplications() {
        return applicationRepository.findAll();
    }
}
