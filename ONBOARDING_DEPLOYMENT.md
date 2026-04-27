# Onboarding System Deployment & Sync Guide

## ✅ Changes Made & Fixed

### Backend Fixes
1. **Entity Annotations** - Added Lombok `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor` to:
   - `OnboardingProgress.java`
   - `RecruiterProfile.java`
   - `JobSeekerProfile.java`
   
2. **Removed Redundant Code** - Removed manual getters/setters (Lombok generates them automatically)

3. **DTO Enhancement** - Updated `OnboardingStepRequest.java` with Lombok annotations

4. **Database Migration** - Created `V8__improve_onboarding_structure.sql` in correct location:
   - Path: `backend/src/main/resources/db/migration/supabase/`
   - Creates 3 new tables: `onboarding_progress`, `recruiter_profile`, `job_seeker_profile`
   - Adds proper indexes and foreign keys
   - Migrates existing user data to new tables

### Frontend Improvements
1. **5-Step Onboarding Flow** - Complete redesign with progress tracking
2. **Updated HttpService** - New methods for step-based endpoints
3. **Enhanced Component** - Role-aware form fields and validation

### API Endpoints
- `GET /auth/onboarding/status` - Get progress
- `POST /auth/onboarding/step/1` - Save step 1
- `POST /auth/onboarding/step/2` - Save step 2
- `POST /auth/onboarding/step/3` - Save step 3
- `POST /auth/onboarding/step/4` - Save step 4
- `POST /auth/onboarding/step/5` - Complete onboarding
- `POST /auth/onboarding/skip` - Skip onboarding

---

## 🔧 Deployment Steps

### 1. **Backend Compilation**
```powershell
cd backend
mvn clean compile
```

### 2. **Execute Flyway Migration on Supabase**
The migration will run automatically when Spring Boot starts:
```powershell
# Run the backend
mvn spring-boot:run
```

**OR** manually execute the SQL in Supabase SQL Editor:
1. Go to Supabase Console: https://supabase.com
2. Select your project
3. Open SQL Editor
4. Copy contents from: `backend/src/main/resources/db/migration/supabase/V8__improve_onboarding_structure.sql`
5. Execute

### 3. **Verify Database Schema**
```sql
-- Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('onboarding_progress', 'recruiter_profile', 'job_seeker_profile');

-- Verify columns in onboarding_progress
\d onboarding_progress

-- Count existing onboarding progress records
SELECT COUNT(*) FROM onboarding_progress;
```

### 4. **Frontend Build**
```powershell
cd frontend
npm install
npm run build
# OR for development
ng serve
```

### 5. **Test the Onboarding Flow**
1. Start backend: `mvn spring-boot:run` (port 8080)
2. Start frontend: `ng serve` (port 4200)
3. Create a new user account
4. Navigate to onboarding and test all 5 steps
5. Verify data is saved in Supabase tables

---

## 🔍 Verification Checklist

### Backend Checks
- [ ] All entities compile without errors
- [ ] AuthController has 6 new onboarding endpoints
- [ ] OnboardingService is properly autowired
- [ ] Repositories extend JpaRepository
- [ ] Migration file exists in correct location

### Database Checks
- [ ] `onboarding_progress` table exists
- [ ] `recruiter_profile` table exists
- [ ] `job_seeker_profile` table exists
- [ ] All foreign keys are properly configured
- [ ] Indexes are created for performance
- [ ] Existing user data migrated successfully

### Frontend Checks
- [ ] Onboarding component renders 5 steps
- [ ] Progress bar updates correctly
- [ ] Step validation works
- [ ] API calls are made to correct endpoints
- [ ] Role-aware UI displays correctly

### API Tests
```bash
# Get onboarding status (requires auth token)
curl -X GET http://localhost:8080/api/auth/onboarding/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Save step 1
curl -X POST http://localhost:8080/api/auth/onboarding/step/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "location": "Bengaluru, India",
    "bio": "Software developer"
  }'
```

---

## 📊 Database Schema Summary

### onboarding_progress
- Tracks which step user is on (1-5)
- Records completion status for each step
- Stores timestamps (started_at, completed_at, last_updated_at)
- One-to-One relationship with users

### recruiter_profile
- Stores company-specific data for recruiters
- Fields: companyName, companyWebsite, companyLogoUrl, industry, companySize
- Includes verification status with timestamp
- One-to-One relationship with users

### job_seeker_profile
- Stores job seeker-specific data
- Fields: headline, skills, experience, education, salary expectations, work preferences
- Includes profile completion percentage
- One-to-One relationship with users

---

## 🚀 Next Steps

1. **Monitor Logs** - Watch for any migration errors in console
2. **Test Thoroughly** - Verify all 5 steps work end-to-end
3. **Handle Edge Cases** - Test with existing users, role changes, etc.
4. **Performance** - Check database query performance with indexes
5. **Deployment** - Deploy to production with proper backup

---

## ⚠️ Rollback Plan

If issues occur:
```sql
-- Disable the foreign key constraints
ALTER TABLE onboarding_progress DROP CONSTRAINT onboarding_progress_user_id_fkey;
ALTER TABLE recruiter_profile DROP CONSTRAINT recruiter_profile_user_id_fkey;
ALTER TABLE job_seeker_profile DROP CONSTRAINT job_seeker_profile_user_id_fkey;

-- Drop the tables
DROP TABLE IF EXISTS onboarding_progress CASCADE;
DROP TABLE IF EXISTS recruiter_profile CASCADE;
DROP TABLE IF EXISTS job_seeker_profile CASCADE;

-- Remove the onboarding_completed_at column if added
ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed_at;
```

---

## 📝 Notes

- All migrations are idempotent (safe to run multiple times)
- Existing user data is preserved and migrated to new tables
- Flyway will track migration as V8
- No production data is modified, only extended
