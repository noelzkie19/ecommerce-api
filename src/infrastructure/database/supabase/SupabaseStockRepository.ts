/**
 * Supabase Stock Repository
 *
 * Implements IStockRepository using Supabase as the data store.
 * This is part of the infrastructure layer.
 */

import { supabaseAdmin } from "../../../config/supabase";
import { AppError } from "../../../common/utils/AppError";
import { IStockRepository } from "../../../domain/interfaces/IStockRepository";
import {
  Stock,
  UpdateStockProps,
  StockWithProductDatabaseRow,
  StockWithProductResponse,
  PaginatedStocks,
  StockStats,
  StockResponse,
} from "../../../domain/entities/Stock";

const db = supabaseAdmin as any;

const STOCK_WITH_PRODUCT_SELECT = `
  id,
  product_id,
  quantity,
  updated_at,
  products (
    id,
    name,
    category,
    price,
    image_url
  )
` as const;

function rowToStockWithProduct(row: StockWithProductDatabaseRow): StockWithProductResponse {
  return {
    id: row.id,
    productId: row.product_id,
    quantity: row.quantity,
    updatedAt: row.updated_at,
    product: row.products
      ? {
          id: row.products.id,
          name: row.products.name,
          category: row.products.category,
          price: row.products.price,
          imageUrl: row.products.image_url,
        }
      : null,
  };
}

/**
 * Supabase implementation of IStockRepository
 */
export class SupabaseStockRepository implements IStockRepository {
  /**
   * Find all stock entries with pagination and optional search
   */
  async findAll(
    filters: { search?: string },
    page: number,
    limit: number,
  ): Promise<PaginatedStocks> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = db
      .from("stock")
      .select(STOCK_WITH_PRODUCT_SELECT, { count: "exact" })
      .range(from, to)
      .order("updated_at", { ascending: false });

    if (filters.search) {
      query = query.ilike("products.name", `%${filters.search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw new AppError(error.message, 500);

    return {
      data: (data ?? []).map((row: StockWithProductDatabaseRow) =>
        rowToStockWithProduct(row),
      ),
      meta: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  /**
   * Find stock by product ID
   */
  async findByProductId(productId: string): Promise<Stock | null> {
    const { data, error } = await db
      .from("stock")
      .select("*")
      .eq("product_id", productId)
      .single();

    if (error) return null;
    return Stock.fromDatabase(data);
  }

  /**
   * Create or update stock for a product
   */
  async upsert(productId: string, props: UpdateStockProps): Promise<StockResponse> {
    const { data, error } = await db
      .from("stock")
      .upsert(
        {
          product_id: productId,
          quantity: props.quantity,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "product_id" },
      )
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);
    return Stock.fromDatabase(data).toResponse();
  }

  /**
   * Get aggregate stock statistics
   */
  async getStats(): Promise<StockStats> {
    const { data, error } = await db.from("stock").select("quantity");
    if (error) throw new AppError(error.message, 500);

    const rows = (data ?? []) as { quantity: number }[];
    const totalStock = rows.reduce((sum, s) => sum + (s.quantity ?? 0), 0);
    const outOfStock = rows.filter((s) => s.quantity === 0).length;
    const lowStock = rows.filter((s) => s.quantity > 0 && s.quantity <= 5).length;

    return { totalStock, outOfStock, lowStock };
  }
}
