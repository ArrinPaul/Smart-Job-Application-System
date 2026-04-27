package com.edutech.jobportalsystem.service;

// File: ./backend/src/main/java/com/edutech/jobportalsystem/service/UserService.java

import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.dto.auth.RegisterRequest;
import com.edutech.jobportalsystem.exception.BadRequestException;
import com.edutech.jobportalsystem.exception.ResourceNotFoundException;
import com.edutech.jobportalsystem.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class UserService implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int CAPTCHA_THRESHOLD = 3;
    private static final int LOCK_MINUTES = 15;
    private static final int VERIFICATION_TOKEN_HOURS = 24;
    private static final int PASSWORD_RESET_TOKEN_MINUTES = 30;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        logger.debug("Loading user for auth: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
        );
    }

    public User registerUser(User user) {
        logger.info("Processing registration for user: {}", user.getUsername());
        String username = normalizeUsername(user.getUsername());
        String email = normalizeEmail(user.getEmail());

        if (userRepository.existsByUsername(username)) {
            logger.warn("Registration failed: Username {} taken", username);
            throw new BadRequestException("Username already taken");
        }

        if (userRepository.existsByEmail(email)) {
            logger.warn("Registration failed: Email {} taken", email);
            throw new BadRequestException("Email already registered");
        }

        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationExpiry(null);
        user.setFailedLoginAttempts(0);
        user.setLockUntil(null);
        user.setTokenVersion(0L);
        user.setMfaEnabled(false);

        User savedUser = userRepository.save(user);
        logger.info("User {} registered successfully", savedUser.getUsername());
        return savedUser;
    }

    public User registerUser(RegisterRequest request) {
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setRole(request.getRole());
        return registerUser(user);
    }

    public boolean requiresCaptcha(String username) {
        return false;
    }

    public void onAuthenticationFailure(String username, String remoteIp, String userAgent) {
        if (username == null || username.isBlank()) {
            logger.warn("Failed authentication with empty username from {}", remoteIp);
            return;
        }

        userRepository.findByUsername(normalizeUsername(username)).ifPresentOrElse(
                user -> logger.warn("Failed login for user {} from IP {} and agent {}", user.getUsername(), remoteIp, abbreviate(userAgent, 100)),
                () -> logger.warn("Failed login for unknown username {} from {}", username, remoteIp)
        );
    }

    public User onAuthenticationSuccess(String username, String remoteIp, String userAgent) {
        User user = userRepository.findByUsername(normalizeUsername(username))
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        if (user.getLastLoginIp() != null && !user.getLastLoginIp().equals(remoteIp)) {
            logger.warn("Unusual login location change for user {}: {} -> {}", user.getUsername(), user.getLastLoginIp(), remoteIp);
        }

        if (user.getLastLoginUserAgent() != null && !user.getLastLoginUserAgent().equals(userAgent)) {
            logger.warn("Unusual device change for user {}", user.getUsername());
        }

        user.setFailedLoginAttempts(0);
        user.setLockUntil(null);
        user.setLastLoginIp(remoteIp);
        user.setLastLoginUserAgent(abbreviate(userAgent, 500));
        user.setLastLoginAt(LocalDateTime.now());
        user.setTokenVersion((user.getTokenVersion() == null ? 0L : user.getTokenVersion()) + 1L);
        return userRepository.save(user);
    }

    public void verifyEmail(String token) {
        User user = userRepository.findByEmailVerificationToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired verification token"));

        if (user.getEmailVerificationExpiry() == null || user.getEmailVerificationExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Invalid or expired verification token");
        }

        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationExpiry(null);
        userRepository.save(user);
    }

    public User createPasswordResetToken(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }

        return userRepository.findByEmail(normalizeEmail(email)).map(user -> {
            user.setPasswordResetToken(generateSecureToken());
            user.setPasswordResetExpiry(LocalDateTime.now().plusMinutes(PASSWORD_RESET_TOKEN_MINUTES));
            return userRepository.save(user);
        }).orElse(null);
    }

    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset token"));

        if (user.getPasswordResetExpiry() == null || user.getPasswordResetExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Invalid or expired reset token");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiry(null);
        user.setFailedLoginAttempts(0);
        user.setLockUntil(null);
        user.setTokenVersion((user.getTokenVersion() == null ? 0L : user.getTokenVersion()) + 1L);
        userRepository.save(user);
    }

    public Map<String, String> setupMfa(String username, TotpService totpService) {
        User user = getUserByUsername(username);
        String secret = totpService.generateSecret();
        user.setMfaSecret(secret);
        user.setMfaEnabled(false);
        userRepository.save(user);

        return Map.of(
                "secret", secret,
                "otpauthUrl", totpService.buildOtpAuthUri(user.getUsername(), secret)
        );
    }

    public void enableMfa(String username, String code, TotpService totpService) {
        User user = getUserByUsername(username);
        if (!totpService.verifyCode(user.getMfaSecret(), code)) {
            throw new BadRequestException("Invalid OTP code");
        }
        user.setMfaEnabled(true);
        userRepository.save(user);
    }

    public void disableMfa(String username, String code, TotpService totpService) {
        User user = getUserByUsername(username);
        if (!totpService.verifyCode(user.getMfaSecret(), code)) {
            throw new BadRequestException("Invalid OTP code");
        }
        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        userRepository.save(user);
    }

    public List<User> getAllUsers() {
        logger.debug("Fetching all users from database");
        return userRepository.findAll();
    }

    public User getUserByUsername(String username) {
        logger.debug("Fetching user by username: {}", username);
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
    }

    public User completeOnboarding(String username, Map<String, Object> profileData) {
        User user = getUserByUsername(username);
        
        if (profileData.containsKey("fullName")) user.setFullName((String) profileData.get("fullName"));
        if (profileData.containsKey("headline")) user.setHeadline((String) profileData.get("headline"));
        if (profileData.containsKey("bio")) user.setBio((String) profileData.get("bio"));
        if (profileData.containsKey("location")) user.setLocation((String) profileData.get("location"));
        if (profileData.containsKey("skills")) user.setSkills((String) profileData.get("skills"));
        if (profileData.containsKey("companyName")) user.setCompanyName((String) profileData.get("companyName"));
        if (profileData.containsKey("website")) user.setWebsite((String) profileData.get("website"));
        
        user.setOnboardingCompleted(true);
        logger.info("User {} completed onboarding", username);
        return userRepository.save(user);
    }

    private String generateSecureToken() {
        return UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
    }

    private String normalizeUsername(String username) {
        return username == null ? null : username.trim();
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private String abbreviate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }
}
