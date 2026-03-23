import { Request } from "express";
import { AppError } from "../utils/AppError";
import type { CartOwner } from "../../domain/interfaces/ICartRepository";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Options for resolving owner from request
 */
export interface ResolveOwnerOptions {
  /** If true, throws an error when neither user nor guest ID is found */
  required?: boolean;
  /** Custom error message when neither user nor guest ID is found */
  requiredMessage?: string;
}

/**
 * Resolves cart/order ownership from the request.
 *
 * Priority:
 * 1. Authenticated user (req.user.id)
 * 2. Guest ID from x-guest-id header
 *
 * @param req - Express request object
 * @param options - Configuration options
 * @returns CartOwner object with either userId or guestId
 * @throws AppError if required is true and neither ID is found
 *
 * @example
 * // For authenticated user
 * const owner = resolveOwner(req); // { userId: 'user-uuid' }
 *
 * @example
 * // For guest user (required)
 * const owner = resolveOwner(req, { required: true });
 * // Throws AppError if neither user nor guest ID
 *
 * @example
 * // For optional owner (e.g., viewing products)
 * const owner = resolveOwner(req, { required: false });
 * // Returns { userId: undefined, guestId: undefined } if neither found
 */
export const resolveOwner = (
  req: Request,
  options: ResolveOwnerOptions = {},
): CartOwner => {
  const { required = false, requiredMessage } = options;

  // Priority 1: Authenticated user
  if (req.user?.id) {
    return { userId: req.user.id };
  }

  // Priority 2: Guest ID from header
  const guestId = req.headers["x-guest-id"];
  if (typeof guestId === "string" && UUID_REGEX.test(guestId)) {
    return { guestId };
  }

  // No valid owner found
  if (required) {
    throw new AppError(
      requiredMessage ??
        "A valid x-guest-id header (UUID) is required for guest access",
      400,
    );
  }

  // Return empty owner for optional resolution
  return { userId: undefined, guestId: undefined };
};

/**
 * Validates if a string is a valid UUID
 */
export const isValidUUID = (value: string): boolean => {
  return UUID_REGEX.test(value);
};

/**
 * Extracts owner ID from request without throwing
 * Returns undefined if neither user nor guest ID is found
 */
export const extractOwnerId = (req: Request): string | undefined => {
  return req.user?.id ?? (req.headers["x-guest-id"] as string);
};

/**
 * Checks if the request has a valid owner (user or guest)
 */
export const hasValidOwner = (req: Request): boolean => {
  return (
    !!req.user?.id ||
    (typeof req.headers["x-guest-id"] === "string" &&
      UUID_REGEX.test(req.headers["x-guest-id"]))
  );
};
