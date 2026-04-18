/**
 * Product Entity
 *
 * Represents a product in the e-commerce platform.
 * This is a core domain entity that contains pure business logic.
 */

import { Money, Currency } from "../value-objects/Money";

export type ProductStatus = "active" | "inactive" | "draft";

/**
 * Product image value object
 */
export class ProductImage {
  readonly id: string;
  readonly productId: string;
  readonly url: string;
  readonly position: number;
  readonly createdAt: Date;

  private constructor(props: ProductImageProps) {
    this.id = props.id;
    this.productId = props.productId;
    this.url = props.url;
    this.position = props.position;
    this.createdAt = props.createdAt;
  }

  static create(props: CreateProductImageProps): ProductImage {
    return new ProductImage({
      id: props.id,
      productId: props.productId,
      url: props.url,
      position: props.position ?? 0,
      createdAt: props.createdAt ?? new Date(),
    });
  }

  static fromDatabase(row: ProductImageDatabaseRow): ProductImage {
    return new ProductImage({
      id: row.id,
      productId: row.product_id,
      url: row.url,
      position: row.position,
      createdAt: new Date(row.created_at),
    });
  }

  toResponse(): ProductImageResponse {
    return {
      id: this.id,
      productId: this.productId,
      url: this.url,
      position: this.position,
      createdAt:
        this.createdAt && !Number.isNaN(this.createdAt.getTime())
          ? this.createdAt.toISOString()
          : null,
    };
  }
}

/**
 * Product entity with business logic
 */
export class Product {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly price: Money;
  readonly category: string;
  readonly imageUrl: string | null;
  readonly badge: string | null;
  readonly rating: number | null;
  readonly reviewCount: number | null;
  readonly originalPrice: Money | null;
  readonly affiliateLink: string | null;
  readonly images: ProductImage[];
  readonly bundles!: ProductBundle[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: ProductProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.price = props.price;
    this.category = props.category;
    this.imageUrl = props.imageUrl;
    this.badge = props.badge;
    this.rating = props.rating;
    this.reviewCount = props.reviewCount;
    this.originalPrice = props.originalPrice;
    this.affiliateLink = props.affiliateLink;
    this.images = props.images;
    this.bundles = props.bundles;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Factory method to create a new Product
   */
  static create(props: CreateProductProps): Product {
    return new Product({
      id: props.id,
      name: props.name,
      description: props.description ?? null,
      price: Money.create(props.price, props.currency ?? "PHP"),
      category: props.category,
      imageUrl: props.imageUrl ?? null,
      badge: props.badge ?? null,
      rating: props.rating ?? null,
      reviewCount: props.reviewCount ?? null,
      originalPrice: props.originalPrice
        ? Money.create(props.originalPrice, props.currency ?? "PHP")
        : null,
      affiliateLink: props.affiliateLink ?? null,
      images: props.images ?? [],
      bundles: props.bundles ?? [],
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  /**
   * Create Product from database row
   */
  static fromDatabase(row: ProductDatabaseRow): Product {
    const images = Array.isArray(row.images)
      ? row.images.map((img: ProductImageDatabaseRow) =>
          ProductImage.fromDatabase(img),
        )
      : [];

    const bundles = Array.isArray(row.bundles)
      ? row.bundles.map((b: ProductBundleDatabaseRow) =>
          ProductBundle.fromDatabase(b),
        )
      : [];

    return new Product({
      id: row.id,
      name: row.name,
      description: row.description,
      price: Money.create(row.price, "PHP"),
      category: row.category,
      imageUrl: row.image_url,
      badge: row.badge,
      rating: row.rating,
      reviewCount: row.review_count,
      originalPrice: row.original_price
        ? Money.create(row.original_price, "PHP")
        : null,
      affiliateLink: row.affiliate_link,
      images,
      bundles,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  /**
   * Check if product has a discount
   */
  hasDiscount(): boolean {
    return this.originalPrice?.isGreaterThan(this.price) ?? false;
  }

  /**
   * Get discount percentage
   */
  getDiscountPercentage(): number {
    if (!this.hasDiscount() || !this.originalPrice) {
      return 0;
    }
    const discount = this.originalPrice.subtract(this.price);
    return (discount.amount / this.originalPrice.amount) * 100;
  }

  /**
   * Check if product has affiliate link
   */
  hasAffiliateLink(): boolean {
    return this.affiliateLink !== null && this.affiliateLink.length > 0;
  }

  /**
   * Get primary image URL
   */
  getPrimaryImageUrl(): string | null {
    if (this.images.length > 0) {
      const sorted = [...this.images].sort((a, b) => a.position - b.position);
      return sorted[0].url;
    }
    return this.imageUrl;
  }

  /**
   * Check if product has images
   */
  hasImages(): boolean {
    return this.images.length > 0 || this.imageUrl !== null;
  }

  /**
   * Update the product name
   */
  updateName(name: string): Product {
    return new Product({
      ...this.toProps(),
      name,
      updatedAt: new Date(),
    });
  }

  /**
   * Update the product price
   */
  updatePrice(price: number, currency?: Currency): Product {
    return new Product({
      ...this.toProps(),
      price: Money.create(price, currency ?? "PHP"),
      updatedAt: new Date(),
    });
  }

  /**
   * Apply a discount
   */
  applyDiscount(discountedPrice: number): Product {
    return new Product({
      ...this.toProps(),
      originalPrice: this.price,
      price: Money.create(discountedPrice, this.price.currency),
      updatedAt: new Date(),
    });
  }

  /**
   * Remove discount
   */
  removeDiscount(): Product {
    if (!this.originalPrice) {
      return this;
    }
    return new Product({
      ...this.toProps(),
      price: this.originalPrice,
      originalPrice: null,
      updatedAt: new Date(),
    });
  }

  /**
   * Add images to product
   */
  addImages(newImages: ProductImage[]): Product {
    return new Product({
      ...this.toProps(),
      images: [...this.images, ...newImages],
      updatedAt: new Date(),
    });
  }

  /**
   * Convert to plain object for response
   */
  toResponse(): ProductResponse {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price.amount,
      priceFormatted: this.price.format(),
      category: this.category,
      imageUrl: this.imageUrl,
      primaryImageUrl: this.getPrimaryImageUrl(),
      badge: this.badge,
      rating: this.rating,
      reviewCount: this.reviewCount,
      originalPrice: this.originalPrice?.amount ?? null,
      originalPriceFormatted: this.originalPrice?.format() ?? null,
      affiliateLink: this.affiliateLink,
      hasDiscount: this.hasDiscount(),
      discountPercentage: Math.round(this.getDiscountPercentage()),
      images: this.images.map((img) => img.toResponse()),
      bundles: this.bundles.map((bundle) => bundle.toResponse()),
      createdAt:
        this.createdAt && !Number.isNaN(this.createdAt.getTime())
          ? this.createdAt.toISOString()
          : null,
      updatedAt:
        this.updatedAt && !Number.isNaN(this.updatedAt.getTime())
          ? this.updatedAt.toISOString()
          : null,
    };
  }

  private toProps(): ProductProps {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      category: this.category,
      imageUrl: this.imageUrl,
      badge: this.badge,
      rating: this.rating,
      reviewCount: this.reviewCount,
      originalPrice: this.originalPrice,
      affiliateLink: this.affiliateLink,
      images: this.images,
      bundles: this.bundles,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

/**
 * Product properties (internal)
 */
interface ProductProps {
  id: string;
  name: string;
  description: string | null;
  price: Money;
  category: string;
  imageUrl: string | null;
  badge: string | null;
  rating: number | null;
  reviewCount: number | null;
  originalPrice: Money | null;
  affiliateLink: string | null;
  images: ProductImage[];
  bundles: ProductBundle[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Properties for creating a new Product
 */
export interface CreateProductProps {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  currency?: Currency;
  category: string;
  imageUrl?: string | null;
  badge?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  originalPrice?: number | null;
  affiliateLink?: string | null;
  images?: ProductImage[];
  bundles?: ProductBundle[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Properties for updating a Product
 */
export interface UpdateProductProps {
  name?: string;
  description?: string | null;
  price?: number;
  currency?: Currency;
  category?: string;
  imageUrl?: string | null;
  badge?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  originalPrice?: number | null;
  affiliateLink?: string | null;
}

/**
 * Product filters
 */
export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  hasDiscount?: boolean;
}

/**
 * Database row type (snake_case from Supabase)
 */
export interface ProductDatabaseRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  badge: string | null;
  rating: number | null;
  review_count: number | null;
  original_price: number | null;
  affiliate_link: string | null;
  created_at: string;
  updated_at: string;
  images?: ProductImageDatabaseRow[];
  bundles?: ProductBundleDatabaseRow[];
}

/**
 * Product image database row
 */
export interface ProductImageDatabaseRow {
  id: string;
  product_id: string;
  url: string;
  position: number;
  created_at: string;
}

/**
 * Create product image props
 */
interface CreateProductImageProps {
  id: string;
  productId: string;
  url: string;
  position?: number;
  createdAt?: Date;
}

/**
 * Product image props
 */
interface ProductImageProps {
  id: string;
  productId: string;
  url: string;
  position: number;
  createdAt: Date;
}

/**
 * API Response type
 */
export interface ProductResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  priceFormatted: string;
  category: string;
  imageUrl: string | null;
  primaryImageUrl: string | null;
  badge: string | null;
  rating: number | null;
  reviewCount: number | null;
  originalPrice: number | null;
  originalPriceFormatted: string | null;
  affiliateLink: string | null;
  hasDiscount: boolean;
  discountPercentage: number;
  images: ProductImageResponse[];
  bundles: ProductBundleResponse[];
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Product image response
 */
export interface ProductImageResponse {
  id: string;
  productId: string;
  url: string;
  position: number;
  createdAt: string | null;
}

/**
 * Product Bundle Value Object
 *
 * Represents a bundle pricing option for a product.
 * e.g., "Buy 3 - Save 15%" = 3 items for a discounted price
 */
export class ProductBundle {
  readonly id: string;
  readonly productId: string;
  readonly name: string;
  readonly bundleQty: number;
  readonly bundlePrice: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: ProductBundleProps) {
    this.id = props.id;
    this.productId = props.productId;
    this.name = props.name;
    this.bundleQty = props.bundleQty;
    this.bundlePrice = props.bundlePrice;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Factory method to create a new ProductBundle
   */
  static create(props: CreateProductBundleProps): ProductBundle {
    return new ProductBundle({
      id: props.id,
      productId: props.productId,
      name: props.name,
      bundleQty: props.bundleQty,
      bundlePrice: props.bundlePrice,
      isActive: props.isActive ?? true,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  /**
   * Create ProductBundle from database row
   */
  static fromDatabase(row: ProductBundleDatabaseRow): ProductBundle {
    return new ProductBundle({
      id: row.id,
      productId: row.product_id,
      name: row.name,
      bundleQty: row.bundle_qty,
      bundlePrice: row.bundle_price,
      isActive: row.is_active ?? true,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  /**
   * Calculate unit price (price per item in bundle)
   */
  getUnitPrice(): number {
    return this.bundlePrice / this.bundleQty;
  }

  /**
   * Calculate savings compared to single unit price
   */
  getSavingsPercentage(singlePrice: number): number {
    const bundleUnitPrice = this.getUnitPrice();
    if (singlePrice <= 0) return 0;
    return Math.round(((singlePrice - bundleUnitPrice) / singlePrice) * 100);
  }

  /**
   * Convert to plain object for response
   */
  toResponse(): ProductBundleResponse {
    return {
      id: this.id,
      productId: this.productId,
      name: this.name,
      bundleQty: this.bundleQty,
      bundlePrice: this.bundlePrice,
      bundlePriceFormatted: `₱${this.bundlePrice.toFixed(2)}`,
      unitPrice: this.getUnitPrice(),
      isActive: this.isActive,
      createdAt:
        this.createdAt && !Number.isNaN(this.createdAt.getTime())
          ? this.createdAt.toISOString()
          : null,
      updatedAt:
        this.updatedAt && !Number.isNaN(this.updatedAt.getTime())
          ? this.updatedAt.toISOString()
          : null,
    };
  }

  private toProps(): ProductBundleProps {
    return {
      id: this.id,
      productId: this.productId,
      name: this.name,
      bundleQty: this.bundleQty,
      bundlePrice: this.bundlePrice,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

/**
 * ProductBundle properties (internal)
 */
interface ProductBundleProps {
  id: string;
  productId: string;
  name: string;
  bundleQty: number;
  bundlePrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Properties for creating a new ProductBundle
 */
export interface CreateProductBundleProps {
  id: string;
  productId: string;
  name: string;
  bundleQty: number;
  bundlePrice: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Properties for updating a ProductBundle
 */
export interface UpdateProductBundleProps {
  id?: string;
  name?: string;
  bundleQty?: number;
  bundlePrice?: number;
  isActive?: boolean;
}

/**
 * ProductBundle database row (snake_case from Supabase)
 */
export interface ProductBundleDatabaseRow {
  id: string;
  product_id: string;
  name: string;
  bundle_qty: number;
  bundle_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * ProductBundle API Response
 */
export interface ProductBundleResponse {
  id: string;
  productId: string;
  name: string;
  bundleQty: number;
  bundlePrice: number;
  bundlePriceFormatted: string;
  unitPrice: number;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}
