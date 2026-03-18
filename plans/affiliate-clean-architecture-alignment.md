# Affiliate Module - Full Clean Architecture Alignment

## Current Affiliate Service Methods (All 30+ methods)

### 1. Basic CRUD (7 methods)

| Method                                       | Description    | Use Case Needed             |
| -------------------------------------------- | -------------- | --------------------------- |
| `getAffiliates(page, limit, search, status)` | List paginated | ✅ ListAffiliatesUseCase    |
| `getAffiliate(id)`                           | Get by ID      | ✅ GetAffiliateUseCase      |
| `createAffiliate(dto)`                       | Create new     | ❌ CreateAffiliateUseCase   |
| `updateAffiliate(id, dto)`                   | Update         | ❌ UpdateAffiliateUseCase   |
| `suspendAffiliate(id)`                       | Suspend        | ❌ SuspendAffiliateUseCase  |
| `activateAffiliate(id)`                      | Activate       | ❌ ActivateAffiliateUseCase |
| `deleteAffiliate(id)`                        | Delete         | ❌ DeleteAffiliateUseCase   |

### 2. Affiliate Products (3 methods)

| Method                                         | Description    | Use Case Needed                |
| ---------------------------------------------- | -------------- | ------------------------------ |
| `getAffiliateProducts(affId)`                  | List products  | ❌ GetAffiliateProductsUseCase |
| `assignProduct(affId, dto)`                    | Assign product | ❌ AssignProductUseCase        |
| `removeProductFromAffiliate(affId, productId)` | Remove         | ❌ RemoveProductUseCase        |

### 3. Affiliate Totals (1 method)

| Method                                           | Description   | Use Case Needed                 |
| ------------------------------------------------ | ------------- | ------------------------------- |
| `updateAffiliateTotals(affId, sale, commission)` | Update totals | ❌ UpdateAffiliateTotalsUseCase |

### 4. User-related (7 methods)

| Method                                            | Description      | Use Case Needed                 |
| ------------------------------------------------- | ---------------- | ------------------------------- |
| `activateAffiliateByUserId(userId)`               | Activate by user | ❌ ActivateByUserIdUseCase      |
| `markAffiliateAsPaidByUserId(userId)`             | Mark paid        | ❌ MarkAsPaidByUserIdUseCase    |
| `getAffiliateByUserId(userId)`                    | Get by user      | ❌ GetAffiliateByUserIdUseCase  |
| `generateAffiliateLink(userId)`                   | Generate link    | ❌ GenerateAffiliateLinkUseCase |
| `createAffiliateForAuthUser(userId, email, name)` | Auto-create      | ❌ CreateForAuthUserUseCase     |
| `updateMyPixelId(userId, pixelId)`                | Update pixel     | ❌ UpdatePixelIdUseCase         |

### 5. Payment (4 methods)

| Method                                              | Description     | Use Case Needed          |
| --------------------------------------------------- | --------------- | ------------------------ |
| `createAffiliatePayment(userId, email, name, link)` | Create payment  | ❌ CreatePaymentUseCase  |
| `verifyAffiliatePayment(intentId, userId, link)`    | Verify payment  | ❌ VerifyPaymentUseCase  |
| `getAffiliateSettings()`                            | Get settings    | ❌ GetSettingsUseCase    |
| `updateAffiliateSettings(fee, rate, type)`          | Update settings | ❌ UpdateSettingsUseCase |

### 6. Referral (4 methods)

| Method                                    | Description       | Use Case Needed              |
| ----------------------------------------- | ----------------- | ---------------------------- |
| `getMyAffiliateLink(userId)`              | Get user's link   | ❌ GetMyAffiliateLinkUseCase |
| `setAffiliateReferrer(affId, referrerId)` | Set referrer      | ❌ SetReferrerUseCase        |
| `recordReferralCommission(affId, amount)` | Record commission | ❌ RecordCommissionUseCase   |

## Implementation Plan

### Phase 1: Create All Use Cases (20+ use cases)

Create in `src/application/use-cases/affiliate/`:

1. `CreateAffiliate.ts`
2. `UpdateAffiliate.ts`
3. `SuspendAffiliate.ts`
4. `ActivateAffiliate.ts`
5. `DeleteAffiliate.ts`
6. `GetAffiliateProducts.ts`
7. `AssignProduct.ts`
8. `RemoveProduct.ts`
9. `UpdateAffiliateTotals.ts`
10. `ActivateByUserId.ts`
11. `MarkAsPaidByUserId.ts`
12. `GetAffiliateByUserId.ts`
13. `GenerateAffiliateLink.ts`
14. `CreateForAuthUser.ts`
15. `UpdatePixelId.ts`
16. `CreatePayment.ts`
17. `VerifyPayment.ts`
18. `GetSettings.ts`
19. `UpdateSettings.ts`
20. `GetMyAffiliateLink.ts`
21. `SetReferrer.ts`
22. `RecordCommission.ts`

### Phase 2: Update Controllers

Update `src/modules/affiliates/affiliate.controller.ts` to use all new use cases

### Phase 3: Update DI Container

Add new tokens and registrations

## Files to Modify:

- `src/application/use-cases/affiliate/index.ts` - Export all
- `src/modules/affiliates/affiliate.controller.ts` - Use use cases
- `src/modules/affiliates/affiliate.service.ts` - Mark deprecated

## Files to Create:

All 22 use case files listed above
