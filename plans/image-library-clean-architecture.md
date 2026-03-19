# Image Library Module - Clean Architecture Implementation Plan

## Overview

Create an Image Library module for managing images with:

- Admin CRUD operations
- Public display endpoints
- Categories support (banners, gallery, testimonials, partners)
- Fields: title, category, thumbnail_url, image_url, description, display_order, is_active
- External URL images

## Architecture Structure

```
src/
├── domain/
│   ├── entities/
│   │   └── ImageLibrary.ts           # Entity with business logic
│   └── interfaces/
│       └── IImageLibraryRepository.ts  # Repository interface
│
├── infrastructure/
│   └── database/
│       └── supabase/
│           └── SupabaseImageLibraryRepository.ts
│
├── application/
│   └── use-cases/
│       └── image-library/
│           ├── ListImageLibraries.ts
│           ├── GetImageLibrary.ts
│           ├── CreateImageLibrary.ts
│           ├── UpdateImageLibrary.ts
│           ├── DeleteImageLibrary.ts
│           └── index.ts
│
└── modules/
    └── image-library/
        ├── image-library.controller.ts      # Public endpoints
        ├── image-library.admin.controller.ts # Admin CRUD
        ├── image-library.routes.ts
        └── image-library.types.ts
```

## Database Schema

### Table: image_library

```sql
CREATE TABLE IF NOT EXISTS image_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'gallery',
  thumbnail_url TEXT,
  image_url TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_image_library_category ON image_library(category);
CREATE INDEX idx_image_library_display_order ON image_library(display_order);
CREATE INDEX idx_image_library_is_active ON image_library(is_active);

-- Enable RLS
ALTER TABLE image_library ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can view active images"
ON image_library FOR SELECT
USING (is_active = true);

-- Allow authenticated users to manage (admin)
CREATE POLICY "Admins can manage image library"
ON image_library FOR ALL
USING (auth.uid() IN (
  SELECT id FROM auth.users
  WHERE raw_user_meta_data->>'role' = 'admin'
));
```

## Categories

- `banners` - Hero banners, promotional images
- `gallery` - Image gallery items
- `testimonials` - Customer testimonial images
- `partners` - Partner/client logos

## API Endpoints

### Public

- `GET /api/image-library` - List active images (paginated, filterable by category)
- `GET /api/image-library/:id` - Get single image by ID

### Admin

- `GET /api/admin/image-library` - List all images (paginated, with filters)
- `POST /api/admin/image-library` - Create new image
- `PATCH /api/admin/image-library/:id` - Update image
- `DELETE /api/admin/image-library/:id` - Delete image

## Implementation Steps

### Phase 1: Database Migration

Create migration file in `supabase/migrations/`

### Phase 2: Domain Layer

1. Create `src/domain/entities/ImageLibrary.ts`
   - ImageLibrary entity with business logic
   - Create/Update props interfaces
   - Database row type
   - Response types

2. Create `src/domain/interfaces/IImageLibraryRepository.ts`
   - Repository interface with CRUD operations
   - Pagination and filter support

### Phase 3: Infrastructure

1. Create `src/infrastructure/database/supabase/SupabaseImageLibraryRepository.ts`
   - Implement IImageLibraryRepository
   - Supabase queries

2. Update `src/infrastructure/index.ts` exports

### Phase 4: Application Layer (Use Cases)

Create use cases:

1. `ListImageLibraries.ts` - Paginated list with category filter
2. `GetImageLibrary.ts` - Single image by ID
3. `CreateImageLibrary.ts` - Create new image
4. `UpdateImageLibrary.ts` - Update image
5. `DeleteImageLibrary.ts` - Delete image

### Phase 5: Presentation Layer

1. Create `src/modules/image-library/image-library.types.ts`
2. Create `src/modules/image-library/image-library.controller.ts` - Public
3. Create `src/modules/image-library/image-library.admin.controller.ts` - Admin
4. Create `src/modules/image-library/image-library.routes.ts`

### Phase 6: Integration

1. Update `src/domain/entities/index.ts` - Add ImageLibrary exports
2. Update `src/domain/interfaces/index.ts` - Add IImageLibraryRepository export
3. Update `src/di/container.ts` - Register IImageLibraryRepository
4. Update `src/app.ts` - Register routes

## Request/Response Examples

### Create Image (Admin)

```json
POST /api/admin/image-library
{
  "title": "Summer Sale Banner",
  "category": "banners",
  "thumbnail_url": "https://example.com/thumb/summer.jpg",
  "image_url": "https://example.com/images/summer.jpg",
  "description": "Summer sale promotional banner",
  "displayOrder": 1,
  "isActive": true
}
```

### List Images (Public)

```json
GET /api/image-library?category=banners&page=1&limit=10
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Summer Sale Banner",
      "category": "banners",
      "thumbnailUrl": "https://example.com/thumb/summer.jpg",
      "imageUrl": "https://example.com/images/summer.jpg",
      "description": "Summer sale promotional banner",
      "displayOrder": 1,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```
