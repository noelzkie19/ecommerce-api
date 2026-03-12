import * as wishlistRepository from './wishlist.repository'
import { AddToWishlistDTO } from './wishlist.types'

export const getWishlist = (userId: string) =>
  wishlistRepository.findAllByUser(userId)

export const addToWishlist = (userId: string, dto: AddToWishlistDTO) =>
  wishlistRepository.add(userId, dto.productId)

export const removeFromWishlist = (id: string, userId: string) =>
  wishlistRepository.remove(id, userId)