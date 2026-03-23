/**
 * CommunityLink Entity
 *
 * Represents a community link displayed on the client side.
 */

export type CommunityLinkCategory =
  | "youtube"
  | "facebook"
  | "telegram"
  | "website"
  | "discord"
  | "instagram"
  | "tiktok"
  | "twitter"
  | "linkedin"
  | "other";

export interface CommunityLinkProps {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: CommunityLinkCategory;
  icon: string | null;
  imageUrl: string | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommunityLinkProps {
  title: string;
  url: string;
  description?: string;
  category?: CommunityLinkCategory;
  icon?: string;
  imageUrl?: string;
  orderIndex?: number;
  isActive?: boolean;
}

export interface UpdateCommunityLinkProps {
  title?: string;
  url?: string;
  description?: string | null;
  category?: CommunityLinkCategory;
  icon?: string | null;
  imageUrl?: string | null;
  orderIndex?: number;
  isActive?: boolean;
}

/**
 * CommunityLink Entity with business logic
 */
export class CommunityLink {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly description: string | null;
  readonly category: CommunityLinkCategory;
  readonly icon: string | null;
  readonly imageUrl: string | null;
  readonly orderIndex: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: CommunityLinkProps) {
    this.id = props.id;
    this.title = props.title;
    this.url = props.url;
    this.description = props.description;
    this.category = props.category;
    this.icon = props.icon;
    this.imageUrl = props.imageUrl;
    this.orderIndex = props.orderIndex;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Factory method to create a new CommunityLink
   */
  static create(
    props: CreateCommunityLinkProps & { id: string },
  ): CommunityLink {
    const now = new Date();
    return new CommunityLink({
      id: props.id,
      title: props.title,
      url: props.url,
      description: props.description ?? null,
      category: props.category ?? "other",
      icon: props.icon ?? null,
      imageUrl: props.imageUrl ?? null,
      orderIndex: props.orderIndex ?? 0,
      isActive: props.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Create CommunityLink from database row
   */
  static fromDatabase(row: CommunityLinkDB): CommunityLink {
    return new CommunityLink({
      id: row.id,
      title: row.title,
      url: row.url,
      description: row.description,
      category: row.category as CommunityLinkCategory,
      icon: row.icon,
      imageUrl: row.image_url,
      orderIndex: row.order_index,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  /**
   * Check if link is active
   */
  isActiveLink(): boolean {
    return this.isActive;
  }

  /**
   * Update the community link
   */
  update(props: UpdateCommunityLinkProps): CommunityLink {
    return new CommunityLink({
      ...this.toProps(),
      title: props.title ?? this.title,
      url: props.url ?? this.url,
      description: props.description ?? this.description,
      category: props.category ?? this.category,
      icon: props.icon ?? this.icon,
      imageUrl: props.imageUrl ?? this.imageUrl,
      orderIndex: props.orderIndex ?? this.orderIndex,
      isActive: props.isActive ?? this.isActive,
      updatedAt: new Date(),
    });
  }

  /**
   * Toggle active status
   */
  toggleActive(): CommunityLink {
    return new CommunityLink({
      ...this.toProps(),
      isActive: !this.isActive,
      updatedAt: new Date(),
    });
  }

  /**
   * Convert to response format
   */
  toResponse(): CommunityLinkResponse {
    return {
      id: this.id,
      title: this.title,
      url: this.url,
      description: this.description,
      category: this.category,
      icon: this.icon,
      imageUrl: this.imageUrl,
      orderIndex: this.orderIndex,
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
   * Convert to public response (hides sensitive data)
   */
  toPublicResponse(): CommunityLinkPublicResponse {
    return {
      id: this.id,
      title: this.title,
      url: this.url,
      description: this.description,
      category: this.category,
      icon: this.icon,
      imageUrl: this.imageUrl,
      orderIndex: this.orderIndex,
    };
  }

  /**
   * Convert to props
   */
  private toProps(): CommunityLinkProps {
    return {
      id: this.id,
      title: this.title,
      url: this.url,
      description: this.description,
      category: this.category,
      icon: this.icon,
      imageUrl: this.imageUrl,
      orderIndex: this.orderIndex,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

/**
 * Database row type
 */
export interface CommunityLinkDB {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: string;
  icon: string | null;
  image_url: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * API Response type
 */
export interface CommunityLinkResponse {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: CommunityLinkCategory;
  icon: string | null;
  imageUrl: string | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Public response type (for client display)
 */
export interface CommunityLinkPublicResponse {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: CommunityLinkCategory;
  icon: string | null;
  imageUrl: string | null;
  orderIndex: number;
}
