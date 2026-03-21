/**
 * Smoke Test Suite — Refactored Modules
 *
 * Covers: Products, Stocks, Testimonials, Cart, Order
 * Makes real HTTP calls against the locally running server.
 *
 * Usage:
 *   TOKEN=<user-token> ADMIN_TOKEN=<admin-token> npx tsx tests/smoke.ts
 *
 * Or set them directly in the CONFIG block below.
 */

import crypto from "node:crypto";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3001/api";
let TOKEN = process.env.TOKEN ?? ""; // Regular authenticated user token
let ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? TOKEN; // Admin token
const GUEST_ID = `smoke-guest-${crypto.randomUUID().slice(0, 8)}`;
// ─────────────────────────────────────────────────────────────────────────────

// ─── RUNNER ──────────────────────────────────────────────────────────────────
type Result = { name: string; passed: boolean; info?: string };
const results: Result[] = [];
let CREATED_PRODUCT_ID = "";
let FIRST_PRODUCT_ID = "";
let CART_ITEM_ID = "";
let GUEST_ORDER_ID = "";
let TESTIMONIAL_ID = "";

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✓  ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, info: err.message });
    console.error(`  ✗  ${name}`);
    console.error(`     → ${err.message}`);
  }
}

function section(title: string): void {
  console.log(`\n${"─".repeat(64)}`);
  console.log(`  ${title}`);
  console.log(`${"─".repeat(64)}`);
}

async function api(
  method: string,
  path: string,
  opts: {
    token?: string;
    guestId?: string;
    body?: unknown;
    expectStatus?: number;
  } = {},
): Promise<any> {
  const { token, guestId, body, expectStatus = 200 } = opts;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (guestId) headers["x-guest-id"] = guestId;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json: any;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (res.status !== expectStatus) {
    throw new Error(
      `Expected HTTP ${expectStatus}, got ${res.status}. Body: ${JSON.stringify(json)}`,
    );
  }

  return json;
}

function assertField(obj: any, field: string): void {
  const val = field.split(".").reduce((o, k) => o?.[k], obj);
  if (val === undefined || val === null) {
    throw new Error(`Missing field "${field}" in response: ${JSON.stringify(obj)}`);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── GUARD ───────────────────────────────────────────────────────────────────
if (!TOKEN || !ADMIN_TOKEN) {
  console.error("\n⚠️  TOKEN and ADMIN_TOKEN must be set before running.\n");
  console.error(
    '  Pass them as env vars: TOKEN=<...> ADMIN_TOKEN=<...> npx tsx tests/smoke.ts\n',
  );
  process.exit(1);
}
// ─────────────────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  console.log("\n🚀  Smoke tests starting");
  console.log(`    BASE_URL  : ${BASE_URL}`);
  console.log(`    GUEST_ID  : ${GUEST_ID}`);

  // ══════════════════════════════════════════════════════════════════════════
  // 1. PRODUCTS — PUBLIC
  // ══════════════════════════════════════════════════════════════════════════
  section("1. PRODUCTS — Public");

  await test("GET /products → 200 returns list", async () => {
    const res = await api("GET", "/products");
    assertField(res, "data");
    if (!Array.isArray(res.data) && !Array.isArray(res.data?.products)) {
      throw new Error("Expected data to be array or data.products to be array");
    }
    // Grab a real product ID for downstream tests
    const list: any[] = Array.isArray(res.data) ? res.data : res.data.products;
    if (list.length > 0) {
      FIRST_PRODUCT_ID = list[0].id;
    }
  });

  await test("GET /products/:id → 200 returns product", async () => {
    if (!FIRST_PRODUCT_ID) throw new Error("No product ID available — skipping");
    const res = await api("GET", `/products/${FIRST_PRODUCT_ID}`);
    assertField(res, "data.id");
    if (res.data.id !== FIRST_PRODUCT_ID) {
      throw new Error(`Expected id ${FIRST_PRODUCT_ID}, got ${res.data.id}`);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 2. PRODUCTS — ADMIN
  // ══════════════════════════════════════════════════════════════════════════
  section("2. PRODUCTS — Admin");

  await test("GET /products/admin → 401 without token", async () => {
    await api("GET", "/products/admin", { expectStatus: 401 });
  });

  await test("GET /products/admin → 200 with admin token", async () => {
    const res = await api("GET", "/products/admin", { token: ADMIN_TOKEN });
    assertField(res, "data");
  });

  await test("POST /products → 201 creates product", async () => {
    const res = await api("POST", "/products", {
      token: ADMIN_TOKEN,
      body: {
        name: `[SMOKE TEST] Product ${Date.now()}`,
        description: "Automated smoke test product — safe to delete",
        price: 99.99,
        category: "test",
        stock: 10,
      },
      expectStatus: 201,
    });
    assertField(res, "data.id");
    CREATED_PRODUCT_ID = res.data.id;
  });

  await test("PATCH /products/:id → 200 updates product", async () => {
    if (!CREATED_PRODUCT_ID) throw new Error("No created product — skipping");
    const res = await api("PATCH", `/products/${CREATED_PRODUCT_ID}`, {
      token: ADMIN_TOKEN,
      body: { name: `[SMOKE TEST] Product Updated ${Date.now()}` },
    });
    assertField(res, "data.id");
  });

  await test("DELETE /products/:id → 200 deletes product", async () => {
    if (!CREATED_PRODUCT_ID) throw new Error("No created product — skipping");
    await api("DELETE", `/products/${CREATED_PRODUCT_ID}`, {
      token: ADMIN_TOKEN,
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 3. STOCKS — PUBLIC
  // ══════════════════════════════════════════════════════════════════════════
  section("3. STOCKS — Public & Admin");

  await test("GET /stocks/:productId → 200 returns stock", async () => {
    if (!FIRST_PRODUCT_ID) throw new Error("No product ID available — skipping");
    const res = await api("GET", `/stocks/${FIRST_PRODUCT_ID}`);
    assertField(res, "data");
  });

  await test("GET /stocks → 401 without token", async () => {
    await api("GET", "/stocks", { expectStatus: 401 });
  });

  await test("GET /stocks → 403 with user token (non-admin)", async () => {
    // Only run if TOKEN !== ADMIN_TOKEN (different accounts)
    if (TOKEN === ADMIN_TOKEN) {
      console.log("     ⚠ Skipped — TOKEN and ADMIN_TOKEN are the same");
      return;
    }
    await api("GET", "/stocks", { token: TOKEN, expectStatus: 403 });
  });

  await test("GET /stocks → 200 with admin token (all stock)", async () => {
    const res = await api("GET", "/stocks", { token: ADMIN_TOKEN });
    assertField(res, "data");
  });

  await test("PATCH /stocks/:productId → 200 updates stock", async () => {
    if (!FIRST_PRODUCT_ID) throw new Error("No product ID available — skipping");
    const res = await api("PATCH", `/stocks/${FIRST_PRODUCT_ID}`, {
      token: ADMIN_TOKEN,
      body: { quantity: 999 },
    });
    assertField(res, "data");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 4. TESTIMONIALS
  // ══════════════════════════════════════════════════════════════════════════
  section("4. TESTIMONIALS — Public, User, Admin");

  await test("GET /testimonials → 200 returns approved list", async () => {
    const res = await api("GET", "/testimonials");
    assertField(res, "data");
  });

  await test("POST /testimonials → 401 without token", async () => {
    await api("POST", "/testimonials", {
      body: { content: "Test" },
      expectStatus: 401,
    });
  });

  await test("POST /testimonials → 201 submits testimonial", async () => {
    const res = await api("POST", "/testimonials", {
      token: TOKEN,
      body: { content: "[SMOKE TEST] Automated testimonial — safe to delete" },
      expectStatus: 201,
    });
    assertField(res, "data.id");
    TESTIMONIAL_ID = res.data.id;
  });

  await test("GET /testimonials/admin/all → 401 without token", async () => {
    await api("GET", "/testimonials/admin/all", { expectStatus: 401 });
  });

  await test("GET /testimonials/admin/all → 200 with admin token", async () => {
    const res = await api("GET", "/testimonials/admin/all", {
      token: ADMIN_TOKEN,
    });
    assertField(res, "data");
  });

  await test("PATCH /testimonials/admin/:id/approve → 200", async () => {
    if (!TESTIMONIAL_ID) throw new Error("No testimonial ID — skipping");
    const res = await api("PATCH", `/testimonials/admin/${TESTIMONIAL_ID}/approve`, {
      token: ADMIN_TOKEN,
    });
    assertField(res, "data");
  });

  await test("PATCH /testimonials/admin/:id/reject → 200", async () => {
    if (!TESTIMONIAL_ID) throw new Error("No testimonial ID — skipping");
    const res = await api("PATCH", `/testimonials/admin/${TESTIMONIAL_ID}/reject`, {
      token: ADMIN_TOKEN,
    });
    assertField(res, "data");
  });

  await test("DELETE /testimonials/admin/:id → 200", async () => {
    if (!TESTIMONIAL_ID) throw new Error("No testimonial ID — skipping");
    await api("DELETE", `/testimonials/admin/${TESTIMONIAL_ID}`, {
      token: ADMIN_TOKEN,
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 5. CART — Guest flow
  // ══════════════════════════════════════════════════════════════════════════
  section("5. CART — Guest flow");

  await test("GET /cart → 200 empty cart for new guest", async () => {
    const res = await api("GET", "/cart", { guestId: GUEST_ID });
    assertField(res, "data");
  });

  await test("POST /cart → 201 adds item to guest cart", async () => {
    if (!FIRST_PRODUCT_ID) throw new Error("No product ID available — skipping");
    const res = await api("POST", "/cart", {
      guestId: GUEST_ID,
      body: { productId: FIRST_PRODUCT_ID, quantity: 1 },
      expectStatus: 201,
    });
    assertField(res, "data");
    // Cart item ID may be at data.id or data[0].id depending on response shape
    CART_ITEM_ID =
      res.data?.id ?? res.data?.items?.[0]?.id ?? res.data?.[0]?.id ?? "";
  });

  await test("GET /cart → 200 returns cart with item", async () => {
    const res = await api("GET", "/cart", { guestId: GUEST_ID });
    const items: any[] = res.data?.items ?? res.data ?? [];
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Expected at least one item in cart after add");
    }
    // Capture item ID for update/remove tests
    if (!CART_ITEM_ID && items[0]?.id) CART_ITEM_ID = items[0].id;
  });

  await test("PATCH /cart/:id → 200 updates cart item quantity", async () => {
    if (!CART_ITEM_ID) throw new Error("No cart item ID — skipping");
    const res = await api("PATCH", `/cart/${CART_ITEM_ID}`, {
      guestId: GUEST_ID,
      body: { quantity: 2 },
    });
    assertField(res, "data");
  });

  await test("DELETE /cart/:id → 200 removes item from cart", async () => {
    if (!CART_ITEM_ID) throw new Error("No cart item ID — skipping");
    await api("DELETE", `/cart/${CART_ITEM_ID}`, { guestId: GUEST_ID });
  });

  // Re-add an item for the order test
  await test("POST /cart → 201 re-adds item for order test", async () => {
    if (!FIRST_PRODUCT_ID) throw new Error("No product ID available — skipping");
    await api("POST", "/cart", {
      guestId: GUEST_ID,
      body: { productId: FIRST_PRODUCT_ID, quantity: 1 },
      expectStatus: 201,
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 6. ORDERS — Guest + Admin flow
  // ══════════════════════════════════════════════════════════════════════════
  section("6. ORDERS — Guest & Admin");

  await test("GET /orders → 200 returns empty order list", async () => {
    const res = await api("GET", "/orders", { guestId: GUEST_ID });
    assertField(res, "data");
  });

  await test("POST /orders → 201 places COD order from cart", async () => {
    const res = await api("POST", "/orders", {
      guestId: GUEST_ID,
      body: {
        fullName: "Smoke Test User",
        email: "smoketest@example.com",
        phoneNumber: "09000000000",
        shippingAddress: "123 Test Street, Test City",
        paymentMethod: "cod",
      },
      expectStatus: 201,
    });
    assertField(res, "data.order.id");
    GUEST_ORDER_ID = res.data.order.id;
  });

  await test("GET /orders → 200 includes placed order", async () => {
    const res = await api("GET", "/orders", { guestId: GUEST_ID });
    const orders: any[] = res.data?.orders ?? res.data ?? [];
    if (!Array.isArray(orders) || orders.length === 0) {
      throw new Error("Expected at least one order after placing");
    }
  });

  await test("GET /orders/:id → 200 returns order (ownership passes)", async () => {
    if (!GUEST_ORDER_ID) throw new Error("No order ID — skipping");
    const res = await api("GET", `/orders/${GUEST_ORDER_ID}`, {
      guestId: GUEST_ID,
    });
    assertField(res, "data.id");
  });

  await test("GET /orders/:id → 403 when ownership fails", async () => {
    if (!GUEST_ORDER_ID) throw new Error("No order ID — skipping");
    const wrongGuestId = `wrong-guest-${crypto.randomUUID().slice(0, 8)}`;
    await api("GET", `/orders/${GUEST_ORDER_ID}`, {
      guestId: wrongGuestId,
      expectStatus: 403,
    });
  });

  await test("GET /orders/admin/all → 401 without token", async () => {
    await api("GET", "/orders/admin/all", { expectStatus: 401 });
  });

  await test("GET /orders/admin/all → 200 with admin token", async () => {
    const res = await api("GET", "/orders/admin/all", { token: ADMIN_TOKEN });
    assertField(res, "data");
  });

  await test("GET /orders/admin/all → 200 with status filter", async () => {
    const res = await api("GET", "/orders/admin/all?status=pending", {
      token: ADMIN_TOKEN,
    });
    assertField(res, "data");
  });

  await test("GET /orders/admin/:id → 200 returns any order", async () => {
    if (!GUEST_ORDER_ID) throw new Error("No order ID — skipping");
    const res = await api("GET", `/orders/admin/${GUEST_ORDER_ID}`, {
      token: ADMIN_TOKEN,
    });
    assertField(res, "data.id");
  });

  await test("PATCH /orders/admin/:id/status → 200 updates to processing", async () => {
    if (!GUEST_ORDER_ID) throw new Error("No order ID — skipping");
    const res = await api("PATCH", `/orders/admin/${GUEST_ORDER_ID}/status`, {
      token: ADMIN_TOKEN,
      body: { status: "processing" },
    });
    assertField(res, "data");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════════════════════
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`\n${"═".repeat(64)}`);
  console.log(`  RESULTS: ${passed} passed, ${failed} failed (${results.length} total)`);
  console.log(`${"═".repeat(64)}`);

  if (failed > 0) {
    console.log("\n  Failures:");
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.error(`  ✗ ${r.name}`);
        console.error(`    ${r.info}`);
      });
    console.log("");
    process.exit(1);
  } else {
    console.log("\n  All tests passed! ✓\n");
  }
}

run().catch((err) => {
  console.error("\n💥  Unexpected error:", err);
  process.exit(1);
});
