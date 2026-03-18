/**
 * Community Links Admin Controller
 *
 * Handles admin community link management endpoints.
 */

import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import {
  ListCommunityLinksUseCase,
  CreateCommunityLinkUseCase,
  UpdateCommunityLinkUseCase,
  DeleteCommunityLinkUseCase,
} from "../../application/use-cases/community-link";

/**
 * List all community links (admin)
 * GET /api/admin/community-links
 */
export const getLinks = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { category, search, isActive } = req.query as {
      category?: string;
      search?: string;
      isActive?: string;
    };
    const page = Math.max(1, Number.parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit as string) || 10),
    );

    const parseBoolean = (value?: string): boolean | undefined => {
      if (value === "true") return true;
      if (value === "false") return false;
      return undefined;
    };

    const useCase = new ListCommunityLinksUseCase();
    const result = await useCase.execute({
      page,
      limit,
      filters: {
        category: category as
          | "youtube"
          | "facebook"
          | "telegram"
          | "website"
          | "discord"
          | "instagram"
          | "tiktok"
          | "twitter"
          | "linkedin"
          | "other",
        search,
        isActive: parseBoolean(isActive),
      },
    });

    res.json({ success: true, data: result.links, meta: result.meta });
  },
);

/**
 * Create a new community link (admin)
 * POST /api/admin/community-links
 */
export const createLink = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const useCase = new CreateCommunityLinkUseCase();
    const link = await useCase.execute(req.body);
    res.status(201).json({ success: true, data: link });
  },
);

/**
 * Update a community link (admin)
 * PATCH /api/admin/community-links/:id
 */
export const updateLink = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const useCase = new UpdateCommunityLinkUseCase();
    const link = await useCase.execute({ linkId: id, ...req.body });
    sendSuccess(res, link);
  },
);

/**
 * Delete a community link (admin)
 * DELETE /api/admin/community-links/:id
 */
export const deleteLink = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const useCase = new DeleteCommunityLinkUseCase();
    await useCase.execute({ linkId: id });
    res.status(204).send();
  },
);
