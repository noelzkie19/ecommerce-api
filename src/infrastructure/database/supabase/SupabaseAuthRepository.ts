/**
 * Supabase Auth Repository
 *
 * Implementation of IAuthRepository using Supabase Auth.
 */

import { supabase, supabaseAdmin } from "../../../config/supabase";
import { pepperPassword } from "../../../common/utils/crypto";
import { AppError } from "../../../common/utils/AppError";
import {
  IAuthRepository,
  AuthResponse,
  RegisterData,
  LoginCredentials,
  GoogleLoginData,
  PasswordResetData,
  NewPasswordData,
  AuthUserInfo,
  UpdateProfileData,
} from "../../../domain/interfaces/IAuthRepository";
import { User, UserRole } from "../../../domain/entities/User";
import { resolve, TOKENS } from "../../../di/container";
import { IAffiliateRepository } from "../../../domain/interfaces/IAffiliateRepository";

/**
 * Get affiliate repository instance using DI
 */
function getAffiliateRepository(): IAffiliateRepository {
  return resolve<IAffiliateRepository>(TOKENS.IAffiliateRepository);
}

/**
 * Link a new user's affiliate record to the referrer identified by referralCode.
 */
async function linkReferral(
  newUserId: string,
  referralCode: string,
): Promise<void> {
  try {
    const affiliateRepo = getAffiliateRepository();

    // Try to find referrer by affiliate_link first, then store_id
    let referrer = await affiliateRepo.findByAffiliateLink(referralCode);
    referrer ??= await affiliateRepo.findByStoreId(referralCode);

    if (!referrer) {
      return;
    }

    // Wait a bit for the affiliate record to be created (in case of async trigger)
    let newAffiliate = await affiliateRepo.findByUserId(newUserId);
    if (!newAffiliate) {
      // Wait and retry
      await new Promise((resolve) => setTimeout(resolve, 500));
      newAffiliate = await affiliateRepo.findByUserId(newUserId);
    }

    if (!newAffiliate) {
      return;
    }

    await affiliateRepo.updateReferredBy(newAffiliate.id, referrer.id);
  } catch {
    // Silently fail - referral linking is not critical
  }
}

/**
 * Get affiliate status for a user
 */
async function getAffiliateStatus(
  userId: string,
): Promise<"pending" | "active" | "suspended"> {
  try {
    const affiliateRepo = getAffiliateRepository();
    const affiliate = await affiliateRepo.findByUserId(userId);
    if (affiliate) {
      return affiliate.paymentStatus === "paid" ? affiliate.status : "pending";
    }
  } catch {
    // Silent fail
  }
  return "pending";
}

/**
 * Supabase Auth Repository Implementation
 */
export class SupabaseAuthRepository implements IAuthRepository {
  /**
   * Register a new user
   */
  async register(
    data: RegisterData,
  ): Promise<AuthResponse | { message: string }> {
    const pepperedPassword = pepperPassword(data.password);

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: pepperedPassword,
      options: { data: { full_name: data.fullName } },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        throw new AppError("Email already registered", 400);
      }
      throw new AppError("Registration failed", 400);
    }

    if (!authData.user) {
      throw new AppError("Registration failed", 500);
    }

    // Explicitly create affiliate record for new user
    const affiliateRepo = getAffiliateRepository();
    await affiliateRepo.createForAuthUser(
      authData.user.id,
      authData.user.email ?? "",
      data.fullName ?? (authData.user.email ?? "").split("@")[0],
    );

    // If a referral code was provided, link the new affiliate to the referrer
    if (data.referralCode && authData.user) {
      await linkReferral(authData.user.id, data.referralCode);
    }

    if (!authData.session) {
      return {
        message:
          "Registration successful! Please check your email to confirm your account.",
      };
    }

    // New users always start as pending (must pay registration fee first)
    return {
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      user: {
        id: authData.user.id,
        email: authData.user.email ?? "",
        fullName: data.fullName,
      },
      affiliateStatus: "pending",
    };
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const pepperedPassword = pepperPassword(credentials.password);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: pepperedPassword,
    });

    if (error || !data.session || !data.user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Determine affiliate status so frontend can redirect correctly
    const affiliateStatus = await getAffiliateStatus(data.user.id);

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email ?? "",
        fullName: data.user.user_metadata?.full_name ?? "",
      },
      affiliateStatus,
    };
  }

  /**
   * Refresh the session tokens
   */
  async refreshSession(refreshToken: string): Promise<AuthResponse> {
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
        email: data.user.email ?? "",
        fullName: data.user.user_metadata?.full_name ?? "",
      },
    };
  }

  /**
   * Request password reset email
   */
  async forgotPassword(data: PasswordResetData): Promise<void> {
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });
    // Always return success to prevent email enumeration
  }

  /**
   * Reset password with new password
   */
  async resetPassword(data: NewPasswordData): Promise<void> {
    const pepperedPassword = pepperPassword(data.password);

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.accessToken,
      refresh_token: data.accessToken,
    });

    if (sessionError) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    const { error } = await supabase.auth.updateUser({
      password: pepperedPassword,
    });

    if (error) {
      throw new AppError("Failed to reset password", 400);
    }

    await supabase.auth.signOut();
  }

  /**
   * Logout current session
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new AppError("Logout failed", 500);
    }
  }

  /**
   * Logout user from all sessions (admin)
   */
  async adminLogout(userId: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.signOut(userId);
    if (error) {
      throw new AppError("Failed to invalidate user sessions", 500);
    }
  }

  /**
   * Login with Google
   */
  async googleLogin(data: GoogleLoginData): Promise<AuthResponse> {
    const { data: existingUsers, error: listError } =
      await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

    if (listError) {
      throw new AppError("Google login failed", 500);
    }

    let user = existingUsers.users.find((u) => u.email === data.email);

    if (!user) {
      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: data.email,
          email_confirm: true,
          user_metadata: {
            full_name: data.fullName,
            google_id: data.googleId,
          },
        });

      if (createError || !newUser.user) {
        throw new AppError(
          createError?.message ?? "Failed to create Google user",
          500,
        );
      }

      user = newUser.user;

      // Explicitly create affiliate record for new Google user
      try {
        const affiliateRepo = getAffiliateRepository();
        await affiliateRepo.createForAuthUser(
          user.id,
          user.email ?? "",
          data.fullName ?? (user.email ?? "").split("@")[0],
        );
      } catch (err) {
        // Don't fail login if affiliate creation fails (trigger may have already created it)
        console.warn("[googleLogin] Affiliate creation skipped:", err);
      }

      // Link referral if a referral code was provided (new user only)
      if (data.referralCode) {
        await linkReferral(user.id, data.referralCode);
      }
    }

    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        full_name: user.user_metadata?.full_name ?? data.fullName,
        google_id: data.googleId,
      },
    });

    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: data.email,
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

    // Determine affiliate status
    const affiliateStatus = await getAffiliateStatus(verifyData.user.id);

    return {
      accessToken: verifyData.session.access_token,
      refreshToken: verifyData.session.refresh_token,
      user: {
        id: verifyData.user.id,
        email: verifyData.user.email ?? "",
        fullName: verifyData.user.user_metadata?.full_name ?? data.fullName,
        role: verifyData.user.app_metadata?.role ?? "user",
      },
      affiliateStatus,
    };
  }

  /**
   * List all auth users (admin)
   */
  async listUsers(): Promise<AuthUserInfo[]> {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      throw new AppError("Failed to fetch auth users", 500);
    }

    return data.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      name:
        u.user_metadata?.full_name ??
        u.user_metadata?.name ??
        u.email?.split("@")[0] ??
        "Unknown",
    }));
  }

  /**
   * Get current user from access token
   */
  async getCurrentUser(accessToken: string): Promise<User> {
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new AppError("Invalid token", 401);
    }

    return User.fromAuthUser({
      id: data.user.id,
      email: data.user.email ?? "",
      fullName: data.user.user_metadata?.full_name,
      role: data.user.app_metadata?.role as UserRole | undefined,
    });
  }

  /**
   * Verify access token validity
   */
  async verifyToken(accessToken: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.getUser(accessToken);
      return !error && !!data.user;
    } catch {
      return false;
    }
  }

  /**
   * Find user by ID (admin)
   */
  async findById(id: string): Promise<any> {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
    if (error) throw new AppError("User not found", 404);
    return data.user;
  }

  /**
   * Update user profile
   */
  async updateProfile(id: string, data: UpdateProfileData): Promise<any> {
    const { data: updated, error } =
      await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: {
          full_name: data.fullName,
          avatar_url: data.avatarUrl,
        },
      });
    if (error) throw new AppError(error.message, 400);
    return updated.user;
  }
}
