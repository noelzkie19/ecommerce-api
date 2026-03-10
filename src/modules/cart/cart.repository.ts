import { supabaseAdmin } from "../../config/supabase";
import { AppError } from "../../common/utils/AppError";
import { AddToCartDTO, CartOwner } from "./cart.types";

const ownerFilter = (query: any, owner: CartOwner) => {
  if (owner.userId) return query.eq("user_id", owner.userId);
  if (owner.guestId) return query.eq("guest_id", owner.guestId);
  throw new AppError("No cart owner provided", 400);
};

export const findAllByOwner = async (owner: CartOwner) => {
  let query = supabaseAdmin
    .from("cart_items")
    .select(
      `
      *,
      product:products (
        id,
        name,
        price,
        image_url,
        images:product_images (
          id,
          url,
          position
        )
      )
    `,
    )
    .order("created_at", { ascending: false });

  query = ownerFilter(query, owner);

  const { data, error } = await query;
  if (error) throw new AppError(error.message, 500);
  return data;
};

export const findItem = async (owner: CartOwner, productId: string) => {
  let query = supabaseAdmin
    .from("cart_items")
    .select("*")
    .eq("product_id", productId)
    .maybeSingle();

  query = ownerFilter(query, owner);

  const { data, error } = await query;
  if (error) throw new AppError(error.message, 500);
  return data;
};

export const upsert = async (owner: CartOwner, dto: AddToCartDTO) => {
  const existing = (await findItem(owner, dto.productId)) as {
    id: string;
    quantity: number;
  } | null;

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from("cart_items")
      .update({ quantity: existing.quantity + dto.quantity })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw new AppError(error.message, 500);
    return data;
  }

  const { data, error } = await supabaseAdmin
    .from("cart_items")
    .insert({
      user_id: owner.userId ?? null,
      guest_id: owner.guestId ?? null,
      product_id: dto.productId,
      quantity: dto.quantity,
    } as any)
    .select()
    .single();
  if (error) throw new AppError(error.message, 500);
  return data;
};

export const updateQuantity = async (
  id: string,
  owner: CartOwner,
  quantity: number,
) => {
  let query = supabaseAdmin
    .from("cart_items")
    .update({ quantity })
    .eq("id", id)
    .select()
    .single();

  query = ownerFilter(query, owner);

  const { data, error } = await query;
  if (error) throw new AppError("Cart item not found", 404);
  return data;
};

export const remove = async (id: string, owner: CartOwner) => {
  let query = supabaseAdmin.from("cart_items").delete().eq("id", id);
  query = ownerFilter(query, owner);

  const { error } = await query;
  if (error) throw new AppError("Cart item not found", 404);
};

export const clearCart = async (owner: CartOwner) => {
  let query = supabaseAdmin.from("cart_items").delete();
  query = ownerFilter(query, owner);

  const { error } = await query;
  if (error) throw new AppError(error.message, 500);
};

export const mergeGuestCart = async (guestId: string, userId: string) => {
  const guestItems = (await findAllByOwner({ guestId })) as {
    product_id: string;
    quantity: number;
  }[];

  for (const item of guestItems) {
    await upsert(
      { userId },
      { productId: item.product_id, quantity: item.quantity },
    );
  }

  await clearCart({ guestId });
};
