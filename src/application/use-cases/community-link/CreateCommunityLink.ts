/**
 * Create Community Link Use Case
 *
 * Creates a new community link.
 */

import {
  ICommunityLinkRepository,
  CommunityLinkFilters,
} from "../../../domain/interfaces/ICommunityLinkRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for CreateCommunityLinkUseCase
 */
export interface CreateCommunityLinkInput {
  title: string;
  url: string;
  description?: string;
  category?: string;
  icon?: string;
  imageUrl?: string;
  orderIndex?: number;
  isActive?: boolean;
}

/**
 * Output DTO for CreateCommunityLinkUseCase
 */
export interface CreateCommunityLinkOutput {
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
 * Create Community Link Use Case
 */
export class CreateCommunityLinkUseCase {
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
    input: CreateCommunityLinkInput,
  ): Promise<CreateCommunityLinkOutput> {
    // Get the current count to set orderIndex if not provided
    let orderIndex = input.orderIndex;
    if (orderIndex === undefined) {
      const count = await this.repository.count({ isActive: true });
      orderIndex = count;
    }

    const link = await this.repository.create({
      title: input.title,
      url: input.url,
      description: input.description,
      category: input.category as CommunityLinkFilters["category"],
      icon: input.icon,
      imageUrl: input.imageUrl,
      orderIndex,
      isActive: input.isActive ?? true,
    });

    return link.toResponse();
  }
}
