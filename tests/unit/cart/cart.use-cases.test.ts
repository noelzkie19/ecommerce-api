/**
 * Cart Use Cases Unit Tests
 *
 * Tests for AddToCartUseCase and UpdateCartItemUseCase.
 * Each test covers both happy and sad paths.
 */

import { AddToCartUseCase } from "../../../src/application/use-cases/cart/AddToCart";
import { UpdateCartItemUseCase } from "../../../src/application/use-cases/cart/UpdateCartItem";
import { createMockCartItem } from "../../__mocks__";

// Create a mock cart repository that satisfies ICartRepository
const createMockCartRepo = (overrides = {}) => ({
  findAllByOwner: jest.fn().mockResolvedValue([]),
  findItem: jest.fn().mockResolvedValue(null),
  upsert: jest.fn().mockResolvedValue(createMockCartItem()),
  updateQuantity: jest.fn().mockResolvedValue(createMockCartItem()),
  remove: jest.fn().mockResolvedValue(undefined),
  clearCart: jest.fn().mockResolvedValue(undefined),
  mergeGuestCart: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

// Create a mock stock repository
const createMockStockRepo = (overrides = {}) => ({
  findByProductId: jest
    .fn()
    .mockResolvedValue({ productId: "product-123", quantity: 10 }),
  getAll: jest.fn().mockResolvedValue([]),
  checkAvailability: jest.fn().mockResolvedValue(true),
  update: jest
    .fn()
    .mockResolvedValue({ productId: "product-123", quantity: 9 }),
  ...overrides,
});

describe("AddToCartUseCase", () => {
  describe("Happy Path", () => {
    it("addToCart_withValidData_addsItem", async () => {
      // Arrange
      const mockCartRepo = createMockCartRepo({
        findItem: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue(
          createMockCartItem({
            id: "new-cart-item",
            productId: "product-123",
            quantity: 2,
          }),
        ),
      });
      const mockStockRepo = createMockStockRepo({
        findByProductId: jest
          .fn()
          .mockResolvedValue({ productId: "product-123", quantity: 10 }),
      });
      const useCase = new AddToCartUseCase(
        mockCartRepo as any,
        mockStockRepo as any,
      );

      // Act
      const result = await useCase.execute({
        userId: "user-123",
        productId: "product-123",
        quantity: 2,
      });

      // Assert
      expect(result.productId).toBe("product-123");
      expect(result.quantity).toBe(2);
      expect(mockCartRepo.upsert).toHaveBeenCalled();
    });

    it("addToCart_withUserId_usesUserId", async () => {
      // Arrange
      const mockCartRepo = createMockCartRepo({
        findItem: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue(
          createMockCartItem({
            userId: "user-456",
          }),
        ),
      });
      const mockStockRepo = createMockStockRepo({
        findByProductId: jest
          .fn()
          .mockResolvedValue({ productId: "product-123", quantity: 5 }),
      });
      const useCase = new AddToCartUseCase(
        mockCartRepo as any,
        mockStockRepo as any,
      );

      // Act
      const result = await useCase.execute({
        userId: "user-456",
        productId: "product-123",
        quantity: 1,
      });

      // Assert
      expect(result.userId).toBe("user-456");
    });

    it("addToCart_withGuestId_usesGuestId", async () => {
      // Arrange
      const mockCartRepo = createMockCartRepo({
        findItem: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue(
          createMockCartItem({
            guestId: "guest-789",
          }),
        ),
      });
      const mockStockRepo = createMockStockRepo({
        findByProductId: jest
          .fn()
          .mockResolvedValue({ productId: "product-123", quantity: 5 }),
      });
      const useCase = new AddToCartUseCase(
        mockCartRepo as any,
        mockStockRepo as any,
      );

      // Act
      const result = await useCase.execute({
        guestId: "guest-789",
        productId: "product-123",
        quantity: 1,
      });

      // Assert
      expect(result.guestId).toBe("guest-789");
    });

    it("addToCart_withExistingItem_incrementsQuantity", async () => {
      // Arrange
      const existingItem = createMockCartItem({ quantity: 1 });
      const mockCartRepo = createMockCartRepo({
        findItem: jest.fn().mockResolvedValue(existingItem),
        upsert: jest
          .fn()
          .mockResolvedValue(createMockCartItem({ quantity: 3 })),
      });
      const mockStockRepo = createMockStockRepo({
        findByProductId: jest
          .fn()
          .mockResolvedValue({ productId: "product-123", quantity: 10 }),
      });
      const useCase = new AddToCartUseCase(
        mockCartRepo as any,
        mockStockRepo as any,
      );

      // Act
      const result = await useCase.execute({
        userId: "user-123",
        productId: "product-123",
        quantity: 2,
      });

      // Assert
      expect(result.quantity).toBe(3); // 1 existing + 2 new
    });
  });

  describe("Sad Path", () => {
    it("addToCart_withoutUserIdOrGuestId_throwsError", async () => {
      // Arrange
      const mockCartRepo = createMockCartRepo();
      const mockStockRepo = createMockStockRepo();
      const useCase = new AddToCartUseCase(
        mockCartRepo as any,
        mockStockRepo as any,
      );

      // Act & Assert
      await expect(
        useCase.execute({
          productId: "product-123",
          quantity: 1,
        }),
      ).rejects.toThrow("Either userId or guestId is required");
    });

    it("addToCart_withOutOfStock_throwsError", async () => {
      // Arrange
      const mockCartRepo = createMockCartRepo();
      const mockStockRepo = createMockStockRepo({
        findByProductId: jest
          .fn()
          .mockResolvedValue({ productId: "product-123", quantity: 0 }),
      });
      const useCase = new AddToCartUseCase(
        mockCartRepo as any,
        mockStockRepo as any,
      );

      // Act & Assert
      await expect(
        useCase.execute({
          userId: "user-123",
          productId: "product-123",
          quantity: 1,
        }),
      ).rejects.toThrow("This product is out of stock");
    });

    it("addToCart_withInsufficientStock_throwsError", async () => {
      // Arrange
      const existingItem = createMockCartItem({ quantity: 5 });
      const mockCartRepo = createMockCartRepo({
        findItem: jest.fn().mockResolvedValue(existingItem),
      });
      const mockStockRepo = createMockStockRepo({
        findByProductId: jest
          .fn()
          .mockResolvedValue({ productId: "product-123", quantity: 3 }),
      });
      const useCase = new AddToCartUseCase(
        mockCartRepo as any,
        mockStockRepo as any,
      );

      // Act & Assert
      await expect(
        useCase.execute({
          userId: "user-123",
          productId: "product-123",
          quantity: 2,
        }),
      ).rejects.toThrow("Only 3 item(s) available in stock");
    });

    it("addToCart_withDatabaseError_throwsError", async () => {
      // Arrange
      const mockCartRepo = createMockCartRepo({
        findItem: jest.fn().mockRejectedValue(new Error("Database error")),
      });
      const mockStockRepo = createMockStockRepo({
        findByProductId: jest
          .fn()
          .mockResolvedValue({ productId: "product-123", quantity: 10 }),
      });
      const useCase = new AddToCartUseCase(
        mockCartRepo as any,
        mockStockRepo as any,
      );

      // Act & Assert
      await expect(
        useCase.execute({
          userId: "user-123",
          productId: "product-123",
          quantity: 1,
        }),
      ).rejects.toThrow("Database error");
    });
  });
});

describe("UpdateCartItemUseCase", () => {
  describe("Happy Path", () => {
    it("updateCartItem_withValidData_updatesItem", async () => {
      // Arrange
      const cartItems = [
        createMockCartItem({ id: "cart-item-123", productId: "product-123" }),
      ];
      const mockCartRepo = createMockCartRepo({
        findAllByOwner: jest.fn().mockResolvedValue(cartItems),
        updateQuantity: jest
          .fn()
          .mockResolvedValue(createMockCartItem({ quantity: 5 })),
      });
      const mockStockRepo = createMockStockRepo({
        findByProductId: jest
          .fn()
          .mockResolvedValue({ productId: "product-123", quantity: 10 }),
      });
      const useCase = new UpdateCartItemUseCase(
        mockCartRepo as any,
        mockStockRepo as any,
      );

      // Act
      const result = await useCase.execute({
        itemId: "cart-item-123",
        userId: "user-123",
        quantity: 5,
      });

      // Assert
      expect(result.quantity).toBe(5);
      expect(mockCartRepo.updateQuantity).toHaveBeenCalled();
    });

    it("updateCartItem_withUserId_usesUserId", async () => {
      // Arrange
      const cartItems = [
        createMockCartItem({ id: "cart-item-123", userId: "user-123" }),
      ];
      const mockCartRepo = createMockCartRepo({
        findAllByOwner: jest.fn().mockResolvedValue(cartItems),
        updateQuantity: jest
          .fn()
          .mockResolvedValue(
            createMockCartItem({ userId: "user-123", quantity: 3 }),
          ),
      });
      const mockStockRepo = createMockStockRepo({
        findByProductId: jest
          .fn()
          .mockResolvedValue({ productId: "product-123", quantity: 10 }),
      });
      const useCase = new UpdateCartItemUseCase(
        mockCartRepo as any,
        mockStockRepo as any,
      );

      // Act
      await useCase.execute({
        itemId: "cart-item-123",
        userId: "user-123",
        quantity: 3,
      });

      // Assert
      expect(mockCartRepo.findAllByOwner).toHaveBeenCalledWith({
        userId: "user-123",
      });
    });
  });

  describe("Sad Path", () => {
    it("updateCartItem_withoutUserIdOrGuestId_throwsError", async () => {
      // Arrange
      const mockCartRepo = createMockCartRepo();
      const mockStockRepo = createMockStockRepo();
      const useCase = new UpdateCartItemUseCase(
        mockCartRepo as any,
        mockStockRepo as any,
      );

      // Act & Assert
      await expect(
        useCase.execute({
          itemId: "cart-item-123",
          quantity: 5,
        }),
      ).rejects.toThrow("Either userId or guestId is required");
    });

    it("updateCartItem_withNonExistentItem_throws404", async () => {
      // Arrange
      const mockCartRepo = createMockCartRepo({
        findAllByOwner: jest.fn().mockResolvedValue([]),
      });
      const mockStockRepo = createMockStockRepo();
      const useCase = new UpdateCartItemUseCase(
        mockCartRepo as any,
        mockStockRepo as any,
      );

      // Act & Assert
      await expect(
        useCase.execute({
          itemId: "non-existent",
          userId: "user-123",
          quantity: 5,
        }),
      ).rejects.toThrow("Cart item not found");
    });

    it("updateCartItem_withOutOfStock_throwsError", async () => {
      // Arrange
      const cartItems = [
        createMockCartItem({ id: "cart-item-123", productId: "product-123" }),
      ];
      const mockCartRepo = createMockCartRepo({
        findAllByOwner: jest.fn().mockResolvedValue(cartItems),
      });
      const mockStockRepo = createMockStockRepo({
        findByProductId: jest
          .fn()
          .mockResolvedValue({ productId: "product-123", quantity: 0 }),
      });
      const useCase = new UpdateCartItemUseCase(
        mockCartRepo as any,
        mockStockRepo as any,
      );

      // Act & Assert
      await expect(
        useCase.execute({
          itemId: "cart-item-123",
          userId: "user-123",
          quantity: 1,
        }),
      ).rejects.toThrow("This product is out of stock");
    });

    it("updateCartItem_exceedsAvailableStock_throwsError", async () => {
      // Arrange
      const cartItems = [
        createMockCartItem({ id: "cart-item-123", productId: "product-123" }),
      ];
      const mockCartRepo = createMockCartRepo({
        findAllByOwner: jest.fn().mockResolvedValue(cartItems),
      });
      const mockStockRepo = createMockStockRepo({
        findByProductId: jest
          .fn()
          .mockResolvedValue({ productId: "product-123", quantity: 3 }),
      });
      const useCase = new UpdateCartItemUseCase(
        mockCartRepo as any,
        mockStockRepo as any,
      );

      // Act & Assert
      await expect(
        useCase.execute({
          itemId: "cart-item-123",
          userId: "user-123",
          quantity: 10,
        }),
      ).rejects.toThrow("Only 3 item(s) available in stock");
    });
  });
});
