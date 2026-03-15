import { supabase, supabaseAdmin } from "../../config/supabase";
import { pepperPassword } from "../../common/utils/crypto";
import {
  RegisterDTO,
  LoginDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  AuthResponse,
  GoogleLoginDTO,
} from "./auth.types";
import { AppError } from "../../common/utils/AppError";

/* ─────────────────────────────────────────────
   REGISTER
───────────────────────────────────────────── */

export const registerUser = async (
  dto: RegisterDTO,
): Promise<AuthResponse | { message: string }> => {
  const pepperedPassword = pepperPassword(dto.password);

  const { data, error } = await supabase.auth.signUp({
    email: dto.email,
    password: pepperedPassword,
    options: { data: { full_name: dto.fullName } },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      throw new AppError("Email already registered", 400);
    }
    throw new AppError("Registration failed", 400);
  }

  if (!data.user) throw new AppError("Registration failed", 500);

  // Affiliate is now auto-created by database trigger on auth.users
  // See supabase/migrations/20260316_auto_create_affiliate.sql

  if (!data.session) {
    return {
      message:
        "Registration successful! Please check your email to confirm your account.",
    };
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: {
      id: data.user.id,
      email: data.user.email!,
      fullName: dto.fullName,
    },
  };
};

/* ─────────────────────────────────────────────
   LOGIN
───────────────────────────────────────────── */

export const loginUser = async (dto: LoginDTO): Promise<AuthResponse> => {
  const pepperedPassword = pepperPassword(dto.password);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: dto.email,
    password: pepperedPassword,
  });

  if (error || !data.session || !data.user) {
    throw new AppError("Invalid email or password", 401);
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: {
      id: data.user.id,
      email: data.user.email!,
      fullName: data.user.user_metadata?.full_name ?? "",
    },
  };
};

/* ─────────────────────────────────────────────
   REFRESH
───────────────────────────────────────────── */

export const refreshSession = async (
  refreshToken: string,
): Promise<AuthResponse> => {
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session || !data.user) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: {
      id: data.user.id,
      email: data.user.email!,
      fullName: data.user.user_metadata?.full_name ?? "",
    },
  };
};

/* ─────────────────────────────────────────────
   FORGOT PASSWORD
───────────────────────────────────────────── */

export const forgotPassword = async (dto: ForgotPasswordDTO): Promise<void> => {
  await supabase.auth.resetPasswordForEmail(dto.email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
  });
  // Always return success to prevent email enumeration
};

/* ─────────────────────────────────────────────
   RESET PASSWORD
───────────────────────────────────────────── */

export const resetPassword = async (
  accessToken: string,
  dto: ResetPasswordDTO,
): Promise<void> => {
  const pepperedPassword = pepperPassword(dto.password);

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: accessToken,
  });

  if (sessionError) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  const { error } = await supabase.auth.updateUser({
    password: pepperedPassword,
  });

  if (error) throw new AppError("Failed to reset password", 400);

  await supabase.auth.signOut();
};

/* ─────────────────────────────────────────────
   USER LOGOUT (current session only)
───────────────────────────────────────────── */

export const logoutUser = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new AppError("Logout failed", 500);
};

/* ─────────────────────────────────────────────
   ADMIN LOGOUT (invalidate ALL sessions)
───────────────────────────────────────────── */

export const adminLogoutUser = async (userId: string): Promise<void> => {
  const { error } = await supabase.auth.admin.signOut(userId);
  if (error) throw new AppError("Failed to invalidate user sessions", 500);
};

/* ─────────────────────────────────────────────
   GOOGLE LOGIN
───────────────────────────────────────────── */

export const googleLogin = async (
  dto: GoogleLoginDTO,
): Promise<AuthResponse> => {
  const { data: existingUsers, error: listError } =
    await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

  if (listError) throw new AppError("Google login failed", 500);

  let user = existingUsers.users.find((u) => u.email === dto.email);

  if (!user) {
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: dto.email,
        email_confirm: true,
        user_metadata: {
          full_name: dto.fullName,
          google_id: dto.googleId,
        },
      });

    if (createError || !newUser.user) {
      console.error("Google user creation error:", createError);
      throw new AppError("Failed to create Google user", 500);
    }

    user = newUser.user;
  }

  // Affiliate is now auto-created by database trigger on auth.users

  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      full_name: user.user_metadata?.full_name ?? dto.fullName,
      google_id: dto.googleId,
    },
  });

  const { data: linkData, error: linkError } =
    await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: dto.email,
    });

  if (linkError || !linkData?.properties) {
    throw new AppError("Failed to generate auth link", 500);
  }

  const { data: verifyData, error: verifyError } =
    await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "recovery",
    });

  if (verifyError || !verifyData.session || !verifyData.user) {
    throw new AppError("Failed to create Google session", 500);
  }

  return {
    accessToken: verifyData.session.access_token,
    refreshToken: verifyData.session.refresh_token,
    user: {
      id: verifyData.user.id,
      email: verifyData.user.email!,
      fullName: verifyData.user.user_metadata?.full_name ?? dto.fullName,
      role: verifyData.user.app_metadata?.role ?? "user",
    },
  };
};

/* ─────────────────────────────────────────────
   GET AUTH USERS (Admin — for affiliate invite dropdown)
───────────────────────────────────────────── */

export const getAuthUsers = async () => {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) throw new AppError("Failed to fetch auth users", 500);

  return data.users.map((u) => ({
    id: u.id,
    email: u.email ?? "",
    name:
      u.user_metadata?.full_name ??
      u.user_metadata?.name ??
      u.email?.split("@")[0] ??
      "Unknown",
  }));
};
