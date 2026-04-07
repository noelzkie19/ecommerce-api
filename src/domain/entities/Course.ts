/**
 * Course Entity
 *
 * Represents a course (YouTube video) in the e-commerce platform.
 * This is a core domain entity that contains pure business logic.
 */

/**
 * YouTube URL Parser
 * Extracts video ID from various YouTube URL formats
 */
export class YouTubeVideo {
  readonly videoId: string;
  readonly originalUrl: string;

  private constructor(videoId: string, originalUrl: string) {
    this.videoId = videoId;
    this.originalUrl = originalUrl;
  }

  /**
   * Parse YouTube URL and extract video ID
   */
  static fromUrl(url: string): YouTubeVideo | null {
    const videoId = extractVideoId(url);
    if (!videoId) {
      return null;
    }
    return new YouTubeVideo(videoId, url);
  }

  /**
   * Get thumbnail URL
   */
  getThumbnailUrl(quality: ThumbnailQuality = "medium"): string {
    const qualityMap: Record<ThumbnailQuality, string> = {
      default: "default",
      medium: "mqdefault",
      high: "hqdefault",
      max: "maxresdefault",
    };
    return `https://img.youtube.com/vi/${this.videoId}/${qualityMap[quality]}.jpg`;
  }

  /**
   * Get embed URL
   */
  getEmbedUrl(): string {
    return `https://www.youtube.com/embed/${this.videoId}`;
  }

  /**
   * Get watch URL
   */
  getWatchUrl(): string {
    return `https://www.youtube.com/watch?v=${this.videoId}`;
  }
}

/**
 * Thumbnail quality options
 */
export type ThumbnailQuality = "default" | "medium" | "high" | "max";

/**
 * Course entity with business logic
 */
export class Course {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly youtubeUrl: string;
  readonly youtubeVideoId: string;
  readonly thumbnailUrl: string | null;
  readonly category: string | null;
  readonly isPremium: boolean;
  readonly isActive: boolean;
  readonly viewsCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: CourseProps) {
    this.id = props.id;
    this.title = props.title;
    this.description = props.description;
    this.youtubeUrl = props.youtubeUrl;
    this.youtubeVideoId = props.youtubeVideoId;
    this.thumbnailUrl = props.thumbnailUrl;
    this.category = props.category;
    this.isPremium = props.isPremium;
    this.isActive = props.isActive;
    this.viewsCount = props.viewsCount;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Factory method to create a new Course
   */
  static create(props: CreateCourseProps): Course {
    const video = YouTubeVideo.fromUrl(props.youtubeUrl);
    const videoId = video?.videoId ?? props.youtubeVideoId;

    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    const thumbnailUrl =
      props.thumbnailUrl ?? video?.getThumbnailUrl("high") ?? null;

    return new Course({
      id: props.id,
      title: props.title,
      description: props.description ?? null,
      youtubeUrl: props.youtubeUrl,
      youtubeVideoId: videoId,
      thumbnailUrl,
      category: props.category ?? null,
      isPremium: props.isPremium ?? false,
      isActive: props.isActive ?? true,
      viewsCount: props.viewsCount ?? 0,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  /**
   * Create Course from database row
   */
  static fromDatabase(row: CourseDatabaseRow): Course {
    return new Course({
      id: row.id,
      title: row.title,
      description: row.description,
      youtubeUrl: row.youtube_url,
      youtubeVideoId: row.youtube_video_id,
      thumbnailUrl: row.thumbnail_url,
      category: row.category,
      isPremium: row.is_premium ?? false,
      isActive: row.is_active ?? true,
      viewsCount: row.views_count ?? 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  /**
   * Check if course has thumbnail
   */
  hasThumbnail(): boolean {
    return this.thumbnailUrl !== null;
  }

  /**
   * Get embed URL
   */
  getEmbedUrl(): string {
    return `https://www.youtube.com/embed/${this.youtubeVideoId}`;
  }

  /**
   * Increment views
   */
  incrementViews(): Course {
    return new Course({
      ...this.toProps(),
      viewsCount: this.viewsCount + 1,
      updatedAt: new Date(),
    });
  }

  /**
   * Update title
   */
  updateTitle(title: string): Course {
    return new Course({
      ...this.toProps(),
      title,
      updatedAt: new Date(),
    });
  }

  /**
   * Toggle premium status
   */
  togglePremium(): Course {
    return new Course({
      ...this.toProps(),
      isPremium: !this.isPremium,
      updatedAt: new Date(),
    });
  }

  /**
   * Convert to plain object for response
   */
  toResponse(): CourseResponse {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      youtubeUrl: this.youtubeUrl,
      youtubeVideoId: this.youtubeVideoId,
      thumbnailUrl: this.thumbnailUrl,
      category: this.category,
      isPremium: this.isPremium,
      isActive: this.isActive,
      viewsCount: this.viewsCount,
      embedUrl: this.getEmbedUrl(),
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

  private toProps(): CourseProps {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      youtubeUrl: this.youtubeUrl,
      youtubeVideoId: this.youtubeVideoId,
      thumbnailUrl: this.thumbnailUrl,
      category: this.category,
      isPremium: this.isPremium,
      isActive: this.isActive,
      viewsCount: this.viewsCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

/**
 * Course properties (internal)
 */
interface CourseProps {
  id: string;
  title: string;
  description: string | null;
  youtubeUrl: string;
  youtubeVideoId: string;
  thumbnailUrl: string | null;
  category: string | null;
  isPremium: boolean;
  isActive: boolean;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Properties for creating a new Course
 */
export interface CreateCourseProps {
  id: string;
  title: string;
  description?: string | null;
  youtubeUrl: string;
  youtubeVideoId?: string;
  thumbnailUrl?: string | null;
  category?: string | null;
  isPremium?: boolean;
  isActive?: boolean;
  viewsCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Properties for updating a Course
 */
export interface UpdateCourseProps {
  title?: string;
  description?: string | null;
  youtubeUrl?: string;
  thumbnailUrl?: string | null;
  category?: string | null;
  isPremium?: boolean;
  isActive?: boolean;
}

/**
 * Course filters
 */
export interface CourseFilters {
  category?: string;
  search?: string;
  isPremium?: boolean;
  isActive?: boolean;
}

/**
 * Database row type (snake_case from Supabase)
 */
export interface CourseDatabaseRow {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  youtube_video_id: string;
  thumbnail_url: string | null;
  category: string | null;
  is_premium: boolean | null;
  is_active: boolean | null;
  views_count: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * API Response type
 */
export interface CourseResponse {
  id: string;
  title: string;
  description: string | null;
  youtubeUrl: string;
  youtubeVideoId: string;
  thumbnailUrl: string | null;
  category: string | null;
  isPremium: boolean;
  isActive: boolean;
  viewsCount: number;
  embedUrl: string;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  if (!url) return null;

  // Handle youtu.be format
  const shortMatch = /youtu\.be\/([a-zA-Z0-9_-]{11})/.exec(url);
  if (shortMatch) return shortMatch[1];

  // Handle youtube.com/watch?v= format
  const watchMatch = /[?&]v=([a-zA-Z0-9_-]{11})/.exec(url);
  if (watchMatch) return watchMatch[1];

  // Handle youtube.com/embed/ format
  const embedMatch = /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/.exec(url);
  if (embedMatch) return embedMatch[1];

  // Handle youtube.com/v/ format
  const vMatch = /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/.exec(url);
  if (vMatch) return vMatch[1];

  return null;
}

/**
 * Validate YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
}
