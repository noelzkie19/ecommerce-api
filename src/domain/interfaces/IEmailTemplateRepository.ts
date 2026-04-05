/**
 * Email Template Repository Interface
 *
 * Defines the contract for email template data access.
 */

export interface EmailTemplate {
  id: string;
  templateKey: string;
  name: string;
  description: string | null;
  subject: string;
  htmlBody: string;
  textBody: string | null;
  category: "order" | "affiliate" | "auth" | "system";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmailTemplateProps {
  templateKey: string;
  name: string;
  description?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  category: "order" | "affiliate" | "auth" | "system";
  isActive?: boolean;
}

export interface UpdateEmailTemplateProps {
  name?: string;
  description?: string;
  subject?: string;
  htmlBody?: string;
  textBody?: string;
  category?: "order" | "affiliate" | "auth" | "system";
  isActive?: boolean;
}

export interface IEmailTemplateRepository {
  findByKey(key: string): Promise<EmailTemplate | null>;
  findAll(): Promise<EmailTemplate[]>;
  findByCategory(category: string): Promise<EmailTemplate[]>;
  findActive(): Promise<EmailTemplate[]>;
  create(props: CreateEmailTemplateProps): Promise<EmailTemplate>;
  update(key: string, props: UpdateEmailTemplateProps): Promise<EmailTemplate>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
