# Firestore Property Schema Audit

Generated: 2026-07-16T16:26:46.668Z

Project: rivia-proptech-a0ff2

Documents audited: 6

## Fields That Should Become Canonical

- approvedAt
- approvedBy
- availability
- categoryId
- categoryTitle
- contact
- createdAt
- description
- featured
- featuredBy
- featuredNote
- featuredOrder
- featuredPlan
- featuredStartedAt
- featuredUntil
- features
- isFeatured
- isVisible
- listingType
- location
- media
- ownerId
- panorama_tour
- pricing
- projectInfo
- promotionStatus
- promotionType
- propertyType
- rating
- specs
- status
- title
- updatedAt

## Deprecated Fields

- address
- area
- area_unit
- averageRating
- bathrooms
- bedrooms
- city
- contact_name
- contact_number
- country
- countryCode
- country_code
- currency
- dailyPrice
- daily_price
- daily_price_currency
- images
- isDistinct
- isSold
- lat
- latitude
- listing_type
- lng
- longitude
- mainImage
- monthly_price
- offerType
- offer_type
- phoneCountryCode
- price
- priceCurrency
- property_category_id
- property_category_title
- property_type
- purpose
- ratingCount
- rentPrice
- salePrice
- sellingPrice
- selling_price
- selling_price_currency
- startingPrice
- starting_price
- transactionType
- yearly_price

## Fields Used Only By Flutter

- property_type
- selling_price
- selling_price_currency
- daily_price
- daily_price_currency
- averageRating
- ratingCount
- book_status
- booked_periods
- statusColor
- isSold

## Fields Used Only By React

- offerType
- listing_type
- salePrice
- sellingPrice
- rentPrice
- startingPrice
- pricing
- projectInfo
- location.countryCode

## Field Inventory

| Field | Documents |
|---|---:|
| `address` | 6 |
| `approvedAt` | 4 |
| `approvedBy` | 4 |
| `area` | 6 |
| `area_unit` | 6 |
| `bathrooms` | 6 |
| `bedrooms` | 6 |
| `city` | 6 |
| `contact_name` | 6 |
| `contact_number` | 6 |
| `country` | 6 |
| `country_code` | 2 |
| `countryCode` | 2 |
| `created_at` | 6 |
| `daily_price` | 3 |
| `daily_price_currency` | 3 |
| `description` | 6 |
| `features` | 6 |
| `id` | 4 |
| `images` | 6 |
| `isDistinct` | 1 |
| `isVisible` | 6 |
| `lat` | 2 |
| `latitude` | 6 |
| `listing_type` | 2 |
| `listingType` | 2 |
| `lng` | 2 |
| `location` | 2 |
| `longitude` | 6 |
| `mainImage` | 6 |
| `nightly_currency` | 3 |
| `nightly_price` | 3 |
| `ownerId` | 6 |
| `phoneCountryCode` | 2 |
| `property_category_id` | 6 |
| `property_category_title` | 6 |
| `property_type` | 6 |
| `request_id` | 4 |
| `request_type` | 6 |
| `rules` | 6 |
| `selling_price` | 3 |
| `selling_price_currency` | 3 |
| `sellingPrice` | 2 |
| `status` | 6 |
| `title` | 6 |
| `updatedAt` | 6 |

## Document Findings

### 0KtuIlroP7saHzKKh23A

Missing fields:
- `listingType`
- `propertyType`
- `pricing`
- `location`
- `media`

Deprecated fields:
- `address`
- `area`
- `area_unit`
- `bathrooms`
- `bedrooms`
- `city`
- `contact_name`
- `contact_number`
- `country`
- `daily_price`
- `daily_price_currency`
- `images`
- `latitude`
- `longitude`
- `mainImage`
- `property_category_id`
- `property_category_title`
- `property_type`

Duplicate aliases:
- `propertyType`: `property_type`, `property_category_title`
- `location`: `city`, `country`, `address`, `latitude`, `longitude`
- `media`: `mainImage`, `images`
- `contact`: `contact_name`, `contact_number`

Type mismatches:
- None

Unknown fields:
- `created_at`
- `id`
- `nightly_currency`
- `nightly_price`
- `request_id`
- `request_type`
- `rules`

### IyMhV6AVS3KbQeC2O6MW

Missing fields:
- `listingType`
- `propertyType`
- `pricing`
- `location`
- `media`

Deprecated fields:
- `address`
- `area`
- `area_unit`
- `bathrooms`
- `bedrooms`
- `city`
- `contact_name`
- `contact_number`
- `country`
- `daily_price`
- `daily_price_currency`
- `images`
- `latitude`
- `longitude`
- `mainImage`
- `property_category_id`
- `property_category_title`
- `property_type`

Duplicate aliases:
- `propertyType`: `property_type`, `property_category_title`
- `location`: `city`, `country`, `address`, `latitude`, `longitude`
- `media`: `mainImage`, `images`
- `contact`: `contact_name`, `contact_number`

Type mismatches:
- None

Unknown fields:
- `created_at`
- `id`
- `nightly_currency`
- `nightly_price`
- `request_id`
- `request_type`
- `rules`

### NLVaIG3AQ76Cyj7OYzQ3

Missing fields:
- `propertyType`
- `pricing`
- `media`

Deprecated fields:
- `address`
- `area`
- `area_unit`
- `bathrooms`
- `bedrooms`
- `city`
- `contact_name`
- `contact_number`
- `country`
- `countryCode`
- `country_code`
- `images`
- `lat`
- `latitude`
- `listing_type`
- `lng`
- `longitude`
- `mainImage`
- `phoneCountryCode`
- `property_category_id`
- `property_category_title`
- `property_type`
- `sellingPrice`
- `selling_price`
- `selling_price_currency`

Duplicate aliases:
- `price`: `sellingPrice`, `selling_price`
- `listingType`: `listingType`, `listing_type`
- `propertyType`: `property_type`, `property_category_title`
- `location`: `location`, `city`, `country`, `countryCode`, `latitude`, `longitude`, `lat`, `lng`
- `media`: `mainImage`, `images`
- `contact`: `contact_name`, `contact_number`, `phoneCountryCode`, `country_code`

Type mismatches:
- None

Unknown fields:
- `created_at`
- `request_type`
- `rules`

### W4hTfEHFExnrSEv4Ypyl

Missing fields:
- `listingType`
- `propertyType`
- `pricing`
- `location`
- `media`

Deprecated fields:
- `address`
- `area`
- `area_unit`
- `bathrooms`
- `bedrooms`
- `city`
- `contact_name`
- `contact_number`
- `country`
- `daily_price`
- `daily_price_currency`
- `images`
- `latitude`
- `longitude`
- `mainImage`
- `property_category_id`
- `property_category_title`
- `property_type`

Duplicate aliases:
- `propertyType`: `property_type`, `property_category_title`
- `location`: `city`, `country`, `address`, `latitude`, `longitude`
- `media`: `mainImage`, `images`
- `contact`: `contact_name`, `contact_number`

Type mismatches:
- None

Unknown fields:
- `created_at`
- `id`
- `nightly_currency`
- `nightly_price`
- `request_id`
- `request_type`
- `rules`

### X7jCV330llJ4WIHj5kjZ

Missing fields:
- `listingType`
- `propertyType`
- `pricing`
- `location`
- `media`

Deprecated fields:
- `address`
- `area`
- `area_unit`
- `bathrooms`
- `bedrooms`
- `city`
- `contact_name`
- `contact_number`
- `country`
- `images`
- `isDistinct`
- `latitude`
- `longitude`
- `mainImage`
- `property_category_id`
- `property_category_title`
- `property_type`
- `selling_price`
- `selling_price_currency`

Duplicate aliases:
- `propertyType`: `property_type`, `property_category_title`
- `location`: `city`, `country`, `address`, `latitude`, `longitude`
- `media`: `mainImage`, `images`
- `contact`: `contact_name`, `contact_number`

Type mismatches:
- None

Unknown fields:
- `created_at`
- `id`
- `request_id`
- `request_type`
- `rules`

### fkrCoxDZ3M0avFqVJgt1

Missing fields:
- `propertyType`
- `pricing`
- `media`

Deprecated fields:
- `address`
- `area`
- `area_unit`
- `bathrooms`
- `bedrooms`
- `city`
- `contact_name`
- `contact_number`
- `country`
- `countryCode`
- `country_code`
- `images`
- `lat`
- `latitude`
- `listing_type`
- `lng`
- `longitude`
- `mainImage`
- `phoneCountryCode`
- `property_category_id`
- `property_category_title`
- `property_type`
- `sellingPrice`
- `selling_price`
- `selling_price_currency`

Duplicate aliases:
- `price`: `sellingPrice`, `selling_price`
- `listingType`: `listingType`, `listing_type`
- `propertyType`: `property_type`, `property_category_title`
- `location`: `location`, `city`, `country`, `countryCode`, `latitude`, `longitude`, `lat`, `lng`
- `media`: `mainImage`, `images`
- `contact`: `contact_name`, `contact_number`, `phoneCountryCode`, `country_code`

Type mismatches:
- None

Unknown fields:
- `created_at`
- `request_type`
- `rules`

