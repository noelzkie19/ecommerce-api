import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import { AppError } from "../../common/utils/AppError";
import { resolve, TOKENS } from "../../di/container";
import { IAuthRepository } from "../../domain/interfaces/IAuthRepository";

/**
 * Get auth repository instance
 */
function getAuthRepository(): IAuthRepository {
  return resolve<IAuthRepository>(TOKENS.IAuthRepository);
}

export const getProfile = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const authRepo = getAuthRepository();
    const profile = await authRepo.findById(req.user.id);
    sendSuccess(res, profile);
  },
);

export const updateProfile = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const { fullName, avatarUrl } = req.body;
    const authRepo = getAuthRepository();
    const profile = await authRepo.updateProfile(req.user.id, {
      fullName,
      avatarUrl,
    });
    sendSuccess(res, profile, "Profile updated");
  },
);
