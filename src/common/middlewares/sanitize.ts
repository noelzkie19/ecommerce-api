import mongoSanitize from "express-mongo-sanitize";
import { RequestHandler } from "express";
export const sanitizeInput: RequestHandler = mongoSanitize({
  replaceWith: "_",
});
