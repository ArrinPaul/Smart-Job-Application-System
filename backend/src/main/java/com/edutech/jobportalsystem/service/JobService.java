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
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service
public class JobService {

    private static final Logger logger = LoggerFactory.getLogger(JobService.class);

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public Job createJob(Job job, String recruiterUsername) {
        logger.info("Creating job: {} by {}", job.getTitle(), recruiterUsername);
        User recruiter = userRepository.findByUsername(recruiterUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", recruiterUsername));

        job.setTitle(sanitize(job.getTitle()));
        job.setDescription(sanitize(job.getDescription()));
        job.setLocation(sanitize(job.getLocation()));
        job.setPostedBy(recruiter);
        job.setIsActive(true); // Ensure new jobs are active

        // Generate slug if not present
        if (job.getSlug() == null || job.getSlug().isBlank()) {
            job.setSlug(generateSlug(job.getTitle(), job.getCompanyName()));
        }

        return jobRepository.save(job);
    }

    @jakarta.annotation.PostConstruct
    @Transactional
    public void backfillSlugs() {
        List<Job> jobsWithNullSlugs = jobRepository.findAll().stream()
                .filter(j -> j.getSlug() == null || j.getSlug().isBlank())
                .toList();
        
        if (!jobsWithNullSlugs.isEmpty()) {
            logger.info("Backfilling slugs for {} jobs...", jobsWithNullSlugs.size());
            for (Job job : jobsWithNullSlugs) {
                job.setSlug(generateSlug(job.getTitle(), job.getCompanyName()));
                jobRepository.save(job);
            }
            logger.info("Slug backfill completed.");
        }
    }

    public Job updateJob(Long jobId, Job updatedJob, String recruiterUsername) {
        logger.info("Updating job ID: {} by {}", jobId, recruiterUsername);
        Job existingJob = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));

        if (!existingJob.getPostedBy().getUsername().equals(recruiterUsername)) {
            logger.warn("Unauthorized update attempt for job ID: {} by user: {}", jobId, recruiterUsername);
            throw new BadRequestException("Not authorized to update this job");
        }

        String oldTitle = existingJob.getTitle();
        existingJob.setTitle(sanitize(updatedJob.getTitle()));
        existingJob.setDescription(sanitize(updatedJob.getDescription()));
        existingJob.setLocation(sanitize(updatedJob.getLocation()));
        
        // Update new fields
        existingJob.setJobType(updatedJob.getJobType());
        existingJob.setWorkType(updatedJob.getWorkType());
        existingJob.setExperienceRequired(updatedJob.getExperienceRequired());
        existingJob.setRequiredSkills(updatedJob.getRequiredSkills());
        existingJob.setEducationRequired(updatedJob.getEducationRequired());
        existingJob.setSalaryMin(updatedJob.getSalaryMin());
        existingJob.setSalaryMax(updatedJob.getSalaryMax());
        existingJob.setSalaryCurrency(updatedJob.getSalaryCurrency());
        existingJob.setApplicationLink(updatedJob.getApplicationLink());
        existingJob.setCompanyName(updatedJob.getCompanyName());
        existingJob.setHowToApply(updatedJob.getHowToApply());

        // Update slug ONLY if current slug is null or blank, or if title changed significantly
        // We use normalizeTitle to compare titles without considering case or extra spaces
        if (existingJob.getSlug() == null || existingJob.getSlug().isBlank() || !normalizeTitle(oldTitle).equals(normalizeTitle(existingJob.getTitle()))) {
            existingJob.setSlug(generateSlug(existingJob.getTitle(), existingJob.getCompanyName()));
        }

        return jobRepository.save(existingJob);
    }

    private String normalizeTitle(String title) {
        if (title == null) return "";
        return title.toLowerCase().replaceAll("[^a-z0-9]", "").trim();
    }

    private String generateSlug(String title, String company) {
        String base = (title + "-" + (company != null ? company : "company")).toLowerCase();
        // Remove non-alphanumeric characters, replace spaces with hyphens
        String slug = base.replaceAll("[^a-z0-9\\s]", "")
                         .replaceAll("\\s+", "-")
                         .replaceAll("-+", "-")
                         .replaceAll("^-|-$", "");

        // Add random suffix to ensure uniqueness
        return slug + "-" + java.util.UUID.randomUUID().toString().substring(0, 8);
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

    public Job adminUpdateJob(Long jobId, Job updatedJob) {
        logger.info("Admin Updating job ID: {}", jobId);
        Job existingJob = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));
        
        if (updatedJob.getTitle() != null) existingJob.setTitle(sanitize(updatedJob.getTitle()));
        if (updatedJob.getDescription() != null) existingJob.setDescription(sanitize(updatedJob.getDescription()));
        if (updatedJob.getLocation() != null) existingJob.setLocation(sanitize(updatedJob.getLocation()));
        if (updatedJob.getJobType() != null) existingJob.setJobType(updatedJob.getJobType());
        if (updatedJob.getWorkType() != null) existingJob.setWorkType(updatedJob.getWorkType());
        if (updatedJob.getSalaryMin() != null) existingJob.setSalaryMin(updatedJob.getSalaryMin());
        if (updatedJob.getSalaryMax() != null) existingJob.setSalaryMax(updatedJob.getSalaryMax());
        if (updatedJob.getExperienceRequired() != null) existingJob.setExperienceRequired(updatedJob.getExperienceRequired());
        if (updatedJob.getRequiredSkills() != null) existingJob.setRequiredSkills(updatedJob.getRequiredSkills());
        if (updatedJob.getIsActive() != null) existingJob.setIsActive(updatedJob.getIsActive());
        
        return jobRepository.save(existingJob);
    }

    public void adminDeleteJob(Long jobId) {
        logger.info("Admin Deleting job ID: {}", jobId);
        if (!jobRepository.existsById(jobId)) {
            throw new ResourceNotFoundException("Job", "id", jobId);
        }
        jobRepository.deleteById(jobId);
    }

    public List<Job> getAllJobs(int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        return jobRepository.findAll(pageable).getContent();
    }

    public List<Job> searchJobs(String title, String location, int page, int size) {
        title = sanitize(title);
        location = sanitize(location);
        logger.debug("Searching jobs - title: {}, location: {}, page: {}, size: {}", title, location, page, size);
        
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        
        boolean hasTitle = title != null && !title.isBlank();
        boolean hasLocation = location != null && !location.isBlank();

        if (hasTitle && hasLocation) {
            return jobRepository.findByTitleContainingIgnoreCaseAndLocationContainingIgnoreCase(title, location, pageable);
        } else if (hasTitle) {
            return jobRepository.findByTitleContainingIgnoreCase(title, pageable);
        } else if (hasLocation) {
            return jobRepository.findByLocationContainingIgnoreCase(location, pageable);
        } else {
            return jobRepository.findAll(pageable).getContent();
        }
    }

    public List<Job> getAllJobs() {
        return jobRepository.findAll();
    }

    public List<Job> searchJobs(String title, String location) {
        return searchJobs(title, location, 0, Integer.MAX_VALUE);
    }

    public List<Job> getJobsByRecruiter(String recruiterUsername) {
        User recruiter = userRepository.findByUsername(recruiterUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", recruiterUsername));
        return jobRepository.findByPostedBy(recruiter);
    }

    public Job getJobBySlug(String slug) {
        return jobRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "slug", slug));
    }

    public java.util.Map<String, Object> getPublicPortalStats() {
        long totalJobs = jobRepository.count();
        long totalUsers = userRepository.count();
        
        // Mocking some internal logic for match rate and speed to avoid complex calculations for now
        // but using real counts for jobs and users.
        return java.util.Map.of(
            "totalJobs", totalJobs,
            "totalUsers", totalUsers,
            "matchRate", 95,
            "matchingSpeedMs", 12
        );
    }

    private String sanitize(String input) {
        if (input == null) {
            return null;
        }
        return input.replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "").trim();
    }
}
