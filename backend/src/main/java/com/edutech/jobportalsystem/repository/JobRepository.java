package com.edutech.jobportalsystem.repository;

import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    
    Optional<Job> findBySlug(String slug);

    List<Job> findByTitleContainingIgnoreCase(String title);

    List<Job> findByLocationContainingIgnoreCase(String location);

    List<Job> findByPostedBy(User recruiter);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<Job> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime createdAt);

    long countByCreatedAtAfter(LocalDateTime createdAt);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT j.postedBy.id) FROM Job j WHERE j.createdAt > :since")
    long countDistinctRecruitersSince(@org.springframework.data.repository.query.Param("since") LocalDateTime since);

    List<Job> findByIsActiveTrue();

    Optional<Job> findFirstByTitleIgnoreCaseAndCompanyNameIgnoreCase(String title, String companyName);
}
