/**
 * IImageLibraryRepository Interface
 *
 * Defines the contract for image library data access operations.
 */

import {
  ImageLibrary,
  ImageLibraryCategory,
  CreateImageLibraryProps,
  UpdateImageLibraryProps,
} from "../entities/ImageLibrary";

export interface ImageLibraryFilters {
  category?: ImageLibraryCategory;
  isActive?: boolean;
  search?: string;
}

export interface PaginatedImageLibraries {
  images: ImageLibrary[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * IImageLibraryRepository Interface
 *
 * Defines the contract for image library data access operations.
 */
export interface IImageLibraryRepository {
  /**
   * Find all image library items with pagination and filters
   */
  findAll(
    page: number,
    limit: number,
    filters?: ImageLibraryFilters,
  ): Promise<PaginatedImageLibraries>;

  /**
   * Find active image library items (for public display)
   */
  findActive(
    category?: ImageLibraryCategory,
    limit?: number,
  ): Promise<ImageLibrary[]>;

  /**
   * Find an image library item by ID
   */
  findById(id: string): Promise<ImageLibrary | null>;

  /**
   * Create a new image library item
   */
  create(props: CreateImageLibraryProps): Promise<ImageLibrary>;

  /**
   * Update an existing image library item
   */
  update(id: string, props: UpdateImageLibraryProps): Promise<ImageLibrary>;

  /**
   * Delete an image library item
   */
  delete(id: string): Promise<void>;

  /**
   * Toggle the active status of an image library item
   */
  toggleActive(id: string): Promise<ImageLibrary>;

  /**
   * Reorder image library items (update display_order)
   */
  reorder(ids: string[]): Promise<void>;

  /**
   * Count total items with optional filters
   */
  count(filters?: ImageLibraryFilters): Promise<number>;
}
