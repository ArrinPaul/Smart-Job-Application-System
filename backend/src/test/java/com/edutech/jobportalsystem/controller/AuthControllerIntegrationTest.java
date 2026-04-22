package com.edutech.jobportalsystem.controller;

// File: src/test/java/com/edutech/jobportalsystem/controller/AuthControllerIntegrationTest.java

import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testRegisterAndLogin_Success() throws Exception {
        Map<String, String> registerRequest = Map.of(
            "username", "integrationuser",
            "password", "password123",
            "email", "integration@mail.com",
            "role", "RECRUITER"
        );

        // Register
        mockMvc.perform(post("/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        // Login
        Map<String, String> loginRequest = Map.of("username", "integrationuser", "password", "password123");
        mockMvc.perform(post("/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
            .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("AUTH_TOKEN=")))
                .andExpect(jsonPath("$.role").value("RECRUITER"));
    }

    @Test
    void testAdminEndpoint_WithoutToken_Returns403() throws Exception {
        mockMvc.perform(get("/admin/users"))
                .andExpect(status().is4xxClientError());
    }
}
