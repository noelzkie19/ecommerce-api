import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import { resolveOwner } from "../../common/resolvers/owner.resolver";
import {
  validateAddToCart,
  validateUpdateCartItem,
  validateCartItemIdParam,
} from "../../common/validators/cart.validator";
import {
  GetCartUseCase,
  AddToCartUseCase,
  UpdateCartItemUseCase,
  RemoveFromCartUseCase,
  ClearCartUseCase,
} from "../../application/use-cases/cart";

export const getCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });
    const useCase = new GetCartUseCase();
    const result = await useCase.execute({ owner });
    sendSuccess(res, result.items);
  },
);

export const addToCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });
    const dto = validateAddToCart(req.body);
    const useCase = new AddToCartUseCase();
    const item = await useCase.execute({
      owner,
      productId: dto.productId,
      quantity: dto.quantity,
    });
    sendSuccess(res, item, "Added to cart", 201);
  },
);

export const updateCartItem = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });
    const { id } = validateCartItemIdParam(req.params);
    const { quantity } = validateUpdateCartItem(req.body);
    const useCase = new UpdateCartItemUseCase();
    const item = await useCase.execute({ id, owner, quantity });
    sendSuccess(res, item, "Cart updated");
  },
);

export const removeFromCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });
    const { id } = validateCartItemIdParam(req.params);
    const useCase = new RemoveFromCartUseCase();
    await useCase.execute({ id, owner });
    sendSuccess(res, null, "Item removed from cart");
  },
);

export const clearCart = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const owner = resolveOwner(req, { required: true });
    const useCase = new ClearCartUseCase();
    await useCase.execute({ owner });
    sendSuccess(res, null, "Cart cleared");
  },
);
