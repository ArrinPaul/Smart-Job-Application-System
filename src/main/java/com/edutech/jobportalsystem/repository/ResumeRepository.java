package com.edutech.jobportalsystem.repository;

// File: src/main/java/com/edutech/jobportalsystem/repository/ResumeRepository.java

import com.edutech.jobportalsystem.entity.Resume;
import com.edutech.jobportalsystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {

    Optional<Resume> findByOwner(User owner);
}
