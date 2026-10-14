# Orbix Firestore Property Schema v2

This is the single official schema for documents in `properties`.

Legacy aliases may be read by `PropertyMapper` only. New writes from Flutter and React must use this schema.

## Architecture

```text
Firestore
  -> PropertyMapper
  -> Property Model
  -> UI
```

Screens and widgets must not parse Firestore property documents directly.

## Collection

`properties/{propertyId}`

The Firestore document id is the property id. Do not store an `id` field inside the document.

## Canonical Fields

| Field | Type | Required | Notes |
|---|---|---:|---|
| `title` | string | yes | Display title. |
| `description` | string | no | Long description. |
| `listingType` | `"sale" | "rent" | "offPlan" | "unknown"` | yes | Transaction flow. |
| `propertyType` | string | yes | Asset category/type, such as apartment, villa, farm, project. |
| `categoryId` | string | no | Category document id. |
| `categoryTitle` | string | no | Category display label. |
| `status` | string | yes | Workflow state, usually `pending`, `approved`, `deleted`. |
| `availability` | string | no | Market availability, such as `available`, `sold`, `booked`. |
| `isVisible` | boolean | yes | Public listing visibility. |
| `ownerId` | string | yes | Firebase Auth uid of owner. |
| `features` | string[] | no | Feature labels or ids. |
| `pricing` | object | yes | See below. |
| `location` | object | yes | See below. |
| `specs` | object | yes | See below. |
| `contact` | object | no | See below. |
| `media` | object | yes | See below. |
| `rating` | object | no | Aggregate rating cache. See below. |
| `rules` | string | no | Property rules/conditions. |
| `projectInfo` | object | no | Off-plan/project metadata. |
| `panorama_tour` | object | no | Inline tour fallback; canonical subcollection remains allowed. |
| `createdAt` | timestamp | yes | Server timestamp. |
| `updatedAt` | timestamp | yes | Server timestamp. |
| `approvedAt` | timestamp | no | Approval timestamp. |
| `approvedBy` | string | no | Admin uid. |
| `isFeatured` | boolean | no | Featured flag. |
| `featured` | boolean | no | Public featured flag. |
| `featuredUntil` | timestamp | no | Promotion end. |
| `featuredStartedAt` | timestamp | no | Promotion start. |
| `featuredBy` | string | no | Admin uid. |
| `featuredPlan` | string | no | Promotion plan. |
| `featuredNote` | string | no | Internal note. |
| `featuredOrder` | number | no | Featured sort order. |
| `promotionStatus` | string | no | `active`, `expired`, `pending`, `cancelled`. |
| `promotionType` | string | no | `manual`, `paid`, etc. |

## `pricing`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `currency` | string | yes | ISO/common currency label used by Orbix. |
| `salePrice` | number|string | sale only | Required when `listingType = "sale"`. |
| `rentPrice` | number|string | rent only | Required when `listingType = "rent"`. |
| `rentalPeriod` | `"daily" | "weekly" | "monthly" | "yearly"` | rent only | Defaults to `daily`. |
| `startingPrice` | number|string | offPlan only | Required when `listingType = "offPlan"`. |

## `location`

| Field | Type | Required |
|---|---|---:|
| `country` | string | yes |
| `countryCode` | string | no |
| `city` | string | yes |
| `address` | string | no |
| `latitude` | number|string | no |
| `longitude` | number|string | no |

## `specs`

| Field | Type | Required |
|---|---|---:|
| `area` | number|string | no |
| `areaUnit` | string | no |
| `bedrooms` | number|string | no |
| `bathrooms` | number|string | no |

## `contact`

| Field | Type | Required |
|---|---|---:|
| `name` | string | no |
| `phone` | string | no |
| `phoneCountryCode` | string | no |

## `media`

| Field | Type | Required |
|---|---|---:|
| `mainImage` | string | no |
| `images` | string[] | no |

## `rating`

| Field | Type | Required | Notes |
|---|---|---:|---|
| `average` | number | no | Rounded public average. Defaults to `0`. |
| `count` | number | no | Number of rating documents counted. Defaults to `0`. |

## Deprecated Read-Only Aliases

These fields must not be written by new Flutter or React code:

- `price`, `salePrice`, `sellingPrice`, `selling_price`, `selling_price_currency`
- `rentPrice`, `dailyPrice`, `daily_price`, `daily_price_currency`, `monthly_price`, `yearly_price`
- `startingPrice`, `starting_price`
- `property_type`, `property_category_id`, `property_category_title`
- `listing_type`, `offerType`, `offer_type`, `purpose`, `transactionType`
- `currency`, `priceCurrency`
- `city`, `country`, `countryCode`, `address`, `latitude`, `longitude`, `lat`, `lng`
- `area`, `area_unit`, `bedrooms`, `bathrooms`
- `mainImage`, `images`, `imageUrl`
- `contact_name`, `contact_number`, `phoneCountryCode`, `country_code`
- `averageRating`, `ratingCount`
- `isSold`, `isDistinct`
- `created_at`

## Write Rule

All write paths must call the platform mapper before writing:

- React: `toCanonicalPropertyWrite` / `toCanonicalPropertyRequest`
- Flutter: `canonicalPropertyWriteMap`

All read paths must call the platform mapper before UI/model consumption:

- React: `fromPropertyDocData`
- Flutter: `normalizePropertyMap`
