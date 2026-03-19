/**
 * Delete Image Library Use Case
 *
 * Deletes an image library item by ID.
 */

import { IImageLibraryRepository } from "../../../domain/interfaces/IImageLibraryRepository";
import { resolve, TOKENS } from "../../../di/container";

/**
 * Input DTO for DeleteImageLibraryUseCase
 */
export interface DeleteImageLibraryInput {
  id: string;
}

/**
 * Delete Image Library Use Case
 */
export class DeleteImageLibraryUseCase {
  private readonly repository: IImageLibraryRepository;

  constructor(repository?: IImageLibraryRepository) {
    this.repository =
      repository ??
      resolve<IImageLibraryRepository>(TOKENS.IImageLibraryRepository);
  }

  /**
   * Execute the use case
   */
  async execute(input: DeleteImageLibraryInput): Promise<void> {
    const { id } = input;

    // Check if the item exists
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error("Image library item not found");
    }

    await this.repository.delete(id);
  }
}
