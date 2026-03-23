/**
 * Supabase Wishlist Repository
 *
 * Implements IWishlistRepository using Supabase as the data store.
 * This is part of the infrastructure layer.
 */

import { supabase } from "../../../config/supabase";
import { AppError } from "../../../common/utils/AppError";
import { IWishlistRepository } from "../../../domain/interfaces/IWishlistRepository";

/**
 * Supabase implementation of IWishlistRepository
 */
export class SupabaseWishlistRepository implements IWishlistRepository {
  /**
   * Find all wishlist items by user ID
   */
  async findAllByUser(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("wishlist_items")
      .select("*, product:products(id, name, price, image_url, badge)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new AppError(error.message, 500);
    return data;
  }

  /**
   * Find a wishlist item by user and product
   */
  async findItem(userId: string, productId: string): Promise<any> {
    const { data } = await supabase
      .from("wishlist_items")
      .select("*")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .single();
    return data;
  }

  /**
   * Add item to wishlist
   */
  async add(userId: string, productId: string): Promise<any> {
    const existing = await this.findItem(userId, productId);
    if (existing) throw new AppError("Product already in wishlist", 409);

    const { data, error } = await supabase
      .from("wishlist_items")
      .insert({ user_id: userId, product_id: productId })
      .select()
      .single();

    if (error) throw new AppError(error.message, 500);
    return data;
  }

  /**
   * Remove item from wishlist
   */
  async remove(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw new AppError("Wishlist item not found", 404);
  }
}
