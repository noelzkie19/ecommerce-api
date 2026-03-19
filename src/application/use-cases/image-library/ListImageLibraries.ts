/**
 * List Image Libraries Use Case
 *
 * Retrieves a paginated list of image library items with optional filters.
 */

import {
  IImageLibraryRepository,
  ImageLibraryFilters,
} from "../../../domain/interfaces/IImageLibraryRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for ListImageLibrariesUseCase
 */
export interface ListImageLibrariesInput {
  page: number;
  limit: number;
  filters?: ImageLibraryFilters;
}

/**
 * Output DTO for ListImageLibrariesUseCase
 */
export interface ListImageLibrariesOutput {
  images: Array<{
    id: string;
    title: string;
    category: string;
    thumbnailUrl: string | null;
    imageUrl: string;
    description: string | null;
    displayOrder: number;
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
 * List Image Libraries Use Case
 */
export class ListImageLibrariesUseCase {
  private readonly repository: IImageLibraryRepository;

  constructor(repository?: IImageLibraryRepository) {
    this.repository =
      repository ??
      resolve<IImageLibraryRepository>(TOKENS.IImageLibraryRepository);
  }

  /**
   * Execute the use case
   */
  async execute(
    input: ListImageLibrariesInput,
  ): Promise<ListImageLibrariesOutput> {
    const { page, limit, filters } = input;

    const result = await this.repository.findAll(page, limit, filters);

    return {
      images: result.images.map((image) => image.toResponse()),
      meta: result.meta,
    };
  }
}
