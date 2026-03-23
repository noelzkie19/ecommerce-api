import { resolve } from "../../../di/container";
import { IAffiliatePixelRepository } from "../../../domain/interfaces/IAffiliatePixelRepository";

const META_GRAPH_API_VERSION = "v18.0";
const META_CONVERSIONS_URL = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

export interface RetryFailedEventsInput {
  limit?: number;
}

export interface RetryFailedEventsOutput {
  retryCount: number;
}

const sendPixelEvent = async (
  event: { eventId: string; [key: string]: unknown },
  pixelId: string,
): Promise<{ success: boolean; response?: Record<string, unknown> }> => {
  const token = process.env.META_ACCESS_TOKEN;

  if (!token) {
    return { success: false };
  }

  const url = `${META_CONVERSIONS_URL}/${pixelId}/events`;

  const payload = {
    data: [event],
    access_token: token,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const jsonResult = await response.json();
    const result = jsonResult as {
      events?: Array<{
        events_received: number;
        fbtrace_id: string;
        id: string;
      }>;
      error?: {
        message: string;
        type: string;
        code: number;
        fbtrace_id?: string;
      };
    };

    if (result.error) {
      return { success: false, response: result };
    }

    return { success: true, response: result };
  } catch {
    return { success: false };
  }
};

export const retryFailedEvents = async (
  input: RetryFailedEventsInput = {},
): Promise<RetryFailedEventsOutput> => {
  // Resolve repository from DI container
  const pixelRepository = resolve<IAffiliatePixelRepository>(
    "IAffiliatePixelRepository",
  );

  const limit = input.limit ?? 10;
  const failedEvents = await pixelRepository.getFailedEvents(limit);

  for (const event of failedEvents) {
    const eventData = event.event_data as {
      eventId: string;
      [key: string]: unknown;
    } | null;

    if (!eventData) continue;

    const result = await sendPixelEvent(eventData, event.pixel_id);

    await pixelRepository.updatePixelEventStatus(
      event.id,
      result.success ? "sent" : "failed",
      result.response,
      result.success ? (event.retry_count || 0) + 1 : event.retry_count || 0,
    );
  }

  return { retryCount: limit };
};
