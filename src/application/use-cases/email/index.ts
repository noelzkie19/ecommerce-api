/**
 * Email Use Cases Index
 *
 * Exports all email-related use cases.
 */

export {
  SendEmailUseCase,
  type SendEmailInput,
  type SendEmailOutput,
} from "./SendEmail";

export {
  SendTemplateEmailUseCase,
  type SendTemplateEmailInput,
  type SendTemplateEmailOutput,
} from "./SendTemplateEmail";
