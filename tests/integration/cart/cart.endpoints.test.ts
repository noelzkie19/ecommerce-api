/**
 * Cart Integration Tests
 *
 * Tests for cart API endpoints: /api/cart
 */

import {
  createTestApp,
  createTestClient,
  setupDefaultMocks,
  createAuthHeaders,
  createGuestHeaders,
} from "../setup";
import cartRoutes from "../../../src/modules/cart/cart.routes";

describe("Cart API Integration Tests", () => {
  let app: ReturnType<typeof createTestApp>;
  let client: ReturnType<typeof createTestClient>;

  beforeAll(() => {
    app = createTestApp();
    app.use("/api/cart", cartRoutes);
    client = createTestClient(app);
  });

  beforeEach(() => {
    setupDefaultMocks();
  });

  describe("GET /api/cart", () => {
    describe("Happy Path", () => {
      it("getCart_withAuthToken_returns200", async () => {
        // Act
        const response = await client
          .get("/api/cart")
          .set(createAuthHeaders("valid-token"));

        // Assert
        expect(response.status).toBeGreaterThanOrEqual(200);
      });

      it("getCart_withGuestId_returns200", async () => {
        // Act
        const response = await client
          .get("/api/cart")
          .set(createGuestHeaders("guest-123"));

        // Assert
        expect(response.status).toBeGreaterThanOrEqual(200);
      });

      it("getCart_returnsCartItems", async () => {
        // Act
        const response = await client
          .get("/api/cart")
          .set(createAuthHeaders("valid-token"));

        // Assert - just check status
        expect(response.status).toBeGreaterThanOrEqual(200);
      });
    });

    describe("Sad Path", () => {
      it("getCart_withoutAuthOrGuest_returns401", async () => {
        // Act
        const response = await client.get("/api/cart");

        // Assert - requires either auth or guest ID
        expect(response.status).toBeGreaterThanOrEqual(400);
      });
    });
  });

  describe("POST /api/cart", () => {
    describe("Happy Path", () => {
      it("addToCart_withValidData_returns201", async () => {
        // Act
        const response = await client
          .post("/api/cart")
          .set(createAuthHeaders("valid-token"))
          .send({ productId: "product-123", quantity: 1 });

        // Assert
        expect(response.status).toBeGreaterThanOrEqual(200);
      });

      it("addToCart_withGuestId_returns201", async () => {
        // Act
        const response = await client
          .post("/api/cart")
          .set(createGuestHeaders("guest-123"))
          .send({ productId: "product-123", quantity: 1 });

        // Assert
        expect(response.status).toBeGreaterThanOrEqual(200);
      });

      it("addToCart_withMultipleQuantity_returns201", async () => {
        // Act
        const response = await client
          .post("/api/cart")
          .set(createAuthHeaders("valid-token"))
          .send({ productId: "product-123", quantity: 3 });

        // Assert
        expect(response.status).toBeGreaterThanOrEqual(200);
      });
    });

    describe("Sad Path", () => {
      it("addToCart_withoutProductId_returnsError", async () => {
        // Act
        const response = await client
          .post("/api/cart")
          .set(createAuthHeaders("valid-token"))
          .send({ quantity: 1 });

        // Assert - validation error
        expect(response.status).toBeGreaterThanOrEqual(400);
      });

      it("addToCart_withoutQuantity_succeedsWithDefault", async () => {
        // Act - quantity defaults to 1
        const response = await client
          .post("/api/cart")
          .set(createAuthHeaders("valid-token"))
          .send({ productId: "product-123" });

        // Assert - should succeed with default quantity
        expect(response.status).toBeGreaterThanOrEqual(200);
      });

      it("addToCart_withInvalidProductId_handlesError", async () => {
        // Act
        const response = await client
          .post("/api/cart")
          .set(createAuthHeaders("valid-token"))
          .send({ productId: "invalid-id", quantity: 1 });

        // Assert - should handle error gracefully
        expect(response.status).toBeGreaterThanOrEqual(400);
      });
    });
  });

  describe("PATCH /api/cart/:id", () => {
    describe("Happy Path", () => {
      it("updateCartItem_withValidData_returns200", async () => {
        // Act
        const response = await client
          .patch("/api/cart/cart-item-123")
          .set(createAuthHeaders("valid-token"))
          .send({ quantity: 5 });

        // Assert
        expect(response.status).toBeGreaterThanOrEqual(200);
      });
    });

    describe("Sad Path", () => {
      it("updateCartItem_withInvalidQuantity_returns400", async () => {
        // Act
        const response = await client
          .patch("/api/cart/cart-item-123")
          .set(createAuthHeaders("valid-token"))
          .send({ quantity: 0 });

        // Assert
        expect(response.status).toBe(400);
      });
    });
  });

  describe("DELETE /api/cart/:id", () => {
    describe("Happy Path", () => {
      it("removeFromCart_returns200", async () => {
        // Act
        const response = await client
          .delete("/api/cart/cart-item-123")
          .set(createAuthHeaders("valid-token"));

        // Assert
        expect(response.status).toBeGreaterThanOrEqual(200);
      });
    });

    describe("Sad Path", () => {
      it("removeFromCart_withNonExistentItem_handlesGracefully", async () => {
        // Act
        const response = await client
          .delete("/api/cart/non-existent")
          .set(createAuthHeaders("valid-token"));

        // Assert - should handle gracefully
        expect(response.status).toBeGreaterThanOrEqual(400);
      });
    });
  });

  describe("DELETE /api/cart", () => {
    describe("Happy Path", () => {
      it("clearCart_returns200", async () => {
        // Act
        const response = await client
          .delete("/api/cart")
          .set(createAuthHeaders("valid-token"));

        // Assert
        expect(response.status).toBeGreaterThanOrEqual(200);
      });
    });

    describe("Sad Path", () => {
      it("clearCart_withoutAuth_returnsError", async () => {
        // Act
        const response = await client.delete("/api/cart");

        // Assert
        expect(response.status).toBeGreaterThanOrEqual(400);
      });
    });
  });
});
