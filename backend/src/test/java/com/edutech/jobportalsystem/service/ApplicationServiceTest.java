package com.edutech.jobportalsystem.service;

// File: src/test/java/com/edutech/jobportalsystem/service/ApplicationServiceTest.java

import com.edutech.jobportalsystem.entity.Application;
import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.repository.ApplicationRepository;
import com.edutech.jobportalsystem.repository.JobRepository;
import com.edutech.jobportalsystem.repository.ResumeRepository;
import com.edutech.jobportalsystem.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private ResumeRepository resumeRepository;

    @InjectMocks
    private ApplicationService applicationService;

    private User applicant;
    private Job job;
    private Application application;

    @BeforeEach
    void setUp() {
        applicant = new User();
        applicant.setId(1L);
        applicant.setUsername("seeker1");

        job = new Job();
        job.setId(1L);
        job.setTitle("Java Dev");

        application = new Application();
        application.setId(1L);
        application.setApplicant(applicant);
        application.setJob(job);
        application.setStatus("APPLIED");
    }

    @Test
    void applyForJob_MapsUserAndJobCorrectly() {
        // Arrange
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        when(userRepository.findById(1L)).thenReturn(Optional.of(applicant));
        when(resumeRepository.findByOwner(applicant)).thenReturn(Optional.empty());
        when(applicationRepository.existsByApplicantAndJob(applicant, job)).thenReturn(false);
        when(applicationRepository.save(any(Application.class))).thenReturn(application);

        // Act
        Application savedApp = applicationService.applyForJob(1L, 1L);

        // Assert
        assertNotNull(savedApp);
        assertEquals(applicant, savedApp.getApplicant());
        assertEquals(job, savedApp.getJob());
        verify(applicationRepository, times(1)).save(any(Application.class));
    }

    @Test
    void applyForJob_AlreadyApplied_ThrowsException() {
        // Arrange
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        when(userRepository.findById(1L)).thenReturn(Optional.of(applicant));
        when(resumeRepository.findByOwner(applicant)).thenReturn(Optional.empty());
        when(applicationRepository.existsByApplicantAndJob(applicant, job)).thenReturn(true);

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            applicationService.applyForJob(1L, 1L);
        });
        verify(applicationRepository, never()).save(any(Application.class));
    }

    @Test
    void updateApplicationStatus_SetsStatusCorrectly() {
        // Arrange
        when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));
        when(applicationRepository.save(any(Application.class))).thenReturn(application);

        // Act
        Application result = applicationService.updateApplicationStatus(1L, "SHORTLISTED");

        // Assert
        assertEquals("SHORTLISTED", result.getStatus());
        verify(applicationRepository).save(application);
    }
}
