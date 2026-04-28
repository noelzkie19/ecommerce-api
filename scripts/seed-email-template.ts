/**
 * Seed Email Templates Script (Orange Theme - Professional)
 *
 * Inserts all email templates into Supabase with refined orange professional design.
 * Brand colors: #f97316 (primary), #ea580c (dark), #ffedd5 (light bg)
 *
 * Run with: npx tsx scripts/seed-email-templates-orange.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const LOGO_URL =
  "https://dpjyebbmblskgexdhiip.supabase.co/storage/v1/object/public/logo/logo.png";

// =============================================================================
// DESIGN SYSTEM — PROFESSIONAL GREEN THEME
// =============================================================================

const DS = {
  color: {
    primary: "#f97316",
    primaryDark: "#ea580c",
    primaryDeep: "#9a3412",
    primaryLight: "#ffedd5",
    primaryMid: "#fed7aa",
    accent: "#fb923c",
    white: "#FFFFFF",
    bgPage: "#fff7ed",
    bgCard: "#FFFFFF",
    bgSubtle: "#fffaf0",
    border: "#fed7aa",
    borderStrong: "#fdba74",
    textPrimary: "#111827",
    textBody: "#374151",
    textMuted: "#6B7280",
    textLight: "#9CA3AF",
    success: "#f97316",
    warning: "#d97706",
    error: "#dc2626",
  },
  font: {
    stack: "'Georgia', 'Times New Roman', serif",
    body: "'Helvetica Neue', Arial, sans-serif",
  },
};

// =============================================================================
// SHARED HTML COMPONENTS
// =============================================================================

/** Top preheader bar — invisible preview text for email clients */
function preheader(text: string): string {
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#f0fdf4;">${text}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>`;
}

/** Full-width white logo bar at the very top */
function logoBar(): string {
  return `
    <!-- LOGO BAR -->
    <tr>
      <td style="background-color:#FFFFFF; padding: 20px 30px; text-align:center; border-bottom: 1px solid ${DS.color.border};">
        <img
          src="${LOGO_URL}"
          alt="Nanu Health Shop"
          width="160"
          style="display:inline-block; height:auto; max-width:160px; border:0;"
        />
      </td>
    </tr>
  `;
}

/** Green gradient hero banner with title */
function heroBanner(title: string, subtitle?: string): string {
  return `
    <!-- HERO BANNER -->
    <tr>
      <td style="
        background: linear-gradient(135deg, ${DS.color.primary} 0%, ${DS.color.primaryDeep} 100%);
        padding: 36px 30px 32px;
        text-align: center;
      ">
        <h1 style="
          margin: 0 0 ${subtitle ? "8px" : "0"};
          color: #FFFFFF;
          font-family: ${DS.font.body};
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -0.3px;
          line-height: 1.3;
        ">${title}</h1>
        ${subtitle ? `<p style="margin:0; color: rgba(255,255,255,0.80); font-family:${DS.font.body}; font-size:14px; letter-spacing:0.4px; text-transform:uppercase;">${subtitle}</p>` : ""}
      </td>
    </tr>
  `;
}

/** Thin green accent strip below hero */
function accentStrip(): string {
  return `
    <tr>
      <td style="height:4px; background: linear-gradient(90deg, ${DS.color.accent} 0%, ${DS.color.primaryDark} 100%);"></td>
    </tr>
  `;
}

/** Professional footer */
function footer(): string {
  return `
    <!-- FOOTER -->
    <tr>
      <td style="background-color: ${DS.color.bgSubtle}; padding: 28px 30px; border-top: 1px solid ${DS.color.border};">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align:center; padding-bottom:12px;">
              <img src="${LOGO_URL}" alt="Nanu Health" width="100" style="height:auto; opacity:0.7;" />
            </td>
          </tr>
          <tr>
            <td style="text-align:center;">
              <p style="margin:0 0 6px; font-family:${DS.font.body}; font-size:12px; color:${DS.color.textLight}; line-height:1.6;">
                © {{year}} Nanu Health Shop. All rights reserved.
              </p>
              <p style="margin:0; font-family:${DS.font.body}; font-size:12px; color:${DS.color.textLight};">
                Questions? Email us at
                <a href="mailto:support@nanu-health.com"
                   style="color:${DS.color.primary}; text-decoration:none; font-weight:600;">
                  support@nanu-health.com
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

/** CTA button */
function btn(label: string, url: string): string {
  return `
    <table cellpadding="0" cellspacing="0" style="margin: 28px auto 0;">
      <tr>
        <td style="
          background: linear-gradient(135deg, ${DS.color.primary} 0%, ${DS.color.primaryDark} 100%);
          border-radius: 6px;
        ">
          <a href="${url}" style="
            display: inline-block;
            padding: 13px 32px;
            color: #FFFFFF;
            font-family: ${DS.font.body};
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 0.3px;
            text-decoration: none;
          ">${label}</a>
        </td>
      </tr>
    </table>
  `;
}

/** Callout / info box */
function callout(
  html: string,
  type: "green" | "yellow" | "red" = "green",
): string {
  const palette = {
    green: {
      bg: DS.color.primaryLight,
      bar: DS.color.primary,
      text: DS.color.primaryDeep,
    },
    yellow: { bg: "#FEF9C3", bar: DS.color.warning, text: "#78350F" },
    red: { bg: "#FEE2E2", bar: DS.color.error, text: "#7F1D1D" },
  }[type];

  return `
    <table cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
      <tr>
        <td style="
          background-color: ${palette.bg};
          border-left: 4px solid ${palette.bar};
          border-radius: 4px;
          padding: 16px 18px;
        ">
          <p style="margin:0; font-family:${DS.font.body}; font-size:14px; color:${palette.text}; line-height:1.6;">
            ${html}
          </p>
        </td>
      </tr>
    </table>
  `;
}

/** Details / summary table */
function detailsTable(
  rows: { label: string; value: string; highlight?: boolean }[],
): string {
  const rowsHtml = rows
    .map((r, i) => {
      const isLast = i === rows.length - 1;
      return `
      <tr>
        <td style="
          padding: 11px 16px;
          font-family: ${DS.font.body};
          font-size: 14px;
          color: ${DS.color.textMuted};
          ${isLast ? "" : `border-bottom: 1px solid ${DS.color.border};`}
          width: 50%;
        ">${r.label}</td>
        <td style="
          padding: 11px 16px;
          font-family: ${DS.font.body};
          font-size: 14px;
          color: ${r.highlight ? DS.color.primary : DS.color.textPrimary};
          font-weight: ${r.highlight ? "700" : "600"};
          text-align: right;
          ${isLast ? "" : `border-bottom: 1px solid ${DS.color.border};`}
        ">${r.value}</td>
      </tr>
    `;
    })
    .join("");

  return `
    <table cellpadding="0" cellspacing="0" width="100%" style="
      background-color: ${DS.color.bgSubtle};
      border: 1px solid ${DS.color.border};
      border-radius: 8px;
      margin: 20px 0;
      overflow: hidden;
    ">
      ${rowsHtml}
    </table>
  `;
}

/** Big highlighted amount display */
function amountHighlight(label: string, amount: string): string {
  return `
    <table cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
      <tr>
        <td style="
          background: linear-gradient(135deg, ${DS.color.primaryLight} 0%, ${DS.color.primaryMid} 100%);
          border: 1px solid ${DS.color.borderStrong};
          border-radius: 10px;
          padding: 24px 20px;
          text-align: center;
        ">
          <p style="margin:0 0 6px; font-family:${DS.font.body}; font-size:12px; font-weight:600; color:${DS.color.primaryDark}; text-transform:uppercase; letter-spacing:1px;">${label}</p>
          <p style="margin:0; font-family:${DS.font.body}; font-size:38px; font-weight:700; color:${DS.color.primary}; line-height:1;">${amount}</p>
        </td>
      </tr>
    </table>
  `;
}

/** Wrapper for all email body content */
function wrap(preheaderText: string, innerRows: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]><style>body,table,td,p,a{font-family:Arial,sans-serif!important;}</style><![endif]-->
</head>
<body style="margin:0; padding:0; background-color:${DS.color.bgPage}; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

  ${preheaderText}

  <!-- EMAIL WRAPPER -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${DS.color.bgPage}; padding: 32px 16px;">
    <tr>
      <td align="center">

        <!-- EMAIL CARD -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width:600px; background-color:${DS.color.bgCard}; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.07);">

          ${innerRows}

        </table>
        <!-- /EMAIL CARD -->

      </td>
    </tr>
  </table>
  <!-- /EMAIL WRAPPER -->

</body>
</html>`;
}

// =============================================================================
// ORDER TEMPLATES
// =============================================================================

const orderTemplates = [
  // ── ORDER CONFIRMATION ──────────────────────────────────────────────────────
  {
    template_key: "order_confirmation",
    name: "Order Confirmation",
    description: "Sent when a new order is placed",
    category: "order",
    subject: "Order Confirmed — #{{order_id}}",
    html_body: wrap(
      preheader("Your order has been received and is being prepared."),
      `
      ${heroBanner("Order Confirmed! 🎉", "Thank you for your purchase")}
      ${accentStrip()}

      <!-- BODY -->
      <tr>
        <td style="padding: 36px 36px 28px;">

          <p style="margin:0 0 16px; font-family:${DS.font.body}; font-size:16px; color:${DS.color.textBody}; line-height:1.7;">
            Hi <strong style="color:${DS.color.textPrimary};">{{customer_name}}</strong>,
          </p>
          <p style="margin:0 0 24px; font-family:${DS.font.body}; font-size:15px; color:${DS.color.textBody}; line-height:1.7;">
            Thank you for your order! We've received your request and our team is already preparing it for shipment.
          </p>

          ${detailsTable([
            { label: "Order ID", value: "#{{order_id}}" },
            { label: "Order Date", value: "{{order_date}}" },
            { label: "Payment Method", value: "{{payment_method}}" },
            { label: "Order Total", value: "₱{{total}}", highlight: true },
          ])}

          <!-- ITEMS -->
          <h2 style="margin: 28px 0 12px; font-family:${DS.font.body}; font-size:17px; color:${DS.color.textPrimary}; font-weight:700;">Items Ordered</h2>
          <div style="font-family:${DS.font.body}; font-size:14px; color:${DS.color.textBody}; line-height:1.8;">
            {{items_list}}
          </div>

          ${callout("<strong>Shipping Address:</strong><br>{{shipping_address}}", "green")}

          <p style="margin:24px 0 0; font-family:${DS.font.body}; font-size:13px; color:${DS.color.textMuted}; line-height:1.7;">
            We'll send you a shipping confirmation once your order is on its way. If you have any questions, reach out to our support team — we're happy to help.
          </p>

        </td>
      </tr>

      ${footer()}
    `,
    ),
    text_body: `Order Confirmed!

Hi {{customer_name}},

Thank you for your order! We've received your request and our team is preparing it for shipment.

ORDER DETAILS
─────────────────────────────
Order ID:        #{{order_id}}
Order Date:      {{order_date}}
Payment Method:  {{payment_method}}
Order Total:     ₱{{total}}

ITEMS ORDERED
{{items_list_text}}

SHIPPING ADDRESS
{{shipping_address}}

We'll send you a shipping confirmation once your order is on its way.

© {{year}} Nanu Health Shop. All rights reserved.
support@nanu-health.com`,
    is_active: true,
  },

  // ── ORDER PROCESSING ────────────────────────────────────────────────────────
  {
    template_key: "order_processing",
    name: "Order Processing",
    description: "Sent when order is being prepared",
    category: "order",
    subject: "Your Order is Being Prepared — #{{order_id}}",
    html_body: wrap(
      preheader("Your order is in the hands of our team right now."),
      `
      ${heroBanner("Your Order is Being Prepared 📦", "We're on it!")}
      ${accentStrip()}

      <tr>
        <td style="padding: 36px 36px 28px;">
          <p style="margin:0 0 16px; font-family:${DS.font.body}; font-size:16px; color:${DS.color.textBody}; line-height:1.7;">
            Hi <strong style="color:${DS.color.textPrimary};">{{customer_name}}</strong>,
          </p>
          <p style="margin:0 0 24px; font-family:${DS.font.body}; font-size:15px; color:${DS.color.textBody}; line-height:1.7;">
            Great news — your order <strong>#{{order_id}}</strong> has moved to our fulfillment team and is currently being packed with care.
          </p>

          ${callout(
            `
            <strong>What happens next?</strong><br>
            Our team is carefully picking and packing your items to ensure everything arrives in perfect condition. You'll receive a shipping notification with tracking details as soon as your order leaves our facility.
          `,
            "green",
          )}

          <p style="margin:24px 0 0; font-family:${DS.font.body}; font-size:13px; color:${DS.color.textMuted}; line-height:1.7;">
            Estimated processing time is <strong>1–2 business days</strong>. We appreciate your patience.
          </p>
        </td>
      </tr>

      ${footer()}
    `,
    ),
    text_body: `Your Order is Being Prepared

Hi {{customer_name}},

Your order #{{order_id}} is currently being packed by our fulfillment team.

Our team is carefully picking and packing your items to ensure everything arrives in perfect condition. You'll receive a shipping notification as soon as your order leaves our facility.

Estimated processing time: 1–2 business days.

© {{year}} Nanu Health Shop. All rights reserved.
support@nanu-health.com`,
    is_active: true,
  },

  // ── ORDER SHIPPED ────────────────────────────────────────────────────────────
  {
    template_key: "order_shipped",
    name: "Order Shipped",
    description: "Sent when order is shipped",
    category: "order",
    subject: "Your Order is On Its Way! — #{{order_id}}",
    html_body: wrap(
      preheader("Your order has been shipped and is heading your way."),
      `
      ${heroBanner("Your Order is On Its Way! 🚚", "Estimated delivery in 2–5 business days")}
      ${accentStrip()}

      <tr>
        <td style="padding: 36px 36px 28px;">
          <p style="margin:0 0 16px; font-family:${DS.font.body}; font-size:16px; color:${DS.color.textBody}; line-height:1.7;">
            Hi <strong style="color:${DS.color.textPrimary};">{{customer_name}}</strong>,
          </p>
          <p style="margin:0 0 24px; font-family:${DS.font.body}; font-size:15px; color:${DS.color.textBody}; line-height:1.7;">
            Your order <strong>#{{order_id}}</strong> has been handed to our courier partner and is now in transit.
          </p>

          <!-- TRACKING BOX -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 20px;">
            <tr>
              <td style="
                background: linear-gradient(135deg, ${DS.color.primaryDeep} 0%, ${DS.color.primaryDark} 100%);
                border-radius: 8px;
                padding: 20px 22px;
                text-align: center;
              ">
                <p style="margin:0 0 6px; font-family:${DS.font.body}; font-size:11px; font-weight:700; color:rgba(255,255,255,0.65); text-transform:uppercase; letter-spacing:1.2px;">Tracking Number</p>
                <p style="margin:0; font-family: 'Courier New', Courier, monospace; font-size:20px; font-weight:700; color:#FFFFFF; letter-spacing:2px;">{{tracking_number}}</p>
              </td>
            </tr>
          </table>

          ${callout("<strong>Delivery Address:</strong><br>{{shipping_address}}", "green")}

          <p style="margin:24px 0 0; font-family:${DS.font.body}; font-size:13px; color:${DS.color.textMuted}; line-height:1.7;">
            Please ensure someone is available to receive the package at the delivery address. If you miss the delivery, the courier will leave a notice with rescheduling instructions.
          </p>
        </td>
      </tr>

      ${footer()}
    `,
    ),
    text_body: `Your Order is On Its Way!

Hi {{customer_name}},

Your order #{{order_id}} has been shipped and is on its way to you.

Tracking Number: {{tracking_number}}

Delivery Address:
{{shipping_address}}

Please ensure someone is available to receive the package.

© {{year}} Nanu Health Shop. All rights reserved.
support@nanu-health.com`,
    is_active: true,
  },

  // ── ORDER DELIVERED ──────────────────────────────────────────────────────────
  {
    template_key: "order_delivered",
    name: "Order Delivered",
    description: "Sent when order is delivered",
    category: "order",
    subject: "Your Order Has Been Delivered — #{{order_id}}",
    html_body: wrap(
      preheader("Your Nanu Health order has arrived. We hope you love it!"),
      `
      ${heroBanner("Order Successfully Delivered ✅", "We hope you love your purchase")}
      ${accentStrip()}

      <tr>
        <td style="padding: 36px 36px 28px;">
          <p style="margin:0 0 16px; font-family:${DS.font.body}; font-size:16px; color:${DS.color.textBody}; line-height:1.7;">
            Hi <strong style="color:${DS.color.textPrimary};">{{customer_name}}</strong>,
          </p>
          <p style="margin:0 0 24px; font-family:${DS.font.body}; font-size:15px; color:${DS.color.textBody}; line-height:1.7;">
            Your order <strong>#{{order_id}}</strong> has been successfully delivered. We hope everything arrived in perfect condition!
          </p>

          ${callout(
            `
            <strong>Thank you for choosing Nanu Health!</strong><br>
            Your trust means everything to us. We'd love to hear your feedback — consider leaving a review on our website to help other customers.
          `,
            "green",
          )}

          <p style="margin:24px 0 8px; font-family:${DS.font.body}; font-size:14px; color:${DS.color.textBody}; line-height:1.7;">
            If anything is missing, damaged, or not quite right, please contact us within <strong>7 days of delivery</strong> and we'll make it right.
          </p>

        </td>
      </tr>

      ${footer()}
    `,
    ),
    text_body: `Order Successfully Delivered!

Hi {{customer_name}},

Your order #{{order_id}} has been successfully delivered. We hope everything arrived in perfect condition!

Thank you for choosing Nanu Health. We'd love to hear your feedback — consider leaving a review on our website.

If anything is missing, damaged, or not right, please contact us within 7 days of delivery.

© {{year}} Nanu Health Shop. All rights reserved.
support@nanu-health.com`,
    is_active: true,
  },

  // ── ORDER CANCELLED ──────────────────────────────────────────────────────────
  {
    template_key: "order_cancelled",
    name: "Order Cancelled",
    description: "Sent when order is cancelled",
    category: "order",
    subject: "Order Cancellation Notice — #{{order_id}}",
    html_body: wrap(
      preheader("Your order has been cancelled. See details inside."),
      `
      ${heroBanner("Order Cancelled", "We're sorry to see this order go")}
      ${accentStrip()}

      <tr>
        <td style="padding: 36px 36px 28px;">
          <p style="margin:0 0 16px; font-family:${DS.font.body}; font-size:16px; color:${DS.color.textBody}; line-height:1.7;">
            Hi <strong style="color:${DS.color.textPrimary};">{{customer_name}}</strong>,
          </p>
          <p style="margin:0 0 24px; font-family:${DS.font.body}; font-size:15px; color:${DS.color.textBody}; line-height:1.7;">
            We're writing to confirm that your order <strong>#{{order_id}}</strong> has been cancelled as requested.
          </p>

          ${callout("<strong>Reason for Cancellation:</strong><br>{{cancellation_reason}}", "yellow")}

          ${callout("<strong>Refund Information:</strong><br>{{refund_info}}", "green")}

          <p style="margin:24px 0 0; font-family:${DS.font.body}; font-size:13px; color:${DS.color.textMuted}; line-height:1.7;">
            If you did not request this cancellation or have any concerns, please contact our support team immediately at <a href="mailto:support@nanu-health.com" style="color:${DS.color.primary};">support@nanu-health.com</a>.
          </p>
        </td>
      </tr>

      ${footer()}
    `,
    ),
    text_body: `Order Cancellation Notice

Hi {{customer_name}},

Your order #{{order_id}} has been cancelled.

Reason for Cancellation: {{cancellation_reason}}

Refund Information: {{refund_info}}

If you did not request this cancellation, please contact support@nanu-health.com immediately.

© {{year}} Nanu Health Shop. All rights reserved.`,
    is_active: true,
  },

  // ── ORDER REFUNDED ───────────────────────────────────────────────────────────
  {
    template_key: "order_refunded",
    name: "Order Refunded",
    description: "Sent when order is refunded",
    category: "order",
    subject: "Refund Processed — #{{order_id}}",
    html_body: wrap(
      preheader("Your refund has been processed and is on its way."),
      `
      ${heroBanner("Refund Processed 💰", "Your money is on the way back to you")}
      ${accentStrip()}

      <tr>
        <td style="padding: 36px 36px 28px;">
          <p style="margin:0 0 16px; font-family:${DS.font.body}; font-size:16px; color:${DS.color.textBody}; line-height:1.7;">
            Hi <strong style="color:${DS.color.textPrimary};">{{customer_name}}</strong>,
          </p>
          <p style="margin:0 0 24px; font-family:${DS.font.body}; font-size:15px; color:${DS.color.textBody}; line-height:1.7;">
            We've successfully processed a refund for your order <strong>#{{order_id}}</strong>.
          </p>

          ${amountHighlight("Refund Amount", "₱{{refund_amount}}")}

          ${detailsTable([
            { label: "Order ID", value: "#{{order_id}}" },
            { label: "Refund Method", value: "{{refund_method}}" },
          ])}

          ${callout(
            `
            Please allow <strong>5–10 business days</strong> for the refund to reflect in your account, depending on your bank or payment provider.
            If you don't see the refund after 10 business days, please don't hesitate to contact us.
          `,
            "green",
          )}
        </td>
      </tr>

      ${footer()}
    `,
    ),
    text_body: `Refund Processed

Hi {{customer_name}},

We've successfully processed a refund for your order #{{order_id}}.

REFUND DETAILS
─────────────────────────────
Refund Amount:  ₱{{refund_amount}}
Refund Method:  {{refund_method}}

Please allow 5–10 business days for the refund to appear in your account.

© {{year}} Nanu Health Shop. All rights reserved.
support@nanu-health.com`,
    is_active: true,
  },
];

// =============================================================================
// AFFILIATE TEMPLATES
// =============================================================================

const affiliateTemplates = [
  // ── AFFILIATE ACTIVATED ───────────────────────────────────────────────────────
  {
    template_key: "affiliate_activated",
    name: "Affiliate Activated",
    description: "Sent when affiliate account is activated",
    category: "affiliate",
    subject: "Your Affiliate Account is Now Active! 🎉",
    html_body: wrap(
      preheader(
        "Your affiliate account has been activated. Start earning commissions today.",
      ),
      `
      ${heroBanner("Your Account is Now Active! 🎉", "Welcome to the team")}
      ${accentStrip()}

      <tr>
        <td style="padding: 36px 36px 28px;">
          <p style="margin:0 0 16px; font-family:${DS.font.body}; font-size:16px; color:${DS.color.textBody}; line-height:1.7;">
            Hi <strong style="color:${DS.color.textPrimary};">{{affiliate_name}}</strong>,
          </p>
          <p style="margin:0 0 24px; font-family:${DS.font.body}; font-size:15px; color:${DS.color.textBody}; line-height:1.7;">
            Great news — your Nanu Health Affiliate Account has been activated and is now ready to use. You can start promoting our products and earning commissions right away!
          </p>

          ${detailsTable([
            { label: "Affiliate ID", value: "{{affiliate_id}}" },
            {
              label: "Your Affiliate Link",
              value:
                "<a href='{{affiliate_link}}' style='color:${DS.color.primary}; word-break:break-all;'>{{affiliate_link}}</a>",
            },
          ])}

          ${callout(
            `
            <strong>Ready to start earning?</strong><br>
            Share your unique affiliate link on your website, blog, or social channels.
            You'll earn a commission for every qualifying purchase made through your link.
          `,
            "green",
          )}

          ${btn("Go to Affiliate Dashboard", "{{dashboard_url}}")}
        </td>
      </tr>

      ${footer()}
    `,
    ),
    text_body: `Your Account is Now Active!

Hi {{affiliate_name}},

Your Nanu Health Affiliate Account has been activated and is now ready to use.

YOUR AFFILIATE DETAILS
────────────────────────────
Affiliate ID:     {{affiliate_id}}
Affiliate Link:   {{affiliate_link}}

Start sharing your link and earning commissions today.
Dashboard: {{dashboard_url}}

© {{year}} Nanu Health Shop. All rights reserved.
support@nanu-health.com`,
    is_active: true,
  },

  // ── AFFILIATE WELCOME ────────────────────────────────────────────────────────
  {
    template_key: "affiliate_welcome",
    name: "Affiliate Welcome",
    description: "Sent when a new affiliate registers",
    category: "affiliate",
    subject: "Affiliate Application Received – Awaiting Approval",
    html_body: wrap(
      preheader(
        "Your affiliate application has been received. Please submit proof of payment to proceed.",
      ),
      `
      ${heroBanner("Welcome to Our Affiliate Program! 🎉", "Application received")}
      ${accentStrip()}

      <tr>
        <td style="padding: 36px 36px 28px;">
          <p style="margin:0 0 16px; font-family:${DS.font.body}; font-size:16px; color:${DS.color.textBody}; line-height:1.7;">
            Hi <strong style="color:${DS.color.textPrimary};">{{affiliate_name}}</strong>,
          </p>
          <p style="margin:0 0 24px; font-family:${DS.font.body}; font-size:15px; color:${DS.color.textBody}; line-height:1.7;">
            Thank you for applying to the Nanu Health Affiliate Program! We're thrilled by your interest in partnering with us to promote health and wellness products.
          </p>

          ${detailsTable([
            { label: "Affiliate ID", value: "{{affiliate_id}}" },
            { label: "Status", value: "Pending Approval" },
            {
              label: "Your Affiliate Link",
              value: "{{affiliate_link}}",
            },
          ])}

           ${callout(
             `
             <strong>Next Steps:</strong><br>
             1. Send your proof of payment (payment receipt or reference number) to our admin through our messenger.<br>
             2. Our admin team will review your submission within <strong>24–48 business hours</strong>.<br>
             3. You'll receive an email notification once your application is approved or rejected.
           `,
             "green",
           )}
        </td>
      </tr>

      ${footer()}
    `,
    ),
    text_body: `Affiliate Application Received – Awaiting Approval
 
 Hi {{affiliate_name}},
 
 Thank you for applying to the Nanu Health Affiliate Program!
 
 Affiliate ID: {{affiliate_id}}
 Affiliate Link: {{affiliate_link}}
 Status: Pending Approval
 
 Next Steps:
 1. Send your proof of payment to our admin through our messenger.
 2. Our admin team will review within 24–48 business hours.
 3. You'll be notified once your application is approved.
 
 © {{year}} Nanu Health Shop. All rights reserved.
 support@nanu-health.com`,
    is_active: true,
  },

  // ── AFFILIATE PAYMENT PROOF SUBMITTED ─────────────────────────────────────────
  {
    template_key: "affiliate_payment_proof_submitted",
    name: "Payment Proof Submitted",
    description: "Notifies admin that an affiliate has submitted payment proof",
    category: "affiliate",
    subject: "New Affiliate Payment Proof Submitted",
    html_body: wrap(
      preheader("An affiliate has submitted proof of payment for review."),
      `
      ${heroBanner("Payment Proof Submitted", "Review required")}
      ${accentStrip()}

      <tr>
        <td style="padding: 36px 36px 28px;">
          <p style="margin:0 0 16px; font-family:${DS.font.body}; font-size:16px; color:${DS.color.textBody}; line-height:1.7;">
            Hello Admin,
          </p>
          <p style="margin:0 0 24px; font-family:${DS.font.body}; font-size:15px; color:${DS.color.textBody}; line-height:1.7;">
            A new affiliate has submitted their proof of payment. Please review and approve or reject their application.
          </p>

          ${detailsTable([
            { label: "Affiliate Name", value: "{{affiliate_name}}" },
            { label: "Affiliate Email", value: "{{affiliate_email}}" },
            { label: "Affiliate ID", value: "{{affiliate_id}}" },
            { label: "Proof URL", value: "{{proof_url}}" },
            { label: "Reference/Note", value: "{{proof_ref}}" },
          ])}

          ${callout(
            `
            <strong>Action Required:</strong><br>
            Please review this affiliate's submission and either approve or reject their application from the admin dashboard.
          `,
            "yellow",
          )}

          ${btn("Go to Admin Dashboard", "{{admin_dashboard_url}}")}
        </td>
      </tr>

      ${footer()}
    `,
    ),
    text_body: `Payment Proof Submitted for Review

Hello Admin,

An affiliate has submitted proof of payment for review.

Affiliate Name: {{affiliate_name}}
Affiliate Email: {{affiliate_email}}
Affiliate ID: {{affiliate_id}}
Proof URL: {{proof_url}}
Reference/Note: {{proof_ref}}

Please visit the admin dashboard to approve or reject this application:
{{admin_dashboard_url}}

© {{year}} Nanu Health Shop. All rights reserved.`,
    is_active: true,
  },

  // ── AFFILIATE APPROVED ───────────────────────────────────────────────────────
  {
    template_key: "affiliate_approved",
    name: "Affiliate Approved",
    description: "Sent when affiliate account is approved",
    category: "affiliate",
    subject: "Your Affiliate Account is Now Active! 🎉",
    html_body: wrap(
      preheader(
        "Congratulations! Your affiliate account has been approved. Start earning today.",
      ),
      `
      ${heroBanner("Congratulations — You're Approved! 🎉", "Your affiliate account is now active")}
      ${accentStrip()}

      <tr>
        <td style="padding: 36px 36px 28px;">
          <p style="margin:0 0 16px; font-family:${DS.font.body}; font-size:16px; color:${DS.color.textBody}; line-height:1.7;">
            Hi <strong style="color:${DS.color.textPrimary};">{{affiliate_name}}</strong>,
          </p>
          <p style="margin:0 0 24px; font-family:${DS.font.body}; font-size:15px; color:${DS.color.textBody}; line-height:1.7;">
            Excellent news — your application to the Nanu Health Affiliate Program has been approved! You can now start sharing your unique affiliate link and earning commissions on every sale.
          </p>

          ${detailsTable([
            { label: "Affiliate ID", value: "{{affiliate_id}}" },
            {
              label: "Your Affiliate Link",
              value:
                "<a href='{{affiliate_link}}' style='color:${DS.color.primary}; word-break:break-all;'>{{affiliate_link}}</a>",
            },
            {
              label: "Commission Rate",
              value: "{{commission_rate}}%",
              highlight: true,
            },
          ])}

          ${callout(
            `
            <strong>Ready to earn?</strong><br>
            Share your unique affiliate link on your website, blog, or social channels.
            You'll earn a commission for every qualifying purchase made through your link.
          `,
            "green",
          )}

          ${btn("Go to Affiliate Dashboard", "{{dashboard_url}}")}
        </td>
      </tr>

      ${footer()}
    `,
    ),
    text_body: `Your Affiliate Account is Now Active!

Hi {{affiliate_name}},

Your application to the Nanu Health Affiliate Program has been approved!

YOUR AFFILIATE DETAILS
─────────────────────────────
Affiliate ID:     {{affiliate_id}}
Affiliate Link:   {{affiliate_link}}
Commission Rate:  {{commission_rate}}%

Start sharing your link and earning commissions today.
Dashboard: {{dashboard_url}}

© {{year}} Nanu Health Shop. All rights reserved.
support@nanu-health.com`,
    is_active: true,
  },

  // ── AFFILIATE REJECTED ───────────────────────────────────────────────────────
  {
    template_key: "affiliate_rejected",
    name: "Affiliate Rejected",
    description: "Sent when affiliate application is rejected",
    category: "affiliate",
    subject: "Update on Your Affiliate Application",
    html_body: wrap(
      preheader("An update regarding your Nanu Health affiliate application."),
      `
      ${heroBanner("Affiliate Application Update", "Thank you for your interest")}
      ${accentStrip()}

      <tr>
        <td style="padding: 36px 36px 28px;">
          <p style="margin:0 0 16px; font-family:${DS.font.body}; font-size:16px; color:${DS.color.textBody}; line-height:1.7;">
            Hi <strong style="color:${DS.color.textPrimary};">{{affiliate_name}}</strong>,
          </p>
          <p style="margin:0 0 24px; font-family:${DS.font.body}; font-size:15px; color:${DS.color.textBody}; line-height:1.7;">
            Thank you for your interest in the Nanu Health Affiliate Program. After careful consideration, we're unable to approve your application at this time.
          </p>

          ${callout("<strong>Feedback:</strong><br>{{rejection_reason}}", "yellow")}

          <p style="margin:24px 0 0; font-family:${DS.font.body}; font-size:14px; color:${DS.color.textBody}; line-height:1.7;">
            We encourage you to reapply in the future once the concerns above have been addressed. If you believe this decision was made in error or would like clarification, please reach out to us at <a href="mailto:support@nanu-health.com" style="color:${DS.color.primary};">support@nanu-health.com</a>.
          </p>
        </td>
      </tr>

      ${footer()}
    `,
    ),
    text_body: `Update on Your Affiliate Application

Hi {{affiliate_name}},

Thank you for your interest in the Nanu Health Affiliate Program. After careful consideration, we're unable to approve your application at this time.

Feedback: {{rejection_reason}}

You're welcome to reapply in the future. Contact us at support@nanu-health.com for clarification.

© {{year}} Nanu Health Shop. All rights reserved.`,
    is_active: true,
  },

  // ── COMMISSION EARNED ────────────────────────────────────────────────────────
  {
    template_key: "affiliate_commission_earned",
    name: "Commission Earned",
    description: "Sent when affiliate earns a commission",
    category: "affiliate",
    subject: "🎉 You Earned a Commission!",
    html_body: wrap(
      preheader(
        "Great news — you just earned a commission through your affiliate link!",
      ),
      `
      ${heroBanner("You Earned a Commission! 💰", "Keep up the great work")}
      ${accentStrip()}

      <tr>
        <td style="padding: 36px 36px 28px;">
          <p style="margin:0 0 16px; font-family:${DS.font.body}; font-size:16px; color:${DS.color.textBody}; line-height:1.7;">
            Hi <strong style="color:${DS.color.textPrimary};">{{affiliate_name}}</strong>,
          </p>
          <p style="margin:0 0 24px; font-family:${DS.font.body}; font-size:15px; color:${DS.color.textBody}; line-height:1.7;">
            A customer just made a purchase through your affiliate link — and you've earned a commission!
          </p>

          ${amountHighlight("Commission Earned", "₱{{commission_amount}}")}

          ${detailsTable([
            { label: "Linked Order ID", value: "#{{order_id}}" },
            { label: "Sale Amount", value: "₱{{sale_amount}}" },
            {
              label: "Commission Rate",
              value: "{{commission_rate}}%",
              highlight: true,
            },
          ])}

          ${btn("View in Dashboard", "{{dashboard_url}}")}
        </td>
      </tr>

      ${footer()}
    `,
    ),
    text_body: `You Earned a Commission!

Hi {{affiliate_name}},

A customer made a purchase through your affiliate link.

Commission Earned: ₱{{commission_amount}}

SALE DETAILS
─────────────────────────────
Order ID:         #{{order_id}}
Sale Amount:      ₱{{sale_amount}}
Commission Rate:  {{commission_rate}}%

View in Dashboard: {{dashboard_url}}

© {{year}} Nanu Health Shop. All rights reserved.
support@nanu-health.com`,
    is_active: true,
  },

  // ── PAYOUT PROCESSED ─────────────────────────────────────────────────────────
  {
    template_key: "affiliate_payout_processed",
    name: "Payout Processed",
    description: "Sent when affiliate payout is processed",
    category: "affiliate",
    subject: "Your Affiliate Payout Has Been Sent 💸",
    html_body: wrap(
      preheader(
        "Your affiliate earnings have been paid out. Check your account soon.",
      ),
      `
      ${heroBanner("Payout Successfully Processed 💸", "Your earnings are on the way")}
      ${accentStrip()}

      <tr>
        <td style="padding: 36px 36px 28px;">
          <p style="margin:0 0 16px; font-family:${DS.font.body}; font-size:16px; color:${DS.color.textBody}; line-height:1.7;">
            Hi <strong style="color:${DS.color.textPrimary};">{{affiliate_name}}</strong>,
          </p>
          <p style="margin:0 0 24px; font-family:${DS.font.body}; font-size:15px; color:${DS.color.textBody}; line-height:1.7;">
            Your affiliate earnings for the period <strong>{{payout_period}}</strong> have been processed and are on their way to you.
          </p>

          ${amountHighlight("Payout Amount", "₱{{payout_amount}}")}

          ${detailsTable([
            { label: "Payout Reference", value: "#{{payout_id}}" },
            { label: "Payment Method", value: "{{payment_method}}" },
            { label: "Period", value: "{{payout_period}}" },
          ])}

          ${callout(
            `
            Please allow <strong>3–5 business days</strong> for funds to appear in your account. If you have any questions about this payout, please contact us.
          `,
            "green",
          )}
        </td>
      </tr>

      ${footer()}
    `,
    ),
    text_body: `Payout Successfully Processed

Hi {{affiliate_name}},

Your affiliate payout has been processed.

PAYOUT DETAILS
─────────────────────────────
Payout Amount:    ₱{{payout_amount}}
Payout Reference: #{{payout_id}}
Payment Method:   {{payment_method}}
Period:           {{payout_period}}

Please allow 3–5 business days for funds to appear in your account.

© {{year}} Nanu Health Shop. All rights reserved.
support@nanu-health.com`,
    is_active: true,
  },
];

// =============================================================================
// AUTH TEMPLATES
// =============================================================================

const authTemplates = [
  // ── PASSWORD RESET ───────────────────────────────────────────────────────────
  {
    template_key: "password_reset",
    name: "Password Reset",
    description: "Sent when user requests password reset",
    category: "auth",
    subject: "Reset Your Nanu Health Password",
    html_body: wrap(
      preheader(
        "You requested a password reset. Use the link inside to create a new one.",
      ),
      `
      ${heroBanner("Password Reset Request", "Secure account management")}
      ${accentStrip()}

      <tr>
        <td style="padding: 36px 36px 28px;">
          <p style="margin:0 0 16px; font-family:${DS.font.body}; font-size:16px; color:${DS.color.textBody}; line-height:1.7;">
            Hi <strong style="color:${DS.color.textPrimary};">{{user_name}}</strong>,
          </p>
          <p style="margin:0 0 24px; font-family:${DS.font.body}; font-size:15px; color:${DS.color.textBody}; line-height:1.7;">
            We received a request to reset the password for your Nanu Health account. Click the button below to choose a new password.
          </p>

          ${btn("Reset My Password", "{{reset_url}}")}

          ${callout(
            `
            <strong>This link expires in 24 hours.</strong><br>
            If you did not request a password reset, no action is required — your account remains secure. Please do not share this link with anyone.
          `,
            "yellow",
          )}

          <p style="margin:24px 0 0; font-family:${DS.font.body}; font-size:13px; color:${DS.color.textMuted}; line-height:1.7;">
            Having trouble with the button? Copy and paste this link into your browser:<br>
            <a href="{{reset_url}}" style="color:${DS.color.primary}; word-break:break-all;">{{reset_url}}</a>
          </p>
        </td>
      </tr>

      ${footer()}
    `,
    ),
    text_body: `Password Reset Request

Hi {{user_name}},

We received a request to reset your Nanu Health account password. Use the link below to create a new password.

Reset Link: {{reset_url}}

This link expires in 24 hours. If you didn't request this, no action is needed.

© {{year}} Nanu Health Shop. All rights reserved.
support@nanu-health.com`,
    is_active: true,
  },

  // ── EMAIL VERIFICATION ───────────────────────────────────────────────────────
  {
    template_key: "email_verification",
    name: "Email Verification",
    description: "Sent to verify user email address",
    category: "auth",
    subject: "Please Verify Your Email — Nanu Health",
    html_body: wrap(
      preheader(
        "You're almost there! Verify your email to complete your Nanu Health registration.",
      ),
      `
      ${heroBanner("Verify Your Email Address", "One last step to get started")}
      ${accentStrip()}

      <tr>
        <td style="padding: 36px 36px 28px;">
          <p style="margin:0 0 16px; font-family:${DS.font.body}; font-size:16px; color:${DS.color.textBody}; line-height:1.7;">
            Hi <strong style="color:${DS.color.textPrimary};">{{user_name}}</strong>,
          </p>
          <p style="margin:0 0 24px; font-family:${DS.font.body}; font-size:15px; color:${DS.color.textBody}; line-height:1.7;">
            Welcome to Nanu Health! To complete your registration and activate your account, please verify your email address by clicking the button below.
          </p>

          ${btn("Verify My Email", "{{verification_url}}")}

          ${callout(
            `
            <strong>This link expires in 24 hours.</strong><br>
            If you did not create an account with Nanu Health, you can safely disregard this email — no account has been created.
          `,
            "green",
          )}

          <p style="margin:24px 0 0; font-family:${DS.font.body}; font-size:13px; color:${DS.color.textMuted}; line-height:1.7;">
            Having trouble with the button? Copy and paste this link into your browser:<br>
            <a href="{{verification_url}}" style="color:${DS.color.primary}; word-break:break-all;">{{verification_url}}</a>
          </p>
        </td>
      </tr>

      ${footer()}
    `,
    ),
    text_body: `Verify Your Email Address

Hi {{user_name}},

Welcome to Nanu Health! Please verify your email address to activate your account.

Verification Link: {{verification_url}}

This link expires in 24 hours. If you didn't create an account, no action is needed.

© {{year}} Nanu Health Shop. All rights reserved.
support@nanu-health.com`,
    is_active: true,
  },
];

// =============================================================================
// SEED FUNCTION
// =============================================================================

async function seedEmailTemplates() {
  console.log(
    "🌱 Starting email templates seed (Professional Orange Theme)...\n",
  );

  const allTemplates = [...affiliateTemplates];

  for (const template of allTemplates) {
    try {
      const { error } = await supabase
        .from("email_templates")
        .upsert(template, { onConflict: "template_key" });

      if (error) {
        console.error(
          `❌ Error seeding "${template.template_key}":`,
          error.message,
        );
      } else {
        console.log(`✅ Seeded: ${template.template_key}`);
      }
    } catch (err) {
      console.error(`❌ Exception seeding "${template.template_key}":`, err);
    }
  }

  console.log("\n✨ All email templates seeded successfully!");
}

seedEmailTemplates()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
