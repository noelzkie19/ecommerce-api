# Types and Architecture Restructuring Plan

## Overview

This document outlines the plan to:

1. **Unify the architecture pattern** - Apply the community-links pattern (routes → controller → useCases) to all modules
2. **Consolidate types** - Eliminate redundancy between module types.ts and domain entities

---

## Target Architecture Pattern

### Reference: community-links Module

```
src/modules/community-links/
├── community-links.routes.ts          # Routes → controllers
├── community-links.controller.ts       # Controllers → use cases (NO service)
└── community-links.admin.controller.ts
```

**Key characteristics:**

- Controllers directly instantiate and call use cases from `src/application/use-cases/`
- NO service.ts file in the module
- NO types.ts file in the module (types come from domain entities and use cases)
- Routes import controllers, controllers import use cases

---

## Current vs Target Structure

### Current Pattern (affiliates, auth, products, etc.)

```
src/modules/[module]/
├── [module].routes.ts        # Routes → controller
├── [module].controller.ts    # Controller → service
├── [module].service.ts      # Service → repository
├── [module].repository.ts   # Repository → database
├── [module].types.ts        # DTOs and types (REDUNDANT)
└── [module].validator.ts    # Validators
```

### Target Pattern

```
src/modules/[module]/
├── [module].routes.ts        # Routes → controller
├── [module].controller.ts    # Controller → use cases (NO service)
├── [module].admin.controller.ts  # Optional admin controller
└── [module].validator.ts    # Validators (can move to common/validators)
```

**Types should come from:**

- `src/domain/entities/` - Domain types, status enums, response types
- `src/application/use-cases/` - DTOs for use case inputs
- `src/common/types/` - Shared types like PaginationMeta

---

## Module Analysis

### 1. Auth Module

| File                 | Status              | Action                              |
| -------------------- | ------------------- | ----------------------------------- |
| `auth.service.ts`    | Has business logic  | Remove (use use cases)              |
| `auth.types.ts`      | Has DTOs + AuthUser | Keep DTOs, import types from domain |
| `auth.controller.ts` | Calls service       | Refactor to call use cases          |
| `auth.routes.ts`     | Routes              | Update imports                      |

**Use Cases Available:**

- RegisterUser, LoginUser, LogoutUser
- ForgotPassword, ResetPassword
- GoogleLogin, RefreshSession
- AdminLogout, ListUsers

### 2. Affiliates Module

| File                      | Status             | Action                      |
| ------------------------- | ------------------ | --------------------------- |
| `affiliate.service.ts`    | Has business logic | Remove (use use cases)      |
| `affiliate.types.ts`      | Has types + DTOs   | Keep DTOs, use domain types |
| `affiliate.controller.ts` | Calls service      | Refactor to call use cases  |
| `affiliate.routes.ts`     | Routes             | Update imports              |

**Use Cases Available:**

- CreateAffiliate, GetAffiliate, ListAffiliates
- UpdateAffiliate, DeleteAffiliate, SuspendAffiliate
- ActivateAffiliate, AssignProduct, RemoveProduct
- GetAffiliateProducts, GetAffiliateByUserId
- GenerateAffiliateLink

### 3. Affiliate-Sales Module

| File                            | Status             | Action                          |
| ------------------------------- | ------------------ | ------------------------------- |
| `affiliate-sales.service.ts`    | Has business logic | Remove (may need new use cases) |
| `affiliate-sales.types.ts`      | Has types + DTOs   | Keep DTOs, use domain types     |
| `affiliate-sales.controller.ts` | Calls service      | Refactor                        |
| `affiliate-sales.routes.ts`     | Routes             | Update imports                  |

**Note:** No use cases exist yet for affiliate-sales. Need to create:

- ListAffiliateSales, GetAffiliateSale
- UpdateAffiliateSaleStatus

### 4. Affiliate-Tracking Module

| File                               | Status                | Action                             |
| ---------------------------------- | --------------------- | ---------------------------------- |
| `affiliate-tracking.service.ts`    | Has business logic    | Remove (may need new use cases)    |
| `affiliate-tracking.types.ts`      | Module-specific types | Keep (these are tracking-specific) |
| `affiliate-tracking.controller.ts` | Calls service         | Refactor                           |
| `affiliate-tracking.routes.ts`     | Routes                | Update imports                     |

**Note:** No use cases exist yet. These types are very specific to tracking ( AttributionData, TrackingStats, etc.) and may need to stay or be moved to a tracking-specific location.

### 5. Affiliate-Pixel Module

| File                            | Status                | Action                          |
| ------------------------------- | --------------------- | ------------------------------- |
| `affiliate-pixel.service.ts`    | Has business logic    | Remove (may need new use cases) |
| `affiliate-pixel.types.ts`      | Module-specific types | Keep (Meta Pixel specific)      |
| `affiliate-pixel.controller.ts` | Calls service         | Refactor                        |
| `affiliate-pixel.routes.ts`     | Routes                | Update imports                  |

**Note:** These types are very specific to Meta Pixel integration. May need to stay as module-specific.

### 6. Products Module

| File                           | Status             | Action                      |
| ------------------------------ | ------------------ | --------------------------- |
| `products.service.ts`          | Has business logic | Remove (use use cases)      |
| `products.types.ts`            | Has types + DTOs   | Keep DTOs, use domain types |
| `products.controller.ts`       | Calls service      | Refactor to call use cases  |
| `products.admin.controller.ts` | Calls service      | Refactor                    |
| `products.routes.ts`           | Routes             | Update imports              |

**Use Cases Available:**

- CreateProduct, GetProduct, ListProducts
- UpdateProduct, DeleteProduct
- ManageProductImages

---

## Types Consolidation

### Duplication Found

| Type              | Location 1                              | Location 2                                                 | Recommended Action              |
| ----------------- | --------------------------------------- | ---------------------------------------------------------- | ------------------------------- |
| `PaymentMethod`   | `order.types.ts`                        | `domain/entities/Order.ts`                                 | Use domain, remove from module  |
| `OrderStatus`     | `order.types.ts`                        | `domain/entities/Order.ts`                                 | Use domain, remove from module  |
| `PaymentStatus`   | `order.types.ts`, `affiliates.types.ts` | `domain/entities/Order.ts`, `domain/entities/Affiliate.ts` | Use domain, remove from modules |
| `AffiliateStatus` | `affiliates.types.ts`                   | `domain/entities/Affiliate.ts`                             | Use domain, remove from module  |
| `CommissionType`  | Multiple modules                        | `domain/value-objects/Commission.ts`                       | Use domain value object         |
| `PaginationMeta`  | Every module                            | `common/types/`                                            | Move to common/types            |
| `UserRole`        | `auth.types.ts`                         | `domain/entities/User.ts`                                  | Use domain                      |

### Types That SHOULD Stay in Modules

1. **DTOs (Data Transfer Objects)** - Request/response shapes for API
   - `CreateAffiliateDTO`, `UpdateAffiliateDTO`
   - `CreateOrderDTO`, `UpdateOrderStatusDTO`
   - `RegisterDTO`, `LoginDTO`

2. **Module-Specific Complex Types** - Types that combine domain entities with additional joined data
   - `Order` with `items` array (includes product details)
   - `Affiliate` with `productCount`, `totalSales`
   - `TrackingStats`, `AttributionData`

3. **External Integration Types** - Types for third-party integrations
   - `MetaPixelEvent`, `MetaUserData` (Meta Conversions API)
   - `AffiliateCookieData`

---

## Migration Steps

### Phase 1: Create Missing Use Cases

1. **Affiliate-Sales**
   - Create `ListAffiliateSalesUseCase`
   - Create `GetAffiliateSaleUseCase`
   - Create `UpdateAffiliateSaleStatusUseCase`

2. **Affiliate-Tracking**
   - Create tracking-related use cases

3. **Affiliate-Pixel**
   - Create pixel-related use cases

### Phase 2: Refactor Controllers

For each module (affiliates, auth, products, etc.):

1. Update controller to import and instantiate use cases
2. Replace service calls with use case execute() calls
3. Remove service import

### Phase 3: Remove Service Layers

1. Delete `affiliate.service.ts`
2. Delete `auth.service.ts`
3. Delete `products.service.ts`
4. And so on...

### Phase 4: Consolidate Types

1. Move `PaginationMeta` to `src/common/types/`
2. Update imports in modules to use domain types
3. Remove duplicate status types from module types.ts
4. Keep only DTOs and module-specific complex types

---

## Files to Modify/Remove

### Affiliates Module

- **Modify:** `affiliate.controller.ts`, `affiliate.routes.ts`
- **Remove:** `affiliate.service.ts`
- **Modify:** `affiliate.types.ts` (keep DTOs, use domain types)

### Auth Module

- **Modify:** `auth.controller.ts`, `auth.routes.ts`
- **Remove:** `auth.service.ts`
- **Modify:** `auth.types.ts` (keep DTOs, use domain types)

### Products Module

- **Modify:** `products.controller.ts`, `products.admin.controller.ts`, `products.routes.ts`
- **Remove:** `products.service.ts`
- **Check:** `products.types.ts` (if exists)

### Affiliate-Sales Module

- **Create:** Use cases first
- **Modify:** Controller, routes
- **Remove:** Service
- **Modify:** Types

### Affiliate-Tracking Module

- **Create:** Use cases first
- **Modify:** Controller, routes
- **Remove:** Service
- **Keep:** Most types (tracking-specific)

### Affiliate-Pixel Module

- **Create:** Use cases first
- **Modify:** Controller, routes
- **Remove:** Service
- **Keep:** Most types (pixel-specific)

---

## Notes

1. **auth.module** - Already has use cases, just needs refactoring
2. **affiliates.module** - Already has use cases, just needs refactoring
3. **products.module** - Already has use cases, just needs refactoring
4. **affiliate-sales, affiliate-tracking, affiliate-pixel** - Need use cases created first
5. **community-links** - Already follows target pattern (no changes needed)
