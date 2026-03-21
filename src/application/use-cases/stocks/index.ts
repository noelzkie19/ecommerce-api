/**
 * Stock Use Cases Index
 */

export {
  GetAllStockUseCase,
  type GetAllStockInput,
  type GetAllStockOutput,
} from "./GetAllStock";

export {
  GetStockByProductIdUseCase,
  type GetStockByProductIdInput,
  type GetStockByProductIdOutput,
} from "./GetStockByProductId";

export {
  GetStockStatsUseCase,
  type GetStockStatsOutput,
} from "./GetStockStats";

export {
  UpdateStockUseCase,
  type UpdateStockInput,
  type UpdateStockOutput,
} from "./UpdateStock";
