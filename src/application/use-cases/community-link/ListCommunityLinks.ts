/**
 * List Community Links Use Case
 *
 * Lists community links with pagination and optional filters.
 */

import {
  ICommunityLinkRepository,
  CommunityLinkFilters,
} from "../../../domain/interfaces/ICommunityLinkRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for ListCommunityLinksUseCase
 */
export interface ListCommunityLinksInput {
  page?: number;
  limit?: number;
  filters?: CommunityLinkFilters;
}

/**
 * Output DTO for ListCommunityLinksUseCase
 */
export interface ListCommunityLinksOutput {
  links: Array<{
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
  }>;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * List Community Links Use Case
 */
export class ListCommunityLinksUseCase {
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
    input: ListCommunityLinksInput,
  ): Promise<ListCommunityLinksOutput> {
    const page = input.page ?? 1;
    const limit = Math.min(input.limit ?? 10, 100);

    const result = await this.repository.findAll(page, limit, input.filters);

    return {
      links: result.links.map((link) => link.toResponse()),
      meta: result.meta,
    };
  }
}
