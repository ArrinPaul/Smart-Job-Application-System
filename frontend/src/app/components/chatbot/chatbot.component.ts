import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../../services/http.service';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { sanitizeHtml } from '../../lib/safe-dompurify';

interface Message {
  text: string;
  html?: SafeHtml;
  sender: 'user' | 'bot';
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  isOpen = false;
  userInput = '';
  messages: Message[] = [];
  isLoading = false;
  isLoggedIn = false;

  suggestions: string[] = [];

  constructor(
    private httpService: HttpService, 
    private authService: AuthService,
    private chatService: ChatService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.updateSuggestions();
      if (this.isLoggedIn) {
        this.loadHistory();
      } else {
        this.resetChat();
      }
    });

    this.chatService.chatOpen$.subscribe(isOpen => {
      this.isOpen = isOpen;
      if (isOpen) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });

    this.chatService.jobContext$.subscribe(job => {
      if (job && this.isLoggedIn) {
        this.isOpen = true; // Ensure it opens
        this.messages = [
          { 
            text: `Hi! I see you're looking at the **${job.title}** role at **${this.getCompanyName(job)}**. How can I help you with this specific opportunity?`, 
            html: this.renderMarkdown(`Hi! I see you're looking at the **${job.title}** role at **${this.getCompanyName(job)}**. How can I help you with this specific opportunity?`),
            sender: 'bot', 
            timestamp: new Date() 
          }
        ];
        this.suggestions = [
          `What are the key requirements for this role?`,
          `Is my profile a good match for ${job.title}?`,
          `How can I stand out in this application?`,
          `What is the expected salary range?`
        ];
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  private updateSuggestions() {
    if (this.isLoggedIn) {
      this.suggestions = [
        'Recommend some jobs for me',
        'How can I improve my resume?',
        'What are the latest remote jobs?',
        'Show me high paying jobs'
      ];
    } else {
      this.suggestions = [
        'What is Vecta?',
        'How can I register?',
        'What features do you offer?',
        'Is it free to use?'
      ];
    }
  }

  private getCompanyName(job: any): string {
    return job.companyName || job.postedBy?.companyName || 'this company';
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  loadHistory() {
    this.httpService.getChatHistory().subscribe({
      next: (history) => {
        if (history && history.length > 0) {
          this.messages = [];
          history.forEach(msg => {
            this.messages.push({
              text: msg.message,
              sender: 'user',
              timestamp: new Date(msg.createdAt)
            });
            this.messages.push({
              text: msg.response,
              html: this.renderMarkdown(msg.response),
              sender: 'bot',
              timestamp: new Date(msg.createdAt)
            });
          });
        } else {
          this.resetChat();
        }
      },
      error: () => this.resetChat()
    });
  }

  resetChat() {
    if (this.isLoggedIn) {
      this.messages = [
        { 
          text: 'Hello! I am your AI Career Assistant. How can I help you today?', 
          html: this.renderMarkdown('Hello! I am your AI Career Assistant. How can I help you today?'),
          sender: 'bot', 
          timestamp: new Date() 
        }
      ];
    } else {
      this.messages = [
        { 
          text: 'Hello! I am the Vecta AI assistant. I can answer questions about our platform and features. Please **Log In** to access personalized job recommendations and career advice!', 
          html: this.renderMarkdown('Hello! I am the Vecta AI assistant. I can answer questions about our platform and features. Please **Log In** to access personalized job recommendations and career advice!'),
          sender: 'bot', 
          timestamp: new Date() 
        }
      ];
    }
  }

  renderMarkdown(text: string): SafeHtml {
    const rawHtml = marked.parse(text) as string;
    const sanitized = sanitizeHtml(rawHtml);
    return this.sanitizer.bypassSecurityTrustHtml(sanitized);
  }

  toggleChat() {
    this.chatService.toggleChat();
  }

  sendMessage(text?: string) {
    const messageText = text || this.userInput.trim();
    if (!messageText) return;

    // Add user message
    this.messages.push({
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    });

    if (!text) this.userInput = '';
    this.isLoading = true;

    // Get current job ID from context if any
    const currentJob = this.chatService.getJobContext();
    const jobId = currentJob ? currentJob.id : undefined;

    // Send to backend
    this.httpService.sendMessage(messageText, jobId).subscribe({
      next: (res) => {
        this.messages.push({
          text: res.response,
          html: this.renderMarkdown(res.response),
          sender: 'bot',
          timestamp: new Date()
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Chat error:', err);
        const errorMsg = 'Sorry, I am having trouble connecting right now. Please try again later.';
        this.messages.push({
          text: errorMsg,
          html: this.renderMarkdown(errorMsg),
          sender: 'bot',
          timestamp: new Date()
        });
        this.isLoading = false;
      }
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.myScrollContainer) {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) { }
  }
}
