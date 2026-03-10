import * as productsRepository from "./products.repository";
import {
  ProductFilters,
  CreateProductDto,
  UpdateProductDto,
} from "./products.types";

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const getProducts = (filters: ProductFilters) =>
  productsRepository.findAll(filters);

export const getProductsPaginated = (
  filters: ProductFilters,
  page: number,
  limit: number,
) => productsRepository.findAllPaginated(filters, page, limit);

export const getProductById = (id: string) => productsRepository.findById(id);

export const createProduct = (dto: CreateProductDto) =>
  productsRepository.create(dto);

export const updateProduct = (id: string, dto: UpdateProductDto) =>
  productsRepository.update(id, dto);

export const deleteProduct = (id: string) => productsRepository.remove(id);

// ---------------------------------------------------------------------------
// Product images
// ---------------------------------------------------------------------------

/**
 * Append one or more image URLs to a product.
 * New images are positioned after the last existing image.
 */
export const addProductImages = async (productId: string, urls: string[]) => {
  // Ensure the product exists first
  await productsRepository.findById(productId);

  const maxPos = await productsRepository.getMaxImagePosition(productId);
  return productsRepository.addImages(productId, urls, maxPos + 1);
};

/** Delete a single image by its own id */
export const deleteProductImage = (imageId: string) =>
  productsRepository.removeImage(imageId);

/** Replace all images for a product with a new ordered list of URLs */
export const replaceProductImages = async (
  productId: string,
  urls: string[],
) => {
  await productsRepository.findById(productId);
  await productsRepository.removeAllImages(productId);
  if (urls.length === 0) return [];
  return productsRepository.addImages(productId, urls, 0);
};

/**
 * Re-order images by supplying an array of { id, position } pairs.
 * Caller is responsible for providing contiguous, non-duplicate positions.
 */
export const reorderProductImages = (
  images: { id: string; position: number }[],
) => productsRepository.reorderImages(images);
