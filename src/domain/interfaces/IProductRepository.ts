/**
 * IProductRepository Interface
 *
 * Defines the contract for product data access.
 * This interface is part of the domain layer and should be implemented
 * by the infrastructure layer (e.g., Supabase implementation).
 */

import {
  Product,
  ProductFilters,
  CreateProductProps,
  UpdateProductProps,
  ProductImage,
  ProductBundle,
  CreateProductBundleProps,
  UpdateProductBundleProps,
} from "../entities/Product";

/**
 * Pagination result
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Product repository interface
 * Defines all data access operations for products
 */
export interface IProductRepository {
  /**
   * Find all products with pagination and filters
   */
  findAllPaginated(
    page: number,
    limit: number,
    filters?: ProductFilters,
    storeId?: string,
  ): Promise<PaginatedResult<Product>>;

  /**
   * Find product by ID
   */
  findById(id: string): Promise<Product | null>;

  /**
   * Find products by category
   */
  findByCategory(category: string): Promise<Product[]>;

  /**
   * Find products by search term
   */
  findBySearch(search: string): Promise<Product[]>;

  /**
   * Find products by IDs (bulk)
   */
  findByIds(ids: string[]): Promise<Product[]>;

  /**
   * Get all unique categories
   */
  getCategories(): Promise<string[]>;

  /**
   * Create a new product
   */
  create(props: CreateProductProps): Promise<Product>;

  /**
   * Update a product
   */
  update(id: string, data: Partial<UpdateProductProps>): Promise<Product>;

  /**
   * Delete a product
   */
  delete(id: string): Promise<void>;

  /**
   * Add images to a product
   */
  addImages(
    productId: string,
    urls: string[],
    startPosition?: number,
  ): Promise<ProductImage[]>;

  /**
   * Remove a single image
   */
  removeImage(imageId: string): Promise<void>;

  /**
   * Remove all images for a product
   */
  removeAllImages(productId: string): Promise<void>;

  /**
   * Reorder images
   */
  reorderImages(images: { id: string; position: number }[]): Promise<void>;

  /**
   * Get the maximum image position for a product
   */
  getMaxImagePosition(productId: string): Promise<number>;

  /**
   * Find all bundles for a product
   */
  findBundlesByProductId(productId: string): Promise<ProductBundle[]>;

  /**
   * Find a single bundle by ID
   */
  findBundleById(bundleId: string): Promise<ProductBundle | null>;

  /**
   * Create bundles for a product
   */
  createBundles(
    productId: string,
    bundles: CreateProductBundleProps[],
  ): Promise<ProductBundle[]>;

  /**
   * Update bundles for a product (replaces all existing)
   */
  updateBundles(
    productId: string,
    bundles: UpdateProductBundleProps[],
  ): Promise<ProductBundle[]>;

  /**
   * Delete a bundle
   */
  deleteBundle(bundleId: string): Promise<void>;
}
