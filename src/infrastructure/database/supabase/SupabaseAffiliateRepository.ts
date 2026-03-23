/**
 * Supabase Affiliate Repository
 *
 * Implements IAffiliateRepository using Supabase as the data store.
 * This is part of the infrastructure layer.
 */

import { supabaseAdmin } from "../../../config/supabase";
import { AppError } from "../../../common/utils/AppError";
import {
  IAffiliateRepository,
  PaginatedResult,
  AffiliateProduct,
  AffiliateSettings,
} from "../../../domain/interfaces/IAffiliateRepository";
import {
  Affiliate,
  AffiliateStatus,
  CreateAffiliateProps,
} from "../../../domain/entities/Affiliate";

const db = supabaseAdmin as any;

/**
 * Supabase implementation of IAffiliateRepository
 */
export class SupabaseAffiliateRepository implements IAffiliateRepository {
  /**
   * Find all affiliates with pagination
   */
  async findAllPaginated(
    page: number,
    limit: number,
    search?: string,
    status?: AffiliateStatus,
  ): Promise<PaginatedResult<Affiliate>> {
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

    const affiliates = (data ?? []).map((row: any) =>
      Affiliate.fromDatabase(row),
    );

    return {
      data: affiliates,
      meta: {
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  /**
   * Find affiliate by ID
   */
  async findById(id: string): Promise<Affiliate | null> {
    const { data, error } = await db
      .from("affiliates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return Affiliate.fromDatabase(data);
  }

  /**
   * Find affiliate by user ID
   */
  async findByUserId(userId: string): Promise<Affiliate | null> {
    const { data, error } = await db
      .from("affiliates")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) return null;
    return Affiliate.fromDatabase(data);
  }

  /**
   * Find affiliate by email
   */
  async findByEmail(email: string): Promise<Affiliate | null> {
    const { data, error } = await db
      .from("affiliates")
      .select("*")
      .eq("email", email)
      .single();

    if (error) return null;
    return Affiliate.fromDatabase(data);
  }

  /**
   * Find affiliate by affiliate link
   */
  async findByAffiliateLink(link: string): Promise<Affiliate | null> {
    const { data, error } = await db
      .from("affiliates")
      .select("id, name, email, status, pixel_id, store_id, affiliate_link")
      .ilike("affiliate_link", link)
      .single();

    if (error) return null;
    return Affiliate.fromDatabase(data);
  }

  /**
   * Find affiliate by store ID
   */
  async findByStoreId(storeId: string): Promise<Affiliate | null> {
    const { data, error } = await db
      .from("affiliates")
      .select("id, name, email, status, pixel_id, store_id")
      .ilike("store_id", storeId)
      .single();

    if (error) return null;
    return Affiliate.fromDatabase(data);
  }

  /**
   * Create a new affiliate
   */
  async create(props: CreateAffiliateProps): Promise<Affiliate> {
    const storeId =
      props.storeId ??
      `store_${Math.random().toString(36).substring(2, 10).toLowerCase()}`;

    const { data, error } = await db
      .from("affiliates")
      .insert({
        user_id: props.userId,
        name: props.name,
        email: props.email,
        status: props.status ?? "pending",
        payment_status: props.paymentStatus ?? "unpaid",
        affiliate_link: props.affiliateLink,
        store_id: storeId,
        pixel_id: props.pixelId,
        referred_by: props.referredBy,
        total_sales: props.totalSales ?? 0,
        total_commissions: props.totalCommissions ?? 0,
        affiliate_commission: props.affiliateCommission ?? 0,
      })
      .select("*")
      .single();

    if (error) throw new AppError(error.message, 500);
    return Affiliate.fromDatabase(data);
  }

  /**
   * Create an affiliate record directly from auth user data
   * Used for auto-creating missing affiliate records for existing users
   */
  async createForAuthUser(
    userId: string,
    email: string,
    name: string,
    referredBy?: string,
  ): Promise<Affiliate> {
    const storeId = `store_${Math.random().toString(36).substring(2, 10).toLowerCase()}`;

    const { data, error } = await db
      .from("affiliates")
      .insert({
        user_id: userId,
        name,
        email,
        status: "pending",
        payment_status: "unpaid",
        store_id: storeId,
        referred_by: referredBy ?? null,
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        // Already exists — fetch and return it
        const existing = await this.findByUserId(userId);
        if (existing) return existing;
      }
      throw new AppError(error.message, 500);
    }

    return Affiliate.fromDatabase(data);
  }

  /**
   * Update an affiliate
   */
  async update(
    id: string,
    data: Partial<CreateAffiliateProps>,
  ): Promise<Affiliate> {
    const payload = Object.fromEntries(
      Object.entries({
        name: data.name,
        email: data.email,
        status: data.status,
        payment_status: data.paymentStatus,
        pixel_id: data.pixelId,
        store_id: data.storeId,
        affiliate_link: data.affiliateLink,
        referred_by: data.referredBy,
        total_sales: data.totalSales,
        total_commissions: data.totalCommissions,
        affiliate_commission: data.affiliateCommission,
      }).filter(([, v]) => v !== undefined),
    );

    const { data: updated, error } = await db
      .from("affiliates")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new AppError("Affiliate not found", 404);
    return Affiliate.fromDatabase(updated);
  }

  /**
   * Delete an affiliate
   */
  async delete(id: string): Promise<void> {
    const { error } = await db.from("affiliates").delete().eq("id", id);
    if (error) throw new AppError("Affiliate not found", 404);
  }

  /**
   * Activate affiliate by user ID
   */
  async activateByUserId(userId: string): Promise<void> {
    const { error } = await db
      .from("affiliates")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("status", "pending");

    if (error) {
      // Silent fail - affiliate may not exist or already active
    }
  }

  /**
   * Mark affiliate as paid by user ID
   */
  async markAsPaidByUserId(userId: string): Promise<void> {
    const { error } = await db
      .from("affiliates")
      .update({ payment_status: "paid", updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) {
      // Silent fail
    }
  }

  /**
   * Generate and set affiliate link
   */
  async generateAndSetAffiliateLink(userId: string): Promise<string | null> {
    const { data: affiliate, error: fetchError } = await db
      .from("affiliates")
      .select("email, affiliate_link")
      .eq("user_id", userId)
      .single();

    if (fetchError || !affiliate) {
      return null;
    }

    // If already has link, return it
    if (affiliate.affiliate_link) {
      return affiliate.affiliate_link;
    }

    // Generate new link from email prefix + random chars
    const emailPrefix = (affiliate.email?.split("@")[0] || "aff")
      .substring(0, 3)
      .toLowerCase();
    const randomChars = Math.random()
      .toString(36)
      .substring(2, 8)
      .toLowerCase();
    const newLink = `${emailPrefix}${randomChars}`;

    const { error: updateError } = await db
      .from("affiliates")
      .update({ affiliate_link: newLink, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (updateError) {
      return null;
    }

    return newLink;
  }

  /**
   * Update pixel ID by user ID
   */
  async updatePixelByUserId(
    userId: string,
    pixelId: string,
  ): Promise<Affiliate> {
    const { data, error } = await db
      .from("affiliates")
      .update({ pixel_id: pixelId, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw new AppError("Affiliate not found", 404);
    return Affiliate.fromDatabase(data);
  }

  /**
   * Update referred by
   */
  async updateReferredBy(
    affiliateId: string,
    referrerId: string,
  ): Promise<void> {
    const { error } = await db
      .from("affiliates")
      .update({ referred_by: referrerId, updated_at: new Date().toISOString() })
      .eq("id", affiliateId);

    if (error) {
      throw new AppError("Failed to update referrer", 500);
    }
  }

  /**
   * Update affiliate totals (sales and commissions)
   */
  async updateTotals(
    affiliateId: string,
    saleAmount: number,
    commissionEarned: number,
  ): Promise<void> {
    const { data: affiliate, error: fetchError } = await db
      .from("affiliates")
      .select("total_sales, total_commissions")
      .eq("id", affiliateId)
      .single();

    if (fetchError) throw new AppError("Affiliate not found", 404);

    const newTotalSales = (affiliate.total_sales ?? 0) + saleAmount;
    const newTotalCommissions =
      (affiliate.total_commissions ?? 0) + commissionEarned;

    const { error: updateError } = await db
      .from("affiliates")
      .update({
        total_sales: newTotalSales,
        total_commissions: newTotalCommissions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", affiliateId);

    if (updateError)
      throw new AppError("Failed to update affiliate totals", 500);
  }

  /**
   * Find products by affiliate
   */
  async findProductsByAffiliate(
    affiliateId: string,
  ): Promise<AffiliateProduct[]> {
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

    return (data ?? []).map((row: any) => ({
      id: row.id,
      affiliateId: row.affiliate_id,
      productId: row.product_id,
      commissionType: row.commission_type,
      commissionValue: row.commission_value,
      product: row.product
        ? {
            id: row.product.id,
            name: row.product.name,
            price: row.product.price,
            imageUrl: row.product.image_url,
          }
        : undefined,
    }));
  }

  /**
   * Assign product to affiliate
   */
  async assignProduct(
    affiliateId: string,
    productId: string,
    commissionType: "percentage" | "fixed",
    commissionValue: number,
  ): Promise<AffiliateProduct> {
    const { data, error } = await db
      .from("affiliate_products")
      .upsert(
        {
          affiliate_id: affiliateId,
          product_id: productId,
          commission_type: commissionType,
          commission_value: commissionValue,
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

    return {
      id: data.id,
      affiliateId: data.affiliate_id,
      productId: data.product_id,
      commissionType: data.commission_type,
      commissionValue: data.commission_value,
      product: data.product
        ? {
            id: data.product.id,
            name: data.product.name,
            price: data.product.price,
            imageUrl: data.product.image_url,
          }
        : undefined,
    };
  }

  /**
   * Remove product from affiliate
   */
  async removeProduct(affiliateId: string, productId: string): Promise<void> {
    const { error } = await db
      .from("affiliate_products")
      .delete()
      .eq("affiliate_id", affiliateId)
      .eq("product_id", productId);

    if (error) throw new AppError("Assignment not found", 404);
  }

  /**
   * Get affiliate settings
   */
  async getSettings(): Promise<AffiliateSettings> {
    const { data, error } = await db.from("affiliate_settings").select("*");

    if (error) throw new AppError("Failed to fetch settings", 500);

    const settings: Record<string, string> = {};
    data?.forEach((row: any) => {
      settings[row.key] = row.value;
    });

    return {
      registrationFee: Number.parseFloat(settings.registration_fee ?? "999"),
      referralCommissionRate: Number.parseFloat(
        settings.referral_commission_rate ?? "20",
      ),
      referralCommissionType:
        (settings.referral_commission_type as "percentage" | "fixed") ??
        "percentage",
    };
  }

  /**
   * Update affiliate settings
   */
  async updateSettings(
    settings: Partial<AffiliateSettings>,
  ): Promise<AffiliateSettings> {
    const updates: Record<string, string> = {};

    if (settings.registrationFee !== undefined) {
      updates.registration_fee = settings.registrationFee.toString();
    }
    if (settings.referralCommissionRate !== undefined) {
      updates.referral_commission_rate =
        settings.referralCommissionRate.toString();
    }
    if (settings.referralCommissionType !== undefined) {
      updates.referral_commission_type = settings.referralCommissionType;
    }

    for (const [key, value] of Object.entries(updates)) {
      const { error } = await db
        .from("affiliate_settings")
        .upsert(
          { key, value, updated_at: new Date().toISOString() },
          { onConflict: "key" },
        );

      if (error) {
        continue;
      }
    }

    return this.getSettings();
  }
}

// Export singleton instance
export const affiliateRepository = new SupabaseAffiliateRepository();
