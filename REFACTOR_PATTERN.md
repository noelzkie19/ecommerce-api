# Refactor Pattern Reference — Product Module as Template

This document captures the exact architecture of the **Product module** end-to-end.
All new module refactors (Cart, Order, Stocks, Testimonials) must follow this pattern precisely.

---

## Architecture Overview

```
HTTP Request
    │
    ▼
src/modules/{module}/
  {module}.routes.ts          ← Express router, middleware, route definitions
  {module}.controller.ts      ← Public controller (calls use cases)
  {module}.admin.controller.ts← Admin controller (calls use cases)
  {module}.upload.controller.ts ← (if file uploads needed)
  {module}.types.ts           ← LEGACY/thin: only response-shaping types or re-exports (mostly dead, kept for compatibility)
    │
    ▼ (use cases instantiated directly in controllers)
src/application/use-cases/{module}/
  index.ts                    ← Barrel re-export of all use cases + their Input/Output types
  ListXxx.ts
  GetXxx.ts
  CreateXxx.ts
  UpdateXxx.ts
  DeleteXxx.ts
    │
    ▼ (use cases depend only on the domain interface)
src/domain/
  interfaces/
    IXxxRepository.ts         ← Contract (interface only). Types used by methods come from the entity file.
    index.ts                  ← Re-exports all interfaces with `export type`
  entities/
    Xxx.ts                    ← Entity class + ALL related types (props, DTOs, DB rows, response shapes)
  value-objects/
    Money.ts                  ← Shared value objects used by entities
  index.ts                    ← Re-exports entities, value-objects, interfaces
    │
    ▼ (interface is implemented here)
src/infrastructure/database/supabase/
  SupabaseXxxRepository.ts    ← Implements IXxxRepository using supabaseAdmin
  (singleton export optional)
  index.ts                    ← Re-exports all repository classes
    │
    ▼ (wired together here)
src/di/container.ts           ← Singleton DI container. Maps token string → implementation instance.
                                 Token = interface name, e.g. "IProductRepository"
```

---

## Layer-by-Layer Rules

### 1. Domain Entity (`src/domain/entities/Xxx.ts`)

This file owns **everything** about the entity. Nothing lives in the interface file.

**Must contain:**
- `export class Xxx { ... }` — the entity class with a `private constructor`
- `static create(props: CreateXxxProps): Xxx` — factory for new instances
- `static fromDatabase(row: XxxDatabaseRow): Xxx` — mapper from raw DB row
- `toResponse(): XxxResponse` — serializer to plain API response object
- Business logic methods (e.g. `hasDiscount()`, `getDiscountPercentage()`)
- `private toProps(): XxxProps` — helper for immutable updates

**Types defined in this file (all exported):**
| Type | Purpose |
|---|---|
| `XxxProps` (private interface) | Internal constructor shape |
| `CreateXxxProps` | Input for `static create()` and repository `create()` |
| `UpdateXxxProps` | Partial input for repository `update()` |
| `XxxFilters` | Query filters for `findAllPaginated()` |
| `XxxDatabaseRow` | Raw Supabase row shape (snake_case) |
| `XxxResponse` | Shape returned by `toResponse()` and use case Output DTOs |

**Rules:**
- Private constructor — only `create()` and `fromDatabase()` can instantiate
- Immutability — update methods return a `new Xxx(...)` rather than mutating
- No imports from infrastructure or application layers (domain is dependency-free)
- Value objects (e.g. `Money`) are imported from `../value-objects/`

---

### 2. Domain Interface (`src/domain/interfaces/IXxxRepository.ts`)

**Thin contract file — no type definitions here.**

```ts
import { Xxx, CreateXxxProps, UpdateXxxProps, XxxFilters } from "../entities/Xxx";

export interface IXxxRepository {
  findAllPaginated(...): Promise<PaginatedResult<Xxx>>;
  findById(id: string): Promise<Xxx | null>;
  create(props: CreateXxxProps): Promise<Xxx>;
  update(id: string, data: Partial<UpdateXxxProps>): Promise<Xxx>;
  delete(id: string): Promise<void>;
  // ...
}
```

**Rules:**
- All types imported from the entity file (`../entities/Xxx`)
- `PaginatedResult<T>` may be defined here if it is generic (as in IProductRepository)
  OR imported from a shared location
- Never define domain types inline in this file
- Registered in `src/domain/interfaces/index.ts` as `export type { IXxxRepository }`

---

### 3. Infrastructure Repository (`src/infrastructure/database/supabase/SupabaseXxxRepository.ts`)

**Implements** `IXxxRepository`. All DB access lives here.

```ts
import { supabaseAdmin } from "../../../config/supabase";
import { AppError } from "../../../common/utils/AppError";
import { IXxxRepository } from "../../../domain/interfaces/IXxxRepository";
import { Xxx, CreateXxxProps, XxxDatabaseRow } from "../../../domain/entities/Xxx";

const db = supabaseAdmin as any;

export class SupabaseXxxRepository implements IXxxRepository {
  async findById(id: string): Promise<Xxx | null> {
    const { data, error } = await db.from("table").select("*").eq("id", id).single();
    if (error) return null;
    return Xxx.fromDatabase(data);
  }
  // ...
}
```

**Rules:**
- Use `supabaseAdmin` (not the anon client) for all writes
- `const db = supabaseAdmin as any` to bypass strict typing on dynamic tables
- Map DB rows → entity using `Xxx.fromDatabase(row)`
- Throw `new AppError(message, statusCode)` for DB errors (never raw throws)
- Export the class and optionally a singleton: `export const xxxRepository = new SupabaseXxxRepository()`
- Registered in `src/infrastructure/index.ts`

---

### 4. DI Container (`src/di/container.ts`)

Maps a string token to a concrete repository instance.

```ts
import { SupabaseXxxRepository } from "../infrastructure/database/supabase/SupabaseXxxRepository";

// Inside registerDefaultDependencies():
this.dependencies.set("IXxxRepository", new SupabaseXxxRepository());
```

**Token convention:** token = interface name exactly, e.g. `"IProductRepository"`

Use cases resolve via:
```ts
import { resolve, TOKENS } from "../../../di/container";
this.xxxRepository = resolve<IXxxRepository>(TOKENS.IXxxRepository);
```

---

### 5. Application Use Cases (`src/application/use-cases/{module}/XxxUseCase.ts`)

One file per operation. Each file exports:
- The use case class
- `XxxInput` interface (what the controller passes in)
- `XxxOutput` interface (what the controller gets back — mirrors `XxxResponse` shape)

```ts
import { IXxxRepository } from "../../../domain/interfaces/IXxxRepository";
import { resolve, TOKENS } from "../../../di/container";

export interface GetXxxInput { id: string; }
export interface GetXxxOutput { id: string; name: string; /* ... */ }

export class GetXxxUseCase {
  private readonly repo: IXxxRepository;

  constructor(repo?: IXxxRepository) {
    this.repo = repo ?? resolve<IXxxRepository>(TOKENS.IXxxRepository);
  }

  async execute(input: GetXxxInput): Promise<GetXxxOutput | null> {
    const entity = await this.repo.findById(input.id);
    if (!entity) return null;
    return entity.toResponse();
  }
}
```

**Rules:**
- Constructor accepts optional injected repo (for testing) and falls back to DI container
- Input/Output types defined inline in the same file
- `entity.toResponse()` converts entity → Output DTO (no manual mapping in use cases)
- Use cases import the interface, never the concrete repository
- Barrel-exported from `index.ts` in the same folder
- Registered in `src/application/index.ts`

---

### 6. Module Layer (`src/modules/{module}/`)

```
{module}.routes.ts            ← Router, applies middleware (requireAuth, requireAdmin), calls controllers
{module}.controller.ts        ← Public endpoints (GET, public reads)
{module}.admin.controller.ts  ← Admin endpoints (POST, PUT, DELETE, restricted reads)
{module}.types.ts             ← Kept for compatibility; ideally only re-exports or response-only shapes
```

**Controller pattern:**
```ts
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import { GetXxxUseCase } from "../../application/use-cases/{module}";

export const getXxx = catchAsync(async (req, res) => {
  const useCase = new GetXxxUseCase();          // instantiated per-request (DI resolves repo)
  const result = await useCase.execute({ id: req.params.id });
  if (!result) { res.status(404).json({ success: false, message: "Not found" }); return; }
  sendSuccess(res, result);
});
```

**Rules:**
- Controllers instantiate use cases with `new XxxUseCase()` — no need to pass repo manually
- Controllers never import repositories directly
- Middleware (`requireAuth`, `requireAdmin`) applied in routes, not controllers
- `catchAsync` wraps every handler to forward async errors to the error middleware
- `sendSuccess(res, data)` for 200 responses; manual `res.status(201).json(...)` for creates

---

## File Naming Conventions

| Layer | File | Class/Interface Name |
|---|---|---|
| Entity | `src/domain/entities/Product.ts` | `Product`, `ProductImage` |
| Interface | `src/domain/interfaces/IProductRepository.ts` | `IProductRepository` |
| Repository | `src/infrastructure/database/supabase/SupabaseProductRepository.ts` | `SupabaseProductRepository` |
| Use Case | `src/application/use-cases/product/ListProducts.ts` | `ListProductsUseCase` |
| Controller (public) | `src/modules/products/products.controller.ts` | named exports |
| Controller (admin) | `src/modules/products/products.admin.controller.ts` | named exports |
| Routes | `src/modules/products/products.routes.ts` | default export `router` |

---

## Dependency Direction (strictly one-way)

```
modules → application → domain ← infrastructure
                ↑
              di/container (wires domain interfaces → infrastructure implementations)
```

- **Domain** has zero external dependencies
- **Application** depends only on domain interfaces
- **Infrastructure** depends on domain entities + interfaces (implements them)
- **Modules** depend only on application use cases
- **DI container** is the only place that imports infrastructure AND wires to domain tokens

---

## What `{module}.types.ts` Is For (and NOT for)

After refactoring, module-level type files become **thin**. They should:
- NOT re-define types that exist in the domain layer
- ONLY contain response-shaping types that are genuinely module-specific
- OR be removed entirely if all types have migrated to the domain

The `products.types.ts` still exists for legacy compatibility but its types are largely superseded by `domain/entities/Product.ts`.

---

## Modules to Refactor (apply this pattern to each)

| Module | Entity File | Interface File | Repository File | Use Cases Folder |
|---|---|---|---|---|
| Cart | `CartItem.ts` | `ICartRepository.ts` | `SupabaseCartRepository.ts` | `use-cases/cart/` |
| Order | `Order.ts` ✓ (exists) | `IOrderRepository.ts` ✓ (exists) | `SupabaseOrderRepository.ts` | `use-cases/order/` |
| Stocks | `Stock.ts` | `IStockRepository.ts` | `SupabaseStockRepository.ts` | `use-cases/stocks/` |
| Testimonials | `Testimonial.ts` | `ITestimonialRepository.ts` | `SupabaseTestimonialRepository.ts` | `use-cases/testimonials/` |

For each module, the existing `{module}.repository.ts` and `{module}.service.ts` in the modules folder will be **deleted** once the infrastructure repository and use cases are in place.
