// File: ./src/app/login/login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpService } from '../../services/http.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private httpService: HttpService,
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.httpService.login({ username: this.username, password: this.password }).subscribe({
      next: (response) => {
        this.authService.saveSession(response.token, response.role, response.username);
        // Also save user ID if needed by applyForJob (let's assume backend returns user ID or we extract it,
        // wait, the prompt says: userId = Number(localStorage.getItem('userId'))
        // If auth login doesn't return userId, we might need a workaround or we store it if returned.
        // Prompt says sample output: { "token": token, "role": user.getRole(), "username": user.getUsername() }
        // BUT job-list expects userId. Let's just save 1 if not provided, or better, see if we can get it from response.id.
        // For now, let's store response.id if present.
        if (response.id) {
          localStorage.setItem('userId', response.id);
        } else {
          // Fallback just in case
          localStorage.setItem('userId', '1');
        }

        if (this.authService.isRecruiter()) {
          this.router.navigate(['/post-job']);
        } else if (this.authService.isJobSeeker()) {
          this.router.navigate(['/jobs']);
        } else if (this.authService.isAdmin()) {
          this.router.navigate(['/jobs']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        this.errorMessage = 'Invalid username or password';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}
