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
    public List<Job> ingestJobs(List<Map<String, String>> jobDataList) {
        User recruiter = getOrCreateGlobalRecruiter();
        List<Job> jobsToSave = new ArrayList<>();
        java.util.Set<String> seenSlugs = new java.util.HashSet<>();

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
                jobsToSave.add(job);
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

                // Generate slug
                String baseSlug = title.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
                if (baseSlug.isEmpty()) baseSlug = "job";
                String uniqueSlug = baseSlug + "-" + (long)(Math.random() * 900000 + 100000);
                int attempts = 0;
                while (seenSlugs.contains(uniqueSlug) && attempts < 10) {
                    uniqueSlug = baseSlug + "-" + (long)(Math.random() * 900000 + 100000);
                    attempts++;
                }
                job.setSlug(uniqueSlug);
                seenSlugs.add(uniqueSlug);
                jobsToSave.add(job);
            }
        }

        List<Job> savedJobs = jobRepository.saveAll(jobsToSave);
        logger.info("Successfully ingested {} jobs in batch.", savedJobs.size());

        // Perform cleanup of stale/closed postings after ingestion
        try {
            cleanupStaleJobs();
        } catch (Exception e) {
            logger.warn("Stale job cleanup failed: {}", e.getMessage());
        }

        return savedJobs;
    }

    /**
     * Cleanup stale job postings: if application link returns 404 or page contains 'closed' keywords,
     * then delete job only if there are no applications; otherwise mark as inactive.
     */
    @Transactional
    public void cleanupStaleJobs() {
        logger.info("Starting stale job cleanup sweep...");
        List<Job> allJobs = jobRepository.findAll();
        for (Job job : allJobs) {
            String link = job.getApplicationLink();
            if (link == null || link.isEmpty()) continue;
            try {
                org.springframework.http.ResponseEntity<String> resp = restTemplate.getForEntity(link, String.class);
                String body = resp.getBody() != null ? resp.getBody().toLowerCase() : "";
                boolean closed = resp.getStatusCode().is4xxClientError() || resp.getStatusCode().is5xxServerError();
                if (!closed) {
                    // simple keyword heuristics
                    if (body.contains("application closed") || body.contains("no longer accepting") || body.contains("applications are closed") || body.contains("expired")) {
                        closed = true;
                    }
                }

                if (closed) {
                    List<com.edutech.jobportalsystem.entity.Application> apps = applicationRepository.findByJob(job);
                    if (apps == null || apps.isEmpty()) {
                        logger.info("Deleting job id={} title='{}' because application link indicates closed and no applications found.", job.getId(), job.getTitle());
                        jobRepository.delete(job);
                    } else {
                        logger.info("Marking job id={} as inactive (closed) but preserving due to existing applications.", job.getId());
                        job.setIsActive(false);
                        jobRepository.save(job);
                    }
                }
            } catch (org.springframework.web.client.HttpClientErrorException.NotFound nf) {
                List<com.edutech.jobportalsystem.entity.Application> apps = applicationRepository.findByJob(job);
                if (apps == null || apps.isEmpty()) {
                    logger.info("Deleting job id={} due to 404 on application link.", job.getId());
                    jobRepository.delete(job);
                } else {
                    logger.info("Marking job id={} inactive due to 404 on application link but has applications.", job.getId());
                    job.setIsActive(false);
                    jobRepository.save(job);
                }
            } catch (Exception e) {
                logger.debug("Failed to validate job link for id={} url={} err={}", job.getId(), link, e.getMessage());
            }
        }
        logger.info("Stale job cleanup completed.");
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
