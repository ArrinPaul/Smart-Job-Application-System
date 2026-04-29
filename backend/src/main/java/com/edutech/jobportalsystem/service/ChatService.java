package com.edutech.jobportalsystem.service;

import com.edutech.jobportalsystem.entity.*;
import com.edutech.jobportalsystem.repository.*;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ChatService {

    @Autowired
    private AIService aiService;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobSeekerProfileRepository profileRepository;

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    private final Tika tika = new Tika();

    public String getChatResponse(String message, String username, Long jobId) {
        User user = userRepository.findByUsername(username).orElse(null);
        JobSeekerProfile profile = user != null ? profileRepository.findByUser(user).orElse(null) : null;
        List<Job> recentJobs = jobRepository.findTop5ByIsActiveTrueOrderByCreatedAtDesc();
        
        Job focusedJob = (jobId != null) ? jobRepository.findById(jobId).orElse(null) : null;

        // 1. Get Conversation History
        List<ChatMessage> history = user != null ? 
            chatMessageRepository.findByUserOrderByCreatedAtDesc(user, PageRequest.of(0, 10)) : 
            List.of();

        // 2. Get Resume Content
        String resumeContent = "";
        if (user != null) {
            Optional<Resume> resumeOpt = resumeRepository.findByOwner(user);
            if (resumeOpt.isPresent()) {
                try {
                    resumeContent = tika.parseToString(new ByteArrayInputStream(resumeOpt.get().getData()));
                } catch (Exception e) {
                    // Log error but continue
                }
            }
        }

        StringBuilder prompt = new StringBuilder();
        prompt.append("System: You are an expert Career Assistant for 'Smart Job Portal'.\n");
        prompt.append("Guidelines:\n- Be concise and professional.\n- Use Markdown for formatting (bold, lists).\n");
        
        if (focusedJob != null) {
            prompt.append("- Focus your response on the specific job application mentioned below.\n");
        } else {
            prompt.append("- If recommending jobs, reference the ones provided below.\n");
        }
        prompt.append("- Use the user's profile and resume content to personalize advice.\n\n");

        if (user != null) {
            prompt.append("User Profile:\n");
            prompt.append("- Username: ").append(user.getUsername()).append("\n");
            prompt.append("- Location: ").append(user.getLocation() != null ? user.getLocation() : "Unknown").append("\n");
            
            if (profile != null) {
                prompt.append("- Skills: ").append(profile.getSkills()).append("\n");
                prompt.append("- Experience: ").append(profile.getExperienceYears()).append(" years\n");
                prompt.append("- Headline: ").append(profile.getProfessionalHeadline()).append("\n");
            }

            if (!resumeContent.isBlank()) {
                prompt.append("\nResume Highlights (Parsed Text):\n");
                prompt.append(resumeContent.length() > 2000 ? resumeContent.substring(0, 2000) + "..." : resumeContent).append("\n");
            }
        }

        if (focusedJob != null) {
            prompt.append("\nFOCUSED JOB CONTEXT:\n");
            prompt.append("- Title: ").append(focusedJob.getTitle()).append("\n");
            prompt.append("- Company: ").append(focusedJob.getCompanyName()).append("\n");
            prompt.append("- Location: ").append(focusedJob.getLocation()).append(" (").append(focusedJob.getWorkType()).append(")\n");
            prompt.append("- Description: ").append(focusedJob.getDescription().length() > 1000 ? focusedJob.getDescription().substring(0, 1000) + "..." : focusedJob.getDescription()).append("\n");
            prompt.append("- Required Skills: ").append(focusedJob.getRequiredSkills()).append("\n");
        } else {
            prompt.append("\nAvailable Jobs:\n");
            for (Job job : recentJobs) {
                prompt.append("- ").append(job.getTitle()).append(" at ").append(job.getCompanyName()).append(" in ").append(job.getLocation()).append(" (Type: ").append(job.getWorkType()).append(")\n");
            }
        }

        if (!history.isEmpty()) {
            prompt.append("\nRecent Conversation History (Oldest to Newest):\n");
            List<ChatMessage> chronoHistory = history.stream()
                .sorted((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
                .collect(Collectors.toList());
            for (ChatMessage msg : chronoHistory) {
                prompt.append("User: ").append(msg.getMessage()).append("\n");
                prompt.append("Assistant: ").append(msg.getResponse()).append("\n");
            }
        }

        prompt.append("\nCurrent User Message: ").append(message).append("\n");
        prompt.append("Assistant: ");

        String response = aiService.generateContent(prompt.toString());

        // 3. Persist History
        if (user != null && response != null && !response.startsWith("AI career services")) {
            ChatMessage chatMessage = ChatMessage.builder()
                .user(user)
                .message(message)
                .response(response)
                .build();
            chatMessageRepository.save(chatMessage);
        }

        return response;
    }

    public List<ChatMessage> getChatHistory(String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return List.of();
        return chatMessageRepository.findByUserOrderByCreatedAtAsc(user);
    }
}
