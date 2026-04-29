package com.edutech.jobportalsystem.service;

import com.edutech.jobportalsystem.entity.ChatMessage;
import com.edutech.jobportalsystem.entity.User;
import com.edutech.jobportalsystem.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.Pageable;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ChatServiceTest {

    @Mock
    private AIService aiService;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JobSeekerProfileRepository profileRepository;

    @Mock
    private ResumeRepository resumeRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @InjectMocks
    private ChatService chatService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetChatResponse_GuestUser() {
        String message = "Hello";
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.empty());
        when(jobRepository.findTop5ByIsActiveTrueOrderByCreatedAtDesc()).thenReturn(Collections.emptyList());
        when(aiService.generateContent(anyString())).thenReturn("AI Response");

        String response = chatService.getChatResponse(message, "Guest", null);

        assertEquals("AI Response", response);
        verify(chatMessageRepository, never()).save(any());
    }

    @Test
    void testGetChatResponse_LoggedInUser_SavesHistory() {
        String message = "Help me with my career";
        User user = new User();
        user.setUsername("testuser");
        user.setId(1L);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(jobRepository.findTop5ByIsActiveTrueOrderByCreatedAtDesc()).thenReturn(Collections.emptyList());
        when(chatMessageRepository.findByUserOrderByCreatedAtDesc(eq(user), any(Pageable.class)))
            .thenReturn(Collections.emptyList());
        when(resumeRepository.findByOwner(user)).thenReturn(Optional.empty());
        when(aiService.generateContent(anyString())).thenReturn("Sure, I can help!");

        String response = chatService.getChatResponse(message, "testuser", null);

        assertEquals("Sure, I can help!", response);
        verify(chatMessageRepository, times(1)).save(any(ChatMessage.class));
    }

    @Test
    void testGetChatHistory() {
        User user = new User();
        user.setUsername("testuser");
        
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(chatMessageRepository.findByUserOrderByCreatedAtAsc(user)).thenReturn(List.of(new ChatMessage()));

        List<ChatMessage> history = chatService.getChatHistory("testuser");

        assertFalse(history.isEmpty());
        assertEquals(1, history.size());
    }
}
