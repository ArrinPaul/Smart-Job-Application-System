package com.edutech.jobportalsystem.service;

import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.repository.JobRepository;
import com.edutech.jobportalsystem.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
    private PasswordEncoder passwordEncoder;

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
            
            // Generate extremely unique slug
            String baseSlug = title.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
            if (baseSlug.isEmpty()) baseSlug = "job";
            
            String uniqueSlug = baseSlug + "-" + (long)(Math.random() * 900000 + 100000);
            
            // Avoid duplicates within the same batch
            int attempts = 0;
            while (seenSlugs.contains(uniqueSlug) && attempts < 10) {
                uniqueSlug = baseSlug + "-" + (long)(Math.random() * 900000 + 100000);
                attempts++;
            }
            
            job.setSlug(uniqueSlug);
            seenSlugs.add(uniqueSlug);
            jobsToSave.add(job);
        }

        List<Job> savedJobs = jobRepository.saveAll(jobsToSave);
        logger.info("Successfully ingested {} jobs in batch.", savedJobs.size());
        return savedJobs;
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
