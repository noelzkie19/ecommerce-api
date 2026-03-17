import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../../common/utils/AppError";

/* ─────────────────────────────────────────────
   Register
───────────────────────────────────────────── */

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),

  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),

  /** Optional referral code from ?ref= query param */
  referralCode: z.string().trim().optional(),
});

/* ─────────────────────────────────────────────
   Login
───────────────────────────────────────────── */

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/* ─────────────────────────────────────────────
   Forgot Password
───────────────────────────────────────────── */

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

/* ─────────────────────────────────────────────
   Reset Password
───────────────────────────────────────────── */

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
});

/* ─────────────────────────────────────────────
   Google Login
───────────────────────────────────────────── */
export const googleLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  fullName: z.string().trim().min(1, "Full name is required"),
  googleId: z.string().min(1, "Google ID is required"),
  /** Optional referral code from ?ref= query param */
  referralCode: z.string().trim().optional(),
});

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;

/* ─────────────────────────────────────────────
   Validation Middleware
───────────────────────────────────────────── */

export const validate =
  <T extends z.ZodTypeAny>(schema: T) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    console.log("[Validate] Raw body:", JSON.stringify(req.body));
    const result = schema.safeParse(req.body);
    console.log(
      "[Validate] Parsed result:",
      result.success ? "success" : "failed",
      result.data,
    );

    if (!result.success) {
      const message = result.error.errors.map((e) => e.message).join(", ");
      return next(new AppError(message, 422));
    }

    req.body = result.data;
    next();
  };
