# Property Schema Compatibility Report

## Current React Schema Before Fix

React writes property requests and approved properties with both canonical and legacy aliases:

- Price: `price`, `salePrice`, `sellingPrice`, `selling_price`, `rentPrice`, `daily_price`, `monthly_price`, `yearly_price`, `startingPrice`, `starting_price`, and nested `pricing`.
- Listing flow: `offerType`, `listingType`, `listing_type`.
- Currency: `currency`, `priceCurrency`, `selling_price_currency`, `daily_price_currency`, nested `pricing.currency`.
- Location: top-level `country`, `countryCode`, `city`, `address`, `latitude`, `longitude`, plus nested `location`.
- Display: `title`, `name`, `images`, `mainImage`, `status`, `isVisible`.

## Current React Schema After Fix

React now writes property documents through `src/lib/propertySchema.ts`:

- Property requests use `toCanonicalPropertyRequest`.
- Approved properties use `toCanonicalPropertyWrite`.
- Partial property updates use `toCanonicalPropertyUpdate`.
- Firestore reads in property services and admin property lists use `fromPropertyDocData`.
- Featured property writes use `isFeatured` and `featured`; `isDistinct` is retained only as a legacy read alias for properties and as a hotel field.
- Sale confirmation writes `availability: sold` instead of `isSold`.

## Current Flutter Schema Before Fix

Flutter displayed and routed properties mostly from raw maps with legacy fields:

- Sale/rent detection depended on `property_type == بيع` or `property_type == إيجار`.
- Sale price depended on `selling_price` and `selling_price_currency`.
- Rent price depended on `daily_price` and `daily_price_currency`.
- Cards/details passed raw Firestore maps through UI and booking/purchase flows.

## Current Flutter Schema After Fix

Flutter now writes property requests and approved property documents through `canonicalPropertyWriteMap` and reads property documents through `normalizePropertyMap`.

- New writes use canonical `listingType`, `propertyType`, `pricing`, `location`, `specs`, `contact`, and `media`.
- Legacy aliases are still generated inside the normalized in-memory map for old widgets and flows.
- Sale confirmation writes `availability: sold`; the mapper still exposes `isSold` in memory when reading legacy or v2 sold documents.

## Differences

- React uses `listingType` / `offerType` for sale/rent, while Flutter expected sale/rent inside `property_type`.
- React sale properties may expose `price`, `salePrice`, or nested `pricing.salePrice`; Flutter only trusted `selling_price`.
- React rent properties may expose `rentPrice`, `monthly_price`, or nested `pricing`; Flutter only trusted `daily_price`.
- React location may be nested under `location`; Flutter expected top-level `city`, `country`, `address`.

## Compatibility Mapping

Implemented in `lib/core/mappers/property_mapper.dart`:

- `price`: reads `price`, `salePrice`, `sellingPrice`, `selling_price`, `rentPrice`, `daily_price`, `monthly_price`, `yearly_price`, `startingPrice`, `starting_price`, `pricing.*`.
- `listing type`: reads `listingType`, `listing_type`, `purpose`, `transactionType`, `offerType`, `offer_type`, `property_type`, `type`.
- `currency`: reads `currency`, `priceCurrency`, `pricing.currency`, `selling_price_currency`, `daily_price_currency`, `nightly_currency`.
- `status`: reads `status`, `availability`.
- `title`: reads `title`, `titleAr`, `name`.
- `location`: reads top-level location fields and nested `location`.

## Files Modified

- `lib/core/mappers/property_mapper.dart`: new single compatibility mapper for property maps.
- `lib/core/business/business_rules.dart`: sale/rent/deal/amount logic now uses normalized fields.
- `lib/core/widgets/proprty_card.dart`: shared property card now displays normalized title, type, price, currency, image, and location.
- `lib/features/property_details_section/view/property_details_screen.dart`: details screen normalizes incoming map once and passes normalized data to child widgets.
- `lib/features/property_details_section/widget/price_and_booking.dart`: purchase vs booking flow and invoice amount/currency now use normalized fields.
- `lib/features/property_details_section/controller/property_details_controller.dart`: remaining booking helpers normalize property input.
- `lib/features/home_section/controller/home_controller.dart`: Firestore property documents normalize at load time; filters and booking checks use shared flow detection.
- `lib/features/favourite_section/view/favorites_screen.dart`: favorites normalize loaded properties and sale/rent status analysis.
- `lib/features/my_property_section/controller/my_property_controller.dart`: owner property documents normalize at load time.
- `lib/features/my_property_section/widget/my_property_card.dart`: duplicate parsing removed; delegates to shared `PropertyCard`.
- `lib/core/services/deal_service.dart`: deal creation uses normalized listing type and total amount.
- `lib/features_admin/admin_pending_properties_section/controller/admin_pending_property_controller.dart`: approved Flutter-side requests are saved with normalized aliases.
- `lib/features/add_property_section/controller/add_proprety_controller.dart`: property requests now write canonical v2 shape.
- `lib/features/edit_property_section/controller/edit_property_controller.dart`: direct edits and edit requests now write canonical v2 shape.
- `lib/features_admin/add_distinct_property/controller/add_distinct_controller.dart`: property featured toggles now write `isFeatured` / `featured`.
- `lib/features_admin/properties_visibility_section/controller/visibility_controller.dart`: property lists normalize before display and visibility writes stay canonical.
- `lib/features_admin/admin_booking_section/controller/admin_bookings_controller.dart`: sale confirmation writes `availability: sold`, and property booking reads normalize first.
- `scripts/propose_property_schema_migration.js`: optional dry-run migration proposal only; not executed.
- `../property_schema_v2.md`: official Firestore property schema v2.
- `../rivia-react-web/src/lib/propertySchema.ts`: React property mapper and canonical write helpers.
- `../rivia-react-web/src/services/propertyService.ts`: property reads and partial updates route through the mapper.
- `../rivia-react-web/src/services/propertyRequestService.ts`: request and approval writes route through canonical schema helpers.
- `../rivia-react-web/src/services/adminWorkflowService.ts`: admin property lists normalize reads; property featured/sold writes use canonical fields.
- `../rivia-react-web/scripts/audit-property-schema.mjs`: live Firestore audit script.
- `../rivia-react-web/FIRESTORE_PROPERTY_SCHEMA_AUDIT.md`: generated audit of existing property documents.

## Migration

No Firestore data change is required for the app fix. A dry-run migration helper was added only for future cleanup if the team decides to backfill aliases after review.
