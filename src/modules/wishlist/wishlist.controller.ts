import { Request, Response } from 'express'
import { catchAsync } from '../../common/utils/catchAsync'
import { sendSuccess } from '../../common/utils/response'
import { AppError } from '../../common/utils/AppError'
import * as wishlistService from './wishlist.service'

export const getWishlist = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401)
  const items = await wishlistService.getWishlist(req.user.id)
  sendSuccess(res, items)
})

export const addToWishlist = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401)
  const { productId } = req.body as { productId: string }
  if (!productId) throw new AppError('productId is required', 400)
  const item = await wishlistService.addToWishlist(req.user.id, { productId })
  sendSuccess(res, item, 'Added to wishlist', 201)
})

export const removeFromWishlist = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401)
  const id = String(req.params.id)
  await wishlistService.removeFromWishlist(id, req.user.id)
  sendSuccess(res, null, 'Removed from wishlist')
})