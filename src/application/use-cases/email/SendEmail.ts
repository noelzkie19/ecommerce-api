/**
 * Send Email Use Case
 *
 * Sends a raw email using Resend API.
 */

import { Resend } from "resend";
import { env } from "../../../config/env";
import { AppError } from "../../../common/utils/AppError";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailOutput {
  success: boolean;
  messageId?: string;
}

export class SendEmailUseCase {
  private readonly resend: Resend;

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY);
  }

  async execute(input: SendEmailInput): Promise<SendEmailOutput> {
    try {
      const { to, subject, html, text, replyTo } = input;

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
      throw new AppError(`Failed to send email: ${errorMessage}`, 500);
    }
  }
}
