export { getAffiliatePixelConfig } from "./GetAffiliatePixelConfig";
export { updateAffiliatePixelConfig } from "./UpdateAffiliatePixelConfig";
export { testPixelConfig } from "./TestPixelConfig";
export { getPixelEvents } from "./GetPixelEvents";
export { firePurchaseEvent } from "./FirePurchaseEvent";
export { fireLeadEvent } from "./FireLeadEvent";
export { retryFailedEvents } from "./RetryFailedEvents";

// Re-export from utils for convenience
export type { SendPixelEventResult } from "../../../modules/affiliate-pixel/affiliate-pixel.utils";

// Types
export type {
  GetAffiliatePixelConfigInput,
  AffiliatePixelConfigOutput,
} from "./GetAffiliatePixelConfig";
export type {
  UpdateAffiliatePixelConfigInput,
  UpdateAffiliatePixelConfigOutput,
} from "./UpdateAffiliatePixelConfig";
export type {
  TestPixelConfigInput,
  PixelEventResult as TestPixelConfigResult,
} from "./TestPixelConfig";
export type {
  GetPixelEventsInput,
  GetPixelEventsOutput,
  PixelEventData,
} from "./GetPixelEvents";
export type { FirePurchaseEventInput } from "./FirePurchaseEvent";
export type { FireLeadEventInput } from "./FireLeadEvent";
export type {
  RetryFailedEventsInput,
  RetryFailedEventsOutput,
} from "./RetryFailedEvents";
