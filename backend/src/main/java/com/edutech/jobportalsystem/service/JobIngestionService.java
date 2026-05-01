package com.edutech.jobportalsystem.service;

import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.repository.JobRepository;
import com.edutech.jobportalsystem.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import com.edutech.jobportalsystem.repository.ApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Value;

@Service
public class JobIngestionService {

    private static final Logger logger = LoggerFactory.getLogger(JobIngestionService.class);

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.data-loader.enabled:false}")
    private boolean dataLoaderEnabled;

    private static final String GLOBAL_RECRUITER_USERNAME = "global.recruiter";

    @Bean
    public CommandLineRunner runIngestion() {
        return args -> {
            if (!dataLoaderEnabled || jobRepository.count() > 0) {
                return;
            }

            logger.info("Auto-ingesting real-world job data...");
            List<Map<String, String>> jobs = new ArrayList<>();
            jobs.add(Map.of(
                "title", "Software Engineer - AI",
                "location", "Florida (Remote options)",
                "description", "Build AI-enhanced retail and eCommerce experiences. Focus on personalized recommendations, search optimization, and predictive analysis. Requires 3+ years of experience and proficiency in full-stack JS."
            ));
            jobs.add(Map.of(
                "title", "Senior DevOps Engineer",
                "location", "Austin, TX",
                "description", "Scale our cloud infrastructure on AWS. Expertise in Terraform, Kubernetes, and GitHub Actions required. Help us achieve 99.9% uptime for our global platform."
            ));
            jobs.add(Map.of(
                "title", "Full Stack Developer (Java/Angular)",
                "location", "New York, NY",
                "description", "Join a fast-paced fintech startup. Build secure banking modules using Spring Boot 3 and Angular 17. Must be comfortable with TDD and agile methodologies."
            ));
            jobs.add(Map.of(
                "title", "UX Researcher",
                "location", "Remote",
                "description", "Conduct user interviews and usability testing to improve our job matching algorithm. Work closely with product managers and designers."
            ));
            jobs.add(Map.of(
                "title", "Data Scientist (NLP)",
                "location", "Seattle, WA",
                "description", "Apply large language models to categorize and rank millions of resumes. Experience with PyTorch or TensorFlow and LLM fine-tuning is a plus."
            ));
            jobs.add(Map.of(
                "title", "Cybersecurity Specialist",
                "location", "Denver, CO",
                "description", "Protect our users' data from emerging threats. Perform regular penetration tests and security audits. Knowledge of OWASP Top 10 is mandatory."
            ));
            jobs.add(Map.of(
                "title", "Product Manager (Mobile)",
                "location", "San Francisco, CA",
                "description", "Own the roadmap for our iOS and Android applications. Drive user growth and retention through data-driven experiments."
            ));
            jobs.add(Map.of(
                "title", "QA Automation Engineer",
                "location", "Toronto, ON",
                "description", "Build robust end-to-end test suites using Playwright and Java. Ensure the highest quality for our continuous delivery pipeline."
            ));

            ingestJobs(jobs);
            logger.info("Successfully populated database with real-world jobs.");
        };
    }

    @Transactional
    public void deleteAllJobs() {
        logger.info("Truncating jobs table for fresh start...");
        jobRepository.deleteAllInBatch(); // Faster than deleteAll()
    }

    @Transactional
    public java.util.Map<String, Object> ingestJobs(List<Map<String, String>> jobDataList) {
        User recruiter = getOrCreateGlobalRecruiter();
        List<Job> jobsToSave = new ArrayList<>();
        java.util.Set<String> seenSlugs = new java.util.HashSet<>();
        int createdCount = 0;
        int updatedCount = 0;

        for (Map<String, String> data : jobDataList) {
            String title = data.get("title");
            String location = data.get("location");
            String description = data.get("description");
            String applicationLink = data.get("applicationLink");
            String companyName = data.get("companyName");
            String howToApply = data.get("howToApply");
            String requiredSkills = data.get("requiredSkills");
            String jobType = data.get("jobType");

            if (title == null || title.isEmpty()) continue;

            // Check for existing job by title + company (case-insensitive)
            java.util.Optional<Job> existing = java.util.Optional.empty();
            if (companyName != null && !companyName.isEmpty()) {
                existing = jobRepository.findFirstByTitleIgnoreCaseAndCompanyNameIgnoreCase(title, companyName);
            }

            if (existing.isPresent()) {
                // Update existing job instead of inserting duplicate
                Job job = existing.get();
                job.setLocation(location != null ? location : job.getLocation());
                job.setDescription(description != null ? description : job.getDescription());
                job.setApplicationLink(applicationLink != null ? applicationLink : job.getApplicationLink());
                job.setHowToApply(howToApply != null ? howToApply : job.getHowToApply());
                job.setRequiredSkills(requiredSkills != null ? requiredSkills : job.getRequiredSkills());
                job.setJobType(jobType != null ? jobType : job.getJobType());
                job.setCompanyName(companyName != null ? companyName : job.getCompanyName());
                job.setIsActive(true);
                
                // Ensure slug exists
                if (job.getSlug() == null || job.getSlug().isBlank()) {
                    job.setSlug(generateIngestionSlug(title, companyName));
                }
                
                jobsToSave.add(job);
                updatedCount++;
            } else {
                Job job = new Job();
                job.setTitle(title);
                job.setLocation(location != null ? location : "Remote");
                job.setDescription(description != null ? description : "No description provided.");
                job.setApplicationLink(applicationLink);
                job.setCompanyName(companyName);
                job.setHowToApply(howToApply);
                job.setRequiredSkills(requiredSkills);
                job.setJobType(jobType);
                job.setPostedBy(recruiter);
                job.setIsActive(true);

                // Generate slug
                job.setSlug(generateIngestionSlug(title, companyName));
                jobsToSave.add(job);
                createdCount++;
            }
        }

        List<Job> savedJobs = jobRepository.saveAll(jobsToSave);
        logger.info("Successfully ingested {} jobs in batch.", savedJobs.size());

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("saved", savedJobs.size());
        result.put("created", createdCount);
        result.put("updated", updatedCount);
        result.put("jobs", savedJobs);
        return result;
    }

    private String generateIngestionSlug(String title, String company) {
        String base = (title + "-" + (company != null ? company : "company")).toLowerCase();
        String slug = base.replaceAll("[^a-z0-9\\s]", "")
                         .replaceAll("\\s+", "-")
                         .replaceAll("-+", "-")
                         .replaceAll("^-|-$", "");
        if (slug.isEmpty()) slug = "job";
        return slug + "-" + (long)(Math.random() * 900000 + 100000);
    }

    /**
     * Cleanup stale job postings - Refactored to avoid long-running transactions
     */
    public void runStaleJobCleanupAsync() {
        // Run in a separate thread to avoid blocking
        new Thread(() -> {
            try {
                cleanupStaleJobsInternal();
            } catch (Exception e) {
                logger.error("Async cleanup failed", e);
            }
        }).start();
    }

    private void cleanupStaleJobsInternal() {
        logger.info("Starting background stale job cleanup sweep...");
        // Fetch IDs first to avoid keeping a large result set in memory or holding a cursor
        List<Long> jobIds = jobRepository.findAll().stream().map(Job::getId).toList();
        
        int deleted = 0;
        int markedInactive = 0;
        
        // Process in smaller batches
        for (Long jobId : jobIds) {
            try {
                processSingleJobCleanup(jobId);
            } catch (Exception e) {
                logger.debug("Cleanup skipped for job {}: {}", jobId, e.getMessage());
            }
        }
        logger.info("Background cleanup completed. Processed {} jobs.", jobIds.size());
    }

    @Transactional
    protected void processSingleJobCleanup(Long jobId) {
        Job job = jobRepository.findById(jobId).orElse(null);
        if (job == null || job.getApplicationLink() == null || job.getApplicationLink().isEmpty()) return;

        try {
            // Only perform network check if active
            if (!job.getIsActive()) return;

            org.springframework.http.ResponseEntity<String> resp = restTemplate.getForEntity(job.getApplicationLink(), String.class);
            boolean closed = resp.getStatusCode().is4xxClientError();
            
            if (!closed && resp.getBody() != null) {
                String body = resp.getBody().toLowerCase();
                if (body.contains("application closed") || body.contains("no longer accepting") || body.contains("expired")) {
                    closed = true;
                }
            }

            if (closed) {
                List<com.edutech.jobportalsystem.entity.Application> apps = applicationRepository.findByJob(job);
                if (apps == null || apps.isEmpty()) {
                    jobRepository.delete(job);
                } else {
                    job.setIsActive(false);
                    jobRepository.save(job);
                }
            }
        } catch (HttpClientErrorException.NotFound nf) {
            List<com.edutech.jobportalsystem.entity.Application> apps = applicationRepository.findByJob(job);
            if (apps == null || apps.isEmpty()) {
                jobRepository.delete(job);
            } else {
                job.setIsActive(false);
                jobRepository.save(job);
            }
        } catch (Exception e) {
            // Silent ignore for network timeouts etc
        }
    }

    private User getOrCreateGlobalRecruiter() {
        return userRepository.findByUsername(GLOBAL_RECRUITER_USERNAME)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setUsername(GLOBAL_RECRUITER_USERNAME);
                    newUser.setEmail("recruiter@globaljobs.com");
                    newUser.setPassword(passwordEncoder.encode("GlobalRecruiter2026!"));
                    newUser.setRole("RECRUITER");
                    newUser.setEmailVerified(true);
                    return userRepository.save(newUser);
                });
    }
}
