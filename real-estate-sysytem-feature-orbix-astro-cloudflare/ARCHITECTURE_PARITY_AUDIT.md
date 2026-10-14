# Architecture Parity Audit

Audit date: 2026-06-19  
Flutter project inspected: `F:\rivia-proptech-main (2)\rivia-proptech-main`  
React project inspected: `F:\rivia-proptech-main (2)\rivia-react-web`

Note: the workspace root contains both projects. The Flutter source, Firebase rules, Storage rules, and Cloud Functions are under the nested `rivia-proptech-main` directory.

## 1. Executive Summary

The React web app is a broad and useful partial migration of the Flutter app, but it is not yet production-equivalent. Public property browsing, property details, map markers, add-property requests, admin property moderation, favorites, account pages, and several admin modules exist in React. The React architecture is cleaner than Flutter in some areas because Firebase access is mostly centralized in services, routes are explicit, and model aliases are flexible.

The largest parity risks are backend compatibility and security, not basic UI coverage. Current rules allow some broad owner/self updates, Cloud Functions callable endpoints lack explicit authorization checks, Storage rules do not support ad or hero-slide uploads, `features/global` uses incompatible field names between Flutter and React, and hotel booking/report/room panorama flows are incomplete in React.

Go/No-Go: **No-Go for full production replacement**. The React app is suitable for internal staging and controlled admin testing after the listed blockers are addressed.

## 2. Architecture Comparison

| Area | Flutter app | React web app | Parity assessment |
|---|---|---|---|
| App structure | GetX feature folders under `lib/features` and `lib/features_admin`; controllers often own UI state and Firebase calls. | React Router pages under `src/pages`, shared services under `src/services`, hooks under `src/hooks`, models in `src/types/models.ts`. | React is more layered and easier to audit, but not all Flutter flows are ported. |
| Routing | GetX and screen navigation from `main.dart`, drawer/admin navigation. | Explicit `createBrowserRouter` routes in `src/app/routes/router.tsx`. | React route coverage is broad. |
| Firebase access | Direct Firestore/Storage calls in controllers. | Mostly centralized in service modules. | React is cleaner, but some services still encode incompatible field assumptions. |
| Property flow | Add request, image upload, panorama upload, admin approval, details, comments, ratings, reports, favorites. | Same major flow exists, with newer location aliases and map integration. | Partial to good; approval behavior differs. |
| Hotel flow | Hotels, room types, room images, room panorama, hotel booking, hotel reports. | Hotels, hotel details, admin hotel form, room type read/service support. | Partial; hotel booking/report and room panorama parity are weak. |
| Admin flow | Property requests, property visibility, categories, features, reports, report reasons, ads, users/admins, notifications, hotels, WhatsApp/settings. | Dashboard, properties, property requests, hotels, users, bookings, reports, ads, categories, features, deals, invoices, contracts, hero slides, admin roles. | Broad but not equivalent; notifications, WhatsApp/settings, report reasons, and some hotel tools are missing. |
| Booking/deals/contracts | Flutter booking/payment/deal flow writes bookings, deals, calls email function, can create contracts via function. | React has bookings, deals, invoices, contracts pages/services. | Partial; backend callable security and payload mismatches are high risk. |
| Panorama/360 | Property and hotel room panorama subcollections. | Property tour support exists; hotel room panorama support appears missing. | Partial. |
| Verification | Identity verification docs and Storage uploads. | Verification page/service exists. | Partial; rules/security issues remain. |
| Favorites | User subcollection favorites. | Hook/service and page exist. | Good parity. |

## 3. Firestore Collection Parity

| Collection/path | Flutter | React | Important fields and mismatches | Risk |
|---|---:|---:|---|---|
| `users` | Yes | Yes | Flutter uses user role, verification, profile fields, notification/favorites subcollections. React AdminRoute trusts `users/{uid}.role`. Rules allow self update, so role/isVerified hardening is needed. | High |
| `users/{uid}/notifications` | Yes | Yes | Flutter creates notifications on admin actions. React reads/marks notifications. React lacks admin notification creation parity. | Medium |
| `users/{uid}/favorites` | Yes | Yes | Property favorite path is compatible. | Low |
| `users/{uid}/user_bookings` | Yes | Yes | Flutter stores property and hotel bookings here. React covers property bookings/admin collectionGroup; hotel booking parity is incomplete. | Medium |
| `properties` | Yes | Yes | Flutter request approval writes `status: approved`, root `latitude/longitude`, snake_case prices. React supports many aliases including `lat/lng` and `location`. | Medium |
| `properties/{id}/panorama_tour/main` | Yes | Yes | Flutter uses subdoc with images. React supports tour service/subdoc and some inline aliases. | Low |
| `properties/{id}/comments` | Yes | Yes | Flutter fields include `id`, `userId`, `userName`, `comment`, `hasBooked`, `createdAt`. React supports comments. | Low |
| `properties/{id}/ratings/{uid}` | Yes | Yes | Flutter uses per-user rating docs and aggregate property updates. React has rating service/page support. | Low |
| `properties/{id}/bookings` | Yes | Yes | Flutter writes alongside `user_bookings`; React does too. Field/date/status aliases should be normalized. | Medium |
| `property_requests` | Yes | Yes | Flutter creates requests and admin deletes approved requests after creating property. React marks request `approved` and keeps it. React also adds `location` and `lat/lng` aliases. | High |
| `property_category` | Yes | Yes | Flutter category field is `title`; React service/admin exists. | Low |
| `features/global` | Yes | Yes | Flutter uses field `list`. React `featureService` reads/writes `values` and `propertyRequestService` reads `values/items/features`, not `list`. This can hide Flutter-managed features. | High |
| `report_reasons` | Yes | Yes | Flutter has admin report reason section. React reads reasons but no equivalent report-reasons admin route was found. | Medium |
| `property_reports` | Yes | Yes | Flutter writes `property_id`, `reporter_id`, `reason_ids`, `reason_text`, `status: pending`, `reported_at`. React writes aliases but uses `status: open`. | Medium |
| `hotel_reports` | Yes | Partial | Flutter has hotel report flow. React admin reports can be aware of hotel reports, but public hotel report workflow appears incomplete. | Medium |
| `hotels` | Yes | Yes | Existing schema includes `hotel_name`, `description`, `contact_name`, `contact_number`, `country`, `images`. React model supports aliases. | Medium |
| `hotels/{hotelId}/room_types` | Yes | Yes | Flutter room fields include `title`, prices, counts, features, images. React reads/service CRUD exists; admin editing is partial. | Medium |
| `hotels/{hotelId}/room_types/{roomId}/panorama_tour/main` | Yes | No/unclear | Flutter supports room panoramas. React hotel room panorama route/UI was not found. | High |
| `deals` | Yes | Yes | Used by booking/purchase flow. React pages/services exist. Callable contract generation security is the main risk. | High |
| `invoices` | Yes | Yes | React admin/user invoice pages exist. Rules allow invoice create only by staff; ensure user purchase never writes invoices directly. | Medium |
| `contracts` | Yes | Yes | Rules deny direct writes; Cloud Function creates contracts. React reads and calls function. Function authorization is high risk. | High |
| `verifications` | Yes | Yes | Verification create/read/update paths mostly align. User verification state update flow needs hardening. | Medium |
| `ads` | Yes | Yes | Both apps use `ads` collection and `ads/{file}.jpg` Storage path. Current Storage rules do not allow `ads/**`. | High |
| `settings` | Yes | No/partial | Flutter uses settings such as WhatsApp contact. React equivalent was not found. | Medium |
| `mail` | Rules only/staff | No | Cloud/email queue may use worker/function instead. Not a direct app blocker. | Low |
| `fcm_notification_requests` | Yes | No | Flutter admin notification flow queues FCM requests. React lacks equivalent admin notification module. | Medium |
| `manual_payments` | Yes/rules | No/partial | Rules support manual payments; React payment parity was not found. | Medium |
| `home_hero_slides` | No | Yes | React-only admin feature. Firestore rules do not include this collection in the inspected rules, so writes may fail under current rules. | High |

## 4. Storage Path Parity

| Asset type | Flutter path | React path | Rules compatibility | Risk/recommendation |
|---|---|---|---|---|
| Property images | `properties/{uid}/property_images/{file}` | `properties/{uid}/property_images/{file}` | Compatible: public read, self/admin write. | Low. |
| Property panorama | `properties/{uid}/panorama_tours/{file}` | `properties/{uid}/panorama_tours/{file}` | Compatible: public read, self/admin write. | Low. |
| Verification images | `id_verifications/{uid}/{...}` | `id_verifications/{uid}/{front/back}` | Compatible path family. | Low. |
| Hotel images | `hotels/{uid}/hotel_images/{hotelId}/{file}` | `hotels/{hotelId}/images/{file}` | Current rule is `hotels/{userId}/{allPaths=**}` with self/admin write. Staff can write React path, but non-staff cannot and path semantics differ. | Medium. Standardize to `hotels/{hotelId}/images/{file}` with public read/staff write. |
| Hotel room images | `hotels/{uid}/{folder}/{file}` | Partial/unclear | Flutter is compatible for staff/self. React room image management is incomplete. | Medium. |
| Ads images | `ads/{file}.jpg` | `ads/{file}` | Not allowed by current Storage rules. | High. Add public read/staff write rule before production. |
| Hero slides | N/A | `home/hero-slides/{slideId}/{file}` | Not allowed by current Storage rules. | High if admin hero slides remain enabled. |
| Contracts | Not observed as client upload | Not observed as client upload | No current rule path. | Low unless PDF upload is added. |

## 5. Route / Screen Parity

| React route | Flutter equivalent | React status | Parity |
|---|---|---|---|
| `/` | Home section | Implemented | Partial/complete |
| `/properties` | Home property listing/search | Implemented | Partial |
| `/properties/:id` | Property details screen | Implemented | Partial/complete |
| `/properties/:id/edit` | Edit property section | Implemented | Partial |
| `/properties/:id/book` | Booking/payment flow | Implemented | Partial |
| `/properties/:id/tour` | Panorama/tour screens | Implemented | Partial |
| `/map`, `/properties/map` | Google maps section | Implemented | Partial/complete |
| `/add-property` | Add property section | Implemented | Partial/complete |
| `/my-properties` | My property/request screens | Implemented | Partial |
| `/my-bookings` | My booking section | Implemented | Partial |
| `/my-requests` | Request aggregation | Implemented | Extra/partial |
| `/favorites` | Favourite section | Implemented | Complete |
| `/profile` | My information section | Implemented | Partial |
| `/verification` | Identify section | Implemented | Partial |
| `/notifications` | Notification section | Implemented | Partial |
| `/hotels/:id` | Hotel details screen | Implemented | Partial |
| `/admin` | Control panel | Implemented | Partial |
| `/admin/property-requests` | Admin pending properties | Implemented | Partial; approval semantics differ |
| `/admin/properties` | Properties visibility/distinct tools | Implemented | Partial |
| `/admin/hotels` | Add/manage hotel section | Implemented | Partial |
| `/admin/hero-slides` | No Flutter equivalent | Implemented | Extra; rules/storage not aligned |
| `/admin/users` | Admin users/add admin | Implemented | Partial |
| `/admin/bookings` | Admin booking section | Implemented | Partial |
| `/admin/reports` | Reports section | Implemented | Partial |
| `/admin/ads` | Ads management | Implemented | Blocked by Storage rules for image upload |
| `/admin/categories` | Property category section | Implemented | Partial/complete |
| `/admin/features` | Property features section | Implemented | Field mismatch with Flutter |
| `/admin/deals` | Deal/payment admin behavior | Implemented | Partial |
| `/admin/invoices` | Invoice admin/user flow | Implemented | Partial |
| `/admin/contracts` | Contract admin/user flow | Implemented | Partial |
| Missing React route | Admin notifications | Missing | Medium risk |
| Missing React route | WhatsApp/contact settings | Missing | Medium risk |
| Missing React route | Report reason management | Missing | Medium risk |
| Missing React route | Identity verification admin queue | Missing/unclear | Medium risk |

## 6. Workflow Parity Analysis

### Visitor browsing
Flutter: home browsing, details, favorites, maps, panorama.  
React: home, property grid, details, map, tour route, hotel cards.  
Readiness: good for properties, partial for hotels.  
Risk: Medium.

### Registration, login, profile, verification
Flutter: auth, profile, identity verification docs/uploads.  
React: login/register/profile/verification pages exist.  
Missing/risk: rules allow self update of user docs; React role checks are doc-based. Verification admin parity is unclear.  
Risk: High.

### Add property
Flutter: uploads images/panorama to compatible Storage paths, writes `property_requests`, admin later approves.  
React: add-property request flow exists with image/tour/location support.  
Missing/risk: `features/global.list` mismatch; React adds coordinate aliases not used by Flutter but compatible; request update rules are broad.  
Risk: Medium.

### Admin approve property
Flutter: creates/updates `properties`, copies panorama subdoc, updates owner notification/user properties, deletes request.  
React: creates/updates property and marks request approved; preserves coordinates and tour; does not mirror all Flutter side effects.  
Production readiness: not equivalent.  
Risk: High.

### Property details
Flutter: gallery, price, features, comments, ratings, booking, reporting, favorites.  
React: most UI and services exist.  
Missing/risk: status and report field differences; comments/rating booking constraints should be verified against Flutter behavior.  
Risk: Medium.

### Booking / purchase
Flutter: property booking writes user and property booking docs, creates/uses deals, calls `queueAdminEmail`, supports contract function.  
React: booking, deals, invoices, contracts pages/services exist.  
Missing/risk: callable functions lack explicit auth checks; React `queueAdminEmail` payload is not the same as Flutter/function expected payload.  
Risk: High.

### Hotels
Flutter: hotels, room types, room images, room panorama, hotel booking, hotel reports.  
React: hotel cards/details/admin form and room type reads exist.  
Missing/risk: hotel booking, hotel report user flow, room panorama, and full room type management parity are incomplete.  
Risk: High.

### Reports
Flutter: property and hotel reports, report reasons admin.  
React: property report and admin reports exist; hotel report/report reasons admin partial or missing.  
Risk: Medium.

### Ads
Flutter: ads collection and Storage upload under `ads`.  
React: ads admin service/page exists and uses same Storage family.  
Missing/risk: current Storage rules deny `ads/**`, so both apps will fail upload unless rules differ in deployed project.  
Risk: High.

### Featured listings
Flutter: distinct/featured admin flow.  
React: featured aliases and admin toggles exist.  
Missing/risk: property owner update rules may allow normal owners to alter visibility/featured/status unless restricted.  
Risk: High.

## 7. Data Model Mismatches

| Model | Flutter fields | React fields/aliases | Issue |
|---|---|---|---|
| Property | `title`, `description`, `property_type`, `property_category_title`, `property_category_id`, `daily_price`, `nightly_price`, `selling_price`, `latitude`, `longitude`, `mainImage`, `images`, `features`, `ownerId`, `contact_name`, `contact_number`, `status`, `isVisible` | Very broad aliases: `name/title`, `property_type/propertyType/type/listingType`, price aliases, `lat/lng`, `location`, image aliases | React is tolerant, but `property_type` semantics can mean listing type in Flutter and property kind/category in React filters. |
| PropertyRequest | Same as property plus `request_type`, `status`, `created_at`, `updatedAt`; panorama subcollection | React adds `location` and root aliases, keeps approved requests | Approval lifecycle differs. |
| Hotel | `hotel_name`, `description`, `city`, `country`, `address`, `latitude`, `longitude`, `contact_name`, `contact_number`, `rules`, `images`, timestamps | React supports `hotel_name/name/title`, `contact_number/phone`, `created_at/createdAt`, status/visible aliases | Good alias support; room/booking parity is weaker than model support. |
| RoomType | `title`, `description`, `area`, `area_unit`, `bedrooms`, `bathrooms`, `daily_price`, `nightly_price`, `total_count`, `available_count`, `features`, `images` | `name/title`, `price/price_per_night/pricePerNight/nightlyPrice`, count aliases | Good aliases; full admin and room panorama parity missing. |
| User | profile fields, `role`, verification flags, notifications/favorites/bookings | UserProfile supports role/profile fields | Security issue: user doc fields are too trusted. |
| Booking | Flutter stores both snake_case and camelCase in newer flow; hotel bookings use `hotel_id`, `room_type_id`, room fields | React supports broad booking fields | Hotel booking not fully implemented. |
| Deal | `dealId`, property/customer/owner fields, status, contract fields | React Deal supports many aliases | Callable/security mismatch more important than model shape. |
| Invoice | Customer/owner/property/deal/status/amount fields | React Invoice aliases | Ensure only staff/function creates invoices. |
| Contract | Function-generated contract docs | React reads contract docs | Direct writes denied correctly; callable auth missing. |
| Report | Flutter uses `property_id`/`hotel_id`, `reporter_id`, `reason_ids`, `reason_text`, `status: pending` | React property report writes aliases but uses `status: open` | Status normalization needed. |
| Verification | user id, ID image URLs, status/timestamps | React setDoc under `verifications/{uid}` | Compatible path family; admin review parity unclear. |
| Feature/category | Flutter `features/global.list`, categories `title` | React feature service `values`; category service exists | Feature field mismatch is a concrete bug. |
| Ad | Firestore fields include image/order and metadata | React ad service/page | Storage rules block upload. |
| Panorama | Flutter subdoc `panorama_tour/main` with image scene data | React tour service supports property tour and inline aliases | Property mostly compatible; hotel room tour missing. |

## 8. Firebase Rules Compatibility Issues

1. `users/{uid}` self update is broad. A malicious user may be able to set `role`, `isVerified`, or other trusted fields unless the deployed rules differ.
2. `AdminRoute` relies on `users/{uid}.role`, which is unsafe without custom claims or locked-down role writes.
3. `properties/{id}` owner update is broad. Owners may be able to set `status`, `isFeatured`, `isVisible`, promotion fields, or admin-only fields.
4. `property_requests/{id}` owner update is broad. Owners may be able to change request status or moderation fields.
5. `contracts` direct create/update/delete is denied, which is good, but the callable function that creates contracts must enforce auth/authorization.
6. `hotels` writes are staff-only. React admin hotel writes are compatible for staff, but public hotel owner workflows cannot write directly.
7. `ads/**` Storage is denied. Admin ad image upload will fail.
8. `home/hero-slides/**` Storage is denied. React hero slide image upload will fail if used.
9. `home_hero_slides` Firestore collection is not covered by inspected rules. Admin hero slide CRUD may fail.
10. `invoices` create is staff-only. React user purchase flow must not directly create invoices from a normal user.
11. Reports create rules are compatible for signed-in users; admin manage rules are compatible.
12. Room type `available_count` signed-in update is intentionally narrow and compatible with hotel booking count decrement, but React must not update other fields as a normal user.

Fields normal users should never set directly: `role`, `isAdmin`, `isStaff`, `isVerified`, `status: approved`, `approvedBy`, `approvedAt`, `isFeatured`, `featured`, `isDistinct`, `isVisible`, promotion fields, admin notes, invoice status, contract status, and moderation status fields.

## 9. Cloud Functions Compatibility Issues

Inspected functions:

| Function | Flutter usage | React usage | Issue |
|---|---|---|---|
| `sendFCMNotification` | Flutter admin notification flow queues `fcm_notification_requests`. | No React equivalent found. | React admin notification parity missing. |
| `createContractForDeal` | Used by deal/contract flow. | Called by React `functionsService`. | Function does not show explicit `context.auth` or deal-party/staff authorization checks. High risk. |
| `queueAdminEmail` | Flutter payment controller calls with rich payload: `emailType`, `dealId`, `bookingId`, etc. | React wrapper sends `{ type, relatedId }`. | Payload mismatch and no explicit callable auth/validation. High risk. |

Production blockers:
- Add auth and authorization checks to callable functions.
- Validate request shape and allowed state transitions.
- Align React email payload with the function contract or update function schema deliberately.
- Prefer server-side creation for contracts and any privileged invoice/status operations.

## 10. Production Blockers

1. User role and verification fields are trusted from mutable Firestore user documents.
2. Callable Cloud Functions lack explicit authorization checks.
3. React and Flutter disagree on `features/global` field: `values` vs `list`.
4. Ad image uploads are blocked by current Storage rules.
5. Hero slide Firestore/Storage paths are not covered by current rules.
6. React property approval lifecycle does not match Flutter side effects.
7. Property owner/request owner write rules are too broad for production moderation.
8. Hotel workflow parity is incomplete: booking, reporting, room type editing, and room panoramas.
9. React `queueAdminEmail` payload does not match Flutter/function payload.
10. Invoice/contract/deal privileged transitions need server-side enforcement.
11. Report status values differ (`pending` vs `open`).
12. Admin notification and settings/WhatsApp management parity is missing.

## 11. Safe Quick Fixes

These are low-risk app fixes that do not require schema migration:

1. Update React feature readers to accept `features/global.list`.
2. When saving features from React, write both `list` and `values` during transition.
3. Normalize report status display to handle both `pending` and `open`.
4. Gate or remove remaining mojibake admin error strings in React services.
5. Add clear Arabic permission errors for admin hero slides and ads when rules block writes.
6. Add a warning banner in admin hero slides if rules are not configured.
7. Ensure debug logs are consistently behind `import.meta.env.DEV`.
8. Add field guards in React forms so normal user flows never submit admin-only fields.
9. Add compatibility tests for `Property`, `Hotel`, and `RoomType` normalization.
10. Document current Storage path expectations in the React README/admin docs.

No safe code fixes were applied during this audit.

## 12. Medium-Term Refactors

1. Introduce shared normalization helpers for property, hotel, room type, booking, report, and user models.
2. Move privileged operations to Cloud Functions: role updates, property approval, invoice creation, contract creation, featured/visibility changes.
3. Replace document-role admin checks with custom claims or rules-protected role writes.
4. Standardize Storage paths:
   - `properties/{uid}/property_images/{file}`
   - `properties/{uid}/panorama_tours/{file}`
   - `hotels/{hotelId}/images/{file}`
   - `hotels/{hotelId}/room_types/{roomTypeId}/images/{file}`
   - `ads/{adId}/{file}`
   - `home/hero-slides/{slideId}/{file}`
5. Standardize Firestore status values across reports, bookings, deals, invoices, contracts, and requests.
6. Make property approval a backend transaction/function that copies panorama, creates property, updates notifications/users, and deletes or archives the request consistently.
7. Complete hotel booking/report/room panorama parity.
8. Add React admin pages for report reasons, notifications, settings/WhatsApp contact, and verification queue if they remain in scope.
9. Add emulator tests or rule-unit tests for admin/user boundaries.
10. Split large route chunks if bundle warnings become a production concern.

## 13. Final Go/No-Go Recommendation

Recommendation: **No-Go for full production cutover**.

The React app is viable for staging, demos, and controlled internal admin testing, but it should not replace the Flutter production app until the high-risk Firebase authorization, callable function, Storage path, feature-field, and workflow parity issues are resolved.

Scores:

| Category | Score |
|---|---:|
| Feature parity | 6/10 |
| Data model compatibility | 7/10 |
| Firebase integration | 6/10 |
| Security readiness | 3/10 |
| UI consistency | 7/10 |
| Production readiness | 4/10 |

