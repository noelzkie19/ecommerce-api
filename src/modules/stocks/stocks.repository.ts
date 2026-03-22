import { supabaseAdmin } from "../../config/supabase";
import { AppError } from "../../common/utils/AppError";

interface UpdateStockDTO {
  quantity: number;
}

export const findAll = async (
  filters: { search?: string } = {},
  page: number = 1,
  limit: number = 10,
) => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from("stocks")
    .select(
      `
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
    `,
      { count: "exact" },
    )
    .range(from, to)
    .order("updated_at", { ascending: false });

  if (filters.search) {
    query = query.ilike("products.name", `%${filters.search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new AppError(error.message, 500);

  return {
    data,
    meta: {
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  };
};

export const findByProductId = async (productId: string) => {
  const { data, error } = await supabaseAdmin
    .from("stocks")
    .select("*")
    .eq("product_id", productId)
    .single();

  if (error) throw new AppError("Stock entry not found", 404);
  return data;
};

export const upsert = async (productId: string, dto: UpdateStockDTO) => {
  const { data, error } = await supabaseAdmin
    .from("stocks")
    .upsert(
      {
        product_id: productId,
        quantity: dto.quantity,
        updated_at: new Date().toISOString(),
      } as any,
      { onConflict: "product_id" },
    )
    .select()
    .single();

  if (error) throw new AppError(error.message, 500);
  return data;
};

export const getStats = async () => {
  const { data, error } = await supabaseAdmin.from("stocks").select("quantity");

  if (error) throw new AppError(error.message, 500);

  const rows = data as { quantity: number }[];
  const totalStock = rows.reduce((sum, s) => sum + (s.quantity ?? 0), 0);
  const outOfStock = rows.filter((s) => s.quantity === 0).length;
  const lowStock = rows.filter((s) => s.quantity > 0 && s.quantity <= 5).length;

  return { totalStock, outOfStock, lowStock };
};
