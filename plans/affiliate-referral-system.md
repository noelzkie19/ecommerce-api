# Affiliate Referral System

## Overview

This document describes the affiliate referral system implementation where:

1. Each affiliate gets a **unique referral link** upon registration
2. When someone uses their link to register and pays ₱999, the affiliate earns **20% commission** (₱199.80)
3. Commission rate is **configurable** via admin dashboard

---

## Features

### 1. Auto-Generated Affiliate Link

- Each affiliate gets a unique referral code (e.g., `johnabc123`)
- Full URL: `https://yoursite.com/register?ref=johnabc123`
- Link is generated automatically when user registers

### 2. Referral Tracking

- When a new user registers with a ref code:
  - The system looks up the affiliate by referral code
  - Stores `referred_by` field linking to the referrer
  - Tracks the referral relationship

### 3. Commission on Registration Payment

- When referred user pays ₱999 registration fee:
  - System calculates commission (default 20% = ₱199.80)
  - Records commission for the referrer
  - Updates referrer's total earnings

### 4. Admin Dashboard Configuration

- Configurable settings:
  - `registration_fee` - Default ₱999
  - `referral_commission_rate` - Default 20%
  - `referral_commission_type` - "percentage" or "fixed"

---

## Database Schema

### New Tables

```sql
-- affiliate_settings table
CREATE TABLE affiliate_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### New Columns (affiliates table)

```sql
-- Unique referral code
affiliate_link VARCHAR(50) UNIQUE

-- Track who referred this affiliate
referred_by UUID REFERENCES affiliates(id)
```

---

## API Endpoints

### Get My Affiliate Link

```
GET /api/affiliates/me/link
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "affiliateLink": "https://yoursite.com/register?ref=johnabc123",
    "affiliateLinkCode": "johnabc123"
  }
}
```

### Get Settings (Admin)

```
GET /api/affiliates/settings
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "registrationFee": 999,
    "referralCommissionRate": 20,
    "referralCommissionType": "percentage"
  }
}
```

### Update Settings (Admin)

```
PATCH /api/affiliates/settings
Authorization: Bearer <admin_token>
Body:
{
  "registrationFee": 999,
  "referralCommissionRate": 25,
  "referralCommissionType": "percentage"
}

Response:
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "registrationFee": 999,
    "referralCommissionRate": 25,
    "referralCommissionType": "percentage"
  }
}
```

---

## Flow: Referral & Commission

### Step 1: User Registers with Ref Code

```
User visits: https://yoursite.com/register?ref=johnabc123

Frontend sends: POST /api/auth/register
  - Includes ref code in metadata or header

Backend:
  1. Creates user account
  2. Auto-creates affiliate record
  3. Looks up referrer by affiliate_link
  4. Sets referred_by field
```

### Step 2: User Pays Registration Fee

```
User:
  1. Goes to affiliate dashboard
  2. Clicks "Pay Registration Fee"
  3. Completes ₱999 payment via Maya Wallet

Backend (verifyAffiliatePayment):
  1. Confirms payment succeeded
  2. Marks affiliate as paid & active
  3. Checks if referred_by is set
  4. Records commission for referrer
  5. Updates referrer's total_sales and total_commissions
```

### Step 3: Commission Calculation

```typescript
// Example: ₱999 payment, 20% commission
const paymentAmount = 999;
const commissionRate = 20; // percentage
const commissionType = "percentage";

if (commissionType === "percentage") {
  commissionAmount = (paymentAmount * commissionRate) / 100;
  // 999 * 20 / 100 = 199.80
}
```

---

## Default Configuration

| Setting                  | Default Value | Description                       |
| ------------------------ | ------------- | --------------------------------- |
| registration_fee         | 999           | Affiliate registration fee in PHP |
| referral_commission_rate | 20            | Commission percentage             |
| referral_commission_type | percentage    | "percentage" or "fixed"           |

---

## Running the Migration

```bash
npm run db:migrate
```

Or manually run the SQL in `supabase/migrations/20260319_affiliate_link_commission.sql`

---

## Testing Checklist

- [ ] Run migration
- [ ] Register new user (should get affiliate link)
- [ ] Get affiliate link via API
- [ ] Register another user with ref code
- [ ] Make payment (₱999)
- [ ] Verify referrer gets commission (₱199.80)
- [ ] Check affiliate sales table
- [ ] Update settings via admin API
- [ ] Verify new commission rate works
