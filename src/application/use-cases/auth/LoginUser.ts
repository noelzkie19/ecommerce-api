/**
 * Login User Use Case
 *
 * Authenticates a user with email and password.
 */

import {
  IAuthRepository,
  AuthResponse,
} from "../../../domain/interfaces/IAuthRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for LoginUserUseCase
 */
export interface LoginUserInput {
  email: string;
  password: string;
}

/**
 * Output DTO for LoginUserUseCase
 */
export type LoginUserOutput = AuthResponse;

/**
 * Login User Use Case
 */
export class LoginUserUseCase {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository?: IAuthRepository) {
    this.authRepository =
      authRepository ?? resolve<IAuthRepository>(TOKENS.IAuthRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    return this.authRepository.login({
      email: input.email,
      password: input.password,
    });
  }
}
