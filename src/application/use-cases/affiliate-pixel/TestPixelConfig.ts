import * as crypto from "node:crypto";
import { AppError } from "../../../common/utils/AppError";

const META_GRAPH_API_VERSION = "v18.0";
const META_CONVERSIONS_URL = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

// Hash function for Meta API (SHA256)
const hashData = (data: string): string => {
  return crypto
    .createHash("sha256")
    .update(data.toLowerCase().trim())
    .digest("hex");
};

export interface TestPixelConfigInput {
  pixelId: string;
  testEventCode?: string;
}

export interface PixelEventResult {
  success: boolean;
  eventId: string;
  pixelId: string;
  response?: Record<string, unknown>;
  error?: string;
}

export const testPixelConfig = async (
  input: TestPixelConfigInput,
): Promise<PixelEventResult> => {
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    throw new AppError("Meta access token not configured", 500);
  }

  const url = `${META_CONVERSIONS_URL}/${input.pixelId}/events`;

  // Build a simple test event with correct Meta API format
  // Must include at least one customer information parameter
  const testEvent = {
    event_name: "PageView",
    event_time: Math.floor(Date.now() / 1000),
    event_id: `test_${Date.now()}`,
    user_data: {
      // At least one customer info parameter required - must be SHA256 hashed
      em: [hashData("test@example.com")], // SHA256 hashed email
    },
    custom_data: {
      value: 0,
      currency: "PHP",
    },
    action_source: "website",
  };

  // Add test event code if provided
  const payload: Record<string, unknown> = {
    data: [testEvent],
    access_token: accessToken,
  };

  if (input.testEventCode) {
    payload.test_event_code = input.testEventCode;
  }

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
        eventId: testEvent.event_id,
        pixelId: input.pixelId,
        error: result.error.message,
        response: result,
      };
    }

    return {
      success: true,
      eventId: testEvent.event_id,
      pixelId: input.pixelId,
      response: result,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      eventId: testEvent.event_id,
      pixelId: input.pixelId,
      error: errorMessage,
    };
  }
};
