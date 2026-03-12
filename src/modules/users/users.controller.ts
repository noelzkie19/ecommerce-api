import { Request, Response } from 'express'
import { catchAsync } from '../../common/utils/catchAsync'
import { sendSuccess } from '../../common/utils/response'
import * as usersService from './users.service'
import { AppError } from '../../common/utils/AppError'

export const getProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401)
  const profile = await usersService.getProfile(req.user.id)
  sendSuccess(res, profile)
})

export const updateProfile = catchAsync(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401)
  const { fullName, avatarUrl } = req.body
  const profile = await usersService.updateProfile(req.user.id, { fullName, avatarUrl })
  sendSuccess(res, profile, 'Profile updated')
})