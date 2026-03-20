# Full Architecture Restructuring Plan

## Current State Analysis

### Modules Using Services (Need Refactoring to Use Cases)

| Module             | Has Service | Status                                   |
| ------------------ | ----------- | ---------------------------------------- |
| affiliate-pixel    | ✓           | Needs refactoring                        |
| affiliate-tracking | ✓           | Needs refactoring                        |
| affiliates         | ✓           | Partial - some methods still use service |
| cart               | ✓           | Needs refactoring                        |
| order              | ✓           | Needs refactoring                        |
| stocks             | ✓           | Needs refactoring                        |
| testimonials       | ✓           | Needs refactoring                        |
| users              | ✓           | Needs refactoring                        |
| wishlist           | ✓           | Needs refactoring                        |

### Modules Already Using Use Cases (Target Pattern)

| Module           | Has Service | Status                    |
| ---------------- | ----------- | ------------------------- |
| community-links  | ✗           | ✓ Already follows pattern |
| courses          | ✗           | ✓ Already follows pattern |
| image-library    | ✗           | ✓ Already follows pattern |
| products         | ✗           | ✓ Already follows pattern |
| auth             | ✗           | ✓ Refactored              |
| affiliates-sales | ✗           | ✓ Refactored              |

---

## Duplicate Types Analysis

### Types.ts Files That Duplicate Domain Types

| Module Types File             | Duplicate Types                                | Domain Location              |
| ----------------------------- | ---------------------------------------------- | ---------------------------- |
| `order.types.ts`              | PaymentMethod, OrderStatus, PaymentStatus      | domain/entities/Order.ts     |
| `affiliates.types.ts`         | AffiliateStatus, PaymentStatus, CommissionType | domain/entities/Affiliate.ts |
| `cart.types.ts`               | (mostly DTOs)                                  | -                            |
| `affiliate-tracking.types.ts` | Tracking-specific (keep)                       | -                            |
| `affiliate-pixel.types.ts`    | Meta Pixel-specific (keep)                     | -                            |
| `auth.types.ts`               | UserRole                                       | domain/entities/User.ts      |

---

## Refactoring Plan

### Phase 1: Create Missing Use Cases

#### affiliate-tracking module needs:

- ListTrackingLinksUseCase
- GetTrackingLinkUseCase
- CreateTrackingLinkUseCase
- UpdateTrackingLinkUseCase
- DeleteTrackingLinkUseCase
- GetTrackingStatsUseCase

#### affiliate-pixel module needs:

- ListPixelEventsUseCase
- GetPixelEventUseCase
- CreatePixelEventUseCase
- SendPixelEventUseCase

#### cart module needs:

- GetCartUseCase
- AddToCartUseCase
- UpdateCartItemUseCase
- RemoveFromCartUseCase
- ClearCartUseCase

#### order module needs:

- ListOrdersUseCase
- GetOrderUseCase
- CreateOrderUseCase
- UpdateOrderStatusUseCase
- CancelOrderUseCase

#### stocks module needs:

- GetStockUseCase
- UpdateStockUseCase

#### testimonials module needs:

- ListTestimonialsUseCase
- GetTestimonialUseCase
- CreateTestimonialUseCase
- UpdateTestimonialUseCase
- DeleteTestimonialUseCase

#### users module needs:

- GetUserUseCase
- UpdateUserUseCase

#### wishlist module needs:

- GetWishlistUseCase
- AddToWishlistUseCase
- RemoveFromWishlistUseCase

### Phase 2: Refactor Controllers

Update each controller to:

1. Import use cases from `src/application/use-cases/[module]/`
2. Instantiate and call use cases
3. Remove service imports

### Phase 3: Delete Service Files

Delete `.service.ts` files once all controllers are updated

### Phase 4: Consolidate Types

1. Move `PaginationMeta` to common/types (DONE)
2. Update order.types.ts to re-export from domain (DONE)
3. Update affiliates.types.ts to re-export from domain
4. Update auth.types.ts to re-export from domain
5. Keep module-specific types (TrackingStats, MetaPixelEvent, etc.)

---

## Priority Order

1. **affiliate-tracking** - High priority (complex business logic)
2. **affiliate-pixel** - High priority (complex business logic)
3. **order** - High priority (core functionality)
4. **cart** - High priority (core functionality)
5. **stocks** - Medium priority
6. **testimonials** - Medium priority
7. **users** - Medium priority
8. **wishlist** - Low priority

---

## Summary

- **Total modules to refactor:** 9 (affiliate-pixel, affiliate-tracking, cart, order, stocks, testimonials, users, wishlist)
- **Modules already done:** 2 (auth, affiliates-sales)
- **Modules already following pattern:** 3 (community-links, courses, image-library, products)
- **Types files to consolidate:** 4 (order, affiliates, auth, plus PaginationMeta in common)
