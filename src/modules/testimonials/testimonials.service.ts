import * as testimonialRepository from "./testimonials.repository";
import { CreateTestimonialDTO, TestimonialStatus } from "./testimonials.type";

// ── Public ────────────────────────────────────────────────────────────────────

export const getApprovedTestimonials = (page: number = 1, limit: number = 10) =>
  testimonialRepository.findAllApproved(page, limit);

export const submitTestimonial = (dto: CreateTestimonialDTO) =>
  testimonialRepository.create(dto);

// ── Admin ─────────────────────────────────────────────────────────────────────

export const getAllTestimonials = (
  search?: string,
  status?: TestimonialStatus,
  page: number = 1,
  limit: number = 10,
) => testimonialRepository.findAll({ search, status }, page, limit);

export const getTestimonialById = (id: string) =>
  testimonialRepository.findById(id);

export const deleteTestimonial = (id: string) =>
  testimonialRepository.remove(id);

export const approveTestimonial = (id: string) =>
  testimonialRepository.update(id, { status: "approved" });

export const rejectTestimonial = (id: string) =>
  testimonialRepository.update(id, { status: "rejected" });

export const getTestimonialStats = () => testimonialRepository.getStats();
