/**
 * Auth Use Cases Index
 */

// Register
export {
  RegisterUserUseCase,
  type RegisterUserInput,
  type RegisterUserOutput,
} from "./RegisterUser";

// Login
export {
  LoginUserUseCase,
  type LoginUserInput,
  type LoginUserOutput,
} from "./LoginUser";

// Logout
export { LogoutUserUseCase } from "./LogoutUser";

// Refresh
export {
  RefreshSessionUseCase,
  type RefreshSessionInput,
  type RefreshSessionOutput,
} from "./RefreshSession";

// Password
export {
  ForgotPasswordUseCase,
  type ForgotPasswordInput,
} from "./ForgotPassword";

export { ResetPasswordUseCase, type ResetPasswordInput } from "./ResetPassword";

// Google
export {
  GoogleLoginUseCase,
  type GoogleLoginInput,
  type GoogleLoginOutput,
} from "./GoogleLogin";

// Admin
export { ListUsersUseCase, type ListUsersOutput } from "./ListUsers";

export { AdminLogoutUseCase, type AdminLogoutInput } from "./AdminLogout";
