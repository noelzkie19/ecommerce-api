/**
 * ICartRepository Interface
 *
 * Defines the contract for cart data access.
 * This interface is part of the domain layer and should be implemented
 * by the infrastructure layer (e.g., Supabase implementation).
 */

import { CartItem, CartOwner, AddToCartProps } from "../entities/CartItem";

/**
 * Cart repository interface
 * Defines all data access operations for cart items
 */
export interface ICartRepository {
  /**
   * Find all cart items for an owner, with nested product details
   */
  findAllByOwner(owner: CartOwner): Promise<CartItem[]>;

  /**
   * Add a product to the cart, or increase quantity if it already exists (upsert)
   */
  upsert(owner: CartOwner, props: AddToCartProps): Promise<CartItem>;

  /**
   * Update the quantity of an existing cart item
   */
  updateQuantity(
    id: string,
    owner: CartOwner,
    quantity: number,
  ): Promise<CartItem>;

  /**
   * Remove a cart item by ID
   */
  remove(id: string, owner: CartOwner): Promise<void>;

  /**
   * Clear all items from a cart
   */
  clearCart(owner: CartOwner): Promise<void>;

  /**
   * Merge a guest cart into an authenticated user's cart
   */
  mergeGuestCart(guestId: string, userId: string): Promise<void>;
}
