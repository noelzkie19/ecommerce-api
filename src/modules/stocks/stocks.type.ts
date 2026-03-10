export interface Stock {
  id: string;
  productId: string;
  quantity: number;
  updatedAt: string;
}

export interface UpdateStockDTO {
  quantity: number;
}

export interface StockWithProduct {
  id: string;
  productId: string;
  quantity: number;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    category: string;
    price: number;
    image_url: string | null;
  };
}
