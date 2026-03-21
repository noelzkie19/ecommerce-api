import { supabaseAdmin } from "../../config/supabase";
import { AppError } from "../../common/utils/AppError";
import {
  CreateAffiliateDTO,
  UpdateAffiliateDTO,
  AssignProductDTO,
  AffiliateStatus,
} from "../../application/use-cases/affiliate";

const db = supabaseAdmin as any;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function enrichAffiliates(rows: any[]): Promise<any[]> {
  if (!rows.length) return [];

  return Promise.all(
    rows.map(async (aff) => {
      const { count: productCount } = await db
        .from("affiliate_products")
        .select("id", { count: "exact", head: true })
        .eq("affiliate_id", aff.id);

      const totalSales = aff.total_sales ?? 0;
      const totalCommissions = aff.total_commissions ?? 0;
      const paymentStatus = aff.payment_status ?? "unpaid";

      return {
        ...aff,
        productCount: productCount ?? 0,
        totalSales,
        totalCommissions,
        paymentStatus,
        // camelCase aliases for snake_case fields
        referredBy: aff.referred_by ?? null,
        affiliateLink: aff.affiliate_link ?? null,
        storeId: aff.store_id ?? null,
        affiliateCommission: aff.affiliate_commission ?? 0,
        pixelId: aff.pixel_id ?? null,
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

/**
 * Look up the email in auth.users first.
 * - Pulls display_name (or email prefix as fallback) as the affiliate name.
 * - Stores the auth user's UUID as user_id so the records are linked.
 * - Throws 404 if the email is not registered in auth.users.
 * - Throws 409 if already an affiliate.
 */
export const create = async (dto: CreateAffiliateDTO) => {
  // 1. Find the user in auth.users via the admin API
  const { data: listData, error: listError } =
    await supabaseAdmin.auth.admin.listUsers();

  if (listError) throw new AppError("Failed to query auth users", 500);

  const authUser = listData.users.find(
    (u) => u.email?.toLowerCase() === dto.email.toLowerCase(),
  );

  if (!authUser) {
    throw new AppError(`No registered user found with email ${dto.email}`, 404);
  }

  // 2. Derive a display name
  const name: string =
    authUser.user_metadata?.full_name ??
    authUser.user_metadata?.name ??
    authUser.email!.split("@")[0];

  // 3. Generate store_id if not provided
  const storeId =
    dto.storeId ||
    "store_" + Math.random().toString(36).substring(2, 10).toLowerCase();

  // 4. Insert into affiliates table
  const { data, error } = await db
    .from("affiliates")
    .insert({
      user_id: authUser.id,
      name,
      email: authUser.email,
      status: dto.status || "pending",
      pixel_id: dto.pixelId,
      store_id: storeId,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505")
      throw new AppError("User is already registered as an affiliate", 409);
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
      payment_status: dto.paymentStatus,
      pixel_id: dto.pixelId,
      store_id: dto.storeId,
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

/**
 * Create an affiliate record directly from auth user data (no listUsers call).
 * Used for auto-creating missing affiliate records for existing users.
 *
 * FIX: Now accepts an optional referredBy param so referred_by can be set
 * immediately at creation time, rather than in a separate update call.
 */
export const createForAuthUser = async (
  userId: string,
  email: string,
  name: string,
  referredBy?: string, // ← NEW: optional referrer ID
) => {
  const storeId =
    "store_" + Math.random().toString(36).substring(2, 10).toLowerCase();

  const { data, error } = await db
    .from("affiliates")
    .insert({
      user_id: userId,
      name,
      email,
      status: "pending",
      payment_status: "unpaid",
      store_id: storeId,
      referred_by: referredBy ?? null, // ← FIX: persist on insert
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      // Already exists — fetch and return it
      return findByUserId(userId);
    }
    throw new AppError(error.message, 500);
  }

  return {
    ...data,
    paymentStatus: data.payment_status ?? "unpaid",
    affiliateLink: data.affiliate_link ?? null,
    referredBy: data.referred_by ?? null,
    affiliateCommission: data.affiliate_commission ?? 0,
  };
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

// ── Affiliate Totals ───────────────────────────────────────────────────────────

/**
 * Update affiliate's total sales and total commissions.
 * Called when an affiliate sale is approved.
 */
export const updateTotals = async (
  affiliateId: string,
  saleAmount: number,
  commissionEarned: number,
) => {
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

  if (updateError) throw new AppError("Failed to update affiliate totals", 500);
};

// ── Activate Affiliate by User ID ───────────────────────────────────────────────

export const activateByUserId = async (userId: string) => {
  const { error } = await db
    .from("affiliates")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "pending");

  if (error) {
    return;
  }
};

// ── Mark Affiliate as Paid ─────────────────────────────────────────────────

export const markAsPaidByUserId = async (userId: string) => {
  const { error } = await db
    .from("affiliates")
    .update({ payment_status: "paid", updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) {
    return;
  }
};

// ── Generate Affiliate Link ─────────────────────────────────────────────────

export const generateAndSetAffiliateLink = async (userId: string) => {
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
  const randomChars = Math.random().toString(36).substring(2, 8).toLowerCase();
  const newLink = `${emailPrefix}${randomChars}`;

  const { error: updateError } = await db
    .from("affiliates")
    .update({ affiliate_link: newLink, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (updateError) {
    return null;
  }

  return newLink;
};

// ── Find Affiliate by Store ID ─────────────────────────────────────────────

export const findByStoreId = async (storeId: string) => {
  const { data, error } = await db
    .from("affiliates")
    .select("id, name, email, status, pixel_id, store_id")
    .ilike("store_id", storeId)
    .single();

  if (error) return null;
  return data;
};

// ── Update Pixel ID by User ID ─────────────────────────────────────────────

export const updatePixelByUserId = async (userId: string, pixelId: string) => {
  const { data, error } = await db
    .from("affiliates")
    .update({ pixel_id: pixelId, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw new AppError("Affiliate not found", 404);

  return {
    ...data,
    paymentStatus: data.payment_status ?? "unpaid",
  };
};

// ── Find Affiliate by User ID ───────────────────────────────────────────────

export const findByUserId = async (userId: string) => {
  const { data, error } = await db
    .from("affiliates")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) return null;

  return {
    ...data,
    paymentStatus: data.payment_status ?? "unpaid",
    affiliateLink: data.affiliate_link ?? null,
    referredBy: data.referred_by ?? null,
    affiliateCommission: data.affiliate_commission ?? 0,
  };
};

// ── Affiliate Settings ───────────────────────────────────────────────────────────

export const getSettings = async () => {
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
};

export const updateSettings = async (
  registrationFee?: number,
  referralCommissionRate?: number,
  referralCommissionType?: "percentage" | "fixed",
) => {
  const updates: Record<string, string> = {};

  if (registrationFee !== undefined) {
    updates.registration_fee = registrationFee.toString();
  }
  if (referralCommissionRate !== undefined) {
    updates.referral_commission_rate = referralCommissionRate.toString();
  }
  if (referralCommissionType !== undefined) {
    updates.referral_commission_type = referralCommissionType;
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

  return getSettings();
};

// ── Find Affiliate by Affiliate Link ───────────────────────────────────────

export const findByAffiliateLink = async (link: string) => {
  const { data, error } = await db
    .from("affiliates")
    .select("id, name, email, status, pixel_id, store_id, affiliate_link")
    .ilike("affiliate_link", link)
    .single();

  if (error) return null;
  return data;
};

// ── Update Referred By ─────────────────────────────────────────────────────

export const updateReferredBy = async (
  affiliateId: string,
  referredById: string,
) => {
  const { error } = await db
    .from("affiliates")
    .update({ referred_by: referredById, updated_at: new Date().toISOString() })
    .eq("id", affiliateId);

  if (error) {
    return;
  }
};

// ── Activate Affiliate by User ID (for use from outside module) ────────────

export const activateAffiliateByUserId = async (userId: string) =>
  activateByUserId(userId);
