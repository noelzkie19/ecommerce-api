// Export types from individual module type files
export * from "./express";

/**
 * Common Pagination Meta type used across all paginated endpoints
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
