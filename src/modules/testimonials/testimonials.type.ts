export type TestimonialStatus = "pending" | "approved" | "rejected";

export interface Testimonial {
  id: string;
  customerName: string;
  location: string | null;
  rating: number;
  message: string;
  status: TestimonialStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTestimonialDTO {
  customerName: string;
  location?: string | null;
  rating: number;
  message: string;
}

export interface UpdateTestimonialDTO {
  customerName?: string;
  location?: string;
  rating?: number;
  message?: string;
  status?: TestimonialStatus;
}

export interface TestimonialStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  averageRating: number;
}
