/**
 * Forgot Password Use Case
 *
 * Sends a password reset email to the user.
 */

import { IAuthRepository } from "../../../domain/interfaces/IAuthRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for ForgotPasswordUseCase
 */
export interface ForgotPasswordInput {
  email: string;
}

/**
 * Forgot Password Use Case
 */
export class ForgotPasswordUseCase {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository?: IAuthRepository) {
    this.authRepository =
      authRepository ?? resolve<IAuthRepository>(TOKENS.IAuthRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: ForgotPasswordInput): Promise<void> {
    return this.authRepository.forgotPassword({ email: input.email });
  }
}
