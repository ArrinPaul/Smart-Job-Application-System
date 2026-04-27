package com.edutech.jobportalsystem.repository;

import com.edutech.jobportalsystem.entity.JobSeekerProfile;
import com.edutech.jobportalsystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface JobSeekerProfileRepository extends JpaRepository<JobSeekerProfile, Long> {
    Optional<JobSeekerProfile> findByUser(User user);
    Optional<JobSeekerProfile> findByUserId(Long userId);
}
