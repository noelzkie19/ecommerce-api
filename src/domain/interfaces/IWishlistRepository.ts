/**
 * IWishlistRepository Interface
 *
 * Defines the contract for wishlist data access.
 * This interface is part of the domain layer and should be implemented
 * by the infrastructure layer (e.g., Supabase implementation).
 */

/**
 * Wishlist repository interface
 * Defines all data access operations for wishlist
 */
export interface IWishlistRepository {
  /**
   * Find all wishlist items by user ID
   */
  findAllByUser(userId: string): Promise<any[]>;

  /**
   * Find a wishlist item by user and product
   */
  findItem(userId: string, productId: string): Promise<any>;

  /**
   * Add item to wishlist
   */
  add(userId: string, productId: string): Promise<any>;

  /**
   * Remove item from wishlist
   */
  remove(id: string, userId: string): Promise<void>;
}
