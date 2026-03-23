/**
 * Get Image Library Use Case
 *
 * Retrieves a single image library item by ID.
 */

import { IImageLibraryRepository } from "../../../domain/interfaces/IImageLibraryRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for GetImageLibraryUseCase
 */
export interface GetImageLibraryInput {
  id: string;
}

/**
 * Output DTO for GetImageLibraryUseCase
 */
export interface GetImageLibraryOutput {
  id: string;
  title: string;
  category: string;
  thumbnailUrl: string | null;
  imageUrl: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Get Image Library Use Case
 */
export class GetImageLibraryUseCase {
  private readonly repository: IImageLibraryRepository;

  constructor(repository?: IImageLibraryRepository) {
    this.repository =
      repository ??
      resolve<IImageLibraryRepository>(TOKENS.IImageLibraryRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: GetImageLibraryInput): Promise<GetImageLibraryOutput> {
    const { id } = input;

    const image = await this.repository.findById(id);

    if (!image) {
      throw new Error("Image library item not found");
    }

    return image.toResponse();
  }
}
