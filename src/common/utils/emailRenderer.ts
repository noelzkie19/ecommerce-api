/**
 * Email Template Renderer
 *
 * Renders email templates with variable substitution.
 * Supports {{variable}} placeholders and logo injection.
 */

const LOGO_URL =
  "https://tegmordfacxihrdnzesp.supabase.co/storage/v1/object/public/logo/logo.jpg";

export interface RenderTemplateOptions {
  htmlBody: string;
  textBody?: string | null;
  variables: Record<string, string | number>;
  includeLogo?: boolean;
}

/**
 * Replace {{variable}} placeholders with actual values
 */
function replaceVariables(
  template: string,
  variables: Record<string, string | number>,
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replaceAll(placeholder, String(value));
  }

  return result;
}

/**
 * Inject logo into HTML template
 */
function injectLogo(html: string): string {
  const logoHtml = `
    <div style="text-align: center; padding: 30px 20px; background-color: #1D3557;">
      <img 
        src="${LOGO_URL}" 
        alt="Triad365" 
        style="max-width: 180px; height: auto; display: block; margin: 0 auto;"
      />
    </div>
  `;

  if (html.includes("<body>")) {
    return html.replace("<body>", `<body>${logoHtml}`);
  } else if (html.includes("<body ")) {
    return html.replace(/<body[^>]*>/, `$&${logoHtml}`);
  } else {
    return logoHtml + html;
  }
}

/**
 * Render email template with variables
 */
export function renderEmailTemplate(options: RenderTemplateOptions): {
  html: string;
  text: string;
} {
  const { htmlBody, textBody, variables, includeLogo = false } = options;

  let renderedHtml = replaceVariables(htmlBody, variables);

  if (includeLogo) {
    renderedHtml = injectLogo(renderedHtml);
  }

  const renderedText = textBody
    ? replaceVariables(textBody, variables)
    : stripHtml(renderedHtml);

  return {
    html: renderedHtml,
    text: renderedText,
  };
}

/**
 * Strip HTML tags for plain text fallback
 */
function stripHtml(html: string): string {
  return html
    .replaceAll(/<[^>]*>/g, "")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll(/\s+/g, " ")
    .trim();
}

/**
 * Validate that all required variables are present
 */
export function validateVariables(
  template: string,
  variables: Record<string, string | number>,
): { valid: boolean; missing: string[] } {
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  const requiredVars = new Set<string>();
  let match;

  while ((match = placeholderRegex.exec(template)) !== null) {
    requiredVars.add(match[1]);
  }

  const missing = Array.from(requiredVars).filter(
    (varName) => !(varName in variables),
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}
