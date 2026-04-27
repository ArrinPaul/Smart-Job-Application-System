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
      icon: 'Mission',
      title: 'Seamless Matching',
      description: 'We leverage intelligent algorithms to connect job seekers with the most relevant opportunities instantly.'
    },
    {
      icon: 'Collaboration',
      title: 'Recruiter Empowerment',
      description: 'Our platform provides recruiters with powerful tools to manage listings and track candidate progress efficiently.'
    },
    {
      icon: 'Security',
      title: 'Data Integrity',
      description: 'We prioritize security with JWT-based authentication and secure database migrations using Supabase.'
    },
    {
      icon: 'Speed',
      title: 'Modern Stack',
      description: 'Built with Spring Boot 3 and Angular 17, ensuring a high-performance, responsive experience for all users.'
    }
  ];

  team = [
    {
      name: 'EduTech System',
      role: 'Platform Core',
      image: '',
      bio: 'The foundational architecture supporting thousands of concurrent job interactions.'
    },
    {
      name: 'Supabase',
      role: 'Database Engine',
      image: '',
      bio: 'Providing real-time PostgreSQL capabilities and secure data persistence.'
    },
    {
      name: 'Spring Boot',
      role: 'Backend Framework',
      image: '',
      bio: 'Powering the robust RESTful API and business logic layer.'
    },
    {
      name: 'Angular',
      role: 'Frontend Framework',
      image: '',
      bio: 'Delivering a modular and responsive single-page application interface.'
    }
  ];
}
