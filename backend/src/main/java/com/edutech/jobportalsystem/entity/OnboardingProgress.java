package com.edutech.jobportalsystem.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "onboarding_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingProgress {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @Column(name = "current_step", nullable = false)
    private Integer currentStep = 1;
    
    @Column(name = "max_step_reached", nullable = false)
    private Integer maxStepReached = 1;
    
    @Column(name = "step1_completed", nullable = false)
    private Boolean step1Completed = false;
    
    @Column(name = "step2_completed", nullable = false)
    private Boolean step2Completed = false;
    
    @Column(name = "step3_completed", nullable = false)
    private Boolean step3Completed = false;
    
    @Column(name = "step4_completed", nullable = false)
    private Boolean step4Completed = false;
    
    @Column(name = "step5_completed", nullable = false)
    private Boolean step5Completed = false;
    
    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt = LocalDateTime.now();
    
    @Column(name = "last_updated_at", nullable = false)
    private LocalDateTime lastUpdatedAt = LocalDateTime.now();
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    public boolean isCompleted() {
        return step1Completed && step2Completed && step3Completed && step4Completed && step5Completed;
    }
    
    public int getCompletionPercentage() {
        int completed = (step1Completed ? 1 : 0) + 
                        (step2Completed ? 1 : 0) + 
                        (step3Completed ? 1 : 0) + 
                        (step4Completed ? 1 : 0) + 
                        (step5Completed ? 1 : 0);
        return (completed * 100) / 5;
    }
}
