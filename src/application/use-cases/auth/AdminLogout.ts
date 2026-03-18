/**
 * Admin Logout Use Case
 *
 * Logs out a user from all sessions (admin function).
 */

import { IAuthRepository } from "../../../domain/interfaces/IAuthRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for AdminLogoutUseCase
 */
export interface AdminLogoutInput {
  userId: string;
}

/**
 * Admin Logout Use Case
 */
export class AdminLogoutUseCase {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository?: IAuthRepository) {
    this.authRepository =
      authRepository ?? resolve<IAuthRepository>(TOKENS.IAuthRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: AdminLogoutInput): Promise<void> {
    return this.authRepository.adminLogout(input.userId);
  }
}
