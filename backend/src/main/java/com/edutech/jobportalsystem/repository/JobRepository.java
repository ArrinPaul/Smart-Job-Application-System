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

    List<Job> findByTitleContainingIgnoreCase(String title, org.springframework.data.domain.Pageable pageable);

    List<Job> findByLocationContainingIgnoreCase(String location, org.springframework.data.domain.Pageable pageable);

    List<Job> findByPostedBy(User recruiter);

    List<Job> findByTitleContainingIgnoreCaseAndLocationContainingIgnoreCase(String title, String location, org.springframework.data.domain.Pageable pageable);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<Job> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime createdAt);

    List<Job> findTop5ByOrderByCreatedAtDesc();

    List<Job> findTop5ByIsActiveTrueOrderByCreatedAtDesc();

    long countByCreatedAtAfter(LocalDateTime createdAt);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT j.postedBy.id) FROM Job j WHERE j.createdAt > :since")
    long countDistinctRecruitersSince(@org.springframework.data.repository.query.Param("since") LocalDateTime since);

    List<Job> findByIsActiveTrue();

    @org.springframework.data.jpa.repository.Query("SELECT j.id FROM Job j")
    List<Long> findAllIds();

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM jobs WHERE title ~ '[^\\x00-\\x7F]' OR description ~ '[^\\x00-\\x7F]'", nativeQuery = true)
    List<Job> findJobsWithNonAsciiContent(org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query(value = "SELECT CAST(created_at AS DATE) as date, COUNT(*) as count " +
            "FROM jobs " +
            "WHERE created_at >= :since " +
            "GROUP BY CAST(created_at AS DATE) " +
            "ORDER BY CAST(created_at AS DATE) ASC", nativeQuery = true)
    List<Object[]> countJobsByDaySince(@org.springframework.data.repository.query.Param("since") LocalDateTime since);

    @org.springframework.data.jpa.repository.Query("SELECT j FROM Job j WHERE j.slug IS NULL OR j.slug = ''")
    List<Job> findJobsWithMissingSlugs();

    Optional<Job> findFirstByTitleIgnoreCaseAndCompanyNameIgnoreCase(String title, String companyName);
}
