package com.edutech.jobportalsystem.service;

import com.edutech.jobportalsystem.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AuthNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(AuthNotificationService.class);

    @Value("${app.security.frontend-base-url:http://localhost:4200}")
    private String frontendBaseUrl;

    public void sendEmailVerification(User user) {
        logger.info("Email verification workflow triggered for user {}", user.getUsername());
    }

    public void sendPasswordReset(User user) {
        logger.info("Password reset workflow triggered for user {}", user.getUsername());
    }
}
