/**
 * Google Login Use Case
 *
 * Authenticates or creates a user via Google OAuth.
 */

import {
  IAuthRepository,
  AuthResponse,
} from "../../../domain/interfaces/IAuthRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GoogleLoginUseCase
 */
export interface GoogleLoginInput {
  email: string;
  fullName: string;
  googleId: string;
  referralCode?: string;
}

/**
 * Output DTO for GoogleLoginUseCase
 */
export type GoogleLoginOutput = AuthResponse;

/**
 * Google Login Use Case
 */
export class GoogleLoginUseCase {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository?: IAuthRepository) {
    this.authRepository =
      authRepository ?? resolve<IAuthRepository>(TOKENS.IAuthRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: GoogleLoginInput): Promise<GoogleLoginOutput> {
    return this.authRepository.googleLogin({
      email: input.email,
      fullName: input.fullName,
      googleId: input.googleId,
      referralCode: input.referralCode,
    });
  }
}
