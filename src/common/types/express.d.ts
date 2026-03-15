import { User } from "@supabase/supabase-js";
import { AttributionData } from "../../modules/affiliate-tracking/affiliate-tracking.types";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      affiliateAttribution?: AttributionData;
    }
  }
}
