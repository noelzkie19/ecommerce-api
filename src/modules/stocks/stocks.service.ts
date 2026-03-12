import * as stockRepository from "./stocks.repository";
import { UpdateStockDTO } from "./stocks.type";

export const getAllStock = (
  search?: string,
  page: number = 1,
  limit: number = 10,
) => stockRepository.findAll({ search }, page, limit);

export const getStockStats = () => stockRepository.getStats();

export const updateStock = (productId: string, dto: UpdateStockDTO) =>
  stockRepository.upsert(productId, dto);

export const getStockByProductId = (productId: string) =>
  stockRepository.findByProductId(productId);
