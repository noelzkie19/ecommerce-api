/**
 * ICommunityLinkRepository Interface
 *
 * Defines the contract for community link data access operations.
 */

import {
  CommunityLink,
  CommunityLinkCategory,
  CreateCommunityLinkProps,
  UpdateCommunityLinkProps,
} from "../entities/CommunityLink";

export interface CommunityLinkFilters {
  category?: CommunityLinkCategory;
  isActive?: boolean;
  search?: string;
}

export interface PaginatedCommunityLinks {
  links: CommunityLink[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * ICommunityLinkRepository Interface
 *
 * Defines the contract for community link data access operations.
 */
export interface ICommunityLinkRepository {
  /**
   * Find all community links with pagination and filters
   */
  findAll(
    page: number,
    limit: number,
    filters?: CommunityLinkFilters,
  ): Promise<PaginatedCommunityLinks>;

  /**
   * Find active community links (for public display)
   */
  findActive(limit?: number): Promise<CommunityLink[]>;

  /**
   * Find a community link by ID
   */
  findById(id: string): Promise<CommunityLink | null>;

  /**
   * Create a new community link
   */
  create(props: CreateCommunityLinkProps): Promise<CommunityLink>;

  /**
   * Update an existing community link
   */
  update(id: string, props: UpdateCommunityLinkProps): Promise<CommunityLink>;

  /**
   * Delete a community link
   */
  delete(id: string): Promise<void>;

  /**
   * Toggle the active status of a community link
   */
  toggleActive(id: string): Promise<CommunityLink>;

  /**
   * Reorder community links (update order_index)
   */
  reorder(ids: string[]): Promise<void>;

  /**
   * Count total links with optional filters
   */
  count(filters?: CommunityLinkFilters): Promise<number>;
}
