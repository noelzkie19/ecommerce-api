/**
 * List Users Use Case
 *
 * Lists all auth users (admin only).
 */

import {
  IAuthRepository,
  AuthUserInfo,
} from "../../../domain/interfaces/IAuthRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Output DTO for ListUsersUseCase
 */
export type ListUsersOutput = AuthUserInfo[];

/**
 * List Users Use Case
 */
export class ListUsersUseCase {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository?: IAuthRepository) {
    this.authRepository =
      authRepository ?? resolve<IAuthRepository>(TOKENS.IAuthRepository);
  }

  /**
   * Execute the use case
   */
  async execute(): Promise<ListUsersOutput> {
    return this.authRepository.listUsers();
  }
}
