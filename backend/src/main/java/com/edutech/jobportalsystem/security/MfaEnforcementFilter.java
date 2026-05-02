package com.edutech.jobportalsystem.security;

import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.repository.UserRepository;
import com.edutech.jobportalsystem.service.TotpService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
public class MfaEnforcementFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;
    private final TotpService totpService;

    @Value("${app.security.mfa.enforce-sensitive-actions:true}")
    private boolean enforceSensitiveActions;

    public MfaEnforcementFilter(UserRepository userRepository, TotpService totpService) {
        this.userRepository = userRepository;
        this.totpService = totpService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (!enforceSensitiveActions || !isSensitiveAction(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            filterChain.doFilter(request, response);
            return;
        }

        Optional<User> optionalUser = userRepository.findByUsername(authentication.getName());
        if (optionalUser.isEmpty() || !Boolean.TRUE.equals(optionalUser.get().getMfaEnabled())) {
            filterChain.doFilter(request, response);
            return;
        }

        String otpCode = request.getHeader("X-OTP-Code");
        if (otpCode == null || !totpService.verifyCode(optionalUser.get().getMfaSecret(), otpCode)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"MFA Required\",\"message\":\"A valid OTP code is required for this action.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isSensitiveAction(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path.contains("/auth/mfa") || path.endsWith("/auth/login") || path.endsWith("/auth/register")
                || path.endsWith("/auth/forgot-password") || path.endsWith("/auth/reset-password")
                || path.endsWith("/auth/verify-email") || path.contains("/messages/typing")) {
            return false;
        }

        String method = request.getMethod();
        return "POST".equalsIgnoreCase(method)
                || "PUT".equalsIgnoreCase(method)
                || "PATCH".equalsIgnoreCase(method)
                || "DELETE".equalsIgnoreCase(method);
    }
}
