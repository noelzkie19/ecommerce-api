/**
 * Products Use Cases Unit Tests
 *
 * Tests for ListProductsUseCase and GetProductUseCase.
 * Each test covers both happy and sad paths.
 */

import { ListProductsUseCase } from "../../../src/application/use-cases/product/ListProducts";
import { GetProductUseCase } from "../../../src/application/use-cases/product/GetProduct";
import { createMockProduct, createMockProductsList } from "../../__mocks__";

// Create a mock repository that satisfies IProductRepository
const createMockProductRepo = (overrides = {}) => ({
  findAllPaginated: jest.fn().mockResolvedValue({
    data: createMockProductsList().map((p) => ({
      toResponse: () => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        priceFormatted: "₱100.00",
        category: p.category,
        imageUrl: null,
        primaryImageUrl: null,
        badge: null,
        rating: null,
        reviewCount: null,
        originalPrice: null,
        originalPriceFormatted: null,
        hasDiscount: false,
        discountPercentage: 0,
        createdAt: p.createdAt,
      }),
    })),
    meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
  }),
  findById: jest.fn().mockResolvedValue(null),
  findByCategory: jest.fn().mockResolvedValue([]),
  findBySearch: jest.fn().mockResolvedValue([]),
  findByIds: jest.fn().mockResolvedValue([]),
  getCategories: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue(createMockProduct()),
  update: jest.fn().mockResolvedValue(createMockProduct()),
  delete: jest.fn().mockResolvedValue(undefined),
  addImages: jest.fn().mockResolvedValue([]),
  removeImage: jest.fn().mockResolvedValue(undefined),
  removeAllImages: jest.fn().mockResolvedValue(undefined),
  reorderImages: jest.fn().mockResolvedValue(undefined),
  getMaxImagePosition: jest.fn().mockResolvedValue(0),
  ...overrides,
});

describe("ListProductsUseCase", () => {
  describe("Happy Path", () => {
    it("listProducts_withDefaultPagination_returnsProducts", async () => {
      // Arrange
      const mockProductRepo = createMockProductRepo({
        findAllPaginated: jest.fn().mockResolvedValue({
          data: createMockProductsList(3).map((p) => ({
            toResponse: () => ({
              id: p.id,
              name: p.name,
              description: p.description,
              price: p.price,
              priceFormatted: "₱100.00",
              category: p.category,
              imageUrl: null,
              primaryImageUrl: null,
              badge: null,
              rating: null,
              reviewCount: null,
              originalPrice: null,
              originalPriceFormatted: null,
              hasDiscount: false,
              discountPercentage: 0,
              createdAt: p.createdAt,
            }),
          })),
          meta: { total: 3, page: 1, limit: 10, totalPages: 1 },
        }),
      });
      const useCase = new ListProductsUseCase(mockProductRepo as any);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.products).toHaveLength(3);
      expect(result.meta.total).toBe(3);
      expect(result.meta.page).toBe(1);
      expect(mockProductRepo.findAllPaginated).toHaveBeenCalledWith(
        1,
        10,
        undefined,
        undefined,
      );
    });

    it("listProducts_withCustomPageAndLimit_returnsPaginatedProducts", async () => {
      // Arrange
      const mockProductRepo = createMockProductRepo({
        findAllPaginated: jest.fn().mockResolvedValue({
          data: createMockProductsList(5).map((p) => ({
            toResponse: () => ({
              id: p.id,
              name: p.name,
              price: p.price,
              priceFormatted: "₱100.00",
              category: p.category,
              imageUrl: null,
              primaryImageUrl: null,
              badge: null,
              rating: null,
              reviewCount: null,
              originalPrice: null,
              originalPriceFormatted: null,
              hasDiscount: false,
              discountPercentage: 0,
              createdAt: p.createdAt,
            }),
          })),
          meta: { total: 20, page: 2, limit: 5, totalPages: 4 },
        }),
      });
      const useCase = new ListProductsUseCase(mockProductRepo as any);

      // Act
      const result = await useCase.execute({ page: 2, limit: 5 });

      // Assert
      expect(result.products).toHaveLength(5);
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(5);
      expect(result.meta.totalPages).toBe(4);
      expect(mockProductRepo.findAllPaginated).toHaveBeenCalledWith(
        2,
        5,
        undefined,
        undefined,
      );
    });

    it("listProducts_withCategoryFilter_returnsFilteredProducts", async () => {
      // Arrange
      const mockProductRepo = createMockProductRepo({
        findAllPaginated: jest.fn().mockResolvedValue({
          data: createMockProductsList(2).map((p) => ({
            toResponse: () => ({
              id: p.id,
              name: p.name,
              price: p.price,
              priceFormatted: "₱100.00",
              category: "Electronics",
              imageUrl: null,
              primaryImageUrl: null,
              badge: null,
              rating: null,
              reviewCount: null,
              originalPrice: null,
              originalPriceFormatted: null,
              hasDiscount: false,
              discountPercentage: 0,
              createdAt: p.createdAt,
            }),
          })),
          meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
        }),
      });
      const useCase = new ListProductsUseCase(mockProductRepo as any);

      // Act
      const result = await useCase.execute({
        filters: { category: "Electronics" },
      });

      // Assert
      expect(result.products).toHaveLength(2);
      expect(mockProductRepo.findAllPaginated).toHaveBeenCalledWith(
        1,
        10,
        { category: "Electronics" },
        undefined,
      );
    });

    it("listProducts_withSearchQuery_returnsMatchingProducts", async () => {
      // Arrange
      const mockProducts = [createMockProduct({ name: "iPhone 15 Pro" })];
      const mockProductRepo = createMockProductRepo({
        findAllPaginated: jest.fn().mockResolvedValue({
          data: mockProducts.map((p) => ({
            toResponse: () => ({
              id: p.id,
              name: p.name,
              price: p.price,
              priceFormatted: "₱100.00",
              category: p.category,
              imageUrl: null,
              primaryImageUrl: null,
              badge: null,
              rating: null,
              reviewCount: null,
              originalPrice: null,
              originalPriceFormatted: null,
              hasDiscount: false,
              discountPercentage: 0,
              createdAt: p.createdAt,
            }),
          })),
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        }),
      });
      const useCase = new ListProductsUseCase(mockProductRepo as any);

      // Act
      const result = await useCase.execute({ filters: { search: "iPhone" } });

      // Assert
      expect(result.products).toHaveLength(1);
      expect(mockProductRepo.findAllPaginated).toHaveBeenCalledWith(
        1,
        10,
        { search: "iPhone" },
        undefined,
      );
    });
  });

  describe("Sad Path", () => {
    it("listProducts_withEmptyResults_returnsEmptyArray", async () => {
      // Arrange
      const mockProductRepo = createMockProductRepo({
        findAllPaginated: jest.fn().mockResolvedValue({
          data: [],
          meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
        }),
      });
      const useCase = new ListProductsUseCase(mockProductRepo as any);

      // Act
      const result = await useCase.execute({});

      // Assert
      expect(result.products).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it("listProducts_withDatabaseError_throwsError", async () => {
      // Arrange
      const mockProductRepo = createMockProductRepo({
        findAllPaginated: jest
          .fn()
          .mockRejectedValue(new Error("Database connection failed")),
      });
      const useCase = new ListProductsUseCase(mockProductRepo as any);

      // Act & Assert
      await expect(useCase.execute({})).rejects.toThrow(
        "Database connection failed",
      );
    });
  });
});

describe("GetProductUseCase", () => {
  describe("Happy Path", () => {
    it("getProduct_withValidId_returnsProduct", async () => {
      // Arrange
      const mockProduct = createMockProduct({
        id: "product-123",
        name: "Test Product",
        price: 100,
        category: "Electronics",
      });
      const mockProductRepo = createMockProductRepo({
        findById: jest.fn().mockResolvedValue({
          ...mockProduct,
          toResponse: () => ({
            id: mockProduct.id,
            name: mockProduct.name,
            description: mockProduct.description,
            price: mockProduct.price,
            priceFormatted: "₱100.00",
            category: mockProduct.category,
            imageUrl: null,
            primaryImageUrl: null,
            badge: null,
            rating: null,
            reviewCount: null,
            originalPrice: null,
            originalPriceFormatted: null,
            affiliateLink: null,
            hasDiscount: false,
            discountPercentage: 0,
            images: [],
            createdAt: mockProduct.createdAt,
            updatedAt: mockProduct.updatedAt,
          }),
        }),
      });
      const useCase = new GetProductUseCase(mockProductRepo as any);

      // Act
      const result = await useCase.execute({ productId: "product-123" });

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe("product-123");
      expect(result?.name).toBe("Test Product");
      expect(mockProductRepo.findById).toHaveBeenCalledWith("product-123");
    });

    it("getProduct_withDiscount_returnsDiscountInfo", async () => {
      // Arrange
      const mockProduct = createMockProduct({
        id: "product-456",
        name: "Sale Product",
        price: 80,
        category: "Electronics",
      });
      const mockProductRepo = createMockProductRepo({
        findById: jest.fn().mockResolvedValue({
          ...mockProduct,
          originalPrice: 100,
          toResponse: () => ({
            id: mockProduct.id,
            name: mockProduct.name,
            price: mockProduct.price,
            priceFormatted: "₱80.00",
            originalPrice: 100,
            originalPriceFormatted: "₱100.00",
            hasDiscount: true,
            discountPercentage: 20,
            category: mockProduct.category,
            imageUrl: null,
            primaryImageUrl: null,
            badge: null,
            rating: null,
            reviewCount: null,
            affiliateLink: null,
            images: [],
            description: null,
            createdAt: mockProduct.createdAt,
            updatedAt: mockProduct.updatedAt,
          }),
        }),
      });
      const useCase = new GetProductUseCase(mockProductRepo as any);

      // Act
      const result = await useCase.execute({ productId: "product-456" });

      // Assert
      expect(result?.hasDiscount).toBe(true);
      expect(result?.discountPercentage).toBe(20);
    });
  });

  describe("Sad Path", () => {
    it("getProduct_withInvalidId_returnsNull", async () => {
      // Arrange
      const mockProductRepo = createMockProductRepo({
        findById: jest.fn().mockResolvedValue(null),
      });
      const useCase = new GetProductUseCase(mockProductRepo as any);

      // Act
      const result = await useCase.execute({ productId: "non-existent-id" });

      // Assert
      expect(result).toBeNull();
      expect(mockProductRepo.findById).toHaveBeenCalledWith("non-existent-id");
    });

    it("getProduct_withDatabaseError_throwsError", async () => {
      // Arrange
      const mockProductRepo = createMockProductRepo({
        findById: jest.fn().mockRejectedValue(new Error("Database error")),
      });
      const useCase = new GetProductUseCase(mockProductRepo as any);

      // Act & Assert
      await expect(
        useCase.execute({ productId: "product-123" }),
      ).rejects.toThrow("Database error");
    });
  });
});
