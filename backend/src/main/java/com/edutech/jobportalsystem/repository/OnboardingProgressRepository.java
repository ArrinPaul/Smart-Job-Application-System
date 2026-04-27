package com.edutech.jobportalsystem.repository;

import com.edutech.jobportalsystem.entity.OnboardingProgress;
import com.edutech.jobportalsystem.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface OnboardingProgressRepository extends JpaRepository<OnboardingProgress, Long> {
    Optional<OnboardingProgress> findByUser(User user);
    Optional<OnboardingProgress> findByUserId(Long userId);
}
