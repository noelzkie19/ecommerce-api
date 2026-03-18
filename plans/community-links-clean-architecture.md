# Community Links Module - Clean Architecture Implementation

## Overview

This document outlines the implementation of a Community Links module with Admin CRUD functionality, following the same clean architecture patterns as the Courses module.

## Requirements

- Admin CRUD operations (Create, Read, Update, Delete)
- Public display of community links on client side
- Support for link categories (YouTube, Facebook, Telegram, Website, etc.)
- Link ordering/sorting
- Active/inactive status

## Implementation Plan

### Phase 1: Database Migration

Create `community_links` table with fields:

- id (UUID, PK)
- title (text, required)
- url (text, required)
- description (text, nullable)
- category (text): youtube, facebook, telegram, website, discord, instagram, other
- icon (text, nullable): icon name/URL
- image_url (text, nullable): thumbnail image
- order_index (integer): for sorting
- is_active (boolean): visibility toggle
- created_at (timestamp)
- updated_at (timestamp)

### Phase 2: Domain Layer

- `CommunityLink.ts` - Entity with business logic
- `ICommunityLinkRepository.ts` - Repository interface

### Phase 3: Infrastructure Layer

- `SupabaseCommunityLinkRepository.ts` - Repository implementation

### Phase 4: Application Layer (Use Cases)

- ListCommunityLinks
- GetCommunityLink
- CreateCommunityLink
- UpdateCommunityLink
- DeleteCommunityLink

### Phase 5: Presentation Layer

- `community-links.controller.ts` - Public endpoints
- `community-links.admin.controller.ts` - Admin endpoints
- `community-links.routes.ts` - Route definitions

## Migration SQL

```sql
CREATE TABLE IF NOT EXISTS community_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  icon TEXT,
  image_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE community_links ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can view active community links"
ON community_links FOR SELECT
USING (is_active = true);

-- Allow authenticated users to manage (admin)
CREATE POLICY "Admins can manage community links"
ON community_links FOR ALL
USING (auth.uid() IN (
  SELECT id FROM auth.users
  WHERE raw_user_meta_data->>'role' = 'admin'
));
```

## API Endpoints

### Public

- `GET /api/community-links` - List active links
- `GET /api/community-links/:id` - Get link by ID

### Admin

- `GET /api/admin/community-links` - List all links (with pagination)
- `POST /api/admin/community-links` - Create link
- `PATCH /api/admin/community-links/:id` - Update link
- `DELETE /api/admin/community-links/:id` - Delete link

## Category Options

- youtube
- facebook
- telegram
- website
- discord
- instagram
- tiktok
- twitter
- linkedin
- other
