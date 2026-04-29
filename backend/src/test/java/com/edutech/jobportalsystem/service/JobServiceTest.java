package com.edutech.jobportalsystem.service;

// File: src/test/java/com/edutech/jobportalsystem/service/JobServiceTest.java

import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.repository.JobRepository;
import com.edutech.jobportalsystem.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class JobServiceTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private JobService jobService;

    private User recruiter;
    private Job job;

    @BeforeEach
    void setUp() {
        recruiter = new User();
        recruiter.setUsername("recruiter1");
        recruiter.setRole("RECRUITER");

        job = new Job();
        job.setId(1L);
        job.setTitle("Java Developer");
        job.setLocation("Chennai");
        job.setPostedBy(recruiter);
    }

    @Test
    void createJob_PersistsJobCorrectly() {
        // Arrange
        when(userRepository.findByUsername("recruiter1")).thenReturn(Optional.of(recruiter));
        when(jobRepository.save(any(Job.class))).thenReturn(job);

        // Act
        Job savedJob = jobService.createJob(new Job(), "recruiter1");

        // Assert
        assertNotNull(savedJob);
        assertEquals(recruiter, savedJob.getPostedBy());
        verify(jobRepository, times(1)).save(any(Job.class));
    }

    @Test
    void updateJob_UpdatesFieldsCorrectly() {
        // Arrange
        Job updatedJob = new Job();
        updatedJob.setTitle("Senior Java Developer");
        updatedJob.setLocation("Bangalore");

        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));
        when(jobRepository.save(any(Job.class))).thenReturn(job);

        // Act
        Job result = jobService.updateJob(1L, updatedJob, "recruiter1");

        // Assert
        assertEquals("Senior Java Developer", result.getTitle());
        assertEquals("Bangalore", result.getLocation());
        verify(jobRepository).save(job);
    }

    @Test
    void deleteJob_CallsRepository() {
        // Arrange
        when(jobRepository.findById(1L)).thenReturn(Optional.of(job));

        // Act
        jobService.deleteJob(1L, "recruiter1");

        // Assert
        verify(jobRepository, times(1)).deleteById(1L);
    }

    @Test
    void searchJobs_ByTitle_ReturnsFilteredList() {
        // Arrange
        when(jobRepository.findByTitleContainingIgnoreCase(eq("Java"), any(Pageable.class))).thenReturn(List.of(job));

        // Act
        List<Job> result = jobService.searchJobs("Java", null);

        // Assert
        assertEquals(1, result.size());
        assertEquals("Java Developer", result.get(0).getTitle());
    }

    @Test
    void searchJobs_ByLocation_ReturnsFilteredList() {
        // Arrange
        when(jobRepository.findByLocationContainingIgnoreCase(eq("Bangalore"), any(Pageable.class))).thenReturn(List.of(job));

        // Act
        List<Job> result = jobService.searchJobs(null, "Bangalore");

        // Assert
        assertEquals(1, result.size());
    }

    @Test
    void getAllJobs_CallsFindAll() {
        // Arrange
        when(jobRepository.findAll()).thenReturn(List.of(job));

        // Act
        List<Job> result = jobService.getAllJobs();

        // Assert
        assertEquals(1, result.size());
        verify(jobRepository).findAll();
    }
}
