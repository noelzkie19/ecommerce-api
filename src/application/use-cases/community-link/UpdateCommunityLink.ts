/**
 * Update Community Link Use Case
 *
 * Updates an existing community link.
 */

import { ICommunityLinkRepository } from "../../../domain/interfaces/ICommunityLinkRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for UpdateCommunityLinkUseCase
 */
export interface UpdateCommunityLinkInput {
  linkId: string;
  title?: string;
  url?: string;
  description?: string | null;
  category?: string;
  icon?: string | null;
  imageUrl?: string | null;
  orderIndex?: number;
  isActive?: boolean;
}

/**
 * Output DTO for UpdateCommunityLinkUseCase
 */
export interface UpdateCommunityLinkOutput {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: string;
  icon: string | null;
  imageUrl: string | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Update Community Link Use Case
 */
export class UpdateCommunityLinkUseCase {
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
    input: UpdateCommunityLinkInput,
  ): Promise<UpdateCommunityLinkOutput> {
    const { linkId, ...updateData } = input;

    const link = await this.repository.update(linkId, {
      title: updateData.title,
      url: updateData.url,
      description: updateData.description,
      category: updateData.category as
        | "youtube"
        | "facebook"
        | "telegram"
        | "website"
        | "discord"
        | "instagram"
        | "tiktok"
        | "twitter"
        | "linkedin"
        | "other",
      icon: updateData.icon,
      imageUrl: updateData.imageUrl,
      orderIndex: updateData.orderIndex,
      isActive: updateData.isActive,
    });

    return link.toResponse();
  }
}
