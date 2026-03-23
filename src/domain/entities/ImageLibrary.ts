/**
 * ImageLibrary Entity
 *
 * Represents an image in the image library with categories.
 */

export type ImageLibraryCategory =
  | "banners"
  | "gallery"
  | "testimonials"
  | "partners";

export interface ImageLibraryProps {
  id: string;
  title: string;
  category: ImageLibraryCategory;
  thumbnailUrl: string | null;
  imageUrl: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateImageLibraryProps {
  title: string;
  category?: ImageLibraryCategory;
  thumbnailUrl?: string;
  imageUrl: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateImageLibraryProps {
  title?: string;
  category?: ImageLibraryCategory;
  thumbnailUrl?: string | null;
  imageUrl?: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

/**
 * ImageLibrary Entity with business logic
 */
export class ImageLibrary {
  readonly id: string;
  readonly title: string;
  readonly category: ImageLibraryCategory;
  readonly thumbnailUrl: string | null;
  readonly imageUrl: string;
  readonly description: string | null;
  readonly displayOrder: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: ImageLibraryProps) {
    this.id = props.id;
    this.title = props.title;
    this.category = props.category;
    this.thumbnailUrl = props.thumbnailUrl;
    this.imageUrl = props.imageUrl;
    this.description = props.description;
    this.displayOrder = props.displayOrder;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Factory method to create a new ImageLibrary
   */
  static create(props: CreateImageLibraryProps & { id: string }): ImageLibrary {
    const now = new Date();
    return new ImageLibrary({
      id: props.id,
      title: props.title,
      category: props.category ?? "gallery",
      thumbnailUrl: props.thumbnailUrl ?? null,
      imageUrl: props.imageUrl,
      description: props.description ?? null,
      displayOrder: props.displayOrder ?? 0,
      isActive: props.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Create ImageLibrary from database row
   */
  static fromDatabase(row: ImageLibraryDB): ImageLibrary {
    return new ImageLibrary({
      id: row.id,
      title: row.title,
      category: row.category as ImageLibraryCategory,
      thumbnailUrl: row.thumbnail_url,
      imageUrl: row.image_url,
      description: row.description,
      displayOrder: row.display_order,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  /**
   * Check if image is active
   */
  isActiveImage(): boolean {
    return this.isActive;
  }

  /**
   * Check if image has thumbnail
   */
  hasThumbnail(): boolean {
    return this.thumbnailUrl !== null;
  }

  /**
   * Update the image library item
   */
  update(props: UpdateImageLibraryProps): ImageLibrary {
    return new ImageLibrary({
      ...this.toProps(),
      title: props.title ?? this.title,
      category: props.category ?? this.category,
      thumbnailUrl: props.thumbnailUrl ?? this.thumbnailUrl,
      imageUrl: props.imageUrl ?? this.imageUrl,
      description: props.description ?? this.description,
      displayOrder: props.displayOrder ?? this.displayOrder,
      isActive: props.isActive ?? this.isActive,
      updatedAt: new Date(),
    });
  }

  /**
   * Toggle active status
   */
  toggleActive(): ImageLibrary {
    return new ImageLibrary({
      ...this.toProps(),
      isActive: !this.isActive,
      updatedAt: new Date(),
    });
  }

  /**
   * Convert to response format
   */
  toResponse(): ImageLibraryResponse {
    return {
      id: this.id,
      title: this.title,
      category: this.category,
      thumbnailUrl: this.thumbnailUrl,
      imageUrl: this.imageUrl,
      description: this.description,
      displayOrder: this.displayOrder,
      isActive: this.isActive,
      createdAt:
        this.createdAt && !Number.isNaN(this.createdAt.getTime())
          ? this.createdAt.toISOString()
          : null,
      updatedAt:
        this.updatedAt && !Number.isNaN(this.updatedAt.getTime())
          ? this.updatedAt.toISOString()
          : null,
    };
  }

  /**
   * Convert to public response (for client display)
   */
  toPublicResponse(): ImageLibraryPublicResponse {
    return {
      id: this.id,
      title: this.title,
      category: this.category,
      thumbnailUrl: this.thumbnailUrl,
      imageUrl: this.imageUrl,
      description: this.description,
      displayOrder: this.displayOrder,
    };
  }

  /**
   * Convert to props
   */
  private toProps(): ImageLibraryProps {
    return {
      id: this.id,
      title: this.title,
      category: this.category,
      thumbnailUrl: this.thumbnailUrl,
      imageUrl: this.imageUrl,
      description: this.description,
      displayOrder: this.displayOrder,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

/**
 * Database row type
 */
export interface ImageLibraryDB {
  id: string;
  title: string;
  category: string;
  thumbnail_url: string | null;
  image_url: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * API Response type
 */
export interface ImageLibraryResponse {
  id: string;
  title: string;
  category: ImageLibraryCategory;
  thumbnailUrl: string | null;
  imageUrl: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Public response type (for client display)
 */
export interface ImageLibraryPublicResponse {
  id: string;
  title: string;
  category: ImageLibraryCategory;
  thumbnailUrl: string | null;
  imageUrl: string;
  description: string | null;
  displayOrder: number;
}
