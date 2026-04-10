package com.edutech.jobportalsystem.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class CaptchaService {

    private static final Logger logger = LoggerFactory.getLogger(CaptchaService.class);

    @Value("${app.security.captcha.enabled:false}")
    private boolean enabled;

    @Value("${app.security.captcha.secret:}")
    private String captchaSecret;

    @Value("${app.security.captcha.verify-url:https://www.google.com/recaptcha/api/siteverify}")
    private String verifyUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public boolean verifyToken(String token, String remoteIp) {
        if (!enabled) {
            return true;
        }

        if (captchaSecret == null || captchaSecret.isBlank()) {
            logger.error("Captcha is enabled but app.security.captcha.secret is missing");
            return false;
        }

        if (token == null || token.isBlank()) {
            return false;
        }

        try {
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("secret", captchaSecret);
            body.add("response", token);
            if (remoteIp != null && !remoteIp.isBlank()) {
                body.add("remoteip", remoteIp);
            }

            Map<?, ?> response = restTemplate.postForObject(verifyUrl, body, Map.class);
            if (response == null) {
                return false;
            }

            Object success = response.get("success");
            return success instanceof Boolean && (Boolean) success;
        } catch (RestClientException ex) {
            logger.warn("Captcha verification failed due to remote service error: {}", ex.getMessage());
            return false;
        }
    }
}
