import { supabase } from '../../config/supabase'
import { AppError } from '../../common/utils/AppError'

export const findAllByUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*, product:products(id, name, price, image_url, badge)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new AppError(error.message, 500)
  return data
}

export const findItem = async (userId: string, productId: string) => {
  const { data } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single()
  return data
}

export const add = async (userId: string, productId: string) => {
  const existing = await findItem(userId, productId)
  if (existing) throw new AppError('Product already in wishlist', 409)

  const { data, error } = await supabase
    .from('wishlist_items')
    .insert({ user_id: userId, product_id: productId })
    .select()
    .single()

  if (error) throw new AppError(error.message, 500)
  return data
}

export const remove = async (id: string, userId: string) => {
  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw new AppError('Wishlist item not found', 404)
}