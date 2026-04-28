package com.edutech.jobportalsystem.controller;

// File: ./backend/src/main/java/com/edutech/jobportalsystem/controller/AuthController.java

import com.edutech.jobportalsystem.dto.auth.ForgotPasswordRequest;
import com.edutech.jobportalsystem.dto.auth.LoginRequest;
import com.edutech.jobportalsystem.dto.auth.MfaCodeRequest;
import com.edutech.jobportalsystem.dto.auth.RegisterRequest;
import com.edutech.jobportalsystem.dto.auth.ResetPasswordRequest;
import com.edutech.jobportalsystem.dto.onboarding.OnboardingStepRequest;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.exception.BadRequestException;
import com.edutech.jobportalsystem.jwt.JwtUtil;
import com.edutech.jobportalsystem.service.AuthNotificationService;
import com.edutech.jobportalsystem.service.OnboardingService;
import com.edutech.jobportalsystem.service.TotpService;
import com.edutech.jobportalsystem.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private OnboardingService onboardingService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private TotpService totpService;

    @Autowired
    private AuthNotificationService authNotificationService;

    @Value("${app.security.cookie.name:AUTH_TOKEN}")
    private String authCookieName;

    @Value("${app.security.cookie.secure:true}")
    private boolean secureCookie;

    @Value("${app.security.cookie.same-site:Strict}")
    private String sameSite;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest request) {
        logger.info("Registering user request received for username: {}", request.getUsername());
        userService.registerUser(request);
        return ResponseEntity.ok(Map.of("message", "Registration request processed successfully."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@Valid @RequestBody LoginRequest request,
                                       HttpServletRequest httpRequest,
                                       HttpServletResponse httpResponse) {
        logger.info("Login request for user: {}", request.getUsername());

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (RuntimeException ex) {
            userService.onAuthenticationFailure(request.getUsername(), httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"));
            throw ex;
        }

        User user = userService.onAuthenticationSuccess(
                request.getUsername(),
                httpRequest.getRemoteAddr(),
                httpRequest.getHeader("User-Agent")
        );

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole(), user.getTokenVersion());

        ResponseCookie cookie = ResponseCookie.from(authCookieName, token)
                .httpOnly(true)
                .secure(secureCookie)
                .path("/")
                .sameSite(sameSite)
                .maxAge(Duration.ofMillis(jwtExpiration))
                .build();

        httpResponse.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        logger.info("User {} logged in successfully", user.getUsername());
        return ResponseEntity.ok(Map.of(
                "role", user.getRole(),
                "username", user.getUsername(),
                "id", user.getId(),
                "mfaEnabled", user.getMfaEnabled(),
                "onboardingCompleted", user.getOnboardingCompleted(),
                "token", token
        ));
    }

    @PostMapping("/onboarding/complete")
    public ResponseEntity<?> completeOnboarding(@RequestBody Map<String, Object> profileData) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.completeOnboarding(username, profileData);
        return ResponseEntity.ok(Map.of(
                "message", "Onboarding completed",
                "onboardingCompleted", user.getOnboardingCompleted()
        ));
    }

    // ========== NEW STEP-BASED ONBOARDING ENDPOINTS ==========
    
    @GetMapping("/onboarding/status")
    public ResponseEntity<?> getOnboardingStatus() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Fetching onboarding status for user: {}", username);
        return ResponseEntity.ok(onboardingService.getOnboardingStatus(username));
    }

    @GetMapping("/onboarding/profile")
    public ResponseEntity<?> getOnboardingProfile() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Fetching onboarding profile for user: {}", username);
        return ResponseEntity.ok(onboardingService.getCurrentUserProfile(username));
    }

    @PostMapping("/onboarding/step/1")
    public ResponseEntity<?> saveStep1(@Valid @RequestBody OnboardingStepRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Saving onboarding step 1 for user: {}", username);
        return ResponseEntity.ok(onboardingService.saveStep1(username, request));
    }

    @PostMapping("/onboarding/step/2")
    public ResponseEntity<?> saveStep2(@Valid @RequestBody OnboardingStepRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Saving onboarding step 2 for user: {}", username);
        return ResponseEntity.ok(onboardingService.saveStep2(username, request));
    }

    @PostMapping("/onboarding/step/3")
    public ResponseEntity<?> saveStep3(@Valid @RequestBody OnboardingStepRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Saving onboarding step 3 for user: {}", username);
        return ResponseEntity.ok(onboardingService.saveStep3(username, request));
    }

    @PostMapping("/onboarding/step/4")
    public ResponseEntity<?> saveStep4(@Valid @RequestBody OnboardingStepRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Saving onboarding step 4 for user: {}", username);
        return ResponseEntity.ok(onboardingService.saveStep4(username, request));
    }

    @PostMapping("/onboarding/step/5")
    public ResponseEntity<?> completeOnboardingStep5() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.info("Completing onboarding for user: {}", username);
        return ResponseEntity.ok(onboardingService.completeOnboarding(username));
    }

    @PostMapping("/onboarding/skip")
    public ResponseEntity<?> skipOnboarding() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        logger.warn("User {} is skipping onboarding", username);
        onboardingService.skipOnboarding(username);
        return ResponseEntity.ok(Map.of(
                "message", "Onboarding skipped",
                "onboardingCompleted", true
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(authCookieName, "")
                .httpOnly(true)
                .secure(secureCookie)
                .path("/")
                .sameSite(sameSite)
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        userService.verifyEmail(token);
        return ResponseEntity.ok(Map.of("message", "Email verified successfully"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        User user = userService.createPasswordResetToken(request.getEmail());
        if (user != null) {
            authNotificationService.sendPasswordReset(user);
        }
        return ResponseEntity.ok(Map.of("message", "If an account exists, reset instructions have been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        userService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "Password reset successful"));
    }

    @GetMapping("/session")
    public ResponseEntity<?> currentSession() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        User user = userService.getUserByUsername(authentication.getName());
        return ResponseEntity.ok(Map.of(
                "username", user.getUsername(),
                "role", user.getRole(),
                "id", user.getId(),
                "mfaEnabled", user.getMfaEnabled()
        ));
    }

    @PostMapping("/mfa/setup")
    public ResponseEntity<?> setupMfa() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(userService.setupMfa(username, totpService));
    }

    @PostMapping("/mfa/enable")
    public ResponseEntity<?> enableMfa(@Valid @RequestBody MfaCodeRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.enableMfa(username, request.getCode(), totpService);
        return ResponseEntity.ok(Map.of("message", "MFA enabled"));
    }

    @PostMapping("/mfa/disable")
    public ResponseEntity<?> disableMfa(@Valid @RequestBody MfaCodeRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.disableMfa(username, request.getCode(), totpService);
        return ResponseEntity.ok(Map.of("message", "MFA disabled"));
    }
}
