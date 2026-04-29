import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isVisible = true;
  isLoggedIn = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    // Hide header on auth pages
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      const hiddenPaths = [
        '/', '/landing', '/login', '/register', '/onboarding', 
        '/admin', '/applications', '/post-job', '/resume'
      ];
      this.isVisible = !hiddenPaths.some(path => 
        url === path || 
        url.startsWith(path + '/') || 
        url.startsWith(path + '?')
      );
    });
  }

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });
  }

  logout(): void {
    // Delegate navigation to AuthService; avoid duplicate navigations
    this.authService.logout();
  }
}
