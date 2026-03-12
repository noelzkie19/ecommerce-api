export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  position: number;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
  badge: string | null;
  rating: number | null;
  reviewCount: number | null;
  originalPrice: number | null;
  affiliateLink: string | null;
  createdAt: string;
  images: ProductImage[];
}

export interface ProductFilters {
  category?: string;
  search?: string;
}

export interface CreateProductDto {
  name: string;
  description?: string | null;
  price: number;
  category: string;
  image_url?: string | null;
  badge?: string | null;
  rating?: number | null;
  review_count?: number | null;
  original_price?: number | null;
  affiliate_link?: string | null;
}

export interface UpdateProductDto {
  name?: string;
  description?: string | null;
  price?: number;
  category?: string;
  image_url?: string | null;
  badge?: string | null;
  rating?: number | null;
  review_count?: number | null;
  original_price?: number | null;
  affiliate_link?: string | null;
}

export interface AddProductImagesDto {
  product_id: string;
  urls: string[];
}

export interface ReorderProductImagesDto {
  images: { id: string; position: number }[];
}
