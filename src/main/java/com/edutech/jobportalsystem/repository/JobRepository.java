package com.edutech.jobportalsystem.repository;

// File: ./src/main/java/com/edutech/jobportalsystem/repository/JobRepository.java

import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    List<Job> findByTitleContainingIgnoreCase(String title);

    List<Job> findByLocationContainingIgnoreCase(String location);

    List<Job> findByPostedBy(User recruiter);
}
