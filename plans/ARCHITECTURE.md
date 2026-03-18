# E-Commerce API Architecture Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Clean Architecture Layers](#clean-architecture-layers)
3. [Directory Structure](#directory-structure)
4. [Domain Layer](#domain-layer)
5. [Infrastructure Layer](#infrastructure-layer)
6. [Application Layer](#application-layer)
7. [Presentation Layer](#presentation-layer)
8. [Event System](#event-system)
9. [Dependency Injection](#dependency-injection)
10. [Migration Guide](#migration-guide)

---

## Project Overview

This e-commerce API is built using **Clean Architecture** principles, providing a maintainable, testable, and scalable codebase. The architecture separates concerns into distinct layers, with clear dependencies pointing inward toward the domain.

### Technology Stack

- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payment**: PayMongo

---

## Clean Architecture Layers

The application follows these layers (from outermost to innermost):

```
┌─────────────────────────────────────────────┐
│           PRESENTATION LAYER                  │
│  Controllers, Routes, DTOs, API Responses   │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│           APPLICATION LAYER                  │
│  Use Cases, Services, Application DTOs     │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│              DOMAIN LAYER                    │
│  Entities, Value Objects, Interfaces        │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│          INFRASTRUCTURE LAYER               │
│  Repositories, External Services, DB         │
└─────────────────────────────────────────────┘
```

### Dependency Rule

> Source code dependencies must point only inward, toward the high-level policy. Nothing in an inner circle can know anything about an outer circle.

---

## Directory Structure

```
src/
├── app.ts                    # Express app setup
├── server.ts                 # Server entry point
│
├── domain/                   # DOMAIN LAYER (innermost)
│   ├── entities/             # Business entities
│   │   ├── Affiliate.ts
│   │   ├── Order.ts
│   │   └── User.ts
│   ├── value-objects/        # Immutable value objects
│   │   ├── Money.ts
│   │   └── Commission.ts
│   ├── interfaces/          # Repository contracts
│   │   ├── IAffiliateRepository.ts
│   │   └── IOrderRepository.ts
│   └── index.ts
│
├── infrastructure/          # INFRASTRUCTURE LAYER
│   ├── database/
│   │   └── supabase/
│   │       └── SupabaseAffiliateRepository.ts
│   └── index.ts
│
├── application/              # APPLICATION LAYER
│   ├── use-cases/
│   │   └── affiliate/
│   │       ├── GetAffiliate.ts
│   │       └── ListAffiliates.ts
│   └── index.ts
│
├── di/                      # DEPENDENCY INJECTION
│   └── container.ts
│
├── common/                   # SHARED UTILITIES
│   ├── constants/
│   ├── events/              # Event system
│   │   ├── index.ts
│   │   └── handlers.ts
│   ├── middlewares/         # Express middleware
│   ├── types/
│   ├── utils/               # AppError, response helpers
│   ├── validators/          # Zod validation
│   └── resolvers/
│
├── config/                   # CONFIGURATION
│   ├── env.ts
│   ├── supabase.ts
│   └── swagger.ts
│
├── modules/                  # FEATURE MODULES (legacy)
│   ├── auth/
│   ├── affiliates/
│   ├── order/
│   ├── products/
│   ├── cart/
│   └── ...
│
└── utils/                    # EXTERNAL INTEGRATIONS
    └── paymongo.utils.ts
```

---

## Domain Layer

The domain layer is the core of the application. It contains:

- **Entities**: Business objects with identity and behavior
- **Value Objects**: Immutable objects describing attributes
- **Interfaces**: Contracts for data access

### Entities

#### Affiliate Entity

```typescript
// src/domain/entities/Affiliate.ts
export class Affiliate {
  readonly id: string;
  readonly userId: string;
  readonly email: string;
  readonly status: AffiliateStatus;

  // Business methods
  canBeActivated(): boolean;
  isActive(): boolean;
  activate(): Affiliate;
  suspend(): Affiliate;
  toResponse(): AffiliateResponse;
}
```

#### Order Entity

```typescript
// src/domain/entities/Order.ts
export class Order {
  readonly id: string;
  readonly status: OrderStatus;

  // Business methods
  isPaid(): boolean;
  canBeCancelled(): boolean;
  confirm(): Order;
  cancel(): Order;
  deliver(): Order;
}
```

### Value Objects

#### Money

```typescript
// src/domain/value-objects/Money.ts
export class Money {
  readonly amount: number;
  readonly currency: Currency;

  static create(amount: number, currency: Currency): Money;
  add(other: Money): Money;
  subtract(other: Money): Money;
  multiply(factor: number): Money;
  percentage(percent: number): Money;
}
```

#### Commission

```typescript
// src/domain/value-objects/Commission.ts
export class Commission {
  readonly type: CommissionType; // 'percentage' | 'fixed'
  readonly value: number;

  calculate(saleAmount: Money): Money;
}
```

### Interfaces

#### IAffiliateRepository

```typescript
// src/domain/interfaces/IAffiliateRepository.ts
export interface IAffiliateRepository {
  findAllPaginated(
    page,
    limit,
    search?,
    status?,
  ): Promise<PaginatedResult<Affiliate>>;
  findById(id: string): Promise<Affiliate | null>;
  findByUserId(userId: string): Promise<Affiliate | null>;
  create(props: CreateAffiliateProps): Promise<Affiliate>;
  update(id: string, data: Partial<CreateAffiliateProps>): Promise<Affiliate>;
  delete(id: string): Promise<void>;
  // ... more methods
}
```

---

## Infrastructure Layer

The infrastructure layer implements the domain interfaces using concrete technologies.

### Supabase Affiliate Repository

```typescript
// src/infrastructure/database/supabase/SupabaseAffiliateRepository.ts
export class SupabaseAffiliateRepository implements IAffiliateRepository {
  async findById(id: string): Promise<Affiliate | null> {
    const { data, error } = await db
      .from("affiliates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return Affiliate.fromDatabase(data);
  }

  // ... implements all IAffiliateRepository methods
}
```

---

## Application Layer

The application layer contains use cases that orchestrate the flow of data.

### Use Cases

```typescript
// src/application/use-cases/affiliate/GetAffiliate.ts
export class GetAffiliateUseCase {
  constructor(private readonly affiliateRepository?: IAffiliateRepository) {}

  async execute(input: GetAffiliateInput): Promise<GetAffiliateOutput | null> {
    const affiliate = await this.affiliateRepository.findById(
      input.affiliateId,
    );
    return affiliate?.toResponse() ?? null;
  }
}
```

### Dependency Injection Container

```typescript
// src/di/container.ts
class Container {
  private dependencies: Map<string, any> = new Map();

  register<T>(token: string, implementation: T): void {
    this.dependencies.set(token, implementation);
  }

  resolve<T>(token: string): T {
    return this.dependencies.get(token) as T;
  }
}

export const container = Container.getInstance();
export const resolve = <T>(token: string): T => container.resolve<T>(token);
```

---

## Presentation Layer

The presentation layer handles HTTP requests and responses. Controllers should be thin - only handling request parsing and response formatting.

### Controller Pattern

```typescript
// src/modules/affiliates/affiliate.controller.ts
export const getAffiliates = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { page, limit, search, status } = validateAffiliatePaginatedQuery(
      req.query,
    );
    const result = await affiliateService.getAffiliates(
      page,
      limit,
      search,
      status,
    );
    sendSuccess(res, result);
  },
);
```

---

## Event System

The event system provides loose coupling between modules using an event-driven architecture.

### Event Types

```typescript
// src/common/events/index.ts
export enum AppEvent {
  ORDER_CREATED = "order.created",
  ORDER_PAYMENT_COMPLETED = "order.payment.completed",
  ORDER_DELIVERED = "order.delivered",
  AFFILIATE_REGISTERED = "affiliate.registered",
  AFFILIATE_ACTIVATED = "affiliate.activated",
  AFFILIATE_PAYMENT_COMPLETED = "affiliate.payment.completed",
}
```

### Emitting Events

```typescript
// Instead of direct import:
// await affiliateService.activateAffiliateByUserId(userId);

// Use events:
eventEmitter.emit(AppEvent.AFFILIATE_ACTIVATED, { userId, affiliateId });
```

### Event Handlers

```typescript
// src/common/events/handlers.ts
eventEmitter.on(AppEvent.ORDER_PAYMENT_COMPLETED, async (payload) => {
  const affiliate = await affiliateRepository.findByUserId(payload.userId);
  if (affiliate?.isActive()) {
    // Record sale for affiliate
  }
});
```

---

## Migration Guide

### Converting Legacy Services

**Before (tightly coupled):**

```typescript
// src/modules/order/order.service.ts
import * as affiliateService from "../affiliates/affiliate.service";
import * as affiliateSalesService from "../affiliates-sales/affiliate-sales.service";

export const placeOrder = async (dto) => {
  // Create order
  await affiliateSalesService.recordSalesForOrder(order.id);
  await affiliateService.activateAffiliateByUserId(userId);
};
```

**After (event-driven):**

```typescript
export const placeOrder = async (dto) => {
  // Create order
  eventEmitter.emit(AppEvent.ORDER_PAYMENT_COMPLETED, {
    userId,
    orderId: order.id,
  });
};
```

### Adding New Use Cases

1. Create domain entity/value object if needed
2. Add methods to repository interface
3. Implement in infrastructure layer
4. Create use case in application layer
5. Use in controller

---

## Summary

This architecture provides:

1. **Testability**: Dependencies can be mocked easily
2. **Maintainability**: Clear separation of concerns
3. **Scalability**: Easy to add new features
4. **Flexibility**: Swap implementations without changing business logic
5. **Loose Coupling**: Modules communicate via events

The legacy `modules/` directory can be gradually migrated to use the new clean architecture patterns over time.
