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
    { number: '50K+', label: 'Active Users' },
    { number: '10K+', label: 'Job Listings' },
    { number: '5K+', label: 'Successful Placements' },
    { number: '98%', label: 'Match Accuracy' }
  ];

  values = [
    {
      icon: 'Mission',
      title: 'Mission-Driven',
      description: 'We connect talented professionals with life-changing opportunities.'
    },
    {
      icon: 'Collaboration',
      title: 'People First',
      description: 'Your success is our success. We prioritize your career growth.'
    },
    {
      icon: 'Security',
      title: 'Transparent',
      description: 'Honest matching, clear processes, and fair opportunities for all.'
    },
    {
      icon: 'Speed',
      title: 'Innovative',
      description: 'Using AI and data to revolutionize job matching.'
    }
  ];

  team = [
    {
      name: 'Sarah Johnson',
      role: 'Founder & CEO',
      image: '',
      bio: 'Former HR Director with 15 years of recruitment experience'
    },
    {
      name: 'Aryan Patel',
      role: 'CTO & Co-founder',
      image: '',
      bio: 'AI/ML expert building intelligent matching algorithms'
    },
    {
      name: 'Emma Wilson',
      role: 'Head of Operations',
      image: '',
      bio: 'Operations strategist ensuring seamless platform experience'
    },
    {
      name: 'Marcus Chen',
      role: 'Head of Product',
      image: '',
      bio: 'Product visionary designing user-centric features'
    }
  ];
}
