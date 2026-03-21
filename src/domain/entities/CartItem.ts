/**
 * CartItem Entity
 *
 * Represents a shopping cart item linking a product to a cart owner.
 * Supports both authenticated users and guest sessions.
 */

/**
 * Cart ownership — either a logged-in user or a guest session
 */
export interface CartOwner {
  userId?: string;
  guestId?: string;
}

/**
 * CartItem entity
 */
export class CartItem {
  readonly id: string;
  readonly userId: string | null;
  readonly guestId: string | null;
  readonly productId: string;
  readonly quantity: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly product: CartItemProduct | null;

  private constructor(props: CartItemProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.guestId = props.guestId;
    this.productId = props.productId;
    this.quantity = props.quantity;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.product = props.product ?? null;
  }

  /**
   * Factory method to create a new CartItem
   */
  static create(props: CreateCartItemProps): CartItem {
    return new CartItem({
      id: props.id,
      userId: props.userId ?? null,
      guestId: props.guestId ?? null,
      productId: props.productId,
      quantity: props.quantity,
      createdAt: new Date(),
      updatedAt: new Date(),
      product: null,
    });
  }

  /**
   * Create CartItem from database row (no product join)
   */
  static fromDatabase(row: CartItemDatabaseRow): CartItem {
    return new CartItem({
      id: row.id,
      userId: row.user_id,
      guestId: row.guest_id,
      productId: row.product_id,
      quantity: row.quantity,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      product: null,
    });
  }

  /**
   * Create CartItem from database row with nested product data
   */
  static fromDatabaseWithProduct(row: CartItemWithProductDatabaseRow): CartItem {
    const product = row.product
      ? {
          id: row.product.id,
          name: row.product.name,
          price: row.product.price,
          imageUrl: row.product.image_url,
          primaryImageUrl:
            row.product.images && row.product.images.length > 0
              ? [...row.product.images].sort(
                  (a, b) => a.position - b.position,
                )[0].url
              : row.product.image_url,
          images: row.product.images ?? [],
        }
      : null;

    return new CartItem({
      id: row.id,
      userId: row.user_id,
      guestId: row.guest_id,
      productId: row.product_id,
      quantity: row.quantity,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      product,
    });
  }

  /**
   * Convert to plain response object (without product)
   */
  toResponse(): CartItemResponse {
    return {
      id: this.id,
      userId: this.userId,
      guestId: this.guestId,
      productId: this.productId,
      quantity: this.quantity,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * Convert to detailed response object (with product data)
   */
  toDetailedResponse(): CartItemWithProductResponse {
    return {
      ...this.toResponse(),
      product: this.product,
    };
  }
}

/**
 * Internal constructor shape
 */
interface CartItemProps {
  id: string;
  userId: string | null;
  guestId: string | null;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  product: CartItemProduct | null;
}

/**
 * Properties for creating a new CartItem
 */
export interface CreateCartItemProps {
  id: string;
  userId?: string | null;
  guestId?: string | null;
  productId: string;
  quantity: number;
}

/**
 * Properties for adding to cart (via repository)
 */
export interface AddToCartProps {
  productId: string;
  quantity: number;
}

/**
 * Database row type (snake_case from Supabase)
 */
export interface CartItemDatabaseRow {
  id: string;
  user_id: string | null;
  guest_id: string | null;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

/**
 * Database row type with nested product data
 */
export interface CartItemWithProductDatabaseRow extends CartItemDatabaseRow {
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    images?: Array<{ id: string; url: string; position: number }>;
  } | null;
}

/**
 * Nested product data shape on a cart item response
 */
export interface CartItemProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  primaryImageUrl: string | null;
  images: Array<{ id: string; url: string; position: number }>;
}

/**
 * API response shape (without product data)
 */
export interface CartItemResponse {
  id: string;
  userId: string | null;
  guestId: string | null;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * API response shape with nested product data
 */
export interface CartItemWithProductResponse extends CartItemResponse {
  product: CartItemProduct | null;
}
