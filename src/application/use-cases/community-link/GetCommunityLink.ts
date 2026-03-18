/**
 * Get Community Link Use Case
 *
 * Gets a single community link by ID.
 */

import { ICommunityLinkRepository } from "../../../domain/interfaces/ICommunityLinkRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GetCommunityLinkUseCase
 */
export interface GetCommunityLinkInput {
  linkId: string;
}

/**
 * Output DTO for GetCommunityLinkUseCase
 */
export interface GetCommunityLinkOutput {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: string;
  icon: string | null;
  imageUrl: string | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get Community Link Use Case
 */
export class GetCommunityLinkUseCase {
  private readonly repository: ICommunityLinkRepository;

  constructor(repository?: ICommunityLinkRepository) {
    this.repository =
      repository ??
      resolve<ICommunityLinkRepository>(TOKENS.ICommunityLinkRepository);
  }

  /**
   * Execute the use case
   */
  async execute(
    input: GetCommunityLinkInput,
  ): Promise<GetCommunityLinkOutput | null> {
    const link = await this.repository.findById(input.linkId);

    if (!link) {
      return null;
    }

    return link.toResponse();
  }
}
