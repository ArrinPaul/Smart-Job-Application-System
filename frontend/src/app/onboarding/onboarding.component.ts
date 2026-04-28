import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { HttpService } from '../services/http.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { UserRole } from '../models/user.model';

interface OnboardingStatus {
  currentStep: number;
  completionPercentage: number;
  isCompleted: boolean;
  userRole: string;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class OnboardingComponent implements OnInit {
  currentStep = 1;
  totalSteps = 5;
  role: UserRole | null = null;
  UserRole = UserRole;
  isEditMode = false;
  selectedFile: File | null = null;
  existingResumes: any[] = [];

  // Dropdown Options
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

  status: OnboardingStatus = {
    currentStep: 1,
    completionPercentage: 0,
    isCompleted: false,
    userRole: ''
  };

  // Form Data
  formData = {
    // Step 1
    fullName: '',
    location: '',
    bio: '',
    
    // Step 2
    headline: '',
    skills: '',
    companyName: '',
    companyWebsite: '',
    industry: '',
    companySize: '',
    experienceYears: null as number | null,
    
    // Step 3
    currentCompany: '',
    currentDesignation: '',
    education: '',
    
    // Step 4
    openToOpportunities: true,
    workPreference: 'remote',
    expectedSalaryMin: null as number | null,
    expectedSalaryMax: null as number | null,
    salaryCurrency: 'INR',
  };

  errors: { [key: string]: string } = {};
  isLoading = false;

  constructor(
    private httpService: HttpService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.role = this.authService.getRole();
    this.isEditMode = this.router.url.includes('/profile');
    
    if (!this.isEditMode && this.authService.isOnboardingCompleted()) {
      this.navigateHome();
    }
    
    this.loadOnboardingStatus();
    
    if (this.isEditMode) {
      this.loadProfileData();
    }
  }

  loadOnboardingStatus(): void {
    this.httpService.getOnboardingStatus().subscribe({
      next: (response: OnboardingStatus) => {
        this.status = response;
        if (!this.isEditMode) {
          this.currentStep = response.currentStep;
        }
        
        // Ensure role is synced if auth service was empty
        if (!this.role && response.userRole) {
          this.role = response.userRole as UserRole;
        }

        if (!this.isEditMode && response.isCompleted) {
          this.navigateHome();
        }
      },
      error: () => {
        // Continue with default step 1
      }
    });
  }

  loadProfileData(): void {
    this.isLoading = true;
    this.httpService.getOnboardingProfile().subscribe({
      next: (profile) => {
        this.isLoading = false;
        // Map profile to formData
        this.formData = {
          ...this.formData,
          ...profile
        };

        if (this.role === UserRole.JOB_SEEKER && profile.id) {
            this.loadExistingResumes(profile.id);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.showError('Failed to load profile data');
      }
    });
  }

  loadExistingResumes(userId: number): void {
    this.httpService.getResumes(userId).subscribe({
        next: (resumes) => {
            this.existingResumes = resumes;
        },
        error: () => {}
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  nextStep(): void {
    if (this.validateCurrentStep()) {
      this.saveCurrentStep();
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errors = {};
    }
  }

  goToStep(step: number): void {
    if (this.isEditMode || step <= this.currentStep || step === this.currentStep + 1) {
      this.currentStep = step;
      this.errors = {};
      window.scrollTo(0, 0);
    }
  }

  closeOnboarding(): void {
    if (this.isEditMode) {
      this.navigateHome();
      return;
    }
    if (confirm('Are you sure you want to close onboarding? You can complete it later from your profile.')) {
      this.navigateHome();
    }
  }

  skipOnboarding(): void {
    if (this.isEditMode) return;
    if (confirm('Are you sure you want to skip the onboarding? You can complete it later.')) {
      this.isLoading = true;
      this.httpService.skipOnboarding().subscribe({
        next: () => {
          this.authService.setOnboardingCompleted(true);
          this.toastService.showSuccess('Onboarding skipped. You can complete it anytime from your profile.');
          this.navigateHome();
        },
        error: () => {
          this.isLoading = false;
          this.toastService.showError('Failed to skip onboarding');
        }
      });
    }
  }

  saveCurrentStep(): void {
    this.isLoading = true;
    
    this.httpService.saveOnboardingStep(this.currentStep, this.formData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.status = response;
        
        if (this.currentStep < this.totalSteps) {
          this.currentStep++;
          this.errors = {};
          window.scrollTo(0, 0);
        } else {
          // Completed all steps, now finalize
          this.completeOnboarding();
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.handleApiError(err);
      }
    });
  }

  completeOnboarding(): void {
    this.isLoading = true;
    
    // If a resume was selected, upload it first
    if (this.role === UserRole.JOB_SEEKER && this.selectedFile) {
        this.httpService.uploadResume(this.selectedFile, this.selectedFile.name).subscribe({
            next: () => {
                this.finalizeOnboarding();
            },
            error: (err) => {
                this.isLoading = false;
                this.toastService.showError('Resume upload failed, but profile was saved.');
                this.finalizeOnboarding();
            }
        });
    } else {
        this.finalizeOnboarding();
    }
  }

  private finalizeOnboarding(): void {
    this.isLoading = true;
    this.httpService.completeOnboardingFinal().subscribe({
      next: () => {
        this.isLoading = false;
        if (!this.isEditMode) {
          this.authService.setOnboardingCompleted(true);
          this.toastService.showSuccess('Onboarding complete! Welcome to SmartJobPortal!');
        } else {
          this.toastService.showSuccess('Profile updated successfully!');
        }
        setTimeout(() => this.navigateHome(), 1500);
      },
      error: () => {
        this.isLoading = false;
        this.toastService.showError('Failed to complete update');
      }
    });
  }

  validateCurrentStep(): boolean {
    this.errors = {};

    if (this.currentStep === 1) {
      if (!this.formData.fullName?.trim()) {
        this.errors['fullName'] = 'Full name is required';
        return false;
      }
      if (!this.formData.location?.trim()) {
        this.errors['location'] = 'Location is required';
        return false;
      }
    }

    if (this.currentStep === 2) {
      if (!this.formData.headline?.trim()) {
        this.errors['headline'] = 'Professional headline is required';
        return false;
      }
      
      if (this.role === UserRole.RECRUITER) {
        if (!this.formData.companyName?.trim()) {
          this.errors['companyName'] = 'Company name is required';
          return false;
        }
      } else if (this.role === UserRole.JOB_SEEKER) {
        if (!this.formData.skills?.trim()) {
          this.errors['skills'] = 'Skills are required';
          return false;
        }
      }
    }

    if (this.currentStep === 4) {
      if (this.formData.expectedSalaryMin && this.formData.expectedSalaryMax) {
        if (this.formData.expectedSalaryMin > this.formData.expectedSalaryMax) {
          this.errors['salary'] = 'Minimum salary cannot be greater than maximum';
          return false;
        }
      }
    }

    return true;
  }

  private handleApiError(err: any): void {
    const errorMsg = err?.error?.message || 'An error occurred';
    this.toastService.showError(errorMsg);
  }

  private navigateHome(): void {
    if (this.isEditMode) {
      this.location.back();
      return;
    }

    const role = this.authService.getRole();
    if (role === UserRole.RECRUITER) {
      this.router.navigate(['/post-job']);
    } else if (role === UserRole.JOB_SEEKER) {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }

  getStepTitle(): string {
    const titles: { [key: number]: string } = {
      1: 'Basic Information',
      2: this.role === UserRole.RECRUITER ? 'Company Information' : 'Professional Details',
      3: 'Work Experience',
      4: this.role === UserRole.JOB_SEEKER ? 'Work Preferences' : 'Company Details',
      5: 'Complete Onboarding'
    };
    return titles[this.currentStep] || '';
  }

  getStepDescription(): string {
    const descriptions: { [key: number]: string } = {
      1: 'Help us get to know you better',
      2: this.role === UserRole.RECRUITER ? 'Tell us about your company' : 'Share your professional background',
      3: 'Add your experience and education',
      4: this.role === UserRole.JOB_SEEKER ? 'Set your job preferences' : 'Company details',
      5: 'You\'re all set!'
    };
    return descriptions[this.currentStep] || '';
  }

  getTabIcon(step: number): string {
    const icons: { [key: number]: string } = {
      1: '1',
      2: '2',
      3: '3',
      4: '4',
      5: '*'
    };
    return icons[step] || '';
  }

  getTabLabel(step: number): string {
    const labels: { [key: number]: string } = {
      1: 'Personal',
      2: 'Professional',
      3: 'Experience',
      4: 'Preferences',
      5: 'Review'
    };
    return labels[step] || '';
  }
}
