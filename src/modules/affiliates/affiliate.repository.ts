import { supabaseAdmin } from "../../config/supabase";
import { AppError } from "../../common/utils/AppError";
import {
  CreateAffiliateDTO,
  UpdateAffiliateDTO,
  AssignProductDTO,
  AffiliateStatus,
} from "./affiliate.types";

const db = supabaseAdmin as any; // remove once supabase types are regenerated

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Enrich raw affiliate rows with aggregate stats:
 *   productCount   – number of assigned products
 *   totalSales     – sum of order_items.unit_price * quantity for confirmed orders
 *   totalCommissions – computed from affiliate commission rules
 */
async function enrichAffiliates(rows: any[]): Promise<any[]> {
  if (!rows.length) return [];

  return Promise.all(
    rows.map(async (aff) => {
      // Product count
      const { count: productCount } = await db
        .from("affiliate_products")
        .select("id", { count: "exact", head: true })
        .eq("affiliate_id", aff.id);

      // Sales & commissions via affiliate_products → order_items
      const { data: apRows } = await db
        .from("affiliate_products")
        .select(
          `
          commission_type,
          commission_value,
          product_id,
          order_items:order_items (
            quantity,
            unit_price,
            order:orders ( status )
          )
        `,
        )
        .eq("affiliate_id", aff.id);

      let totalSales = 0;
      let totalCommissions = 0;

      for (const ap of apRows ?? []) {
        for (const oi of ap.order_items ?? []) {
          if (
            oi.order?.status !== "delivered" &&
            oi.order?.status !== "confirmed"
          )
            continue;
          const lineTotal = oi.unit_price * oi.quantity;
          totalSales += lineTotal;
          totalCommissions +=
            ap.commission_type === "percentage"
              ? (lineTotal * ap.commission_value) / 100
              : ap.commission_value * oi.quantity;
        }
      }

      return {
        ...aff,
        productCount: productCount ?? 0,
        totalSales,
        totalCommissions,
      };
    }),
  );
}

// ── Affiliates CRUD ───────────────────────────────────────────────────────────

export const findAllPaginated = async (
  page: number = 1,
  limit: number = 20,
  search?: string,
  status?: AffiliateStatus,
) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let q = db
    .from("affiliates")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) q = q.ilike("name", `%${search}%`);
  if (status) q = q.eq("status", status);

  const { data, error, count } = await q;
  if (error) throw new AppError(error.message, 500);

  const enriched = await enrichAffiliates(data ?? []);

  return {
    data: enriched,
    meta: {
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  };
};

export const findById = async (id: string) => {
  const { data, error } = await db
    .from("affiliates")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new AppError("Affiliate not found", 404);
  const [enriched] = await enrichAffiliates([data]);
  return enriched;
};

export const create = async (dto: CreateAffiliateDTO) => {
  const { data, error } = await db
    .from("affiliates")
    .insert({ name: dto.name, email: dto.email, status: "active" })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505")
      throw new AppError("Email already registered as affiliate", 409);
    throw new AppError(error.message, 500);
  }

  const [enriched] = await enrichAffiliates([data]);
  return enriched;
};

export const update = async (id: string, dto: UpdateAffiliateDTO) => {
  const payload = Object.fromEntries(
    Object.entries({
      name: dto.name,
      email: dto.email,
      status: dto.status,
    }).filter(([, v]) => v !== undefined),
  );

  const { data, error } = await db
    .from("affiliates")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new AppError("Affiliate not found", 404);
  const [enriched] = await enrichAffiliates([data]);
  return enriched;
};

export const remove = async (id: string) => {
  const { error } = await db.from("affiliates").delete().eq("id", id);
  if (error) throw new AppError("Affiliate not found", 404);
};

// ── Affiliate Products ────────────────────────────────────────────────────────

export const findProductsByAffiliate = async (affiliateId: string) => {
  const { data, error } = await db
    .from("affiliate_products")
    .select(
      `
      *,
      product:products ( id, name, price, image_url )
    `,
    )
    .eq("affiliate_id", affiliateId)
    .order("created_at", { ascending: false });

  if (error) throw new AppError(error.message, 500);
  return data ?? [];
};

export const assignProduct = async (
  affiliateId: string,
  dto: AssignProductDTO,
) => {
  // upsert so re-assigning the same product just updates commission
  const { data, error } = await db
    .from("affiliate_products")
    .upsert(
      {
        affiliate_id: affiliateId,
        product_id: dto.productId,
        commission_type: dto.commissionType,
        commission_value: dto.commissionValue,
      },
      { onConflict: "affiliate_id,product_id" },
    )
    .select(
      `
      *,
      product:products ( id, name, price, image_url )
    `,
    )
    .single();

  if (error) throw new AppError(error.message, 500);
  return data;
};

export const removeProduct = async (affiliateId: string, productId: string) => {
  const { error } = await db
    .from("affiliate_products")
    .delete()
    .eq("affiliate_id", affiliateId)
    .eq("product_id", productId);

  if (error) throw new AppError("Assignment not found", 404);
};
