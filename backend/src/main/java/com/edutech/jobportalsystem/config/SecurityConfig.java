package com.edutech.jobportalsystem.config;

// File: ./src/main/java/com/edutech/jobportalsystem/config/SecurityConfig.java

import com.edutech.jobportalsystem.jwt.JwtRequestFilter;
import com.edutech.jobportalsystem.security.AuthRateLimitFilter;
import com.edutech.jobportalsystem.security.MfaEnforcementFilter;
import com.edutech.jobportalsystem.security.PayloadSizeFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.beans.factory.annotation.Value;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.cors.allowed-origins:http://localhost:4200,http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   JwtRequestFilter jwtRequestFilter,
                                                   AuthRateLimitFilter authRateLimitFilter,
                                                   PayloadSizeFilter payloadSizeFilter,
                                                   MfaEnforcementFilter mfaEnforcementFilter) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers(
                            "/auth/register", "/auth/login", "/auth/verify-email", "/auth/forgot-password", "/auth/reset-password",
                            "/api/auth/register", "/api/auth/login", "/api/auth/verify-email", "/api/auth/forgot-password", "/api/auth/reset-password",
                            "/public/**", "/api/public/**", "/jobs/**", "/api/jobs/**", "/chat/**", "/api/chat/**"
                            ).permitAll()
                    .requestMatchers("/admin/**", "/api/admin/**").hasRole("ADMIN")
                    .requestMatchers("/recruiter/**", "/api/recruiter/**").hasRole("RECRUITER")
                    .requestMatchers(HttpMethod.GET, "/jobs", "/api/jobs").hasAnyRole("JOB_SEEKER", "RECRUITER")
                    .requestMatchers("/jobseeker/**", "/api/jobseeker/**").hasRole("JOB_SEEKER")
                    .requestMatchers(HttpMethod.POST, "/job/apply", "/api/job/apply").hasRole("JOB_SEEKER")
                    .requestMatchers(HttpMethod.GET, "/resume/**", "/api/resume/**").hasAnyRole("RECRUITER", "JOB_SEEKER", "ADMIN")
                    .requestMatchers(HttpMethod.POST, "/jobseeker/resume", "/api/jobseeker/resume").hasRole("JOB_SEEKER")
                    .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html", "/actuator/**", "/api/actuator/**").permitAll()
                        .anyRequest().authenticated()
                )
                .anonymous(anonConfig -> {})
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'"))
                        .xssProtection(xss -> xss.headerValue(org.springframework.security.web.header.writers.XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
                        .frameOptions(frame -> frame.deny())
                );

            http.addFilterBefore(payloadSizeFilter, UsernamePasswordAuthenticationFilter.class);
            http.addFilterBefore(authRateLimitFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
            http.addFilterAfter(mfaEnforcementFilter, JwtRequestFilter.class);
        http.exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"Authentication required\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Forbidden\",\"message\":\"Access denied: insufficient permissions\"}");
                })
        );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Split comma-separated origins from property
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        configuration.setAllowedOrigins(origins);
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-XSRF-TOKEN", "X-OTP-Code"));
        configuration.setExposedHeaders(Arrays.asList("Set-Cookie"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
