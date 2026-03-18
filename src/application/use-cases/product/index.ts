/**
 * Product Use Cases Index
 */

export {
  ListProductsUseCase,
  type ListProductsInput,
  type ListProductsOutput,
} from "./ListProducts";

export {
  GetProductUseCase,
  type GetProductInput,
  type GetProductOutput,
} from "./GetProduct";

export {
  CreateProductUseCase,
  type CreateProductInput,
  type CreateProductOutput,
} from "./CreateProduct";

export {
  UpdateProductUseCase,
  type UpdateProductInput,
  type UpdateProductOutput,
} from "./UpdateProduct";

export { DeleteProductUseCase, type DeleteProductInput } from "./DeleteProduct";

export {
  ManageProductImagesUseCase,
  type AddProductImagesInput,
  type RemoveProductImageInput,
  type ReplaceProductImagesInput,
  type ReorderProductImagesInput,
  type ProductImageOutput,
} from "./ManageProductImages";
