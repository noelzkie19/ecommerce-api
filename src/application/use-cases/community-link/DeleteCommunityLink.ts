/**
 * Delete Community Link Use Case
 *
 * Deletes a community link.
 */

import { ICommunityLinkRepository } from "../../../domain/interfaces/ICommunityLinkRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for DeleteCommunityLinkUseCase
 */
export interface DeleteCommunityLinkInput {
  linkId: string;
}

/**
 * Delete Community Link Use Case
 */
export class DeleteCommunityLinkUseCase {
  private readonly repository: ICommunityLinkRepository;

  constructor(repository?: ICommunityLinkRepository) {
    this.repository =
      repository ??
      resolve<ICommunityLinkRepository>(TOKENS.ICommunityLinkRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: DeleteCommunityLinkInput): Promise<void> {
    // Verify the link exists
    const existing = await this.repository.findById(input.linkId);
    if (!existing) {
      throw new Error("Community link not found");
    }

    await this.repository.delete(input.linkId);
  }
}
