# Affiliate Types Restructuring Plan

## Objective

Make the affiliate-related modules structure uniform by moving ALL types to use-cases directories.

## Current State

### Affiliate Modules with Types (in `src/modules/`):

| Module             | Types File                    |
| ------------------ | ----------------------------- |
| affiliates         | `affiliate.types.ts`          |
| affiliate-pixel    | `affiliate-pixel.types.ts`    |
| affiliate-tracking | `affiliate-tracking.types.ts` |
| affiliates-sales   | `affiliate-sales.types.ts`    |

### Use-Cases Directories (in `src/application/use-cases/`):

| Module             | Current Types                |
| ------------------ | ---------------------------- |
| affiliate          | Inline in each use-case file |
| affiliate-pixel    | Imports from module          |
| affiliate-tracking | Inline in each use-case file |
| affiliate-sales    | Imports from module          |

## Target Structure

### New Types Location (in `src/application/use-cases/`):

```
src/application/use-cases/
├── affiliate/
│   ├── types/
│   │   ├── index.ts          # Main export
│   │   ├── affiliate.ts     # Affiliate entity types
│   │   ├── dto.ts           # DTOs (Create, Update, etc.)
│   │   └── settings.ts      # Settings types
│   ├── index.ts             # Re-exports from types/
│   └── ...use cases...
├── affiliate-pixel/
│   ├── types/
│   │   ├── index.ts
│   │   ├── pixel-config.ts  # Pixel configuration types
│   │   ├── events.ts        # Event types
│   │   └── meta.ts          # Meta API types
│   ├── index.ts
│   └── ...use cases...
├── affiliate-tracking/
│   ├── types/
│   │   ├── index.ts
│   │   ├── tracking.ts      # Tracking link types
│   │   ├── attribution.ts  # Attribution types
│   │   └── stats.ts         # Stats types
│   ├── index.ts
│   └── ...use cases...
└── affiliate-sales/
    ├── types/
    │   ├── index.ts
    │   └── sale.ts           # Sale types
    ├── index.ts
    └── ...use cases...
```

## Migration Steps

### 1. Affiliate Types (`affiliate`)

**Current: `src/modules/affiliates/affiliate.types.ts`**

- `AffiliateStatus`, `CommissionType`, `PaymentStatus`
- `Affiliate`, `AffiliateProduct`
- `CreateAffiliateDTO`, `UpdateAffiliateDTO`, `AssignProductDTO`
- `PaginationMeta`, `PaginatedAffiliates`
- `AffiliateSettings`, `UpdateSettingsDTO`

**Action:** Create `src/application/use-cases/affiliate/types/index.ts`

### 2. Affiliate-Pixel Types (`affiliate-pixel`)

**Current: `src/modules/affiliate-pixel/affiliate-pixel.types.ts`**

- `MetaEventType`, `PixelEventStatus`
- `MetaUserData`, `MetaCustomData`, `MetaPixelEvent`
- `MetaEventResponse`, `MetaConversionsApiResponse`
- `ConversionValueType`, `PixelConfig`, `AffiliatePixelConfig`
- `AffiliatePixelEvent`, `PaginatedPixelEvents`

**Action:** Create `src/application/use-cases/affiliate-pixel/types/index.ts`

### 3. Affiliate-Tracking Types (`affiliate-tracking`)

**Current: `src/modules/affiliate-tracking/affiliate-tracking.types.ts`**

- `TrackingMethod`, `ConversionValueType`
- `AffiliateTrackingLink`, `AffiliateAttribution`
- `CreateTrackingLinkDTO`, `UpdateTrackingLinkDTO`, `AttributeOrderDTO`
- `TrackingStats`, `AttributionData`, `AffiliateCookieData`
- `PaginatedTrackingLinks`, `PaginatedAttributions`

**Action:** Create `src/application/use-cases/affiliate-tracking/types/index.ts`

### 4. Affiliate-Sales Types (`affiliate-sales`)

**Current: `src/modules/affiliates-sales/affiliate-sales.types.ts`**

- `AffiliateSaleStatus`, `CommissionType`
- `AffiliateSale`, `PaginationMeta`, `PaginatedAffiliateSales`
- `UpdateAffiliateSaleStatusDTO`

**Action:** Create `src/application/use-cases/affiliate-sales/types/index.ts`

## Module Updates

After moving types to use-cases, update `src/modules/*/types.ts` files to re-export from use-cases for backward compatibility, OR remove them entirely and update all imports.

### Recommended: Re-export from modules for backward compatibility

```typescript
// src/modules/affiliates/affiliate.types.ts
export * from "../../application/use-cases/affiliate/types";
```

## Implementation Order

1. Create types folders and index files in each use-cases directory
2. Move/copy types to new locations
3. Update use-cases index.ts to re-export types
4. Update module types files to re-export from use-cases (backward compatibility)
5. Verify build works

## Notes

- Some types may be duplicated across modules (e.g., `CommissionType` appears in both `affiliates` and `affiliates-sales`)
- Consider creating shared types if needed, but per user request, all types go to use-cases
- Domain entities (in `src/domain/entities/`) should remain as they are - these are separate from API types
