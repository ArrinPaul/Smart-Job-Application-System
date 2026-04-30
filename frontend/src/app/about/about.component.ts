import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  stats = [
    { number: '100%', label: 'Open Source' },
    { number: 'Real-time', label: 'Job Syncing' },
    { number: 'Secure', label: 'JWT Auth' },
    { number: '99.9%', label: 'Uptime' }
  ];

  values = [
    {
      icon: 'Search',
      title: 'Job Discovery',
      description: 'We help candidates quickly find relevant openings through smart search, filters, and curated listings.'
    },
    {
      icon: 'Post',
      title: 'Job Posting',
      description: 'Employers can create and manage job posts with clear details, locations, and hiring requirements.'
    },
    {
      icon: 'Support',
      title: 'Applicant Support',
      description: 'Candidates get a smoother application experience with profile building, saved jobs, and guided steps.'
    },
    {
      icon: 'Shield',
      title: 'Secure Access',
      description: 'We keep user accounts, applications, and recruiter workflows protected with secure authentication.'
    }
  ];

  services = [
    {
      name: 'Smart Job Search',
      role: 'For Job Seekers',
      image: 'assets/about/job-discovery.svg',
      bio: 'Find matching roles faster with searchable listings, category filters, and location-based discovery.'
    },
    {
      name: 'Recruiter Dashboard',
      role: 'For Employers',
      image: 'assets/about/job-posting.svg',
      bio: 'Manage postings, review applicants, and keep hiring activity organized in one place.'
    },
    {
      name: 'Application Tracking',
      role: 'For Hiring Teams',
      image: 'assets/about/applicant-support.svg',
      bio: 'Track applications through a simple workflow so teams can move candidates forward without confusion.'
    },
    {
      name: 'Secure Profiles',
      role: 'For Everyone',
      image: 'assets/about/secure-access.svg',
      bio: 'Keep profiles, resumes, and account activity protected while users interact with the platform.'
    }
  ];
}
