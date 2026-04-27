# Job Recommendation Engine Documentation

## Overview

The Job Recommendation Engine is an intelligent system that analyzes job seeker profiles and matches them with suitable jobs based on a sophisticated scoring algorithm. The system provides both a dedicated recommendations page and a dashboard widget for quick access.

## Architecture

### Backend Components

#### 1. **JobRecommendationService** (`backend/src/main/java/com/edutech/jobportalsystem/service/JobRecommendationService.java`)

The core service that implements the recommendation algorithm with the following scoring factors:

**Scoring Factors (Total: 100 points)**

1. **Skills Match (25 points)**
   - Compares user's skills with job requirements
   - Uses substring matching for flexibility
   - Calculates percentage of required skills matched

2. **Experience Level (20 points)**
   - Evaluates years of experience
   - Perfect match: User years ≥ Required years
   - Partial credit for close matches (within 1-3 years)

3. **Job Title/Designation (15 points)**
   - Exact title matches: 15 points
   - Keyword-based matching: Scaled points
   - Filters out short words to avoid false matches

4. **Salary Expectations (15 points)**
   - Checks if job salary range overlaps with user expectations
   - Full credit for exact overlap
   - Partial credit if ranges are close (within 20%)

5. **Location & Work Preference (10 points)**
   - Evaluates location matching
   - Considers work type preferences (Remote, On-site, Hybrid)
   - Hybrid positions compatible with any preference

6. **Education Level (10 points)**
   - Matches education qualifications
   - Prefers users with equal or higher education
   - Graceful handling of non-required education

**Minimum Match Threshold: 50%**

Jobs with less than 50% match score are not recommended.

#### 2. **JobRecommendationDTO** (`backend/src/main/java/com/edutech/jobportalsystem/dto/job/JobRecommendationDTO.java`)

Data transfer object containing:
- Job ID, Title, Company, Location, Work Type
- Salary range
- Match Percentage (0-100)
- Match Reasons (list of factors contributing to the score)

#### 3. **API Endpoint**

```
GET /jobseeker/recommendations?limit=10
```

**Parameters:**
- `limit`: Maximum number of recommendations (default: 10, max: 50)

**Response:**
```json
[
  {
    "jobId": 1,
    "jobTitle": "Senior Software Engineer",
    "companyName": "Tech Corp",
    "location": "San Francisco, CA",
    "workType": "Hybrid",
    "salaryMin": 120000,
    "salaryMax": 160000,
    "matchPercentage": 92,
    "matchReasons": [
      "Skills match (88%)",
      "Experience match (100%)",
      "Role match (95%)",
      "Salary match (100%)",
      "Location/work type match (100%)"
    ]
  }
]
```

### Frontend Components

#### 1. **RecommendationsComponent** (`frontend/src/app/recommendations/`)

**Files:**
- `recommendations.component.ts` - Main component logic
- `recommendations.component.html` - Template
- `recommendations.component.css` - Styling

**Features:**
- Full-page recommendations display
- Card-based layout with expandable details
- Match percentage visualization with color coding
- Apply, Share, and View Details actions
- Responsive design for mobile/tablet/desktop
- Loading and error states
- Empty state guidance

**Color Coding:**
- Green (≥80%): Excellent Match
- Amber (60-79%): Good Match
- Red (50-59%): Fair Match

#### 2. **RecommendationWidgetComponent** (`frontend/src/app/components/recommendation-widget/`)

**Files:**
- `recommendation-widget.component.ts` - Widget logic
- `recommendation-widget.component.html` - Template
- `recommendation-widget.component.css` - Styling

**Features:**
- Compact 5-recommendation display
- Shows top matches only
- Quick access from dashboard
- Link to full recommendations page
- Optimized for mobile viewing

#### 3. **HTTP Service Update** (`frontend/src/app/services/http.service.ts`)

Added method:
```typescript
getJobRecommendations(limit: number = 10): Observable<any[]>
```

#### 4. **Models** (`frontend/src/app/models/recommendation.model.ts`)

```typescript
export interface JobRecommendation {
  jobId: number;
  jobTitle: string;
  companyName: string;
  location: string;
  workType: string;
  salaryMin: number;
  salaryMax: number;
  matchPercentage: number;
  matchReasons: string[];
}
```

### Routing

Added route in `app.routes.ts`:
```typescript
{
  path: 'recommendations',
  loadComponent: () => import('./recommendations/recommendations.component').then(m => m.RecommendationsComponent),
  canActivate: [RoleGuard],
  data: { roles: [UserRole.JOB_SEEKER] }
}
```

## Usage

### For Job Seekers

#### Accessing Recommendations

1. **Full Page:** Navigate to `/recommendations` route
2. **Dashboard Widget:** View top 5 recommendations on dashboard
3. **API Direct:** Call `/jobseeker/recommendations` endpoint

#### Recommendation Actions

- **Apply Now:** Submit application directly from recommendation
- **Share:** Share job recommendation via social or clipboard
- **View Details:** Navigate to full job details page

### For Developers

#### Integrating the Widget

```typescript
import { RecommendationWidgetComponent } from './components/recommendation-widget/recommendation-widget.component';

// In your dashboard component
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecommendationWidgetComponent } from './components/recommendation-widget/recommendation-widget.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RecommendationWidgetComponent],
  template: `
    <div class="dashboard">
      <h1>Dashboard</h1>
      <div class="widgets-grid">
        <!-- Other widgets -->
        <app-recommendation-widget></app-recommendation-widget>
      </div>
    </div>
  `
})
export class DashboardComponent {}
```

#### Customizing Recommendations

To modify scoring weights, edit `JobRecommendationService.scoreJobForUser()`:

```java
private int scoreSkillsMatch(String userSkills, String requiredSkills) {
    // Modify logic here
    return (int) Math.round((percentage / 100.0) * 25); // 25 = max points for skills
}
```

## Algorithm Details

### Skill Matching Algorithm

```
1. Split user skills and required skills by comma
2. Normalize to lowercase
3. For each required skill:
   - Check if any user skill contains it (substring match)
   - Or if the required skill contains the user skill
4. Count matches
5. Calculate percentage: (matches / total_required) * 100
6. Scale to 0-25 points
```

### Experience Matching

```
Perfect Match (20 pts):  userYears >= requiredYears
Almost There (18 pts):   yearsDiff = 1
Good (15 pts):          yearsDiff = 2
Fair (10 pts):          yearsDiff = 3
No Match (0 pts):       yearsDiff > 3
```

### Title Similarity

```
1. Normalize titles to lowercase
2. If exact match: 15 points
3. If partial match:
   - Split into words
   - Count matching words (length > 2)
   - Award 5 points per matched word
   - Cap at 15 points
4. No match: 0 points
```

### Salary Matching

```
IF jobSalaryMax >= userSalaryMin AND jobSalaryMin <= userSalaryMax:
    RETURN 15 (Full match)
ELSE IF ranges within 20% tolerance:
    RETURN 8 (Partial match)
ELSE:
    RETURN 0 (No match)
```

## Performance Considerations

### Query Optimization

The service currently loads all active jobs. For large datasets, consider:

```java
// Add pagination
public Page<JobRecommendationDTO> getRecommendationsForUser(
    Long userId, 
    int limit, 
    int offset) {
    // Implement pagination
}

// Add caching
@Cacheable(value = "recommendations", key = "#userId")
public List<JobRecommendationDTO> getRecommendationsForUser(Long userId, int limit) {
    // ...
}
```

### Caching Strategy

Recommendations can be cached for 24 hours:

```java
import org.springframework.cache.annotation.Cacheable;

@Cacheable(value = "recommendations", key = "#userId", cacheManager = "cacheManager")
public List<JobRecommendationDTO> getRecommendationsForUser(Long userId, int limit) {
    // Service implementation
}
```

## Testing

### Backend Unit Tests

```java
@SpringBootTest
class JobRecommendationServiceTest {
    
    @Test
    void testSkillsMatching() {
        // Test skills matching logic
    }
    
    @Test
    void testExperienceMatching() {
        // Test experience level matching
    }
    
    @Test
    void testSalaryMatching() {
        // Test salary range matching
    }
}
```

### Frontend Component Tests

```typescript
describe('RecommendationsComponent', () => {
  it('should load recommendations on init', () => {
    // Test initialization
  });
  
  it('should display match percentage with correct color', () => {
    // Test color coding logic
  });
});
```

## Future Enhancements

1. **Machine Learning Integration**
   - Implement collaborative filtering
   - Use historical application data for better matching

2. **Advanced Filtering**
   - Filter by match percentage threshold
   - Sort by salary, date posted, or company

3. **Notification System**
   - Alert job seekers of new matching jobs
   - Scheduled digest emails

4. **Analytics**
   - Track recommendation accuracy
   - Monitor application rates
   - A/B test scoring algorithms

5. **User Feedback Loop**
   - Allow users to rate recommendation quality
   - Use feedback to improve algorithm

6. **Real-time Updates**
   - WebSocket integration for new job notifications
   - Live recommendation updates

## Troubleshooting

### No Recommendations Showing

1. **Check Profile Completion:** Ensure job seeker profile has:
   - Skills
   - Experience years
   - Expected salary
   - Work preferences

2. **Verify Available Jobs:** Confirm active jobs exist in system

3. **Check Match Threshold:** All recommendations must be ≥50% match

### Low Match Percentages

1. **Improve Profile Details:** Add more specific skills and experience
2. **Adjust Salary Expectations:** Broaden salary range
3. **Update Work Preferences:** Be flexible with location/type

### Performance Issues

1. **Enable Caching:** Implement recommendation caching
2. **Add Database Indexes:** Index frequently searched fields
3. **Implement Pagination:** Limit results returned

## API Examples

### Using cURL

```bash
# Get top 10 recommendations
curl -X GET "http://localhost:8080/jobseeker/recommendations?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get top 20 recommendations
curl -X GET "http://localhost:8080/jobseeker/recommendations?limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Angular HttpClient

```typescript
this.httpService.getJobRecommendations(10).subscribe(
  recommendations => {
    console.log('Recommendations:', recommendations);
  },
  error => {
    console.error('Error:', error);
  }
);
```

## Configuration

### Application Properties

Add to `application.properties`:

```properties
# Job Recommendation Settings
recommendation.min-match-threshold=50
recommendation.default-limit=10
recommendation.max-limit=50

# Caching (if implemented)
spring.cache.type=redis
spring.redis.host=localhost
spring.redis.port=6379
```

## Database Schema

No additional tables required. The system uses existing:
- `users` table
- `jobs` table
- `job_seeker_profiles` table

## Security Considerations

- Only job seekers can access recommendations
- Users only see recommendations for themselves
- All endpoints require JWT authentication
- No sensitive data exposed in recommendations

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review component error messages
3. Check browser console for client-side errors
4. Review application logs for server-side errors
