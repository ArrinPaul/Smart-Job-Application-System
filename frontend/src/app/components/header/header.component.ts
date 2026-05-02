import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message.service';
import { filter } from 'rxjs/operators';
import { interval, Subscription, startWith, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isVisible = true;
  isLoggedIn = false;
  unreadCount = 0;
  private unreadSub?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    // Hide header on landing/auth/onboarding/admin pages
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(new NavigationEnd(0, this.router.url, this.router.url))
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects || event.url;
      const hiddenPaths = [
        '/', '/landing', '/login', '/register', '/onboarding', '/admin'
      ];
      
      this.isVisible = !hiddenPaths.some(path => {
        // Remove query params and fragments for base path comparison
        const baseUrl = url.split('?')[0].split('#')[0];
        
        if (path === '/') return baseUrl === '/' || baseUrl === '';
        return baseUrl === path || baseUrl.startsWith(path + '/');
      });
    });
  }

  isRecruiter(): boolean {
    return this.authService.isRecruiter();
  }

  isJobSeeker(): boolean {
    return this.authService.isJobSeeker();
  }

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
      if (status) {
        this.startUnreadPolling();
      } else {
        this.stopUnreadPolling();
        this.unreadCount = 0;
      }
    });
  }

  ngOnDestroy(): void {
    this.stopUnreadPolling();
  }

  private startUnreadPolling(): void {
    this.stopUnreadPolling();
    this.unreadSub = interval(10000).pipe(
      startWith(0),
      switchMap(() => this.isLoggedIn ? this.messageService.getUnreadMessages() : of([]))
    ).subscribe({
      next: (messages) => {
        this.unreadCount = messages.length;
      },
      error: () => {
        this.unreadCount = 0;
      }
    });
  }

  private stopUnreadPolling(): void {
    this.unreadSub?.unsubscribe();
  }

  logout(): void {
    this.stopUnreadPolling();
    this.authService.logout();
  }
}
