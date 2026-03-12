import { supabase } from "../../config/supabase";
import {
  ProductFilters,
  CreateProductDto,
  UpdateProductDto,
} from "./products.types";
import { AppError } from "../../common/utils/AppError";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Supabase nested select for product_images, ordered by position */
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

/** Normalise raw Supabase row so images are always an array sorted by position */
function normaliseProduct(row: Record<string, unknown>) {
  const images = Array.isArray(row.images) ? row.images : [];
  return {
    ...row,
    images: [...images].sort(
      (a: { position: number }, b: { position: number }) =>
        a.position - b.position,
    ),
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const findAll = async (filters: ProductFilters = {}) => {
  let query = supabase.from("products").select(PRODUCT_WITH_IMAGES_SELECT);

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.search) query = query.ilike("name", `%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw new AppError(error.message, 500);
  return (data ?? []).map(normaliseProduct);
};

export const findById = async (id: string) => {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_WITH_IMAGES_SELECT)
    .eq("id", id)
    .single();

  if (error) throw new AppError("Product not found", 404);
  return normaliseProduct(data as Record<string, unknown>);
};

export const findAllPaginated = async (
  filters: ProductFilters = {},
  page: number = 1,
  limit: number = 10,
) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("products")
    .select(PRODUCT_WITH_IMAGES_SELECT, { count: "exact" })
    .range(from, to)
    .order("created_at", { ascending: false });

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.search) query = query.ilike("name", `%${filters.search}%`);

  const { data, error, count } = await query;
  if (error) throw new AppError(error.message, 500);

  return {
    data: (data ?? []).map(normaliseProduct),
    meta: {
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  };
};

// ---------------------------------------------------------------------------
// Mutations – products
// ---------------------------------------------------------------------------

export const create = async (dto: CreateProductDto) => {
  const payload = {
    name: dto.name,
    description: dto.description ?? null,
    price: dto.price,
    category: dto.category,
    image_url: dto.image_url ?? null,
    badge: dto.badge ?? null,
    rating: dto.rating ?? null,
    review_count: dto.review_count ?? null,
    original_price: dto.original_price ?? null,
    affiliate_link: dto.affiliate_link ?? null,
  };

  const { data, error } = await supabase
    .from("products")
    .insert(payload)
    .select(PRODUCT_WITH_IMAGES_SELECT)
    .single();

  if (error) throw new AppError(error.message, 500);
  return normaliseProduct(data as Record<string, unknown>);
};

export const update = async (id: string, dto: UpdateProductDto) => {
  const payload = Object.fromEntries(
    Object.entries({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      category: dto.category,
      image_url: dto.image_url,
      badge: dto.badge,
      rating: dto.rating,
      review_count: dto.review_count,
      original_price: dto.original_price,
      affiliate_link: dto.affiliate_link,
    }).filter(([, v]) => v !== undefined),
  );

  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select(PRODUCT_WITH_IMAGES_SELECT)
    .single();

  if (error) throw new AppError("Product not found", 404);
  return normaliseProduct(data as Record<string, unknown>);
};

export const remove = async (id: string) => {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new AppError("Product not found", 404);
};

// ---------------------------------------------------------------------------
// Mutations – product_images
// ---------------------------------------------------------------------------

/**
 * Insert multiple image rows for a product.
 * `startPosition` lets callers append after existing images.
 */
// NOTE: Cast to `any` is intentional — `product_images` is not in the
// generated Supabase types yet. Re-run `supabase gen types typescript`
// after applying the migration to remove these casts.
const db = supabase as any; // eslint-disable-line @typescript-eslint/no-explicit-any

export const addImages = async (
  productId: string,
  urls: string[],
  startPosition: number = 0,
) => {
  const rows = urls.map((url, i) => ({
    product_id: productId,
    url,
    position: startPosition + i,
  }));

  const { data, error } = await db.from("product_images").insert(rows).select();

  if (error) throw new AppError(error.message, 500);
  return data;
};

export const removeImage = async (imageId: string) => {
  const { error } = await db.from("product_images").delete().eq("id", imageId);

  if (error) throw new AppError("Image not found", 404);
};

export const removeAllImages = async (productId: string) => {
  const { error } = await db
    .from("product_images")
    .delete()
    .eq("product_id", productId);

  if (error) throw new AppError(error.message, 500);
};

export const reorderImages = async (
  images: { id: string; position: number }[],
) => {
  await Promise.all(
    images.map(({ id, position }) =>
      db.from("product_images").update({ position }).eq("id", id),
    ),
  );
};

export const getMaxImagePosition = async (
  productId: string,
): Promise<number> => {
  const { data } = await db
    .from("product_images")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  return (data as { position: number } | null)?.position ?? -1;
};
