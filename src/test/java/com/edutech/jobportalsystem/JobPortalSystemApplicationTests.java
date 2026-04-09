package com.edutech.jobportalsystem;

// File: src/test/java/com/edutech/jobportalsystem/JobPortalSystemApplicationTests.java

import com.edutech.jobportalsystem.entity.*;
import com.edutech.jobportalsystem.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@org.springframework.test.context.ActiveProfiles("test")
class JobPortalSystemApplicationTests {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ResumeRepository resumeRepository;

    @Test
    void testEntityLifecycleAndRepositories() {
        // 1. Create User
        User user = new User();
        user.setUsername("testuser");
        user.setPassword("password");
        user.setEmail("test@example.com");
        user.setRole("JOB_SEEKER");
        User savedUser = userRepository.save(user);

        assertNotNull(savedUser.getId());
        assertEquals("testuser", savedUser.getUsername());

        // 2. Create Job
        User recruiter = new User();
        recruiter.setUsername("recruiter1");
        recruiter.setPassword("password");
        recruiter.setEmail("recruiter@example.com");
        recruiter.setRole("RECRUITER");
        userRepository.save(recruiter);

        Job job = new Job();
        job.setTitle("Software Engineer");
        job.setDescription("Excellent role");
        job.setLocation("Remote");
        job.setPostedBy(recruiter);
        Job savedJob = jobRepository.save(job);

        assertNotNull(savedJob.getId());
        assertNotNull(savedJob.getCreatedAt());

        // 3. Create Application
        Application application = new Application();
        application.setApplicant(savedUser);
        application.setJob(savedJob);
        Application savedApp = applicationRepository.save(application);

        assertNotNull(savedApp.getId());
        assertEquals("APPLIED", savedApp.getStatus());
        assertNotNull(savedApp.getAppliedAt());

        // 4. Create Resume
        Resume resume = new Resume();
        resume.setOwner(savedUser);
        resume.setFileName("resume.pdf");
        resume.setFileType("application/pdf");
        resume.setData("content".getBytes());
        Resume savedResume = resumeRepository.save(resume);

        assertNotNull(savedResume.getId());
        assertNotNull(savedResume.getUploadedAt());

        // 5. Test Repository Methods
        Optional<User> foundUser = userRepository.findByUsername("testuser");
        assertTrue(foundUser.isPresent());

        assertTrue(userRepository.existsByEmail("test@example.com"));

        assertFalse(jobRepository.findByTitleContainingIgnoreCase("Software").isEmpty());
        
        assertTrue(applicationRepository.existsByApplicantAndJob(savedUser, savedJob));
        
        assertTrue(resumeRepository.findByOwner(savedUser).isPresent());
    }
}
