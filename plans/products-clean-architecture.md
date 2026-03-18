# Products Module Refactoring Plan

Based on the Affiliate Clean Architecture pattern, this document outlines how to refactor the products module.

## Current State vs Target Architecture

### Current (Transaction Script Pattern)

```
src/modules/products/
├── products.repository.ts   # Direct Supabase + business logic
├── products.service.ts     # Thin passthrough
├── products.controller.ts  # HTTP handlers
├── products.admin.controller.ts
└── products.types.ts       # DTOs only
```

### Target (Clean Architecture)

```
src/
├── domain/
│   ├── entities/
│   │   └── Product.ts          # Entity with business logic
│   ├── interfaces/
│   │   └── IProductRepository.ts  # Repository interface
│   └── value-objects/
│       └── Money.ts            # Reuse existing
│
├── infrastructure/
│   └── database/
│       └── supabase/
│           └── SupabaseProductRepository.ts  # Implementation
│
├── application/
│   └── use-cases/
│       └── product/
│           ├── GetProduct.ts
│           ├── ListProducts.ts
│           ├── CreateProduct.ts
│           ├── UpdateProduct.ts
│           ├── DeleteProduct.ts
│           └── ManageProductImages.ts
│
└── modules/products/          # Legacy - route adapters only
```

---

## Phase 1: Domain Layer

### Create `src/domain/entities/Product.ts`

Based on [`Affiliate.ts`](src/domain/entities/Affiliate.ts) pattern:

```typescript
export class Product {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly price: Money; // Value object
  readonly category: string;
  readonly imageUrl: string | null;
  readonly badge: string | null;
  readonly rating: number | null;
  readonly reviewCount: number | null;
  readonly originalPrice: Money | null;
  readonly affiliateLink: string | null;
  readonly images: ProductImage[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // Business methods
  static create(props: CreateProductProps): Product;
  static fromDatabase(row: ProductDatabaseRow): Product;

  // Business logic
  hasDiscount(): boolean;
  getDiscountPercentage(): number;
  isActive(): boolean;

  // State transitions
  applyDiscount(): Product;
  removeDiscount(): Product;

  // Output
  toResponse(): ProductResponse;
}
```

### Create `src/domain/interfaces/IProductRepository.ts`

Based on [`IAffiliateRepository.ts`](src/domain/interfaces/IAffiliateRepository.ts):

```typescript
export interface IProductRepository {
  findAllPaginated(
    page: number,
    limit: number,
    filters: ProductFilters,
  ): Promise<PaginatedResult<Product>>;

  findById(id: string): Promise<Product | null>;
  findByCategory(category: string): Promise<Product[]>;
  findBySearch(search: string): Promise<Product[]>;

  create(props: CreateProductProps): Promise<Product>;
  update(id: string, data: Partial<UpdateProductProps>): Promise<Product>;
  delete(id: string): Promise<void>;

  // Image management
  addImages(productId: string, urls: string[]): Promise<ProductImage[]>;
  removeImage(imageId: string): Promise<void>;
  reorderImages(images: { id: string; position: number }[]): Promise<void>;
}
```

---

## Phase 2: Infrastructure Layer

### Create `src/infrastructure/database/supabase/SupabaseProductRepository.ts`

Based on [`SupabaseAffiliateRepository.ts`](src/infrastructure/database/supabase/SupabaseAffiliateRepository.ts):

- Implement `IProductRepository` interface
- Use Supabase client
- Map database rows to domain entities
- Handle image operations

---

## Phase 3: Application Layer

### Create Use Cases

Based on [`GetAffiliate.ts`](src/application/use-cases/affiliate/GetAffiliate.ts):

| Use Case                  | Responsibility                 |
| ------------------------- | ------------------------------ |
| `GetProduct.ts`           | Get single product by ID       |
| `ListProducts.ts`         | List with pagination & filters |
| `CreateProduct.ts`        | Create new product             |
| `UpdateProduct.ts`        | Update product details         |
| `DeleteProduct.ts`        | Delete product                 |
| `AddProductImages.ts`     | Add images to product          |
| `ReorderProductImages.ts` | Reorder product images         |
| `ReplaceProductImages.ts` | Replace all images             |

### Update DI Container

Add to [`src/di/container.ts`](src/di/container.ts):

```typescript
export const TOKENS = {
  // ... existing
  IProductRepository: Symbol("IProductRepository"),
};

// Register
container.bind(TOKENS.IProductRepository).to(SupabaseProductRepository);
```

---

## Phase 4: Presentation Layer (Routes)

### Update Controllers

Keep controllers thin - only:

- Extract request data
- Call use cases
- Format response

```typescript
// products.controller.ts (refactored)
export const getProducts = catchAsync(async (req, res) => {
  const useCase = new ListProductsUseCase();
  const result = await useCase.execute({
    page: parseInt(req.query.page),
    limit: parseInt(req.query.limit),
    filters: req.query,
  });
  sendSuccess(res, result);
});
```

---

## Migration Strategy

### Step-by-Step:

1. **Create Domain Layer** (new files)
   - Product entity with business logic
   - IProductRepository interface
   - Value objects (reuse Money)

2. **Create Infrastructure** (new files)
   - SupabaseProductRepository implementing interface

3. **Create Use Cases** (new files)
   - All product use cases

4. **Update DI Container**
   - Register new dependencies

5. **Update Controllers** (modify)
   - Use DI container
   - Call use cases instead of services

6. **Deprecate Old Service** (mark for removal)
   - Add deprecation warnings
   - Keep as thin wrapper during transition

7. **Remove Legacy** (cleanup)
   - Delete old service layer
   - Move types to domain

---

## Event Integration

Products should emit events for other modules:

```typescript
// In use cases
import { eventEmitter } from "../../common/events";

await eventEmitter.emit("product.created", { productId: product.id });
await eventEmitter.emit("product.updated", { productId, changes });
await eventEmitter.emit("product.deleted", { productId });
```

---

## Summary

| Phase          | Files to Create | Files to Modify |
| -------------- | --------------- | --------------- |
| Domain         | 2               | -               |
| Infrastructure | 1               | -               |
| Application    | 7               | -               |
| DI             | -               | 1               |
| Controllers    | -               | 2               |

Total: **11 new files**, **3 modified files**
