# Courses Module - Clean Architecture Implementation Plan

## Overview

Create a Courses module for managing YouTube video links with:

- YouTube link storage and display
- Paginated list on client side
- Full CRUD operations (admin)
- Clean Architecture pattern (same as Products)

## Database Schema

### Table: courses

```sql
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  youtube_video_id TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER, -- in seconds
  category TEXT,
  is_premium BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Indexes

```sql
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_display_order ON courses(display_order);
CREATE INDEX idx_courses_is_active ON courses(is_active);
```

## Architecture Structure

```
src/
├── domain/
│   ├── entities/
│   │   └── Course.ts           # Entity with business logic
│   ├── interfaces/
│   │   └── ICourseRepository.ts  # Repository interface
│   └── value-objects/
│       └── YouTubeVideo.ts     # YouTube URL parsing
│
├── infrastructure/
│   └── database/
│       └── supabase/
│           └── SupabaseCourseRepository.ts
│
├── application/
│   └── use-cases/
│       └── course/
│           ├── ListCourses.ts
│           ├── GetCourse.ts
│           ├── CreateCourse.ts
│           ├── UpdateCourse.ts
│           ├── DeleteCourse.ts
│           └── IncrementViews.ts
│
└── modules/
    └── courses/
        ├── courses.controller.ts      # Public endpoints
        ├── courses.admin.controller.ts # Admin CRUD
        ├── courses.routes.ts
        └── courses.types.ts
```

## Implementation Steps

### Phase 1: Domain Layer

1. Create `src/domain/entities/Course.ts`
   - Course entity with validation
   - YouTube URL parsing logic
   - Business methods (isPremium, getEmbedUrl, etc.)

2. Create `src/domain/interfaces/ICourseRepository.ts`
   - CRUD operations
   - Pagination support
   - Category listing

3. Create `src/domain/value-objects/YouTubeVideo.ts`
   - Extract video ID from URL
   - Generate thumbnail URL
   - Validate YouTube URLs

### Phase 2: Infrastructure

1. Create `src/infrastructure/database/supabase/SupabaseCourseRepository.ts`
   - Implement ICourseRepository
   - Supabase queries

2. Update `src/infrastructure/index.ts` exports

### Phase 3: Application Layer

Create use cases:

1. `ListCourses.ts` - Paginated list with filters
2. `GetCourse.ts` - Single course by ID
3. `CreateCourse.ts` - Create new course
4. `UpdateCourse.ts` - Update course
5. `DeleteCourse.ts` - Delete course
6. `IncrementViews.ts` - Track views

### Phase 4: Presentation Layer

1. Create `src/modules/courses/courses.types.ts`
2. Create `src/modules/courses/courses.controller.ts` - Public
3. Create `src/modules/courses/courses.admin.controller.ts` - Admin
4. Create `src/modules/courses/courses.routes.ts`

### Phase 5: Migration

Create `supabase/migrations/YYYYMMDD_create_courses.sql`

## YouTube URL Handling

### Supported URL Formats:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://www.youtube.com/v/VIDEO_ID`

### Helper Functions:

```typescript
// Extract video ID
extractVideoId(url: string): string | null

// Generate thumbnail
getThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'max'): string

// Get embed URL
getEmbedUrl(videoId: string): string
```

## API Endpoints

### Public:

- `GET /api/courses` - List (paginated)
- `GET /api/courses/:id` - Get single

### Admin:

- `GET /api/admin/courses` - List (paginated)
- `POST /api/admin/courses` - Create
- `PUT /api/admin/courses/:id` - Update
- `DELETE /api/admin/courses/:id` - Delete

## Client Display

- Paginated list (10 items per page)
- Filter by category
- Search by title
- Show thumbnail, title, duration
