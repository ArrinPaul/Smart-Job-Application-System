import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from '../services/message.service';
import { DirectMessage } from '../models/message.model';
import { User } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { HttpService } from '../services/http.service';
import { ActivatedRoute } from '@angular/router';
import { interval, Subscription, switchMap, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="messages-layout">
      <!-- Contacts Sidebar -->
      <aside class="contacts-sidebar" [class.hidden-mobile]="selectedContact">
        <div class="sidebar-inner">
          <header class="sidebar-header">
            <div class="header-top">
              <h2>Correspondence</h2>
              <span class="chat-count" *ngIf="contacts.length">{{ contacts.length }} active</span>
            </div>
            <div class="search-box">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" [(ngModel)]="contactSearch" (input)="onContactSearch()" placeholder="Search archives..." class="search-input">
            </div>
          </header>
          
          <div class="contacts-scrollbox">
            <!-- Active Conversations -->
            <div class="contact-group">
              <div *ngFor="let contact of filteredContacts()" 
                   class="contact-item" 
                   [class.active]="selectedContact?.id === contact.id"
                   (click)="selectContact(contact)">
                <div class="avatar-container">
                  <div class="user-avatar" [style.background]="getAvatarColor(contact)">
                    {{ contact.fullName?.charAt(0) || contact.username.charAt(0) }}
                  </div>
                  <div class="online-dot"></div>
                </div>
                <div class="contact-info">
                  <div class="info-row">
                    <span class="name">{{ contact.fullName || contact.username }}</span>
                    <span class="time" *ngIf="contact.lastMessageAt">{{ contact.lastMessageAt | date:'shortTime' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="role-label">{{ contact.role.replace('_', ' ') }}</span>
                    <span class="unread-indicator" *ngIf="hasUnreadFrom(contact)"></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Global Search Results -->
            <div *ngIf="globalSearchResults.length > 0" class="search-results-section">
              <h3 class="section-divider">New Connections</h3>
              <div *ngFor="let user of globalSearchResults" 
                   class="contact-item result-item" 
                   (click)="selectContact(user)">
                <div class="avatar-container">
                  <div class="user-avatar mini" [style.background]="getAvatarColor(user)">
                    {{ user.fullName?.charAt(0) || user.username.charAt(0) }}
                  </div>
                </div>
                <div class="contact-info">
                  <span class="name">{{ user.fullName || user.username }}</span>
                  <span class="role-label">{{ user.role.replace('_', ' ') }}</span>
                </div>
              </div>
            </div>
            
            <!-- Empty Sidebar State -->
            <div *ngIf="contacts.length === 0 && globalSearchResults.length === 0" class="sidebar-empty">
              <div class="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h4>No conversations yet</h4>
              <p>Find a recruiter or applicant to start messaging.</p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Chat Area -->
      <main class="chat-view" [class.mobile-active]="selectedContact">
        <ng-container *ngIf="selectedContact; else welcomeScreen">
          <header class="chat-view-header">
            <button class="back-link" (click)="selectedContact = null">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              Archives
            </button>
            
            <div class="header-main">
              <div class="user-summary">
                <div class="user-avatar" [style.background]="getAvatarColor(selectedContact)">
                  {{ selectedContact.fullName?.charAt(0) || selectedContact.username.charAt(0) }}
                </div>
                <div class="user-text">
                  <h3>{{ selectedContact.fullName || selectedContact.username }}</h3>
                  <div class="user-meta">
                    <span class="presence-tag">
                      <span class="dot"></span>
                      Online
                    </span>
                    <span class="sep">/</span>
                    <span class="role-tag">{{ selectedContact.role.replace('_', ' ') }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="header-tools">
              <div class="inline-search">
                <input type="text" [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="Find in conversation..." class="tool-input">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
            </div>
          </header>

          <div class="chat-body" #scrollContainer>
            <div class="message-list">
              <div class="date-marker">
                <span>Today</span>
              </div>

              <div *ngFor="let msg of messages; let i = index" 
                   class="msg-row" 
                   [class.outgoing]="msg.sender.id === currentUserId"
                   [class.incoming]="msg.sender.id !== currentUserId"
                   [class.compact]="isCompact(i)">
                
                <div class="msg-bubble">
                  <div class="msg-content">{{ msg.content }}</div>
                  
                  <div *ngIf="msg.attachmentUrl" class="msg-attachment">
                    <div class="attachment-info">
                      <div class="file-icon">
                        <svg *ngIf="isImage(msg.attachmentType)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        <svg *ngIf="!isImage(msg.attachmentType)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                          <polyline points="13 2 13 9 20 9"></polyline>
                        </svg>
                      </div>
                      <div class="file-meta">
                        <span class="file-name">{{ msg.attachmentName }}</span>
                        <span class="file-size">{{ msg.attachmentType }}</span>
                      </div>
                    </div>
                    <a [href]="getDownloadUrl(msg)" [download]="msg.attachmentName" class="file-download">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </a>
                  </div>

                  <div class="msg-footer">
                    <span class="msg-time">{{ msg.sentAt | date:'h:mm a' }}</span>
                    <span class="msg-status" *ngIf="msg.sender.id === currentUserId">
                      <svg *ngIf="msg.isRead" class="read-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <svg *ngIf="!msg.isRead" class="delivered-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Typing Indicator -->
              <div class="typing-notice" *ngIf="isOtherTyping">
                <div class="typing-dots">
                  <span></span><span></span><span></span>
                </div>
                <span>{{ selectedContact.fullName || selectedContact.username }} is typing</span>
              </div>
            </div>
          </div>

          <footer class="chat-entry">
            <div class="context-pill" *ngIf="selectedJobId">
              <span class="pill-label">In response to</span>
              <span class="pill-value">Job #{{ selectedJobId }}</span>
              <button class="pill-clear" (click)="selectedJobId = null">✕</button>
            </div>
            
            <div class="composer">
              <input type="file" #fileInput (change)="onFileSelected($event)" style="display: none">
              <button class="composer-action" (click)="triggerFileUpload()" [disabled]="isUploading">
                <svg *ngIf="!isUploading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                </svg>
                <div *ngIf="isUploading" class="upload-loader"></div>
              </button>

              <div class="composer-field">
                <textarea 
                  [(ngModel)]="newMessage" 
                  (keydown.enter)="$event.preventDefault(); sendMessage()" 
                  (input)="onTyping()"
                  placeholder="Draft your message..." 
                  class="composer-input"
                  rows="1"
                  #messageArea
                ></textarea>
                
                <button class="composer-send" (click)="sendMessage()" [disabled]="!newMessage.trim() && !isUploading">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </footer>
        </ng-container>

        <ng-template #welcomeScreen>
          <div class="empty-view">
            <div class="editorial-empty">
              <div class="empty-orb">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h2>Correspondence</h2>
              <p>Select a thread from your archives to view your full history and continue the conversation.</p>
              <div class="empty-stats">
                <div class="stat-pill">
                  <strong>{{ contacts.length }}</strong>
                  <span>Active Threads</span>
                </div>
              </div>
            </div>
          </div>
        </ng-template>
      </main>
    </div>
  `,
  styles: [`
    :host {
      --sidebar-w: 380px;
      --header-h: 72px;
      --view-bg: var(--bg);
      --card-bg: var(--surface);
      --border-c: var(--border);
      --accent-c: var(--brand);
      --text-main: var(--ink);
      --text-dim: var(--ink-soft);
      --radius: var(--radius-lg);
    }

    .messages-layout {
      display: flex;
      height: calc(100vh - var(--header-h));
      background: var(--view-bg);
      overflow: hidden;
      position: relative;
    }

    /* --- Sidebar Section --- */
    .contacts-sidebar {
      width: var(--sidebar-w);
      min-width: var(--sidebar-w);
      border-right: 1px solid var(--border-c);
      background: rgba(255, 255, 255, 0.4);
      backdrop-filter: blur(10px);
      z-index: 20;
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .sidebar-inner {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      padding: 32px 24px 24px;
      background: var(--card-bg);
      border-bottom: 1px solid var(--border-c);
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .header-top h2 {
      font-size: 1.6rem;
      color: var(--text-main);
    }

    .chat-count {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--accent-c);
      background: color-mix(in srgb, var(--accent-c) 8%, transparent);
      padding: 6px 12px;
      border-radius: 99px;
      border: 1px solid color-mix(in srgb, var(--accent-c) 20%, transparent);
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      width: 16px;
      height: 16px;
      color: var(--text-dim);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 12px 16px 12px 42px;
      background: var(--view-bg);
      border: 1px solid var(--border-c);
      border-radius: 12px;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      font-family: 'Manrope', sans-serif;
    }

    .search-input:focus {
      background: var(--card-bg);
      border-color: var(--accent-c);
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent-c) 12%, transparent);
      outline: none;
    }

    .contacts-scrollbox {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      margin-bottom: 4px;
      position: relative;
      background: transparent;
    }

    .contact-item:hover {
      background: rgba(255, 255, 255, 0.6);
      transform: translateY(-1px);
    }

    .contact-item.active {
      background: var(--card-bg);
      box-shadow: var(--shadow-soft);
    }

    .contact-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 16px;
      bottom: 16px;
      width: 4px;
      background: var(--accent-c);
      border-radius: 0 4px 4px 0;
    }

    .avatar-container {
      position: relative;
    }

    .user-avatar {
      width: 52px;
      height: 52px;
      border-radius: 18px;
      color: white;
      display: grid;
      place-items: center;
      font-weight: 800;
      font-size: 1.4rem;
      box-shadow: var(--shadow-tactile);
      font-family: 'Fraunces', serif;
    }

    .user-avatar.mini { width: 40px; height: 40px; font-size: 1.1rem; border-radius: 14px; }

    .online-dot {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 14px;
      height: 14px;
      background: #10b981;
      border: 3px solid var(--card-bg);
      border-radius: 50%;
    }

    .contact-info {
      flex: 1;
      min-width: 0;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .name {
      font-weight: 700;
      font-size: 1rem;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: 'Fraunces', serif;
    }

    .time {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-dim);
    }

    .role-label {
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-dim);
      opacity: 0.7;
    }

    .unread-indicator {
      width: 8px;
      height: 8px;
      background: var(--accent-c);
      border-radius: 50%;
      box-shadow: 0 0 10px color-mix(in srgb, var(--accent-c) 40%, transparent);
    }

    .section-divider {
      font-size: 0.7rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--text-dim);
      margin: 32px 16px 12px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border-c);
      opacity: 0.5;
    }

    /* --- Chat Main View --- */
    .chat-view {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--view-bg);
      position: relative;
    }

    .chat-view-header {
      height: 88px;
      padding: 0 32px;
      background: var(--card-bg);
      border-bottom: 1px solid var(--border-c);
      display: flex;
      align-items: center;
      gap: 24px;
      z-index: 10;
    }

    .back-link {
      display: none;
      background: none;
      border: none;
      padding: 8px;
      cursor: pointer;
      color: var(--text-main);
      font-weight: 800;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .back-link svg { width: 18px; height: 18px; }

    .header-main {
      flex: 1;
    }

    .user-summary {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .user-summary .user-avatar {
      width: 48px;
      height: 48px;
      border-radius: 14px;
    }

    .user-text h3 {
      font-size: 1.4rem;
      margin: 0;
      line-height: 1.2;
    }

    .user-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      color: var(--text-dim);
      font-weight: 600;
    }

    .presence-tag {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #10b981;
    }

    .presence-tag .dot {
      width: 6px;
      height: 6px;
      background: currentColor;
      border-radius: 50%;
    }

    .user-meta .sep { opacity: 0.3; }

    .inline-search {
      position: relative;
      display: flex;
      align-items: center;
    }

    .tool-input {
      background: var(--view-bg);
      border: 1px solid var(--border-c);
      padding: 8px 16px 8px 36px;
      border-radius: 10px;
      font-size: 0.85rem;
      width: 200px;
      transition: all 0.3s ease;
      font-family: 'Manrope', sans-serif;
    }

    .tool-input:focus {
      width: 280px;
      outline: none;
      background: #fff;
      border-color: var(--accent-c);
    }

    .inline-search svg {
      position: absolute;
      left: 12px;
      width: 14px;
      height: 14px;
      color: var(--text-dim);
    }

    .chat-body {
      flex: 1;
      overflow-y: auto;
      padding: 40px;
      display: flex;
      flex-direction: column;
    }

    .message-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-width: 860px;
      width: 100%;
      margin: 0 auto;
    }

    .date-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 32px 0;
      position: relative;
    }

    .date-marker::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      height: 1px;
      background: var(--border-c);
      opacity: 0.4;
    }

    .date-marker span {
      background: var(--view-bg);
      padding: 0 16px;
      font-size: 0.7rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--text-dim);
      position: relative;
    }

    .msg-row {
      display: flex;
      flex-direction: column;
      margin-bottom: 4px;
      animation: msgReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes msgReveal {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .msg-row.outgoing { align-items: flex-end; }
    .msg-row.incoming { align-items: flex-start; }

    .msg-bubble {
      max-width: 65%;
      padding: 14px 20px;
      border-radius: 24px;
      font-size: 0.95rem;
      line-height: 1.6;
      position: relative;
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);
      transition: transform 0.2s ease;
    }

    .outgoing .msg-bubble {
      background: var(--accent-c);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .incoming .msg-bubble {
      background: var(--card-bg);
      color: var(--text-main);
      border-bottom-left-radius: 4px;
      border: 1px solid var(--border-c);
    }

    .msg-row.compact { margin-top: -2px; }
    .compact.outgoing .msg-bubble { border-top-right-radius: 4px; border-bottom-right-radius: 4px; }
    .compact.incoming .msg-bubble { border-top-left-radius: 4px; border-bottom-left-radius: 4px; }

    .msg-attachment {
      margin-top: 12px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      padding: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .incoming .msg-attachment {
      background: var(--view-bg);
      border-color: var(--border-c);
    }

    .attachment-info {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }

    .file-icon {
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      display: grid;
      place-items: center;
      color: inherit;
    }

    .incoming .file-icon { background: var(--card-bg); border: 1px solid var(--border-c); }

    .file-meta {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .file-name {
      font-weight: 700;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-size {
      font-size: 0.7rem;
      opacity: 0.7;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .file-download {
      color: inherit;
      padding: 8px;
      border-radius: 50%;
      background: rgba(0,0,0,0.05);
      transition: all 0.2s;
    }

    .file-download:hover { background: rgba(0,0,0,0.1); transform: scale(1.1); }

    .msg-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 6px;
      font-size: 0.65rem;
      font-weight: 700;
      opacity: 0.6;
    }

    .msg-status .read-icon { color: #10b981; }

    /* Typing Status */
    .typing-notice {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 0;
      color: var(--text-dim);
      font-size: 0.8rem;
      font-weight: 700;
    }

    .typing-dots {
      background: var(--card-bg);
      padding: 10px 14px;
      border-radius: 18px;
      border-bottom-left-radius: 4px;
      border: 1px solid var(--border-c);
      display: flex;
      gap: 4px;
    }

    .typing-dots span {
      width: 6px;
      height: 6px;
      background: var(--accent-c);
      border-radius: 50%;
      opacity: 0.4;
      animation: dotFlow 1.4s infinite ease-in-out;
    }

    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes dotFlow {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
      40% { transform: scale(1.1); opacity: 1; }
    }

    /* --- Composer Section --- */
    .chat-entry {
      padding: 24px 32px 32px;
      background: var(--card-bg);
      border-top: 1px solid var(--border-c);
    }

    .context-pill {
      background: var(--surface-soft);
      border: 1px solid var(--border-c);
      border-radius: 99px;
      padding: 6px 16px;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
      font-size: 0.8rem;
      animation: pillFade 0.3s ease;
    }

    @keyframes pillFade { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

    .pill-label { font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.5; font-size: 0.7rem; }
    .pill-value { font-weight: 700; color: var(--accent-c); }
    .pill-clear { background: none; border: none; cursor: pointer; opacity: 0.4; font-size: 1rem; }

    .composer {
      display: flex;
      align-items: flex-end;
      gap: 16px;
    }

    .composer-action {
      width: 52px;
      height: 52px;
      border-radius: 18px;
      border: 1px solid var(--border-c);
      background: var(--view-bg);
      color: var(--text-dim);
      display: grid;
      place-items: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .composer-action:hover:not(:disabled) {
      background: white;
      color: var(--accent-c);
      border-color: var(--accent-c);
      box-shadow: 0 4px 12px color-mix(in srgb, var(--accent-c) 10%, transparent);
    }

    .composer-field {
      flex: 1;
      background: var(--view-bg);
      border-radius: 22px;
      padding: 6px;
      display: flex;
      align-items: flex-end;
      border: 1px solid var(--border-c);
      transition: all 0.2s;
    }

    .composer-field:focus-within {
      background: white;
      border-color: var(--accent-c);
      box-shadow: var(--ring);
    }

    .composer-input {
      flex: 1;
      border: none;
      background: transparent;
      padding: 12px 16px;
      font-family: inherit;
      font-size: 1rem;
      resize: none;
      outline: none;
      max-height: 180px;
      color: var(--text-main);
    }

    .composer-send {
      width: 44px;
      height: 44px;
      border-radius: 16px;
      background: var(--accent-c);
      color: white;
      border: none;
      display: grid;
      place-items: center;
      cursor: pointer;
      transition: all 0.2s;
      margin: 2px;
    }

    .composer-send:disabled {
      background: var(--border-c);
      cursor: not-allowed;
      opacity: 0.5;
    }

    .composer-send:hover:not(:disabled) {
      transform: scale(1.05) translateY(-1px);
      box-shadow: 0 4px 12px color-mix(in srgb, var(--accent-c) 30%, transparent);
    }

    /* --- Welcome Screen --- */
    .empty-view {
      flex: 1;
      display: grid;
      place-items: center;
      padding: 40px;
    }

    .editorial-empty {
      text-align: center;
      max-width: 460px;
    }

    .empty-orb {
      width: 120px;
      height: 120px;
      background: linear-gradient(135deg, var(--brand), var(--brand-strong));
      border-radius: 48px;
      display: grid;
      place-items: center;
      margin: 0 auto 40px;
      box-shadow: 0 24px 48px color-mix(in srgb, var(--brand) 25%, transparent);
      animation: orbFloat 6s infinite ease-in-out;
    }

    @keyframes orbFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-15px); }
    }

    .editorial-empty h2 {
      font-size: 2.6rem;
      margin-bottom: 20px;
    }

    .editorial-empty p {
      color: var(--text-dim);
      font-size: 1.1rem;
      margin-bottom: 40px;
      line-height: 1.6;
    }

    .empty-stats {
      display: flex;
      justify-content: center;
      padding-top: 40px;
      border-top: 1px solid var(--border-c);
    }

    .stat-pill {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .stat-pill strong { font-size: 1.8rem; color: var(--accent-c); font-family: 'Fraunces', serif; }
    .stat-pill span { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 900; color: var(--text-dim); }

    /* --- Utilities --- */
    .upload-loader {
      width: 22px;
      height: 22px;
      border: 3px solid color-mix(in srgb, var(--accent-c) 15%, transparent);
      border-top-color: var(--accent-c);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* --- Responsive --- */
    @media (max-width: 1024px) {
      :host { --sidebar-w: 320px; }
      .chat-view-header { padding: 0 24px; }
      .chat-body { padding: 24px; }
    }

    @media (max-width: 768px) {
      .contacts-sidebar {
        position: absolute;
        inset: 0;
        width: 100%;
        z-index: 30;
        transform: translateX(0);
      }
      .contacts-sidebar.hidden-mobile { transform: translateX(-100%); }
      
      .chat-view {
        position: absolute;
        inset: 0;
        width: 100%;
        z-index: 20;
        display: none;
      }
      .chat-view.mobile-active { display: flex; }
      
      .back-link { display: flex; }
      .header-tools { display: none; }
      
      .msg-bubble { max-width: 85%; }
    }
  `]
})
export class MessagesComponent implements OnInit, OnDestroy {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;

  contacts: any[] = []; // Changed to any to support extra UI fields
  selectedContact: User | null = null;
  messages: DirectMessage[] = [];
  newMessage: string = '';
  searchQuery: string = '';
  contactSearch: string = '';
  globalSearchResults: User[] = [];
  currentUserId: number | null;

  private pollSubscription?: Subscription;
  private typingSub?: Subscription;
  isOtherTyping: boolean = false;
  selectedJobId: number | null = null;
  isUploading: boolean = false;

  private avatarColors = [
    '#bb3e2d', '#0d6774', '#1e6742', '#d97706', 
    '#5b21b6', '#1e40af', '#991b1b', '#065f46'
  ];

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private httpService: HttpService,
    private route: ActivatedRoute
  ) {
    this.currentUserId = this.authService.getUserId();
  }

  ngOnInit(): void {
    this.loadContacts();
    
    this.route.queryParams.subscribe(params => {
      if (params['userId']) {
        const userId = +params['userId'];
        this.selectedJobId = params['jobId'] ? +params['jobId'] : null;
        this.selectContactById(userId);
      }
    });

    this.pollSubscription = interval(2000).pipe(
      switchMap(() => {
        if (this.selectedContact && document.visibilityState === 'visible') {
          if (this.searchQuery.trim()) return of(null);
          return this.messageService.getConversation(this.selectedContact.id);
        }
        return of(null);
      })
    ).subscribe(msgs => {
      if (msgs && (msgs.length > this.messages.length || this.anyUnread(msgs))) {
        this.messages = msgs;
        this.scrollToBottom();
      }
    });

    this.typingSub = interval(3000).pipe(
      switchMap(() => {
        if (this.selectedContact && document.visibilityState === 'visible') {
          return this.messageService.isTyping(this.selectedContact.id);
        }
        return of({ isTyping: false });
      })
    ).subscribe(status => {
      this.isOtherTyping = status.isTyping;
    });
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
    this.typingSub?.unsubscribe();
  }

  getAvatarColor(user: User): string {
    const id = user.id || 0;
    return this.avatarColors[id % this.avatarColors.length];
  }

  isCompact(index: number): boolean {
    if (index === 0) return false;
    const current = this.messages[index];
    const prev = this.messages[index - 1];
    return current.sender.id === prev.sender.id;
  }

  isImage(type?: string): boolean {
    return !!type && type.startsWith('image/');
  }

  hasUnreadFrom(contact: User): boolean {
    // This would ideally come from the server in the contacts list
    return false; 
  }

  private anyUnread(msgs: DirectMessage[]): boolean {
    return msgs.some(m => m.receiver.id === this.currentUserId && !m.isRead);
  }

  filteredContacts(): User[] {
    if (!this.contactSearch.trim()) return this.contacts;
    const query = this.contactSearch.toLowerCase();
    return this.contacts.filter(c => 
      (c.fullName && c.fullName.toLowerCase().includes(query)) || 
      c.username.toLowerCase().includes(query) ||
      (c.role && c.role.toLowerCase().includes(query))
    );
  }

  onContactSearch(): void {
    if (this.contactSearch.trim().length >= 2) {
      this.messageService.searchUsers(this.contactSearch).subscribe(users => {
        this.globalSearchResults = users.filter(u => 
          u.id !== this.currentUserId && 
          !this.contacts.some(c => c.id === u.id)
        );
      });
    } else {
      this.globalSearchResults = [];
    }
  }

  onSearch(): void {
    this.loadMessages();
  }

  onTyping(): void {
    if (this.selectedContact) {
      this.messageService.setTyping(this.selectedContact.id).subscribe();
    }
  }

  triggerFileUpload(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploading = true;
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      this.sendMessage(undefined, file.type, file.name, base64Data);
      this.isUploading = false;
      this.fileInput.nativeElement.value = '';
    };
    reader.readAsDataURL(file);
  }

  loadContacts(): void {
    this.messageService.getContacts().subscribe(contacts => {
      this.contacts = contacts.map(c => ({
        ...c,
        lastMessageAt: new Date() // Placeholder, ideally from backend
      }));
      if (this.selectedContact && !this.contacts.some(c => c.id === this.selectedContact?.id)) {
        this.contacts.unshift(this.selectedContact);
      }
    });
  }

  selectContact(contact: User): void {
    this.selectedContact = contact;
    this.searchQuery = '';
    this.contactSearch = '';
    this.globalSearchResults = [];
    this.loadMessages();
    if (!this.contacts.some(c => c.id === contact.id)) {
      this.contacts.unshift(contact);
    }
  }

  private selectContactById(userId: number): void {
    this.httpService.getUserById(userId).subscribe(user => {
      this.selectContact(user);
    });
  }

  loadMessages(): void {
    if (!this.selectedContact) return;
    this.messageService.getConversation(this.selectedContact.id, this.searchQuery).subscribe(messages => {
      this.messages = messages;
      this.scrollToBottom();
    });
  }

  getDownloadUrl(msg: DirectMessage): string {
    if (msg.attachmentUrl && msg.attachmentUrl.startsWith('/api')) {
      return `${environment.apiUrl.replace('/api', '')}${msg.attachmentUrl}`;
    }
    return msg.attachmentUrl || '#';
  }

  sendMessage(attachmentUrl?: string, attachmentType?: string, attachmentName?: string, attachmentData?: string): void {
    if (!this.selectedContact) return;
    if (!this.newMessage.trim() && !attachmentData) return;
    
    const content = this.newMessage || (attachmentName ? `Sent an attachment: ${attachmentName}` : '');
    this.newMessage = '';
    
    this.messageService.sendMessage(
      this.selectedContact.id, 
      content, 
      this.selectedJobId || undefined,
      attachmentUrl,
      attachmentType,
      attachmentName,
      attachmentData
    ).subscribe(msg => {
      this.messages.push(msg);
      this.scrollToBottom();
      this.selectedJobId = null; 
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}
