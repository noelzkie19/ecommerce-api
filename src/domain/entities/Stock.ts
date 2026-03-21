/**
 * Stock Entity
 *
 * Represents the inventory stock for a product.
 * This is a core domain entity with no external dependencies.
 */

/**
 * Stock entity
 */
export class Stock {
  readonly id: string;
  readonly productId: string;
  readonly quantity: number;
  readonly updatedAt: Date;

  private constructor(props: StockProps) {
    this.id = props.id;
    this.productId = props.productId;
    this.quantity = props.quantity;
    this.updatedAt = props.updatedAt;
  }

  static create(props: CreateStockProps): Stock {
    return new Stock({
      id: props.id,
      productId: props.productId,
      quantity: props.quantity,
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  static fromDatabase(row: StockDatabaseRow): Stock {
    return new Stock({
      id: row.id,
      productId: row.product_id,
      quantity: row.quantity,
      updatedAt: new Date(row.updated_at),
    });
  }

  isOutOfStock(): boolean {
    return this.quantity === 0;
  }

  isLowStock(threshold: number = 5): boolean {
    return this.quantity > 0 && this.quantity <= threshold;
  }

  toResponse(): StockResponse {
    return {
      id: this.id,
      productId: this.productId,
      quantity: this.quantity,
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

/**
 * Internal constructor shape
 */
interface StockProps {
  id: string;
  productId: string;
  quantity: number;
  updatedAt: Date;
}

/**
 * Properties for creating a new Stock record
 */
export interface CreateStockProps {
  id: string;
  productId: string;
  quantity: number;
  updatedAt?: Date;
}

/**
 * Properties for updating a Stock record
 */
export interface UpdateStockProps {
  quantity: number;
}

/**
 * Database row type (snake_case from Supabase)
 */
export interface StockDatabaseRow {
  id: string;
  product_id: string;
  quantity: number;
  updated_at: string;
}

/**
 * Database row with nested product data
 */
export interface StockWithProductDatabaseRow extends StockDatabaseRow {
  products: {
    id: string;
    name: string;
    category: string;
    price: number;
    image_url: string | null;
  } | null;
}

/**
 * API response shape
 */
export interface StockResponse {
  id: string;
  productId: string;
  quantity: number;
  updatedAt: string;
}

/**
 * API response shape with nested product data
 */
export interface StockWithProductResponse {
  id: string;
  productId: string;
  quantity: number;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    category: string;
    price: number;
    imageUrl: string | null;
  } | null;
}

/**
 * Stock statistics
 */
export interface StockStats {
  totalStock: number;
  outOfStock: number;
  lowStock: number;
}

/**
 * Pagination result for stocks
 */
export interface PaginatedStocks {
  data: StockWithProductResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
