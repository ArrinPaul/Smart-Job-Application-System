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
            PasswordEncoder passwordEncoder,
            @Value("${app.data-loader.enabled:true}") boolean enabled
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
            recruiter1.setPassword(passwordEncoder.encode("password123"));
            recruiter1.setRole("RECRUITER");
            userRepository.save(recruiter1);
            logger.info("Created recruiter: {}", recruiter1.getUsername());

            User recruiter2 = new User();
            recruiter2.setUsername("sarah.recruiter");
            recruiter2.setEmail("sarah@startups.com");
            recruiter2.setPassword(passwordEncoder.encode("password123"));
            recruiter2.setRole("RECRUITER");
            userRepository.save(recruiter2);
            logger.info("Created recruiter: {}", recruiter2.getUsername());

            // Create sample job seekers
            User jobSeeker1 = new User();
            jobSeeker1.setUsername("alice.developer");
            jobSeeker1.setEmail("alice@email.com");
            jobSeeker1.setPassword(passwordEncoder.encode("password123"));
            jobSeeker1.setRole("JOB_SEEKER");
            userRepository.save(jobSeeker1);
            logger.info("Created job seeker: {}", jobSeeker1.getUsername());

            User jobSeeker2 = new User();
            jobSeeker2.setUsername("bob.designer");
            jobSeeker2.setEmail("bob@email.com");
            jobSeeker2.setPassword(passwordEncoder.encode("password123"));
            jobSeeker2.setRole("JOB_SEEKER");
            userRepository.save(jobSeeker2);
            logger.info("Created job seeker: {}", jobSeeker2.getUsername());

            User jobSeeker3 = new User();
            jobSeeker3.setUsername("charlie.manager");
            jobSeeker3.setEmail("charlie@email.com");
            jobSeeker3.setPassword(passwordEncoder.encode("password123"));
            jobSeeker3.setRole("JOB_SEEKER");
            userRepository.save(jobSeeker3);
            logger.info("Created job seeker: {}", jobSeeker3.getUsername());

            // Create sample jobs
            Job job1 = new Job();
            job1.setTitle("Senior Java Developer");
            job1.setDescription("We are looking for an experienced Java developer with 5+ years of experience in Spring Boot development.");
            job1.setLocation("San Francisco, CA");
            job1.setPostedBy(recruiter1);
            jobRepository.save(job1);
            logger.info("Created job: {}", job1.getTitle());

            Job job2 = new Job();
            job2.setTitle("UI/UX Designer");
            job2.setDescription("Join our design team to create beautiful and intuitive user experiences for our web and mobile applications.");
            job2.setLocation("New York, NY");
            job2.setPostedBy(recruiter1);
            jobRepository.save(job2);
            logger.info("Created job: {}", job2.getTitle());

            Job job3 = new Job();
            job3.setTitle("Project Manager");
            job3.setDescription("Lead cross-functional teams to deliver innovative software solutions on time and within budget.");
            job3.setLocation("Austin, TX");
            job3.setPostedBy(recruiter2);
            jobRepository.save(job3);
            logger.info("Created job: {}", job3.getTitle());

            Job job4 = new Job();
            job4.setTitle("Full Stack Developer");
            job4.setDescription("We need a talented full stack developer to work on both front-end and back-end technologies.");
            job4.setLocation("Remote");
            job4.setPostedBy(recruiter2);
            jobRepository.save(job4);
            logger.info("Created job: {}", job4.getTitle());

            Job job5 = new Job();
            job5.setTitle("Data Scientist");
            job5.setDescription("Help us build machine learning models to solve complex business problems with big data analytics.");
            job5.setLocation("Boston, MA");
            job5.setPostedBy(recruiter1);
            jobRepository.save(job5);
            logger.info("Created job: {}", job5.getTitle());

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
            logger.warn("Job Seekers: alice.developer, bob.designer, charlie.manager");
            logger.warn("Password for all sample users: password123");
            logger.warn("========================================");
            logger.warn("Sample Jobs: {} jobs created", jobRepository.count() - 1);
            logger.warn("Sample Applications: {} applications created", applicationRepository.count());
            logger.warn("========================================");
        };
    }
}
