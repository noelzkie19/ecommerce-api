/**
 * Supabase Email Template Repository
 *
 * Implements email template data access using Supabase.
 */

import { supabaseAdmin } from "../../../config/supabase";
import { AppError } from "../../../common/utils/AppError";
import {
  CreateEmailTemplateProps,
  EmailTemplate,
  IEmailTemplateRepository,
  UpdateEmailTemplateProps,
} from "@/domain/interfaces/IEmailTemplateRepository";

const db = supabaseAdmin as any;

export class SupabaseEmailTemplateRepository
  implements IEmailTemplateRepository
{
  /**
   * Find template by key
   */
  async findByKey(key: string): Promise<EmailTemplate | null> {
    const { data, error } = await db
      .from("email_templates")
      .select("*")
      .eq("template_key", key)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapToEntity(data);
  }

  /**
   * Find all templates
   */
  async findAll(): Promise<EmailTemplate[]> {
    const { data, error } = await db
      .from("email_templates")
      .select("*")
      .order("category", { ascending: true })
      .order("template_key", { ascending: true });

    if (error) {
      throw new AppError(
        `Failed to fetch email templates: ${error.message}`,
        500,
      );
    }

    return (data || []).map(this.mapToEntity);
  }

  /**
   * Find templates by category
   */
  async findByCategory(category: string): Promise<EmailTemplate[]> {
    const { data, error } = await db
      .from("email_templates")
      .select("*")
      .eq("category", category)
      .order("template_key", { ascending: true });

    if (error) {
      throw new AppError(
        `Failed to fetch email templates by category: ${error.message}`,
        500,
      );
    }

    return (data || []).map(this.mapToEntity);
  }

  /**
   * Find active templates only
   */
  async findActive(): Promise<EmailTemplate[]> {
    const { data, error } = await db
      .from("email_templates")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("template_key", { ascending: true });

    if (error) {
      throw new AppError(
        `Failed to fetch active email templates: ${error.message}`,
        500,
      );
    }

    return (data || []).map(this.mapToEntity);
  }

  /**
   * Create a new template
   */
  async create(props: CreateEmailTemplateProps): Promise<EmailTemplate> {
    const { data, error } = await db
      .from("email_templates")
      .insert({
        template_key: props.templateKey,
        name: props.name,
        description: props.description || null,
        subject: props.subject,
        html_body: props.htmlBody,
        text_body: props.textBody || null,
        category: props.category,
        is_active: props.isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      throw new AppError(
        `Failed to create email template: ${error.message}`,
        500,
      );
    }

    return this.mapToEntity(data);
  }

  /**
   * Update an existing template
   */
  async update(
    key: string,
    props: UpdateEmailTemplateProps,
  ): Promise<EmailTemplate> {
    const updateData: Record<string, any> = {};

    if (props.name !== undefined) updateData.name = props.name;
    if (props.description !== undefined)
      updateData.description = props.description;
    if (props.subject !== undefined) updateData.subject = props.subject;
    if (props.htmlBody !== undefined) updateData.html_body = props.htmlBody;
    if (props.textBody !== undefined) updateData.text_body = props.textBody;
    if (props.category !== undefined) updateData.category = props.category;
    if (props.isActive !== undefined) updateData.is_active = props.isActive;

    const { data, error } = await db
      .from("email_templates")
      .update(updateData)
      .eq("template_key", key)
      .select()
      .single();

    if (error) {
      throw new AppError(
        `Failed to update email template: ${error.message}`,
        500,
      );
    }

    return this.mapToEntity(data);
  }

  /**
   * Delete a template
   */
  async delete(key: string): Promise<void> {
    const { error } = await db
      .from("email_templates")
      .delete()
      .eq("template_key", key);

    if (error) {
      throw new AppError(
        `Failed to delete email template: ${error.message}`,
        500,
      );
    }
  }

  /**
   * Check if template exists
   */
  async exists(key: string): Promise<boolean> {
    const { count, error } = await db
      .from("email_templates")
      .select("*", { count: "exact", head: true })
      .eq("template_key", key);

    if (error) {
      throw new AppError(
        `Failed to check email template existence: ${error.message}`,
        500,
      );
    }

    return (count ?? 0) > 0;
  }

  /**
   * Map database row to entity
   */
  private mapToEntity(row: any): EmailTemplate {
    return {
      id: row.id,
      templateKey: row.template_key,
      name: row.name,
      description: row.description,
      subject: row.subject,
      htmlBody: row.html_body,
      textBody: row.text_body,
      category: row.category,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

// Singleton instance
export const emailTemplateRepository = new SupabaseEmailTemplateRepository();
