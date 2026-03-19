/**
 * Create Image Library Use Case
 *
 * Creates a new image library item.
 */

import {
  IImageLibraryRepository,
  ImageLibraryFilters,
} from "../../../domain/interfaces/IImageLibraryRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for CreateImageLibraryUseCase
 */
export interface CreateImageLibraryInput {
  title: string;
  category?: string;
  thumbnailUrl?: string;
  imageUrl: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * Output DTO for CreateImageLibraryUseCase
 */
export interface CreateImageLibraryOutput {
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
}

/**
 * Create Image Library Use Case
 */
export class CreateImageLibraryUseCase {
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
    input: CreateImageLibraryInput,
  ): Promise<CreateImageLibraryOutput> {
    // Get the current count to set displayOrder if not provided
    let displayOrder = input.displayOrder;
    if (displayOrder === undefined) {
      const count = await this.repository.count({ isActive: true });
      displayOrder = count;
    }

    const image = await this.repository.create({
      title: input.title,
      category: input.category as ImageLibraryFilters["category"],
      thumbnailUrl: input.thumbnailUrl,
      imageUrl: input.imageUrl,
      description: input.description,
      displayOrder,
      isActive: input.isActive ?? true,
    });

    return image.toResponse();
  }
}
