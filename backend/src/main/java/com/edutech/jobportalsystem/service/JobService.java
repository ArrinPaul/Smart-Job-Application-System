package com.edutech.jobportalsystem.service;

// File: ./src/main/java/com/edutech/jobportalsystem/service/JobService.java

import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.repository.JobRepository;
import com.edutech.jobportalsystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class JobService {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    public Job createJob(Job job, String recruiterUsername) {
        User recruiter = userRepository.findByUsername(recruiterUsername)
                .orElseThrow(() -> new RuntimeException("Recruiter not found"));
        job.setPostedBy(recruiter);
        return jobRepository.save(job);
    }

    public Job updateJob(Long jobId, Job updatedJob, String recruiterUsername) {
        Job existingJob = jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        
        // In a real app, we'd verify if the recruiter owns the job, but following the Plan strictly:
        existingJob.setTitle(updatedJob.getTitle());
        existingJob.setDescription(updatedJob.getDescription());
        existingJob.setLocation(updatedJob.getLocation());
        
        return jobRepository.save(existingJob);
    }

    public void deleteJob(Long jobId) {
        jobRepository.deleteById(jobId);
    }

    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    public List<Job> searchJobs(String title, String location) {
        if (title != null && !title.isBlank() && location != null && !location.isBlank()) {
            // Filter in-memory as per Plan requirement logic
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
                .orElseThrow(() -> new RuntimeException("Recruiter not found"));
        return jobRepository.findByPostedBy(recruiter);
    }
}
