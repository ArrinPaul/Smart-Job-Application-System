import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../services/http.service';
import { ToastService } from '../services/toast.service';
import { User, UserRole } from '../models/user.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface EditingUser {
  id: number;
  email: string;
  username: string;
  role: string;
}

interface PasswordReset {
  userId: number;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  users: User[] = [];
  isLoading = false;
  
  // Modals
  showEditModal = false;
  showPasswordModal = false;
  showDeleteConfirm = false;
  
  editingUser: EditingUser | null = null;
  passwordReset: PasswordReset = { userId: 0, newPassword: '', confirmPassword: '' };
  userToDelete: User | null = null;
  
  // Form errors
  editErrors: { [key: string]: string } = {};
  passwordErrors: { [key: string]: string } = {};

  private destroy$ = new Subject<void>();

  constructor(
    private httpService: HttpService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.httpService.getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: User[]) => {
          this.users = response;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.toastService.showError('Failed to load users');
        }
      });
  }

  openEditModal(user: User): void {
    this.editingUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    };
    this.editErrors = {};
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingUser = null;
    this.editErrors = {};
  }

  saveUserChanges(): void {
    if (!this.editingUser) return;

    this.editErrors = {};

    if (!this.editingUser.email?.trim()) {
      this.editErrors['email'] = 'Email is required';
    }
    if (!this.editingUser.username?.trim()) {
      this.editErrors['username'] = 'Username is required';
    }
    if (!this.editingUser.role) {
      this.editErrors['role'] = 'Role is required';
    }

    if (Object.keys(this.editErrors).length > 0) {
      return;
    }

    this.isLoading = true;
    this.httpService.updateUser(this.editingUser.id, {
      email: this.editingUser.email,
      username: this.editingUser.username,
      role: this.editingUser.role as UserRole
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastService.showSuccess('User updated successfully');
        this.closeEditModal();
        this.loadUsers();
      },
      error: () => {
        this.isLoading = false;
        this.toastService.showError('Failed to update user');
      }
    });
  }

  openPasswordModal(user: User): void {
    this.passwordReset = {
      userId: user.id,
      newPassword: '',
      confirmPassword: ''
    };
    this.passwordErrors = {};
    this.showPasswordModal = true;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.passwordReset = { userId: 0, newPassword: '', confirmPassword: '' };
    this.passwordErrors = {};
  }

  saveNewPassword(): void {
    this.passwordErrors = {};

    if (!this.passwordReset.newPassword?.trim()) {
      this.passwordErrors['newPassword'] = 'New password is required';
    }
    if (this.passwordReset.newPassword?.length < 6) {
      this.passwordErrors['newPassword'] = 'Password must be at least 6 characters';
    }
    if (this.passwordReset.newPassword !== this.passwordReset.confirmPassword) {
      this.passwordErrors['confirmPassword'] = 'Passwords do not match';
    }

    if (Object.keys(this.passwordErrors).length > 0) {
      return;
    }

    this.isLoading = true;
    this.httpService.updateUserPassword(
      this.passwordReset.userId,
      this.passwordReset.newPassword
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastService.showSuccess('Password updated successfully');
        this.closePasswordModal();
        this.loadUsers();
      },
      error: () => {
        this.isLoading = false;
        this.toastService.showError('Failed to update password');
      }
    });
  }

  openDeleteConfirm(user: User): void {
    this.userToDelete = user;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.userToDelete = null;
  }

  confirmDelete(): void {
    if (!this.userToDelete) return;

    this.isLoading = true;
    this.httpService.deleteUser(this.userToDelete.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.toastService.showSuccess('User deleted successfully');
          this.closeDeleteConfirm();
          this.loadUsers();
        },
        error: () => {
          this.isLoading = false;
          this.toastService.showError('Failed to delete user');
        }
      });
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'JOB_APPLICANT': 
      case 'JOB_SEEKER': return 'Job Applicant';
      case 'RECRUITER': return 'Recruiter';
      case 'ADMIN': return 'Administrator';
      default: return role;
    }
  }

  changeRole(user: User, newRole: string): void {
    if (user.role === newRole) return;

    const previousRole = user.role;
    this.isLoading = true;
    
    this.httpService.updateUserRole(user.id, newRole)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.toastService.showSuccess(`User role changed to ${newRole}`);
          this.loadUsers();
        },
        error: () => {
          this.isLoading = false;
          this.toastService.showError('Failed to change user role');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
