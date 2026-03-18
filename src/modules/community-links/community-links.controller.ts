/**
 * Community Links Public Controller
 *
 * Handles public community link endpoints.
 */

import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import {
  ListCommunityLinksUseCase,
  GetCommunityLinkUseCase,
} from "../../application/use-cases/community-link";

/**
 * List active community links
 * GET /api/community-links
 */
export const getLinks = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const { category, search } = req.query as {
      category?: string;
      search?: string;
    };
    const page = Math.max(1, Number.parseInt(req.query.page as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit as string) || 10),
    );

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
        isActive: true,
      },
    });

    res.json({ success: true, data: result.links, meta: result.meta });
  },
);

/**
 * Get a single community link by ID
 * GET /api/community-links/:id
 */
export const getLinkById = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const useCase = new GetCommunityLinkUseCase();
    const link = await useCase.execute({ linkId: id });

    if (!link) {
      res
        .status(404)
        .json({ success: false, message: "Community link not found" });
      return;
    }

    sendSuccess(res, link);
  },
);
