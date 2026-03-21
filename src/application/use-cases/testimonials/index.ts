/**
 * Testimonials Use Cases Index
 */

export {
  GetAllTestimonialsUseCase,
  type GetAllTestimonialsInput,
  type GetAllTestimonialsOutput,
} from "./GetAllTestimonials";

export {
  GetTestimonialStatsUseCase,
  type GetTestimonialStatsOutput,
} from "./GetTestimonialStats";

export {
  GetApprovedTestimonialsUseCase,
  type GetApprovedTestimonialsInput,
  type GetApprovedTestimonialsOutput,
} from "./GetApprovedTestimonials";

export {
  GetTestimonialByIdUseCase,
  type GetTestimonialByIdInput,
  type GetTestimonialByIdOutput,
} from "./GetTestimonialById";

export {
  CreateTestimonialUseCase,
  type CreateTestimonialInput,
  type CreateTestimonialOutput,
} from "./CreateTestimonial";

export {
  UpdateTestimonialStatusUseCase,
  type UpdateTestimonialStatusInput,
  type UpdateTestimonialStatusOutput,
} from "./UpdateTestimonialStatus";

export {
  DeleteTestimonialUseCase,
  type DeleteTestimonialInput,
} from "./DeleteTestimonial";
