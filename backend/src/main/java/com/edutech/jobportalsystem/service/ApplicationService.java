package com.edutech.jobportalsystem.service;

// File: ./src/main/java/com/edutech/jobportalsystem/service/ApplicationService.java

import com.edutech.jobportalsystem.entity.Application;
import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.repository.ApplicationRepository;
import com.edutech.jobportalsystem.repository.JobRepository;
import com.edutech.jobportalsystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ApplicationService {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobRepository jobRepository;

    public Application applyForJob(Long jobId, Long userId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        User applicant = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (applicationRepository.existsByApplicantAndJob(applicant, job)) {
            throw new RuntimeException("Already applied for this job");
        }

        Application application = new Application();
        application.setApplicant(applicant);
        application.setJob(job);
        // status/appliedAt set by @PrePersist
        return applicationRepository.save(application);
    }

    public List<Application> getApplicationsForRecruiter(String recruiterUsername) {
        User recruiter = userRepository.findByUsername(recruiterUsername)
                .orElseThrow(() -> new RuntimeException("Recruiter not found"));
        List<Job> jobs = jobRepository.findByPostedBy(recruiter);
        return applicationRepository.findByJobIn(jobs);
    }

    public List<Application> getApplicationsByApplicant(User applicant) {
        return applicationRepository.findByApplicant(applicant);
    }

    public Application updateApplicationStatus(Long applicationId, String newStatus) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        application.setStatus(newStatus);
        return applicationRepository.save(application);
    }

    public List<Application> getAllApplications() {
        return applicationRepository.findAll();
    }
}
