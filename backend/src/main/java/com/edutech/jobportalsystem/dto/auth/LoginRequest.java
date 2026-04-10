package com.edutech.jobportalsystem.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LoginRequest {

    @NotBlank(message = "Username is required")
    @Size(max = 100, message = "Username is too long")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(max = 256, message = "Password is too long")
    private String password;

    @Size(max = 4096, message = "Captcha token is too long")
    private String captchaToken;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getCaptchaToken() {
        return captchaToken;
    }

    public void setCaptchaToken(String captchaToken) {
        this.captchaToken = captchaToken;
    }
}
