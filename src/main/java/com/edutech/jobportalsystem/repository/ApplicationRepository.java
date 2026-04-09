package com.edutech.jobportalsystem.repository;

// File: ./src/main/java/com/edutech/jobportalsystem/repository/ApplicationRepository.java

import com.edutech.jobportalsystem.entity.Application;
import com.edutech.jobportalsystem.entity.Job;
import com.edutech.jobportalsystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findByApplicant(User applicant);

    List<Application> findByJob(Job job);

    List<Application> findByJobIn(List<Job> jobs);

    Boolean existsByApplicantAndJob(User applicant, Job job);
}
