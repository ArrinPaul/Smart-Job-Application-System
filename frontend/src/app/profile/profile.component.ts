import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpService } from '../services/http.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { UserRole } from '../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  isLoading = false;
  isSaving = false;
  isEditing = false;
  userProfile: any = {};
  role: UserRole | null = null;
  UserRole = UserRole;

  // Dropdown Options (Synced with Onboarding)
  headlineOptions = [
    'Software Engineer', 'Senior Software Engineer', 'Full Stack Developer', 'Backend Engineer', 'Frontend Engineer',
    'DevOps Engineer', 'Site Reliability Engineer (SRE)', 'Data Engineer', 'Machine Learning Engineer', 'Mobile Developer (iOS/Android)',
    'Embedded Systems Engineer', 'Cloud Architect', 'Security Engineer', 'QA Automation Engineer', 'Systems Programmer',
    'Game Developer', 'Blockchain Engineer', 'Computer Vision Engineer', 'NLP Engineer', 'Firmware Engineer',
    'Solutions Architect', 'Staff Software Engineer', 'Principal Software Engineer', 'Engineering Manager', 'Director of Engineering',
    'CTO (Chief Technology Officer)', 'Infrastructure Engineer', 'Platform Engineer', 'Database Administrator (DBA)', 'UI/UX Designer'
  ];

  skillsOptions = [
    'JavaScript', 'Python', 'Java', 'C++', 'C#', 'TypeScript', 'HTML/CSS', 'React', 'Angular', 'Vue.js',
    'Node.js', 'SQL', 'NoSQL', 'Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'Machine Learning',
    'Data Analysis', 'Agile Methodologies', 'RESTful APIs', 'GraphQL', 'Linux', 'Testing/QA', 'CI/CD',
    'Cybersecurity', 'System Design', 'Problem Solving'
  ];

  companyOptions = [
    'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Netflix', 'IBM', 'Oracle', 'SAP', 'Salesforce',
    'Adobe', 'Intel', 'Cisco', 'TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'Capgemini', 'Deloitte',
    'HCL', 'Tech Mahindra', 'Uber', 'Airbnb', 'Twitter', 'LinkedIn', 'Tesla', 'Spotify', 'PayPal', 'Stripe'
  ];

  educationOptions = [
    'High School Diploma', 'Associate Degree', 'Bachelor of Science (B.Sc.)', 'Bachelor of Arts (B.A.)', 'Bachelor of Engineering (B.E.)',
    'Bachelor of Technology (B.Tech)', 'Bachelor of Computer Applications (BCA)', 'Master of Science (M.Sc.)', 'Master of Arts (M.A.)',
    'Master of Engineering (M.E.)', 'Master of Technology (M.Tech)', 'Master of Computer Applications (MCA)', 'Master of Business Administration (MBA)',
    'Doctor of Philosophy (Ph.D.)', 'Diploma in Computer Science', 'Post Graduate Diploma', 'Bootcamp Graduate', 'Self-Taught',
    'Some College (No Degree)', 'Professional Certification'
  ];

  // For multi-select handling
  selectedHeadlines: string[] = [];
  selectedSkills: string[] = [];

  constructor(
    private httpService: HttpService,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.role = this.authService.getRole();
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.httpService.getOnboardingProfile().subscribe({
      next: (profile) => {
        this.userProfile = { ...profile };
        
        // Parse headlines and skills into arrays
        if (profile.headline) {
          this.selectedHeadlines = profile.headline.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '');
        }
        if (profile.skills) {
          this.selectedSkills = profile.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '');
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.showError('Failed to load profile');
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.loadProfile(); // Reset changes
    }
  }

  toggleSelection(field: 'headline' | 'skills', value: string): void {
    const list = field === 'headline' ? this.selectedHeadlines : this.selectedSkills;
    const index = list.indexOf(value);
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(value);
    }
  }

  isSelected(field: 'headline' | 'skills', value: string): boolean {
    const list = field === 'headline' ? this.selectedHeadlines : this.selectedSkills;
    return list.includes(value);
  }

  addCustomOption(field: 'headline' | 'skills', value: string): void {
    const trimmed = value.trim();
    if (!trimmed) return;
    
    const options = field === 'headline' ? this.headlineOptions : this.skillsOptions;
    if (!options.includes(trimmed)) {
      options.push(trimmed);
    }
    
    this.toggleSelection(field, trimmed);
  }

  saveProfile(): void {
    this.isSaving = true;
    
    // Prepare data
    const payload = {
      ...this.userProfile,
      headline: this.selectedHeadlines.join(', '),
      skills: this.selectedSkills.join(', ')
    };

    this.httpService.updateProfile(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.isEditing = false;
        this.toastService.showSuccess('Profile updated successfully');
        this.loadProfile();
      },
      error: (err) => {
        this.isSaving = false;
        this.toastService.showError('Failed to update profile');
      }
    });
  }
}
