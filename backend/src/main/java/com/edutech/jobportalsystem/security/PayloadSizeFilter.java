package com.edutech.jobportalsystem.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class PayloadSizeFilter extends OncePerRequestFilter {

    @Value("${app.security.max-request-bytes:1048576}")
    private long maxRequestBytes;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        long contentLength = request.getContentLengthLong();
        if (contentLength > maxRequestBytes) {
            response.setStatus(HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Payload Too Large\",\"message\":\"Request payload exceeds allowed size.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
