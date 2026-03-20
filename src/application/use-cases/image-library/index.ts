/**
 * Image Library Use Cases Index
 */

// List
export {
  ListImageLibrariesUseCase,
  type ListImageLibrariesInput,
  type ListImageLibrariesOutput,
} from "./ListImageLibraries";

// Get
export {
  GetImageLibraryUseCase,
  type GetImageLibraryInput,
  type GetImageLibraryOutput,
} from "./GetImageLibrary";

// Create
export {
  CreateImageLibraryUseCase,
  type CreateImageLibraryInput,
  type CreateImageLibraryOutput,
} from "./CreateImageLibrary";

// Update
export {
  UpdateImageLibraryUseCase,
  type UpdateImageLibraryInput,
  type UpdateImageLibraryOutput,
} from "./UpdateImageLibrary";

// Delete
export {
  DeleteImageLibraryUseCase,
  type DeleteImageLibraryInput,
} from "./DeleteImageLibrary";

// Upload
export {
  uploadImage,
  type UploadImageInput,
  type UploadImageOutput,
} from "./UploadImage";
export {
  uploadThumbnail,
  type UploadThumbnailInput,
  type UploadThumbnailOutput,
} from "./UploadThumbnail";
export {
  uploadImageAndThumbnail,
  type UploadImageAndThumbnailInput,
  type UploadImageAndThumbnailOutput,
} from "./UploadImageAndThumbnail";
