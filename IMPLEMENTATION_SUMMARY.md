# Admin Affiliate Approval with Payment Proof - Implementation Summary

## Overview

Backend implementation complete for admin affiliate approval workflow with payment proof image upload capability at `/admin/affiliates`.

---

## What Was Built

### New Files Created

1. **`src/application/use-cases/affiliate/UploadPaymentProofImage.ts`**
   - Handles image file upload to Supabase Storage
   - Validates file types (JPEG, PNG, WEBP, GIF)
   - Updates affiliate payment proof fields
   - Admin-only use case

### Modified Files

2. **`src/domain/interfaces/IAffiliateRepository.ts`** - Added `uploadPaymentProofImage()` method
3. **`src/infrastructure/database/supabase/SupabaseAffiliateRepository.ts`** - Implemented repository method
4. **`src/application/use-cases/affiliate/index.ts`** - Exported new use case
5. **`src/modules/affiliates/affiliate.controller.ts`** - Added `uploadPaymentProofImage` handler
6. **`src/modules/affiliates/affiliate.routes.ts`** - Added admin route with multer middleware

---

## API Endpoint

### POST `/api/affiliates/:id/payment-proof-image`

- **Auth**: Admin only (`requireAuth` + `requireAdmin`)
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `image` (file, **required**): Payment proof image (max 5MB)
  - `proofRef` (string, optional): Reference/note
- **CRITICAL**: The file field **must** be named `image` (same as product upload). Using `file` will cause MulterError: "Unexpected field".
- **Success Response**: 200 with affiliate data including payment proof URL
- **Errors**:
  - 400: No file, invalid file type, missing affiliateId, unexpected field name
  - 401: Unauthorized
  - 404: Affiliate not found
  - 500: Upload failed

---

## Storage Configuration

- **Bucket**: `payment_proof` (must be created in Supabase)
- **Path**: `payment_proof/{affiliate_id}/{timestamp}-{random}.{ext}`
- **Access**: Public read (for admin panel display)
- **Max File Size**: 5MB
- **Allowed Types**: JPEG, PNG, WEBP, GIF

---

## Database Fields Used

All columns already exist in `affiliates` table:

- `payment_proof_url` (string, nullable)
- `payment_proof_ref` (string, nullable)
- `payment_proof_submitted_at` (timestamp, nullable)
- `approved_by` (string, nullable)
- `approved_at` (timestamp, nullable)
- `rejection_reason` (string, nullable)

---

## Integration with Existing Workflow

1. **Admin views** `GET /api/affiliates` → sees `paymentProofUrl` for each affiliate
2. **Admin uploads** proof image → `POST /api/affiliates/:id/payment-proof-image`
3. **Affiliate record** updated with image URL and timestamp
4. **Admin approves** → `POST /api/affiliates/:id/approve` (checks `canBeActivated()` which allows approval when `paymentProofSubmittedAt` is set)
5. **Affiliate notified** via email (existing `affiliate_approved` template)

---

## Response Data

All affiliate responses include payment proof fields:

- `ListAffiliatesOutput.data[].paymentProofUrl`
- `ListAffiliatesOutput.data[].paymentProofRef`
- `ListAffiliatesOutput.data[].paymentProofSubmittedAt`
- `ApproveAffiliateOutput.paymentProofUrl`
- `RejectAffiliateOutput.paymentProofUrl`
- `GetAffiliateOutput.paymentProofUrl`

---

## Frontend Requirements (Admin Panel)

At `http://localhost:3000/admin/affiliates`:

### 1. Display Payment Proof

```jsx
{
  affiliate.paymentProofUrl && (
    <div>
      <a
        href={affiliate.paymentProofUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        View Payment Proof
      </a>
      {/* OR show inline image */}
      <img
        src={affiliate.paymentProofUrl}
        alt="Payment proof"
        style={{ maxWidth: "200px" }}
      />
    </div>
  );
}
```

### 2. Upload Payment Proof (per affiliate row)

```javascript
// IMPORTANT: Form field name MUST be 'image' (not 'file')
// This matches the product image upload pattern: upload.single("image")
const formData = new FormData();
formData.append("image", file); // Field name: 'image' - required
formData.append("proofRef", "Bank transfer ref: ABC123"); // Optional

fetch(`/api/affiliates/${affiliateId}/payment-proof-image`, {
  method: "POST",
  body: formData,
  // Note: Do NOT set Content-Type header; browser sets it with boundary
});
```

Example with HTML:

```html
<input
  type="file"
  accept="image/jpeg,image/png,image/webp,image/gif"
  name="image"
/>
```

### 3. Filter/Sort

- Filter by status: `pending`, `active`, `suspended`, `rejected`
- Sort by `paymentProofSubmittedAt` to see recent submissions first
- Show badge if `paymentProofUrl` exists (indicates proof submitted)

---

## Testing Checklist

- [ ] Create `payment_proof` bucket in Supabase with public access
- [ ] Test admin upload: `POST /api/affiliates/:id/payment-proof-image` with image file (field name: `image`)
- [ ] Verify image appears in `payment_proof` bucket with correct path
- [ ] Verify affiliate record updates `payment_proof_url`, `payment_proof_submitted_at`
- [ ] Verify `GET /api/affiliates` returns updated payment proof URL
- [ ] Verify admin can approve affiliate after proof upload
- [ ] Test file size limit (5MB) - should reject larger files
- [ ] Test invalid file types - should reject

---

## Notes

- Only admin can upload payment proof images (user endpoint removed per requirement)
- Existing `SubmitPaymentProofUseCase` (URL-based) still works if needed
- No changes needed to `ApproveAffiliateUseCase` - already supports proof-based approval
- All TypeScript types compile correctly (no new errors introduced)
- Pattern matches existing product image upload exactly (`upload.single("image")`)

---

## Next Steps

1. **Create Supabase bucket**: `payment_proof` with public read access
2. **Update frontend** at `/admin/affiliates` to:
   - Show payment proof image/URL in table
   - Add file upload component for admin (field name: `image`)
   - Display upload status
3. **Test end-to-end** workflow
4. **Consider adding**: ability to delete/replace payment proof (future enhancement)
