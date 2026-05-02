package com.edutech.jobportalsystem.service;

import com.edutech.jobportalsystem.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class AuthNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(AuthNotificationService.class);

    private final JavaMailSender mailSender;

    public AuthNotificationService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Value("${app.security.frontend-base-url:http://localhost:4200}")
    private String frontendBaseUrl;

    @Value("${app.security.email.enabled:false}")
    private boolean emailEnabled;

    @Value("${app.security.email.from:no-reply@vecta.ai}")
    private String fromEmail;

    public void sendEmailVerification(User user) {
        String link = frontendBaseUrl + "/verify-email?token=" + user.getEmailVerificationToken();
        sendEmail(
                user.getEmail(),
                "Verify your Vecta account",
                "Hello " + user.getUsername() + ",\n\nPlease verify your email by opening this link:\n" + link +
                        "\n\nThis link expires in 24 hours."
        );
    }

    public void sendPasswordReset(User user) {
        String link = frontendBaseUrl + "/reset-password?token=" + user.getPasswordResetToken();
        sendEmail(
                user.getEmail(),
                "Reset your Vecta password",
                "Hello " + user.getUsername() + ",\n\nA password reset was requested for your account. " +
                        "Use this link to set a new password:\n" + link +
                        "\n\nThis link expires in 30 minutes. If you did not request this, you can ignore this email."
        );
    }

    private void sendEmail(String to, String subject, String body) {
        if (!emailEnabled) {
            logger.warn("Security email notifications are disabled. Skipping email to {}", to);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            logger.info("Security email sent to {}", to);
        } catch (Exception ex) {
            logger.error("Failed to send security email to {}", to, ex);
        }
    }
}
