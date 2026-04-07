/**
 * Send Template Email Use Case
 *
 * Sends an email using a template with variable substitution.
 */

import { Resend } from "resend";
import { env } from "../../../config/env";
import { AppError } from "../../../common/utils/AppError";
import { emailTemplateRepository } from "../../../infrastructure/database/supabase/SupabaseEmailTemplateRepository";
import {
  renderEmailTemplate,
  validateVariables,
} from "../../../common/utils/emailRenderer";

export interface SendTemplateEmailInput {
  to: string;
  templateKey: string;
  variables: Record<string, string | number>;
  replyTo?: string;
}

export interface SendTemplateEmailOutput {
  success: boolean;
  messageId?: string;
}

export class SendTemplateEmailUseCase {
  private readonly resend: Resend;

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY);
  }

  async execute(
    input: SendTemplateEmailInput,
  ): Promise<SendTemplateEmailOutput> {
    try {
      const { to, templateKey, variables, replyTo } = input;

      // Fetch template from database
      const template = await emailTemplateRepository.findByKey(templateKey);

      if (!template) {
        throw new AppError(`Email template not found: ${templateKey}`, 404);
      }

      if (!template.isActive) {
        throw new AppError(`Email template is inactive: ${templateKey}`, 400);
      }

      // Validate required variables
      const validation = validateVariables(template.htmlBody, variables);
      if (!validation.valid) {
        throw new AppError(
          `Missing required variables for template ${templateKey}: ${validation.missing.join(", ")}`,
          400,
        );
      }

      // Render template with variables
      const { html, text } = renderEmailTemplate({
        htmlBody: template.htmlBody,
        textBody: template.textBody,
        variables,
        includeLogo: false,
      });

      // Replace variables in subject
      const subject = template.subject.replaceAll(
        /\{\{(\w+)\}\}/g,
        (match: string, varName: string) => String(variables[varName] ?? match),
      );

      // Send email
      const result = await this.resend.emails.send({
        from: env.EMAIL_FROM || "Triad365 <noreply@triad365.com>",
        to,
        subject,
        html,
        text,
        replyTo: replyTo || env.EMAIL_REPLY_TO,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new AppError(`Failed to send template email: ${errorMessage}`, 500);
    }
  }
}
