// Meta API constants
const META_GRAPH_API_VERSION = "v18.0";
const META_CONVERSIONS_URL = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

export interface SendPixelEventInput {
  event: Record<string, unknown>;
  pixelId: string;
  accessToken?: string;
}

export interface PixelEventResult {
  success: boolean;
  eventId: string;
  pixelId: string;
  response?: Record<string, unknown>;
  error?: string;
}

export const sendPixelEvent = async (
  input: SendPixelEventInput,
): Promise<PixelEventResult> => {
  const token = input.accessToken || process.env.META_ACCESS_TOKEN;

  if (!token) {
    return {
      success: false,
      eventId: (input.event.eventId as string) || "",
      pixelId: input.pixelId,
      error: "Meta access token not configured",
      response: undefined,
    };
  }

  const url = `${META_CONVERSIONS_URL}/${input.pixelId}/events`;

  const payload = {
    data: [input.event],
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
      return {
        success: false,
        eventId: (input.event.eventId as string) || "",
        pixelId: input.pixelId,
        error: result.error.message,
        response: result,
      };
    }

    return {
      success: true,
      eventId: (input.event.eventId as string) || "",
      pixelId: input.pixelId,
      response: result,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      eventId: (input.event.eventId as string) || "",
      pixelId: input.pixelId,
      error: errorMessage,
    };
  }
};
