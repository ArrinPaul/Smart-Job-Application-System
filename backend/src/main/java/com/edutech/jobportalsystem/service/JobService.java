package com.edutech.jobportalsystem.service;

// File: ./backend/src/main/java/com/edutech/jobportalsystem/service/JobService.java

import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.exception.BadRequestException;
import com.edutech.jobportalsystem.exception.ResourceNotFoundException;
import com.edutech.jobportalsystem.repository.JobRepository;
import com.edutech.jobportalsystem.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class JobService {

    private static final Logger logger = LoggerFactory.getLogger(JobService.class);

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    public Job createJob(Job job, String recruiterUsername) {
        logger.info("Creating job: {} by {}", job.getTitle(), recruiterUsername);
        User recruiter = userRepository.findByUsername(recruiterUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", recruiterUsername));
        job.setPostedBy(recruiter);
        return jobRepository.save(job);
    }

    public Job updateJob(Long jobId, Job updatedJob, String recruiterUsername) {
        logger.info("Updating job ID: {} by {}", jobId, recruiterUsername);
        Job existingJob = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));
        
        if (!existingJob.getPostedBy().getUsername().equals(recruiterUsername)) {
            logger.warn("Unauthorized update attempt for job ID: {} by user: {}", jobId, recruiterUsername);
            throw new BadRequestException("Not authorized to update this job");
        }
        
        existingJob.setTitle(updatedJob.getTitle());
        existingJob.setDescription(updatedJob.getDescription());
        existingJob.setLocation(updatedJob.getLocation());
        
        return jobRepository.save(existingJob);
    }

    public void deleteJob(Long jobId, String recruiterUsername) {
        logger.info("Deleting job ID: {} by {}", jobId, recruiterUsername);
        Job existingJob = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));
        
        if (!existingJob.getPostedBy().getUsername().equals(recruiterUsername)) {
            logger.warn("Unauthorized delete attempt for job ID: {} by user: {}", jobId, recruiterUsername);
            throw new BadRequestException("Not authorized to delete this job");
        }
        
        jobRepository.deleteById(jobId);
    }

    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    public List<Job> searchJobs(String title, String location) {
        logger.debug("Searching jobs - title: {}, location: {}", title, location);
        if (title != null && !title.isBlank() && location != null && !location.isBlank()) {
            return jobRepository.findAll().stream()
                    .filter(j -> j.getTitle().toLowerCase().contains(title.toLowerCase()) && 
                                 j.getLocation().toLowerCase().contains(location.toLowerCase()))
                    .collect(Collectors.toList());
        } else if (title != null && !title.isBlank()) {
            return jobRepository.findByTitleContainingIgnoreCase(title);
        } else if (location != null && !location.isBlank()) {
            return jobRepository.findByLocationContainingIgnoreCase(location);
        } else {
            return jobRepository.findAll();
        }
    }

    public List<Job> getJobsByRecruiter(String recruiterUsername) {
        User recruiter = userRepository.findByUsername(recruiterUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", recruiterUsername));
        return jobRepository.findByPostedBy(recruiter);
    }
}
