/**
 * IAffiliatePixelRepository Interface
 *
 * Defines the contract for affiliate pixel event data access.
 * This interface is part of the domain layer and should be implemented
 * by the infrastructure layer (e.g., Supabase implementation).
 */

import {
  MetaEventType,
  PixelEventStatus,
  AffiliatePixelEvent,
  PaginatedPixelEvents,
} from "../../application/use-cases/affiliate-pixel";

/**
 * Pixel event input for creation
 */
export interface CreatePixelEventInput {
  affiliateId: string;
  orderId: string;
  eventType: MetaEventType;
  pixelId: string;
  eventId: string;
  eventData?: Record<string, unknown>;
  status: PixelEventStatus;
  metaResponse?: Record<string, unknown>;
}

/**
 * Failed pixel event for retry
 */
export interface FailedPixelEvent {
  id: string;
  affiliate_id: string;
  order_id: string;
  event_type: MetaEventType;
  pixel_id: string;
  event_id: string;
  event_data: Record<string, unknown> | null;
  status: PixelEventStatus;
  retry_count: number;
  meta_response?: Record<string, unknown> | null;
  created_at: string;
  sent_at?: string;
}

/**
 * Pixel event statistics
 */
export interface PixelEventStats {
  total: number;
  sent: number;
  pending: number;
  failed: number;
  byType: Record<string, number>;
}

/**
 * Affiliate pixel repository interface
 * Defines all data access operations for pixel events
 */
export interface IAffiliatePixelRepository {
  /**
   * Create a new pixel event
   */
  createPixelEvent(input: CreatePixelEventInput): Promise<AffiliatePixelEvent>;

  /**
   * Get pixel events by affiliate ID with pagination
   */
  getPixelEventsByAffiliate(
    affiliateId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedPixelEvents>;

  /**
   * Get a single pixel event by ID
   */
  getPixelEventById(id: string): Promise<AffiliatePixelEvent | null>;

  /**
   * Update pixel event status
   */
  updatePixelEventStatus(
    id: string,
    status: PixelEventStatus,
    metaResponse?: Record<string, unknown>,
    retryCount?: number,
  ): Promise<AffiliatePixelEvent>;

  /**
   * Get failed events for retry
   */
  getFailedEvents(limit: number): Promise<FailedPixelEvent[]>;

  /**
   * Get pixel events by order ID
   */
  getPixelEventsByOrder(orderId: string): Promise<AffiliatePixelEvent[]>;

  /**
   * Delete a pixel event
   */
  deletePixelEvent(id: string): Promise<void>;

  /**
   * Get event statistics
   */
  getEventStats(affiliateId?: string): Promise<PixelEventStats>;
}
