/**
 * Supabase Cart Repository
 *
 * Implements ICartRepository using Supabase as the data store.
 * This is part of the infrastructure layer.
 */

import { supabaseAdmin } from "../../../config/supabase";
import { AppError } from "../../../common/utils/AppError";
import {
  ICartRepository,
  CartOwner,
  AddToCartDTO,
  CartItem,
} from "../../../domain/interfaces/ICartRepository";

/**
 * Helper to apply owner filter to query
 */
function ownerFilter(query: any, owner: CartOwner): any {
  if (owner.userId) return query.eq("user_id", owner.userId);
  if (owner.guestId) return query.eq("guest_id", owner.guestId);
  throw new AppError("No cart owner provided", 400);
}

/**
 * Supabase implementation of ICartRepository
 */
export class SupabaseCartRepository implements ICartRepository {
  /**
   * Find all cart items by owner
   */
  async findAllByOwner(owner: CartOwner): Promise<CartItem[]> {
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

    return (data ?? []).map((item: any) => ({
      ...item,
      product: item.product
        ? {
            ...item.product,
            imageUrl: item.product.image_url,
            images: item.product.images,
          }
        : undefined,
    }));
  }

  /**
   * Find a cart item by owner and product
   */
  async findItem(
    owner: CartOwner,
    productId: string,
  ): Promise<CartItem | null> {
    let query = supabaseAdmin
      .from("cart_items")
      .select("*")
      .eq("product_id", productId)
      .maybeSingle();

    query = ownerFilter(query, owner);

    const { data, error } = await query;
    if (error) throw new AppError(error.message, 500);
    return data;
  }

  /**
   * Add or update cart item
   */
  async upsert(owner: CartOwner, dto: AddToCartDTO): Promise<CartItem> {
    const existing = await this.findItem(owner, dto.productId);

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
  }

  /**
   * Update cart item quantity
   */
  async updateQuantity(
    id: string,
    owner: CartOwner,
    quantity: number,
  ): Promise<CartItem> {
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
  }

  /**
   * Remove cart item
   */
  async remove(id: string, owner: CartOwner): Promise<void> {
    let query = supabaseAdmin.from("cart_items").delete().eq("id", id);
    query = ownerFilter(query, owner);

    const { error } = await query;
    if (error) throw new AppError("Cart item not found", 404);
  }

  /**
   * Clear all cart items for owner
   */
  async clearCart(owner: CartOwner): Promise<void> {
    let query = supabaseAdmin.from("cart_items").delete();
    query = ownerFilter(query, owner);

    const { error } = await query;
    if (error) throw new AppError(error.message, 500);
  }

  /**
   * Merge guest cart to user cart
   */
  async mergeGuestCart(guestId: string, userId: string): Promise<void> {
    const guestItems = await this.findAllByOwner({ guestId });

    for (const item of guestItems) {
      await this.upsert(
        { userId },
        { productId: item.productId, quantity: item.quantity },
      );
    }

    await this.clearCart({ guestId });
  }
}
