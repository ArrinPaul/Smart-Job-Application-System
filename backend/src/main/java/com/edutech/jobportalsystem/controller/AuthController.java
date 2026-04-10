package com.edutech.jobportalsystem.controller;

// File: ./backend/src/main/java/com/edutech/jobportalsystem/controller/AuthController.java

import com.edutech.jobportalsystem.dto.auth.ForgotPasswordRequest;
import com.edutech.jobportalsystem.dto.auth.LoginRequest;
import com.edutech.jobportalsystem.dto.auth.MfaCodeRequest;
import com.edutech.jobportalsystem.dto.auth.RegisterRequest;
import com.edutech.jobportalsystem.dto.auth.ResetPasswordRequest;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.exception.BadRequestException;
import com.edutech.jobportalsystem.jwt.JwtUtil;
import com.edutech.jobportalsystem.service.AuthNotificationService;
import com.edutech.jobportalsystem.service.CaptchaService;
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
    private JwtUtil jwtUtil;

    @Autowired
    private CaptchaService captchaService;

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

        try {
            User user = userService.registerUser(request);
            authNotificationService.sendEmailVerification(user);
        } catch (BadRequestException ex) {
            logger.warn("Registration request handled with generic response");
        }

        return ResponseEntity.ok(Map.of("message", "If the account can be created, verification instructions will be sent."));
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@Valid @RequestBody LoginRequest request,
                                       HttpServletRequest httpRequest,
                                       HttpServletResponse httpResponse) {
        logger.info("Login request for user: {}", request.getUsername());

        if (userService.requiresCaptcha(request.getUsername())
                && !captchaService.verifyToken(request.getCaptchaToken(), httpRequest.getRemoteAddr())) {
            userService.onAuthenticationFailure(request.getUsername(), httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"));
            throw new BadCredentialsException("Invalid credentials");
        }

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
                "mfaEnabled", user.getMfaEnabled()
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
