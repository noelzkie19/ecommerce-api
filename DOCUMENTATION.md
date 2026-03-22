# E-Commerce API Documentation

## Project Overview

Triad E-Commerce is a backend API built with Node.js, TypeScript, Express, and Supabase. It provides a comprehensive e-commerce platform with affiliate marketing capabilities.

## Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth / JWT
- **API Documentation**: Swagger/OpenAPI

## Code Structure

```
src/
├── app.ts                 # Express application setup
├── server.ts              # Server entry point
├── application/           # Use cases / business logic
│   └── use-cases/
│       ├── affiliate/     # Affiliate management use cases
│       ├── affiliate-pixel/   # Pixel tracking use cases
│       ├── affiliate-sales/    # Affiliate sales use cases
│       ├── affiliate-tracking/ # Tracking links use cases
│       ├── auth/          # Authentication use cases
│       ├── cart/          # Shopping cart use cases
│       ├── community-link/ # Community links use cases
│       ├── course/        # Course management use cases
│       ├── image-library/ # Image management use cases
│       ├── order/         # Order processing use cases
│       ├── product/       # Product management use cases
│       ├── stocks/        # Inventory management use cases
│       ├── testimonial/   # Testimonial management use cases
│       ├── user/          # User management use cases
│       └── wishlist/      # Wishlist management use cases
├── common/                # Shared utilities
│   ├── constants/         # Application constants
│   ├── events/            # Event handlers
│   ├── middlewares/       # Express middlewares
│   ├── resolvers/         # GraphQL-like resolvers
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── validators/        # Input validation
├── config/                # Configuration files
│   ├── env.ts             # Environment variables
│   ├── supabase.ts        # Supabase client
│   └── swagger.ts         # Swagger setup
├── di/                    # Dependency injection
│   └── container.ts       # DI container
├── domain/                # Domain layer
│   ├── entities/          # Domain entities
│   ├── interfaces/        # Repository interfaces
│   └── value-objects/     # Value objects
├── infrastructure/        # Infrastructure implementations
│   └── database/
│       └── supabase/      # Supabase repositories
└── modules/               # Express route modules
    ├── affiliate-pixel/   # Pixel tracking controller/routes
    ├── affiliate-tracking/ # Tracking controller/routes
    ├── affiliates/        # Affiliate controller/routes
    ├── auth/              # Auth controller/routes
    ├── cart/              # Cart controller/routes
    ├── community-link/    # Community link controller/routes
    ├── course/            # Course controller/routes
    ├── image-library/     # Image library controller/routes
    ├── order/             # Order controller/routes
    ├── product/           # Product controller/routes
    ├── stocks/            # Stocks controller/routes
    ├── testimonial/       # Testimonial controller/routes
    ├── user/              # User controller/routes
    └── wishlist/          # Wishlist controller/routes
```

## Domain Entities

- **Affiliate**: Partner/affiliate user management
- **CommunityLink**: Community link management
- **Course**: Course management
- **ImageLibrary**: Image storage and management
- **Order**: Order processing
- **Product**: Product catalog
- **User**: User accounts and profiles

## Value Objects

- **Commission**: Affiliate commission calculations
- **Money**: Currency and amount handling

## API Modules

### Authentication (`/api/auth`)

- Login, Register, Logout
- Password management (forgot/reset)
- Google OAuth login
- Session refresh

### Products (`/api/products`)

- CRUD operations
- Image management
- Listing with filters

### Orders (`/api/orders`)

- Order creation and processing
- Order status management

### Affiliates (`/api/affiliates`)

- Affiliate registration and management
- Commission tracking
- Product assignment
- Payment processing

### Affiliate Tracking (`/api/affiliate-tracking`)

- Tracking link generation
- Attribution management
- Click tracking
- Referral resolution

### Affiliate Pixel (`/api/affiliate-pixel`)

- Pixel event firing
- Event configuration
- Lead and purchase tracking
- Event retry logic

### Cart (`/api/cart`)

- Shopping cart management

### Wishlist (`/api/wishlist`)

- User wishlist management

### Courses (`/api/courses`)

- Course CRUD operations

### Image Library (`/api/images`)

- Image upload and management

### Community Links (`/api/community-links`)

- Community link management

## Middlewares

- `affiliateTracking`: Affiliate tracking middleware
- `errorHandler`: Global error handling
- `logger`: Request logging
- `rateLimiter`: API rate limiting
- `sanitize`: Input sanitization
- `owner`: Ownership resolver

## Environment Variables

Required variables (see `src/config/env.ts`):

- `PORT`: Server port
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_KEY`: Supabase API key
- `JWT_SECRET`: JWT signing secret

## Running the Application

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start production server
npm start

# Start development server
npm run dev
```

## API Documentation

Swagger documentation is available at `/api-docs` when the server is running.
