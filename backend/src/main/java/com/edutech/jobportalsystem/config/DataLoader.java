package com.edutech.jobportalsystem.config;

import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.entity.Application;
import com.edutech.jobportalsystem.repository.UserRepository;
import com.edutech.jobportalsystem.repository.JobRepository;
import com.edutech.jobportalsystem.repository.ApplicationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
public class DataLoader {

    private static final Logger logger = LoggerFactory.getLogger(DataLoader.class);

    @Bean
    public CommandLineRunner loadSampleData(
            UserRepository userRepository,
            JobRepository jobRepository,
            ApplicationRepository applicationRepository,
            com.edutech.jobportalsystem.repository.JobSeekerProfileRepository profileRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.data-loader.enabled:false}") boolean enabled,
            @Value("${app.data-loader.sample-password:ChangeMe123!}") String samplePassword
    ) {
        return args -> {
            if (!enabled) {
                logger.info("Data loader is disabled");
                return;
            }

            // Check if sample data already exists
            if (userRepository.count() > 1) { // More than just admin
                logger.info("Sample data already exists, skipping data loading");
                return;
            }

            logger.info("Loading sample data into database...");

            // Create sample recruiters
            User recruiter1 = new User();
            recruiter1.setUsername("john.recruiter");
            recruiter1.setEmail("john@techcorp.com");
            recruiter1.setPassword(passwordEncoder.encode(samplePassword));
            recruiter1.setRole("RECRUITER");
            recruiter1.setCompanyName("TechCorp Solutions");
            userRepository.save(recruiter1);
            logger.info("Created recruiter: {}", recruiter1.getUsername());

            User recruiter2 = new User();
            recruiter2.setUsername("sarah.recruiter");
            recruiter2.setEmail("sarah@startups.com");
            recruiter2.setPassword(passwordEncoder.encode(samplePassword));
            recruiter2.setRole("RECRUITER");
            recruiter2.setCompanyName("Startup Hub");
            userRepository.save(recruiter2);
            logger.info("Created recruiter: {}", recruiter2.getUsername());

            // Create sample job applicants with profiles
            User jobSeeker1 = new User();
            jobSeeker1.setUsername("alice.developer");
            jobSeeker1.setEmail("alice@email.com");
            jobSeeker1.setPassword(passwordEncoder.encode(samplePassword));
            jobSeeker1.setRole("JOB_SEEKER");
            jobSeeker1.setLocation("San Francisco, CA");
            userRepository.save(jobSeeker1);
            
            com.edutech.jobportalsystem.entity.JobSeekerProfile profile1 = new com.edutech.jobportalsystem.entity.JobSeekerProfile();
            profile1.setUser(jobSeeker1);
            profile1.setSkills("Java, Spring Boot, SQL, REST API, Git");
            profile1.setExperienceYears(6);
            profile1.setCurrentDesignation("Java Developer");
            profile1.setExpectedSalaryMin(new java.math.BigDecimal("130000"));
            profile1.setExpectedSalaryMax(new java.math.BigDecimal("190000"));
            profile1.setWorkPreference("On-site");
            profileRepository.save(profile1);
            logger.info("Created job applicant and profile: {}", jobSeeker1.getUsername());

            User jobSeeker2 = new User();
            jobSeeker2.setUsername("bob.designer");
            jobSeeker2.setEmail("bob@email.com");
            jobSeeker2.setPassword(passwordEncoder.encode(samplePassword));
            jobSeeker2.setRole("JOB_SEEKER");
            jobSeeker2.setLocation("New York, NY");
            userRepository.save(jobSeeker2);
            
            com.edutech.jobportalsystem.entity.JobSeekerProfile profile2 = new com.edutech.jobportalsystem.entity.JobSeekerProfile();
            profile2.setUser(jobSeeker2);
            profile2.setSkills("Figma, Adobe XD, UI Design, UX Research");
            profile2.setExperienceYears(4);
            profile2.setCurrentDesignation("UI Designer");
            profile2.setExpectedSalaryMin(new java.math.BigDecimal("95000"));
            profile2.setExpectedSalaryMax(new java.math.BigDecimal("150000"));
            profile2.setWorkPreference("Hybrid");
            profileRepository.save(profile2);
            logger.info("Created job applicant and profile: {}", jobSeeker2.getUsername());

            User jobSeeker3 = new User();
            jobSeeker3.setUsername("charlie.fullstack");
            jobSeeker3.setEmail("charlie@email.com");
            jobSeeker3.setPassword(passwordEncoder.encode(samplePassword));
            jobSeeker3.setRole("JOB_SEEKER");
            jobSeeker3.setLocation("Remote");
            userRepository.save(jobSeeker3);
            
            com.edutech.jobportalsystem.entity.JobSeekerProfile profile3 = new com.edutech.jobportalsystem.entity.JobSeekerProfile();
            profile3.setUser(jobSeeker3);
            profile3.setSkills("JavaScript, React, Node.js, TypeScript, PostgreSQL");
            profile3.setExperienceYears(3);
            profile3.setCurrentDesignation("Software Engineer");
            profile3.setExpectedSalaryMin(new java.math.BigDecimal("85000"));
            profile3.setExpectedSalaryMax(new java.math.BigDecimal("135000"));
            profile3.setWorkPreference("Remote");
            profileRepository.save(profile3);
            logger.info("Created job applicant and profile: {}", jobSeeker3.getUsername());

            // Create sample jobs with requirements
            Job job1 = new Job();
            job1.setTitle("Senior Java Developer");
            job1.setDescription("We are looking for an experienced Java developer with 5+ years of experience in Spring Boot development.");
            job1.setLocation("San Francisco, CA");
            job1.setWorkType("On-site");
            job1.setExperienceRequired(5);
            job1.setRequiredSkills("Java, Spring Boot, SQL, Microservices, AWS");
            job1.setSalaryMin(new java.math.BigDecimal("120000"));
            job1.setSalaryMax(new java.math.BigDecimal("180000"));
            job1.setPostedBy(recruiter1);
            job1.setIsActive(true);
            job1.setSlug("senior-java-developer-techcorp");
            jobRepository.save(job1);
            logger.info("Created job: {}", job1.getTitle());

            Job job2 = new Job();
            job2.setTitle("UI/UX Designer");
            job2.setDescription("Join our design team to create beautiful and intuitive user experiences for our web and mobile applications.");
            job2.setLocation("New York, NY");
            job2.setWorkType("Hybrid");
            job2.setExperienceRequired(3);
            job2.setRequiredSkills("Figma, Adobe XD, User Research, Prototyping");
            job2.setSalaryMin(new java.math.BigDecimal("90000"));
            job2.setSalaryMax(new java.math.BigDecimal("140000"));
            job2.setPostedBy(recruiter1);
            job2.setIsActive(true);
            job2.setSlug("ui-ux-designer-techcorp");
            jobRepository.save(job2);
            logger.info("Created job: {}", job2.getTitle());

            Job job3 = new Job();
            job3.setTitle("Full Stack Developer");
            job3.setDescription("We need a talented full stack developer to work on both front-end and back-end technologies.");
            job3.setLocation("Remote");
            job3.setWorkType("Remote");
            job3.setExperienceRequired(2);
            job3.setRequiredSkills("JavaScript, React, Node.js, TypeScript, PostgreSQL");
            job3.setSalaryMin(new java.math.BigDecimal("80000"));
            job3.setSalaryMax(new java.math.BigDecimal("130000"));
            job3.setPostedBy(recruiter2);
            job3.setIsActive(true);
            job3.setSlug("full-stack-developer-startups");
            jobRepository.save(job3);
            logger.info("Created job: {}", job3.getTitle());

            Job job4 = new Job();
            job4.setTitle("Python Backend Engineer");
            job4.setDescription("Develop high-performance backend services using Python and FastAPI.");
            job4.setLocation("San Francisco, CA");
            job4.setWorkType("Hybrid");
            job4.setExperienceRequired(4);
            job4.setRequiredSkills("Python, FastAPI, Redis, Docker, PostgreSQL");
            job4.setSalaryMin(new java.math.BigDecimal("110000"));
            job4.setSalaryMax(new java.math.BigDecimal("160000"));
            job4.setPostedBy(recruiter1);
            job4.setIsActive(true);
            job4.setSlug("python-backend-engineer-techcorp");
            jobRepository.save(job4);
            logger.info("Created job: {}", job4.getTitle());

            // Create sample applications
            Application app1 = new Application();
            app1.setApplicant(jobSeeker1);
            app1.setJob(job1);
            app1.setStatus("APPLIED");
            applicationRepository.save(app1);
            logger.info("Created application: {} applied for {}", jobSeeker1.getUsername(), job1.getTitle());

            Application app2 = new Application();
            app2.setApplicant(jobSeeker2);
            app2.setJob(job2);
            app2.setStatus("APPLIED");
            applicationRepository.save(app2);
            logger.info("Created application: {} applied for {}", jobSeeker2.getUsername(), job2.getTitle());

            Application app3 = new Application();
            app3.setApplicant(jobSeeker3);
            app3.setJob(job3);
            app3.setStatus("HIRED");
            applicationRepository.save(app3);
            logger.info("Created application: {} applied for {}", jobSeeker3.getUsername(), job3.getTitle());

            Application app4 = new Application();
            app4.setApplicant(jobSeeker1);
            app4.setJob(job4);
            app4.setStatus("REJECTED");
            applicationRepository.save(app4);
            logger.info("Created application: {} applied for {}", jobSeeker1.getUsername(), job4.getTitle());

            logger.warn("========================================");
            logger.warn("SAMPLE DATA LOADED SUCCESSFULLY!");
            logger.warn("========================================");
            logger.warn("Sample Users Created:");
            logger.warn("Recruiters: john.recruiter, sarah.recruiter");
            logger.warn("job applicants: alice.developer, bob.designer, charlie.manager");
            logger.warn("Password for all sample users: configured via app.data-loader.sample-password");
            logger.warn("========================================");
            logger.warn("Sample Jobs: {} jobs created", jobRepository.count() - 1);
            logger.warn("Sample Applications: {} applications created", applicationRepository.count());
            logger.warn("========================================");
        };
    }
}
