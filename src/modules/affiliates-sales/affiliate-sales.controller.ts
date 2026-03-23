/**
 * Affiliate Sales Controller
 *
 * Handles HTTP requests for affiliate sales endpoints.
 */

import { Request, Response } from "express";
import { catchAsync } from "../../common/utils/catchAsync";
import { sendSuccess } from "../../common/utils/response";
import { AppError } from "../../common/utils/AppError";
import {
  ListAffiliateSalesUseCase,
  GetAffiliateSaleUseCase,
  UpdateAffiliateSaleStatusUseCase,
  ApproveAffiliateSaleUseCase,
  RejectAffiliateSaleUseCase,
  DeleteAffiliateSaleUseCase,
  AffiliateSaleStatus,
} from "../../application/use-cases/affiliate-sales";

// ── Helpers ───────────────────────────────────────────────────────────────────

const queryString = (val: unknown): string | undefined =>
  typeof val === "string" ? val : undefined;

const queryInt = (val: unknown, fallback: number): number => {
  const n = typeof val === "string" ? Number.parseInt(val, 10) : Number.NaN;
  return Number.isNaN(n) ? fallback : Math.max(1, n);
};

// ── GET /api/affiliate-sales ──────────────────────────────────────────────────

export const getSales = catchAsync(async (req: Request, res: Response) => {
  const page = queryInt(req.query.page, 1);
  const limit = queryInt(req.query.limit, 20);
  const affiliateId = queryString(req.query.affiliateId);
  const search = queryString(req.query.search);
  const status = queryString(req.query.status) as
    | AffiliateSaleStatus
    | undefined;

  const useCase = new ListAffiliateSalesUseCase();
  const result = await useCase.execute({
    page,
    limit,
    affiliateId,
    status,
    search,
  });

  sendSuccess(res, result);
});

// ── GET /api/affiliate-sales/:id ──────────────────────────────────────────────

export const getSale = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const useCase = new GetAffiliateSaleUseCase();
  const sale = await useCase.execute({ id });
  sendSuccess(res, sale);
});

// ── PATCH /api/affiliate-sales/:id/status ─────────────────────────────────────

export const updateSaleStatus = catchAsync(
  async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const { status } = req.body;

    if (!status) throw new AppError("Status is required", 400);

    const VALID = new Set<AffiliateSaleStatus>([
      "pending",
      "approved",
      "rejected",
    ]);
    if (!VALID.has(status)) throw new AppError("Invalid status", 400);

    const useCase = new UpdateAffiliateSaleStatusUseCase();
    const sale = await useCase.execute({ id, status });

    // If approving, update affiliate totals via the use case (handled internally)
    sendSuccess(res, sale, "Sale status updated");
  },
);

// ── PATCH /api/affiliate-sales/:id/approve ────────────────────────────────────

export const approveSale = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const useCase = new ApproveAffiliateSaleUseCase();
  const sale = await useCase.execute({ id });
  sendSuccess(res, sale, "Sale approved");
});

// ── PATCH /api/affiliate-sales/:id/reject ─────────────────────────────────────

export const rejectSale = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const useCase = new RejectAffiliateSaleUseCase();
  const sale = await useCase.execute({ id });
  sendSuccess(res, sale, "Sale rejected");
});

// ── DELETE /api/affiliate-sales/:id ──────────────────────────────────────────

export const deleteSale = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);

  const useCase = new DeleteAffiliateSaleUseCase();
  await useCase.execute({ id });

  res.status(204).send();
});
