/**
 * Update Image Library Use Case
 *
 * Updates an existing image library item.
 */

import { IImageLibraryRepository } from "../../../domain/interfaces/IImageLibraryRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for UpdateImageLibraryUseCase
 */
export interface UpdateImageLibraryInput {
  id: string;
  title?: string;
  category?: string;
  thumbnailUrl?: string | null;
  imageUrl?: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * Output DTO for UpdateImageLibraryUseCase
 */
export interface UpdateImageLibraryOutput {
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
 * Update Image Library Use Case
 */
export class UpdateImageLibraryUseCase {
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
    input: UpdateImageLibraryInput,
  ): Promise<UpdateImageLibraryOutput> {
    const { id, ...updateData } = input;

    const image = await this.repository.update(id, {
      title: updateData.title,
      category: updateData.category as
        | "banners"
        | "gallery"
        | "testimonials"
        | "partners",
      thumbnailUrl: updateData.thumbnailUrl,
      imageUrl: updateData.imageUrl,
      description: updateData.description,
      displayOrder: updateData.displayOrder,
      isActive: updateData.isActive,
    });

    return image.toResponse();
  }
}
