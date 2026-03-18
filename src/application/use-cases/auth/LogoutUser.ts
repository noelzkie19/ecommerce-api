/**
 * Logout User Use Case
 *
 * Logs out the current user.
 */

import { IAuthRepository } from "../../../domain/interfaces/IAuthRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Logout User Use Case
 */
export class LogoutUserUseCase {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository?: IAuthRepository) {
    this.authRepository =
      authRepository ?? resolve<IAuthRepository>(TOKENS.IAuthRepository);
  }

  /**
   * Execute the use case
   */
  async execute(): Promise<void> {
    return this.authRepository.logout();
  }
}
