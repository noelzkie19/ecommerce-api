/**
 * Refresh Session Use Case
 *
 * Refreshes the user's session tokens.
 */

import {
  IAuthRepository,
  AuthResponse,
} from "../../../domain/interfaces/IAuthRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for RefreshSessionUseCase
 */
export interface RefreshSessionInput {
  refreshToken: string;
}

/**
 * Output DTO for RefreshSessionUseCase
 */
export type RefreshSessionOutput = AuthResponse;

/**
 * Refresh Session Use Case
 */
export class RefreshSessionUseCase {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository?: IAuthRepository) {
    this.authRepository =
      authRepository ?? resolve<IAuthRepository>(TOKENS.IAuthRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: RefreshSessionInput): Promise<RefreshSessionOutput> {
    return this.authRepository.refreshSession(input.refreshToken);
  }
}
