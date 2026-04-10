package com.edutech.jobportalsystem.jwt;

// File: ./backend/src/main/java/com/edutech/jobportalsystem/jwt/JwtUtil.java

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Component
public class JwtUtil {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long expirationTime;

    public String generateToken(String username, String role, Long tokenVersion) {
        logger.debug("Generating token for user: {} with role: {}", username, role);
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        claims.put("tokenVersion", tokenVersion == null ? 0L : tokenVersion);
        return createToken(claims, username);
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(SignatureAlgorithm.HS256, secretKey)
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public Long extractTokenVersion(String token) {
        Long tokenVersion = extractClaim(token, claims -> claims.get("tokenVersion", Long.class));
        return tokenVersion == null ? 0L : tokenVersion;
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parser().setSigningKey(secretKey).parseClaimsJws(token).getBody();
        } catch (Exception e) {
            logger.error("Failed to extract claims from token: {}", e.getMessage());
            throw e;
        }
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public Boolean validateToken(String token, UserDetails userDetails, Long expectedTokenVersion) {
        final String username = extractUsername(token);
        long tokenVersion = extractTokenVersion(token);
        long expectedVersion = expectedTokenVersion == null ? 0L : expectedTokenVersion;
        boolean isValid = (username.equals(userDetails.getUsername())
                && !isTokenExpired(token)
                && tokenVersion == expectedVersion);
        if (!isValid) {
            logger.warn("Token validation failed for user: {}", username);
        }
        return isValid;
    }
}
