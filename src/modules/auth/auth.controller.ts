/**
 * Auth Controller
 *
 * Handles HTTP requests for authentication endpoints.
 */

import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import { AppError } from "../../common/utils/AppError";

import {
  RegisterUserUseCase,
  LoginUserUseCase,
  LogoutUserUseCase,
  RefreshSessionUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
  GoogleLoginUseCase,
  AdminLogoutUseCase,
  ListUsersUseCase,
} from "../../application/use-cases/auth";

import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  GoogleLoginInput,
} from "./auth.validation";

/* ─────────────────────────────────────────────
   REGISTER
───────────────────────────────────────────── */
export const register = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const dto = req.body as RegisterInput;

    const useCase = new RegisterUserUseCase();
    const result = await useCase.execute(dto);

    sendSuccess(res, result, "Account created successfully", 201);
  },
);

/* ─────────────────────────────────────────────
   LOGIN
───────────────────────────────────────────── */
export const login = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const dto = req.body as LoginInput;

    const useCase = new LoginUserUseCase();
    const result = await useCase.execute(dto);

    sendSuccess(res, result, "Login successful");
  },
);

/* ─────────────────────────────────────────────
   REFRESH
───────────────────────────────────────────── */
export const refresh = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body as { refreshToken: string };
    if (!refreshToken) {
      throw new AppError("Refresh token is required", 400);
    }

    const useCase = new RefreshSessionUseCase();
    const result = await useCase.execute({ refreshToken });

    sendSuccess(res, result, "Token refreshed");
  },
);

/* ─────────────────────────────────────────────
   FORGOT PASSWORD
───────────────────────────────────────────── */
export const forgotPassword = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const dto = req.body as ForgotPasswordInput;

    const useCase = new ForgotPasswordUseCase();
    await useCase.execute(dto);

    sendSuccess(res, null, "If the email exists, a reset link has been sent");
  },
);

/* ─────────────────────────────────────────────
   RESET PASSWORD
───────────────────────────────────────────── */
export const resetPassword = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError("Reset token is required", 400);
    }
    const token = Array.isArray(authHeader)
      ? authHeader[0].split(" ")[1]
      : authHeader.split(" ")[1];
    const dto = req.body as ResetPasswordInput;

    const useCase = new ResetPasswordUseCase();
    await useCase.execute({ accessToken: token, password: dto.password });

    sendSuccess(res, null, "Password reset successfully");
  },
);

/* ─────────────────────────────────────────────
   USER LOGOUT (current session only)
───────────────────────────────────────────── */
export const logout = catchAsync(
  async (_req: Request, res: Response): Promise<void> => {
    const useCase = new LogoutUserUseCase();
    await useCase.execute();

    sendSuccess(res, null, "Logged out successfully");
  },
);

/* ─────────────────────────────────────────────
   ADMIN LOGOUT (invalidate ALL sessions)
───────────────────────────────────────────── */
export const adminLogout = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.userId as string;
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const useCase = new AdminLogoutUseCase();
    await useCase.execute({ userId });

    sendSuccess(res, null, "User sessions invalidated successfully");
  },
);

/* ─────────────────────────────────────────────
   GOOGLE LOGIN
───────────────────────────────────────────── */
export const googleLogin = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const dto = req.body as GoogleLoginInput;

    const useCase = new GoogleLoginUseCase();
    const result = await useCase.execute(dto);

    sendSuccess(res, result, "Google login successful");
  },
);

/* ─────────────────────────────────────────────
   ME (current user)
───────────────────────────────────────────── */
export const me = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;
    sendSuccess(
      res,
      {
        user: {
          id: user.id,
          email: user.email!,
          fullName: user.user_metadata?.full_name ?? "",
          role: user.user_metadata?.role ?? "user",
        },
      },
      "User fetched successfully",
    );
  },
);

/* ─────────────────────────────────────────────
   GET AUTH USERS (Admin — affiliate invite dropdown)
───────────────────────────────────────────── */
export const getAuthUsers = catchAsync(
  async (_req: Request, res: Response): Promise<void> => {
    const useCase = new ListUsersUseCase();
    const users = await useCase.execute();

    sendSuccess(res, users, "Auth users fetched successfully");
  },
);
