/**
 * Supabase Affiliate Sales Repository
 *
 * Implements IAffiliateSalesRepository using Supabase as the data store.
 * This is part of the infrastructure layer.
 */

import { supabaseAdmin } from "../../../config/supabase";
import { AppError } from "../../../common/utils/AppError";
import {
  IAffiliateSalesRepository,
  AffiliateSaleStatus,
  AffiliateSale,
  PaginatedAffiliateSales,
} from "../../../domain/interfaces/IAffiliateSalesRepository";

const db = supabaseAdmin as any;

const selectFields = `
  *,
  affiliates!affiliate_id ( id, name, email ),
  products!product_id ( id, name, price, image_url ),
  orders!order_id ( id, status, created_at )
`;

/**
 * Helper to rename embedded fields
 */
function transformAffiliateSale(data: any): AffiliateSale {
  return {
    ...data,
    affiliate: data.affiliates,
    product: data.products,
    order: data.orders,
    affiliates: undefined,
    products: undefined,
    orders: undefined,
  };
}

/**
 * Supabase implementation of IAffiliateSalesRepository
 */
export class SupabaseAffiliateSalesRepository implements IAffiliateSalesRepository {
  /**
   * Find all affiliate sales with pagination
   */
  async findAllPaginated(
    page: number,
    limit: number,
    affiliateId?: string,
    status?: AffiliateSaleStatus,
    search?: string,
  ): Promise<PaginatedAffiliateSales> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let countQ = db
      .from("affiliate_sales")
      .select("id", { count: "exact", head: true });

    if (affiliateId) countQ = countQ.eq("affiliate_id", affiliateId);
    if (status) countQ = countQ.eq("status", status);

    const { count, error: countError } = await countQ;
    if (countError) throw new AppError(countError.message, 500);

    let dataQ = db
      .from("affiliate_sales")
      .select(selectFields)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (affiliateId) dataQ = dataQ.eq("affiliate_id", affiliateId);
    if (status) dataQ = dataQ.eq("status", status);

    const { data, error } = await dataQ;
    if (error) throw new AppError(error.message, 500);

    // client-side search on affiliate name / product name
    const filtered = search
      ? (data ?? []).filter(
          (s: any) =>
            s.affiliates?.name?.toLowerCase().includes(search.toLowerCase()) ||
            s.products?.name?.toLowerCase().includes(search.toLowerCase()),
        )
      : (data ?? []);

    return {
      data: filtered.map(transformAffiliateSale),
      meta: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  /**
   * Find affiliate sale by ID
   */
  async findById(id: string): Promise<AffiliateSale | null> {
    const { data, error } = await db
      .from("affiliate_sales")
      .select(selectFields)
      .eq("id", id)
      .single();

    if (error) return null;
    return transformAffiliateSale(data);
  }

  /**
   * Update affiliate sale status
   */
  async updateStatus(
    id: string,
    status: AffiliateSaleStatus,
  ): Promise<AffiliateSale> {
    const { data, error } = await db
      .from("affiliate_sales")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(selectFields)
      .single();

    if (error) throw new AppError("Affiliate sale not found", 404);
    return transformAffiliateSale(data);
  }

  /**
   * Delete affiliate sale
   */
  async delete(id: string): Promise<void> {
    const { error } = await db.from("affiliate_sales").delete().eq("id", id);
    if (error) throw new AppError("Affiliate sale not found", 404);
  }

  /**
   * Record sales for a confirmed/delivered order
   */
  async recordSalesForOrder(orderId: string): Promise<void> {
    const { data: items, error: itemsError } = await db
      .from("order_items")
      .select("id, product_id, quantity, unit_price")
      .eq("order_id", orderId);

    if (itemsError) throw new AppError(itemsError.message, 500);
    if (!items?.length) return;

    const productIds = items.map((i: any) => i.product_id);

    const { data: apRows, error: apError } = await db
      .from("affiliate_products")
      .select("affiliate_id, product_id, commission_type, commission_value")
      .in("product_id", productIds);

    if (apError) throw new AppError(apError.message, 500);
    if (!apRows?.length) return;

    const apMap = new Map<string, any>();
    for (const ap of apRows) apMap.set(ap.product_id, ap);

    const salesRows = items
      .filter((item: any) => apMap.has(item.product_id))
      .map((item: any) => {
        const ap = apMap.get(item.product_id);
        const lineTotal = item.unit_price * item.quantity;
        const commissionEarned =
          ap.commission_type === "percentage"
            ? (lineTotal * ap.commission_value) / 100
            : ap.commission_value * item.quantity;

        return {
          affiliate_id: ap.affiliate_id,
          order_id: orderId,
          order_item_id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          sale_amount: lineTotal,
          commission_type: ap.commission_type,
          commission_value: ap.commission_value,
          commission_earned: commissionEarned,
          status: "pending",
        };
      });

    if (!salesRows.length) return;

    const { error: upsertError } = await db
      .from("affiliate_sales")
      .upsert(salesRows, { onConflict: "order_item_id" });

    if (upsertError) {
      if (upsertError.message?.includes("order_item_id")) {
        throw new AppError(
          "Database migration required. Run 20260321_add_referral_commission_columns.sql",
          500,
        );
      }
      throw new AppError(upsertError.message, 500);
    }
  }
}
