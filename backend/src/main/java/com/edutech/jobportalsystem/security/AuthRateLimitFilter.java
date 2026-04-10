package com.edutech.jobportalsystem.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(AuthRateLimitFilter.class);

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Value("${app.security.auth-rate-limit.capacity:5}")
    private long capacity;

    @Value("${app.security.auth-rate-limit.window-minutes:15}")
    private long windowMinutes;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (!isRateLimitedAuthEndpoint(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = request.getRemoteAddr() + ":" + request.getRequestURI();
        Bucket bucket = buckets.computeIfAbsent(key, ignored -> createBucket());

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (probe.isConsumed()) {
            filterChain.doFilter(request, response);
            return;
        }

        long retryAfterSeconds = Math.max(1L, probe.getNanosToWaitForRefill() / 1_000_000_000L);
        logger.warn("Rate limit exceeded for {} {} from {}", request.getMethod(), request.getRequestURI(), request.getRemoteAddr());

        response.setStatus(429);
        response.setContentType("application/json");
        response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
        response.getWriter().write("{\"error\":\"Too Many Requests\",\"message\":\"Too many attempts. Try again later.\"}");
    }

    private Bucket createBucket() {
        Refill refill = Refill.greedy(capacity, Duration.ofMinutes(windowMinutes));
        Bandwidth limit = Bandwidth.classic(capacity, refill);
        return Bucket.builder().addLimit(limit).build();
    }

    private boolean isRateLimitedAuthEndpoint(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod()) && !"GET".equalsIgnoreCase(request.getMethod())) {
            return false;
        }

        String path = request.getRequestURI();
        return path.endsWith("/auth/login")
                || path.endsWith("/auth/register")
                || path.endsWith("/auth/forgot-password")
                || path.endsWith("/auth/reset-password")
                || path.endsWith("/auth/verify-email");
    }
}
