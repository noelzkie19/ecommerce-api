import { Request, Response, NextFunction } from "express";
import { supabase } from "../../config/supabase";
import { AppError } from "../../common/utils/AppError";
import { catchAsync } from "../../common/utils/catchAsync";
import { ROLES } from "../../common/constants/roles";

export const requireAuth = catchAsync(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError("No token provided", 401);
    }

    const token = authHeader.split("Bearer ")[1];
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) throw new AppError("Invalid or expired token", 401);

    req.user = user;
    next();
  },
);

/**
 * Like requireAuth, but never blocks the request.
 * Attaches req.user if a valid Bearer token is present, otherwise continues as guest.
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      if (user) req.user = user;
    }
  } catch {
    // Silently ignore auth errors — guest access continues
  }
  next();
};

export const requireAdmin = catchAsync(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const userRole = (req.user.app_metadata as { role?: string })?.role 
      ?? (req.user.user_metadata as { role?: string })?.role;

    if (userRole !== ROLES.ADMIN) {
      throw new AppError("Admin access required", 403);
    }

    next();
  },
);
