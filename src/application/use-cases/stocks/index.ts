/**
 * Stocks Use Cases Index
 *
 * Exports all stock-related use cases.
 */

export {
  GetAllStockUseCase,
  type GetAllStockInput,
  type GetAllStockOutput,
} from "./GetAllStock";
export {
  UpdateStockUseCase,
  type UpdateStockInput,
  type UpdateStockOutput,
} from "./UpdateStock";
export {
  GetStockByProductIdUseCase,
  type GetStockByProductIdInput,
  type GetStockByProductIdOutput,
} from "./GetStockByProductId";
export {
  GetStockAvailabilityUseCase,
  type GetStockAvailabilityInput,
  type GetStockAvailabilityOutput,
} from "./GetStockAvailability";
