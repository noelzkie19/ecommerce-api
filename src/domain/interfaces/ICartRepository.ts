/**
 * ICartRepository Interface
 *
 * Defines the contract for cart data access.
 * This interface is part of the domain layer and should be implemented
 * by the infrastructure layer (e.g., Supabase implementation).
 */

/**
 * Cart owner (either user or guest)
 */
export interface CartOwner {
  userId?: string;
  guestId?: string;
}

/**
 * Add to cart DTO
 */
export interface AddToCartDTO {
  productId: string;
  productBundleId?: string;
  quantity: number;
}

/**
 * Cart item with product details
 */
export interface CartItem {
  id: string;
  userId: string | null;
  guestId: string | null;
  productId: string;
  productBundleId?: string | null;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  productBundle?: {
    id: string;
    name: string;
    bundleQty: number;
    bundlePrice: number;
  } | null;
  product?: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    imageUrl: string | null;
    images?: Array<{
      id: string;
      url: string;
      position: number;
    }>;
    stock?: {
      quantity: number;
      available: boolean;
    };
  };
}

/**
 * Cart repository interface
 * Defines all data access operations for cart
 */
export interface ICartRepository {
  /**
   * Find all cart items by owner
   */
  findAllByOwner(owner: CartOwner): Promise<CartItem[]>;

  /**
   * Find a cart item by owner and product
   */
  findItem(owner: CartOwner, productId: string): Promise<CartItem | null>;

  /**
   * Add or update cart item
   */
  upsert(owner: CartOwner, dto: AddToCartDTO): Promise<CartItem>;

  /**
   * Update cart item quantity
   */
  updateQuantity(
    id: string,
    owner: CartOwner,
    quantity: number,
  ): Promise<CartItem>;

  /**
   * Remove cart item
   */
  remove(id: string, owner: CartOwner): Promise<void>;

  /**
   * Clear all cart items for owner
   */
  clearCart(owner: CartOwner): Promise<void>;

  /**
   * Merge guest cart to user cart
   */
  mergeGuestCart(guestId: string, userId: string): Promise<void>;
}
