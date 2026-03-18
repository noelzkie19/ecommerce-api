/**
 * Register User Use Case
 *
 * Registers a new user in the system.
 */

import {
  IAuthRepository,
  AuthResponse,
} from "../../../domain/interfaces/IAuthRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for RegisterUserUseCase
 */
export interface RegisterUserInput {
  email: string;
  password: string;
  fullName: string;
  referralCode?: string;
}

/**
 * Output DTO for RegisterUserUseCase
 */
export type RegisterUserOutput = AuthResponse | { message: string };

/**
 * Register User Use Case
 */
export class RegisterUserUseCase {
  private readonly authRepository: IAuthRepository;

  constructor(authRepository?: IAuthRepository) {
    this.authRepository =
      authRepository ?? resolve<IAuthRepository>(TOKENS.IAuthRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    return this.authRepository.register({
      email: input.email,
      password: input.password,
      fullName: input.fullName,
      referralCode: input.referralCode,
    });
  }
}
