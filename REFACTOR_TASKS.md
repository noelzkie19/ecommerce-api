# Refactor Tasks

Apply the product pattern (documented in `REFACTOR_PATTERN.md`) to each module below.
Work **one module at a time**, in order from simplest to most complex.
Do NOT delete legacy files (`*.repository.ts`, `*.service.ts`) until the refactor is reviewed and confirmed.

---

## Progress

| # | Module | Status |
|---|---|---|
| 1 | Stocks | ⬜ Not started |
| 2 | Testimonials | ⬜ Not started |
| 3 | Cart | ⬜ Not started |
| 4 | Order | ⬜ Not started |

---

## Module 1 — Stocks

**Why first:** Simplest module. 3 operations, no complex relationships, no authentication on public read.

**Current state (legacy):**
- `src/modules/stocks/stocks.repository.ts` — raw Supabase calls (uses anon `supabase` client for reads)
- `src/modules/stocks/stocks.service.ts` — thin pass-through to repository
- `src/modules/stocks/stocks.controller.ts` — calls service
- `src/modules/stocks/stocks.type.ts` — defines `Stock`, `UpdateStockDTO`, `StockWithProduct`

**Operations to implement:**
| Use Case | Input | Output |
|---|---|---|
| `GetAllStockUseCase` | `page?, limit?, search?` | paginated list of stock+product |
| `GetStockByProductIdUseCase` | `productId` | single stock record |
| `GetStockStatsUseCase` | none | `{ total, lowStock, outOfStock }` |
| `UpdateStockUseCase` | `productId, quantity` | updated stock record |

**Files to CREATE:**

```
src/domain/entities/Stock.ts
  - class Stock { private constructor, static create(), static fromDatabase(), toResponse() }
  - interfaces: StockProps, CreateStockProps, UpdateStockProps, StockDatabaseRow, StockResponse, StockWithProductResponse, StockStats

src/domain/interfaces/IStockRepository.ts
  - imports types from Stock.ts entity
  - interface IStockRepository { findAll(), findByProductId(), upsert(), getStats() }

src/infrastructure/database/supabase/SupabaseStockRepository.ts
  - implements IStockRepository
  - uses supabaseAdmin for all operations
  - maps rows via Stock.fromDatabase()

src/application/use-cases/stocks/GetAllStock.ts
src/application/use-cases/stocks/GetStockByProductId.ts
src/application/use-cases/stocks/GetStockStats.ts
src/application/use-cases/stocks/UpdateStock.ts
src/application/use-cases/stocks/index.ts
```

**Files to MODIFY:**
```
src/di/container.ts                   — register "IStockRepository" → SupabaseStockRepository
src/domain/interfaces/index.ts        — add export type { IStockRepository }
src/infrastructure/index.ts           — add export SupabaseStockRepository
src/application/index.ts              — add export * from "./use-cases/stocks"
src/modules/stocks/stocks.controller.ts — rewrite to use use cases (keep same handler names/routes)
```

**Files to KEEP (do not delete yet):**
```
src/modules/stocks/stocks.repository.ts   ← delete after review
src/modules/stocks/stocks.service.ts      ← delete after review
src/modules/stocks/stocks.type.ts         ← keep, becomes legacy/thin
```

---

## Module 2 — Testimonials

**Why second:** Self-contained, no cross-module dependencies. Two controllers (public + admin). Status workflow adds a tiny bit of complexity.

**Current state (legacy):**
- `src/modules/testimonials/testimonials.repository.ts` — Supabase calls (uses `supabaseAdmin`)
- `src/modules/testimonials/testimonials.service.ts` — thin pass-through
- `src/modules/testimonials/testimonials.admin.controller.ts` — admin endpoints
- `src/modules/testimonials/testimonials.public.controller.ts` — public endpoints
- `src/modules/testimonials/testimonials.type.ts` — `TestimonialStatus`, `Testimonial`, `CreateTestimonialDTO`, `UpdateTestimonialDTO`, `TestimonialStats`

**Operations to implement:**
| Use Case | Input | Output | Who uses it |
|---|---|---|---|
| `GetAllTestimonialsUseCase` | `page?, limit?, search?, status?` | paginated + stats | admin |
| `GetApprovedTestimonialsUseCase` | `page?, limit?` | paginated approved only | public |
| `GetTestimonialByIdUseCase` | `id` | single testimonial | admin |
| `CreateTestimonialUseCase` | `customerName, rating, message, location?` | created testimonial | public |
| `UpdateTestimonialUseCase` | `id, ...fields` | updated testimonial | admin |
| `UpdateTestimonialStatusUseCase` | `id, status` | updated testimonial | admin |
| `DeleteTestimonialUseCase` | `id` | void | admin |
| `GetTestimonialStatsUseCase` | none | `TestimonialStats` | admin |

**Files to CREATE:**
```
src/domain/entities/Testimonial.ts
  - class Testimonial { private constructor, static create(), static fromDatabase(), toResponse() }
  - types: TestimonialStatus, TestimonialProps, CreateTestimonialProps, UpdateTestimonialProps,
           TestimonialDatabaseRow, TestimonialResponse, TestimonialStats

src/domain/interfaces/ITestimonialRepository.ts
  - imports all types from Testimonial.ts
  - interface ITestimonialRepository { findAll(), findAllApproved(), findById(), create(), update(), delete(), getStats() }

src/infrastructure/database/supabase/SupabaseTestimonialRepository.ts
  - implements ITestimonialRepository

src/application/use-cases/testimonials/GetAllTestimonials.ts
src/application/use-cases/testimonials/GetApprovedTestimonials.ts
src/application/use-cases/testimonials/GetTestimonialById.ts
src/application/use-cases/testimonials/CreateTestimonial.ts
src/application/use-cases/testimonials/UpdateTestimonial.ts
src/application/use-cases/testimonials/UpdateTestimonialStatus.ts
src/application/use-cases/testimonials/DeleteTestimonial.ts
src/application/use-cases/testimonials/GetTestimonialStats.ts
src/application/use-cases/testimonials/index.ts
```

**Files to MODIFY:**
```
src/di/container.ts                                          — register "ITestimonialRepository"
src/domain/interfaces/index.ts                               — add export type { ITestimonialRepository }
src/infrastructure/index.ts                                  — add export SupabaseTestimonialRepository
src/application/index.ts                                     — add export * from "./use-cases/testimonials"
src/modules/testimonials/testimonials.admin.controller.ts    — rewrite to use use cases
src/modules/testimonials/testimonials.public.controller.ts   — rewrite to use use cases
```

**Files to KEEP (do not delete yet):**
```
src/modules/testimonials/testimonials.repository.ts   ← delete after review
src/modules/testimonials/testimonials.service.ts      ← delete after review
src/modules/testimonials/testimonials.type.ts         ← keep, becomes legacy/thin
```

---

## Module 3 — Cart

**Why third:** Introduces `CartOwner` (userId vs guestId) and guest cart merge logic. Slightly more complex queries.

**Current state (legacy):**
- `src/modules/cart/cart.repository.ts` — Supabase calls with owner filter helper
- `src/modules/cart/cart.service.ts` — thin pass-through
- `src/modules/cart/cart.controller.ts` — calls service
- `src/modules/cart/cart.types.ts` — `CartOwner`, `AddToCartDTO`, `UpdateCartItemDTO`

**Operations to implement:**
| Use Case | Input | Output |
|---|---|---|
| `GetCartUseCase` | `owner: CartOwner` | list of cart items with product details |
| `AddToCartUseCase` | `owner, productId, quantity` | upserted cart item |
| `UpdateCartItemUseCase` | `id, owner, quantity` | updated cart item |
| `RemoveFromCartUseCase` | `id, owner` | void |
| `ClearCartUseCase` | `owner` | void |
| `MergeGuestCartUseCase` | `guestId, userId` | void |

**Files to CREATE:**
```
src/domain/entities/CartItem.ts
  - class CartItem { private constructor, static create(), static fromDatabase(), toResponse() }
  - types: CartOwner, AddToCartInput, CartItemProps, CartItemDatabaseRow, CartItemResponse, CartItemWithProductResponse

src/domain/interfaces/ICartRepository.ts
  - imports CartOwner, AddToCartInput, CartItem from entity
  - interface ICartRepository { findAllByOwner(), upsert(), updateQuantity(), remove(), clearCart(), mergeGuestCart() }

src/infrastructure/database/supabase/SupabaseCartRepository.ts
  - implements ICartRepository
  - carries the applyOwnerFilter() helper privately

src/application/use-cases/cart/GetCart.ts
src/application/use-cases/cart/AddToCart.ts
src/application/use-cases/cart/UpdateCartItem.ts
src/application/use-cases/cart/RemoveFromCart.ts
src/application/use-cases/cart/ClearCart.ts
src/application/use-cases/cart/MergeGuestCart.ts
src/application/use-cases/cart/index.ts
```

**Files to MODIFY:**
```
src/di/container.ts                       — register "ICartRepository"
src/domain/interfaces/index.ts            — add export type { ICartRepository }
src/infrastructure/index.ts               — add export SupabaseCartRepository
src/application/index.ts                  — add export * from "./use-cases/cart"
src/modules/cart/cart.controller.ts       — rewrite to use use cases
src/common/resolvers/owner.resolver.ts    — update CartOwner import → domain entity
```

**Files to KEEP (do not delete yet):**
```
src/modules/cart/cart.repository.ts   ← delete after review
src/modules/cart/cart.service.ts      ← delete after review
src/modules/cart/cart.types.ts        ← keep, becomes legacy/thin
```

---

## Module 4 — Order

**Why last:** Most complex. Depends on Cart (for cart items), Stock (for deduction), and has its own payment status + restore-stock-on-cancel logic. Cross-module concerns must be handled carefully.

**Current state (legacy):**
- `src/modules/order/order.repository.ts` — contains stock deduction, order creation, payment update, restore stock
- `src/modules/order/order.service.ts` — orchestrates the full place-order flow
- `src/modules/order/order.controller.ts` — calls service
- `src/modules/order/order.types.ts` — re-exports from domain + defines `CreateOrderDTO`, `UpdateOrderStatusDTO`, etc.
- `src/domain/interfaces/IOrderRepository.ts` — already exists (partially migrated)
- `src/domain/entities/Order.ts` — already exists

**Key complexity:**
- `PlaceOrder` use case must: fetch cart → deduct stock → create order → clear cart (transactional flow)
- `CancelOrder` / `UpdateOrderStatus` must restore stock if status → cancelled
- `IOrderRepository` already exists in domain — review and align

**Operations to implement:**
| Use Case | Notes |
|---|---|
| `PlaceOrderUseCase` | Full transactional flow: validate cart → deduct stock → insert order+items → clear cart |
| `GetOrdersUseCase` | Get all orders for an owner (user) with pagination |
| `GetOrderByIdUseCase` | Single order with items |
| `UpdateOrderStatusUseCase` | Admin updates status; triggers stock restore if cancelled |
| `GetAllOrdersAdminUseCase` | Admin list with filters |

**Files to CREATE:**
```
src/infrastructure/database/supabase/SupabaseOrderRepository.ts
  - implements IOrderRepository (already defined in domain)
  - stock deduction + restore logic lives here

src/application/use-cases/order/PlaceOrder.ts
src/application/use-cases/order/GetOrders.ts
src/application/use-cases/order/GetOrderById.ts
src/application/use-cases/order/UpdateOrderStatus.ts
src/application/use-cases/order/GetAllOrdersAdmin.ts
src/application/use-cases/order/index.ts
```

**Files to MODIFY:**
```
src/di/container.ts                    — register "IOrderRepository"
src/domain/interfaces/index.ts         — verify IOrderRepository is exported
src/infrastructure/index.ts            — add export SupabaseOrderRepository
src/application/index.ts               — add export * from "./use-cases/order"
src/modules/order/order.controller.ts  — rewrite to use use cases
```

**Files to KEEP (do not delete yet):**
```
src/modules/order/order.repository.ts   ← delete after review
src/modules/order/order.service.ts      ← delete after review
src/modules/order/order.types.ts        ← keep, becomes legacy/thin
```

---

## Cleanup (after all 4 modules are reviewed and confirmed)

Once all refactors are approved, delete these legacy files:

```
src/modules/stocks/stocks.repository.ts
src/modules/stocks/stocks.service.ts
src/modules/testimonials/testimonials.repository.ts
src/modules/testimonials/testimonials.service.ts
src/modules/cart/cart.repository.ts
src/modules/cart/cart.service.ts
src/modules/order/order.repository.ts
src/modules/order/order.service.ts
```

Then do a final `npm run build` to confirm zero errors.
