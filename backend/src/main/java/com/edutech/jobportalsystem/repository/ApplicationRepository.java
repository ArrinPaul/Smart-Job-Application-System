package com.edutech.jobportalsystem.repository;

// File: ./src/main/java/com/edutech/jobportalsystem/repository/ApplicationRepository.java

import com.edutech.jobportalsystem.entity.Application;
import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findByApplicant(User applicant);

    List<Application> findByJob(Job job);

    List<Application> findByJobIn(List<Job> jobs);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM Application a WHERE a.job.postedBy.username = :username")
    List<Application> findAllByRecruiterUsername(@org.springframework.data.repository.query.Param("username") String username);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM Application a WHERE a.job.postedBy.username = :username AND a.status = :status")
    List<Application> findAllByRecruiterUsernameAndStatus(@org.springframework.data.repository.query.Param("username") String username, @org.springframework.data.repository.query.Param("status") String status);

    @org.springframework.data.jpa.repository.Query("SELECT a FROM Application a WHERE a.job.postedBy.username = :username AND a.status IN :statuses")
    List<Application> findAllByRecruiterUsernameAndStatusIn(@org.springframework.data.repository.query.Param("username") String username, @org.springframework.data.repository.query.Param("statuses") List<String> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT a.status, COUNT(a) FROM Application a WHERE a.job.postedBy.username = :username GROUP BY a.status")
    List<Object[]> countApplicationsByStatusForRecruiter(@org.springframework.data.repository.query.Param("username") String username);

    List<Application> findByApplicantAndStatus(User applicant, String status);

    List<Application> findByApplicantAndStatusIn(User applicant, List<String> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT a.status, COUNT(a) FROM Application a WHERE a.applicant = :applicant GROUP BY a.status")
    List<Object[]> countApplicationsByStatusForApplicant(@org.springframework.data.repository.query.Param("applicant") User applicant);


    Boolean existsByApplicantAndJob(User applicant, Job job);

    List<Application> findByAppliedAtAfter(LocalDateTime appliedAt);

    long countByAppliedAtAfter(LocalDateTime appliedAt);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(DISTINCT a.applicant.id) FROM Application a WHERE a.appliedAt > :since")
    long countDistinctApplicantsSince(@org.springframework.data.repository.query.Param("since") LocalDateTime since);

    @org.springframework.data.jpa.repository.Query("SELECT a.status, COUNT(a) FROM Application a GROUP BY a.status")
    List<Object[]> countApplicationsByStatus();
}
