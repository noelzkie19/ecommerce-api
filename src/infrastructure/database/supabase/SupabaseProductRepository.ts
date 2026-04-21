/**
 * Supabase Product Repository
 *
 * Implements IProductRepository using Supabase as the data store.
 * This is part of the infrastructure layer.
 */

import { supabaseAdmin } from "../../../config/supabase";
import { AppError } from "../../../common/utils/AppError";
import {
  IProductRepository,
  PaginatedResult,
} from "../../../domain/interfaces/IProductRepository";
import {
  Product,
  ProductFilters,
  CreateProductProps,
  UpdateProductProps,
  ProductImage,
  ProductImageDatabaseRow,
  ProductBundle,
  ProductBundleDatabaseRow,
  CreateProductBundleProps,
  UpdateProductBundleProps,
} from "../../../domain/entities/Product";

const db = supabaseAdmin as any;

/**
 * Supabase nested select for product_images only (used in most queries)
 */
const PRODUCT_WITH_IMAGES_SELECT = `
  *,
  images:product_images (
    id,
    product_id,
    url,
    position,
    created_at
  )
` as const;

/**
 * Supabase nested select for product_images and product_bundles
 */
const PRODUCT_WITH_IMAGES_AND_BUNDLES_SELECT = `
  *,
  images:product_images (
    id,
    product_id,
    url,
    position,
    created_at
  ),
  bundles:product_bundles (
    id,
    product_id,
    name,
    bundle_qty,
    bundle_price,
    is_active,
    created_at,
    updated_at
  )
` as const;

/**
 * Normalise raw Supabase row so images and bundles are always arrays
 */
function normaliseProduct(row: Record<string, unknown>) {
  const images = Array.isArray(row.images) ? row.images : [];
  const bundles = Array.isArray(row.bundles) ? row.bundles : [];
  return {
    ...row,
    images: [...images].sort(
      (a: { position: number }, b: { position: number }) =>
        a.position - b.position,
    ),
    bundles: [...bundles].sort(
      (a: { bundle_qty: number }, b: { bundle_qty: number }) =>
        a.bundle_qty - b.bundle_qty,
    ),
  };
}

/**
 * Create an empty paginated result
 */
function createEmptyResult(
  page: number,
  limit: number,
): PaginatedResult<Product> {
  return {
    data: [],
    meta: {
      total: 0,
      page,
      limit,
      totalPages: 0,
    },
  };
}

/**
 * Apply filters to a Supabase query
 */
function applyFilters(query: any, filters?: ProductFilters): any {
  if (!filters) return query;

  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }
  if (filters.minPrice !== undefined) {
    query = query.gte("price", filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    query = query.lte("price", filters.maxPrice);
  }
  return query;
}

/**
 * Supabase implementation of IProductRepository
 */
export class SupabaseProductRepository implements IProductRepository {
  /**
   * Find all products with pagination and filters
   */
  async findAllPaginated(
    page: number,
    limit: number,
    filters?: ProductFilters,
    storeId?: string,
  ): Promise<PaginatedResult<Product>> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query;

    // If storeId is provided, filter products by affiliate's storeId
    if (storeId) {
      // First find the affiliate by storeId, then get their products
      const { data: affiliateData, error: affiliateError } = await db
        .from("affiliates")
        .select("id")
        .eq("store_id", storeId)
        .eq("status", "active")
        .single();

      if (affiliateError || !affiliateData) {
        // No affiliate found with this storeId, return empty result
        return createEmptyResult(page, limit);
      }

      const affiliateId = affiliateData.id;

      // Get product IDs assigned to this affiliate
      const { data: affiliateProducts, error: apError } = await db
        .from("affiliate_products")
        .select("product_id")
        .eq("affiliate_id", affiliateId);

      if (apError || !affiliateProducts || affiliateProducts.length === 0) {
        return createEmptyResult(page, limit);
      }

      const productIds = (affiliateProducts as { product_id: string }[]).map(
        (ap) => ap.product_id,
      );

      // Build query with filters
      query = db
        .from("products")
        .select(PRODUCT_WITH_IMAGES_AND_BUNDLES_SELECT, { count: "exact" })
        .in("id", productIds)
        .range(from, to)
        .order("created_at", { ascending: false });
    } else {
      // Standard product listing without storeId
      query = db
        .from("products")
        .select(PRODUCT_WITH_IMAGES_AND_BUNDLES_SELECT, { count: "exact" })
        .range(from, to)
        .order("created_at", { ascending: false });
    }

    // Apply filters to query (shared by both branches)
    query = applyFilters(query, filters);

    const { data, error, count } = await query;
    if (error) throw new AppError(error.message, 500);

    const products = (data ?? []).map((row: Record<string, unknown>) =>
      Product.fromDatabase(normaliseProduct(row) as any),
    );

    return {
      data: products,
      meta: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  /**
   * Find product by ID
   */
  async findById(id: string): Promise<Product | null> {
    const { data, error } = await db
      .from("products")
      .select(PRODUCT_WITH_IMAGES_AND_BUNDLES_SELECT)
      .eq("id", id)
      .single();

    if (error) return null;
    return Product.fromDatabase(normaliseProduct(data) as any);
  }

  /**
   * Find products by category
   */
  async findByCategory(category: string): Promise<Product[]> {
    const { data, error } = await db
      .from("products")
      .select(PRODUCT_WITH_IMAGES_SELECT)
      .eq("category", category)
      .order("created_at", { ascending: false });

    if (error) throw new AppError(error.message, 500);

    return (data ?? []).map((row: Record<string, unknown>) =>
      Product.fromDatabase(normaliseProduct(row) as any),
    );
  }

  /**
   * Find products by search term
   */
  async findBySearch(search: string): Promise<Product[]> {
    const { data, error } = await db
      .from("products")
      .select(PRODUCT_WITH_IMAGES_SELECT)
      .ilike("name", `%${search}%`)
      .order("created_at", { ascending: false });

    if (error) throw new AppError(error.message, 500);

    return (data ?? []).map((row: Record<string, unknown>) =>
      Product.fromDatabase(normaliseProduct(row) as any),
    );
  }

  /**
   * Find products by IDs (bulk)
   */
  async findByIds(ids: string[]): Promise<Product[]> {
    if (ids.length === 0) return [];

    const { data, error } = await db
      .from("products")
      .select(PRODUCT_WITH_IMAGES_SELECT)
      .in("id", ids);

    if (error) throw new AppError(error.message, 500);

    return (data ?? []).map((row: Record<string, unknown>) =>
      Product.fromDatabase(normaliseProduct(row) as any),
    );
  }

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<string[]> {
    const { data, error } = await db
      .from("products")
      .select("category")
      .order("category");

    if (error) throw new AppError(error.message, 500);

    const categories = new Set<string>();
    data?.forEach((row: { category: string }) => {
      if (row.category) {
        categories.add(row.category);
      }
    });

    return Array.from(categories);
  }

  /**
   * Create a new product
   */
  async create(props: CreateProductProps): Promise<Product> {
    const payload = {
      name: props.name,
      description: props.description ?? null,
      price: props.price,
      category: props.category,
      image_url: props.imageUrl ?? null,
      badge: props.badge ?? null,
      rating: props.rating ?? null,
      review_count: props.reviewCount ?? null,
      original_price: props.originalPrice ?? null,
      affiliate_link: props.affiliateLink ?? null,
      video_url: props.videoUrl ?? null,
      video_tag: props.videoTag ?? "default",
    };

    const { data, error } = await db
      .from("products")
      .insert(payload)
      .select(PRODUCT_WITH_IMAGES_SELECT)
      .single();

    if (error) throw new AppError(error.message, 500);
    return Product.fromDatabase(normaliseProduct(data) as any);
  }

  /**
   * Update a product
   */
  async update(
    id: string,
    data: Partial<UpdateProductProps>,
  ): Promise<Product> {
    const payload = Object.fromEntries(
      Object.entries({
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        image_url: data.imageUrl,
        badge: data.badge,
        rating: data.rating,
        review_count: data.reviewCount,
        original_price: data.originalPrice,
        affiliate_link: data.affiliateLink,
        video_url: data.videoUrl,
        video_tag: data.videoTag,
      }).filter(([, v]) => v !== undefined),
    );

    const { data: updated, error } = await db
      .from("products")
      .update(payload)
      .eq("id", id)
      .select(PRODUCT_WITH_IMAGES_SELECT)
      .single();

    if (error) throw new AppError("Product not found", 404);
    return Product.fromDatabase(normaliseProduct(updated) as any);
  }

  /**
   * Delete a product
   */
  async delete(id: string): Promise<void> {
    const { error } = await db.from("products").delete().eq("id", id);
    if (error) throw new AppError("Product not found", 404);
  }

  /**
   * Add images to a product
   */
  async addImages(
    productId: string,
    urls: string[],
    startPosition: number = 0,
  ): Promise<ProductImage[]> {
    const maxPos = await this.getMaxImagePosition(productId);
    const actualStart = startPosition > 0 ? startPosition : maxPos + 1;

    const rows = urls.map((url, i) => ({
      product_id: productId,
      url,
      position: actualStart + i,
    }));

    const { data, error } = await db
      .from("product_images")
      .insert(rows)
      .select();

    if (error) throw new AppError(error.message, 500);

    return (data ?? []).map((row: ProductImageDatabaseRow) =>
      ProductImage.fromDatabase(row),
    );
  }

  /**
   * Remove a single image
   */
  async removeImage(imageId: string): Promise<void> {
    const { error } = await db
      .from("product_images")
      .delete()
      .eq("id", imageId);

    if (error) throw new AppError("Image not found", 404);
  }

  /**
   * Remove all images for a product
   */
  async removeAllImages(productId: string): Promise<void> {
    const { error } = await db
      .from("product_images")
      .delete()
      .eq("product_id", productId);

    if (error) throw new AppError(error.message, 500);
  }

  /**
   * Reorder images
   */
  async reorderImages(
    images: { id: string; position: number }[],
  ): Promise<void> {
    await Promise.all(
      images.map(({ id, position }) =>
        db.from("product_images").update({ position }).eq("id", id),
      ),
    );
  }

  /**
   * Get the maximum image position for a product
   */
  async getMaxImagePosition(productId: string): Promise<number> {
    const { data } = await db
      .from("product_images")
      .select("position")
      .eq("product_id", productId)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    return (data as { position: number } | null)?.position ?? -1;
  }

  /**
   * Find all bundles for a product
   */
  async findBundlesByProductId(productId: string): Promise<ProductBundle[]> {
    const { data, error } = await db
      .from("product_bundles")
      .select("*")
      .eq("product_id", productId)
      .eq("is_active", true)
      .order("bundle_qty", { ascending: true });

    if (error) throw new AppError(error.message, 500);

    return (data ?? []).map((row: ProductBundleDatabaseRow) =>
      ProductBundle.fromDatabase(row),
    );
  }

  /**
   * Find a single bundle by ID
   */
  async findBundleById(bundleId: string): Promise<ProductBundle | null> {
    const { data, error } = await db
      .from("product_bundles")
      .select("*")
      .eq("id", bundleId)
      .single();

    if (error || !data) return null;

    return ProductBundle.fromDatabase(data as ProductBundleDatabaseRow);
  }

  /**
   * Create bundles for a product
   */
  async createBundles(
    productId: string,
    bundles: CreateProductBundleProps[],
  ): Promise<ProductBundle[]> {
    const payload = bundles.map((bundle) => ({
      product_id: productId,
      name: bundle.name,
      bundle_qty: bundle.bundleQty,
      bundle_price: bundle.bundlePrice,
      is_active: bundle.isActive ?? true,
    }));

    const { data, error } = await db
      .from("product_bundles")
      .insert(payload)
      .select("*");

    if (error) throw new AppError(error.message, 500);

    return (data ?? []).map((row: ProductBundleDatabaseRow) =>
      ProductBundle.fromDatabase(row),
    );
  }

  /**
   * Update bundles for a product (replaces all existing)
   */
  async updateBundles(
    productId: string,
    bundles: UpdateProductBundleProps[],
  ): Promise<ProductBundle[]> {
    // First delete all existing bundles
    const { error: deleteError } = await db
      .from("product_bundles")
      .delete()
      .eq("product_id", productId);

    if (deleteError) throw new AppError(deleteError.message, 500);

    // Then insert new bundles
    if (bundles.length === 0) {
      return [];
    }

    const payload = bundles.map((bundle) => ({
      product_id: productId,
      name: bundle.name,
      bundle_qty: bundle.bundleQty,
      bundle_price: bundle.bundlePrice,
      is_active: bundle.isActive ?? true,
    }));

    const { data, error } = await db
      .from("product_bundles")
      .insert(payload)
      .select("*");

    if (error) throw new AppError(error.message, 500);

    return (data ?? []).map((row: ProductBundleDatabaseRow) =>
      ProductBundle.fromDatabase(row),
    );
  }

  /**
   * Delete a bundle
   */
  async deleteBundle(bundleId: string): Promise<void> {
    const { error } = await db
      .from("product_bundles")
      .delete()
      .eq("id", bundleId);

    if (error) throw new AppError("Bundle not found", 404);
  }
}

// Export singleton instance
export const productRepository = new SupabaseProductRepository();
