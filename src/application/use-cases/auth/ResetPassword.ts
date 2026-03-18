/**
 * Reset Password Use Case
 *
 * Resets the user's password using a valid reset token.
 */

import { IAuthRepository } from "../../../domain/interfaces/IAuthRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for ResetPasswordUseCase
 */
export interface ResetPasswordInput {
  accessToken: string;
  password: string;
}

/**
 * Reset Password Use Case
 */
export class ResetPasswordUseCase {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository?: IAuthRepository) {
    this.authRepository =
      authRepository ?? resolve<IAuthRepository>(TOKENS.IAuthRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: ResetPasswordInput): Promise<void> {
    return this.authRepository.resetPassword({
      accessToken: input.accessToken,
      password: input.password,
    });
  }
}
