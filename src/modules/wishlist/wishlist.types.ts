export interface WishlistItem {
  id: string
  userId: string
  productId: string
  createdAt: string
}

export interface WishlistItemWithProduct extends WishlistItem {
  product: {
    id: string
    name: string
    price: number
    imageUrl: string | null
    badge: string | null
  }
}

export interface AddToWishlistDTO {
  productId: string
}