# Architecture Parity Next Steps

Audit continuation date: 2026-06-19  
Primary audit file: `ARCHITECTURE_PARITY_AUDIT.md`

This report turns the parity audit into a prioritized remediation plan. It intentionally does not change Firebase rules, Cloud Functions, Flutter files, or React app code.

## 1. Current Readiness Snapshot

| Area | Current state | Next action |
|---|---|---|
| Public property browsing | Mostly functional in React. | Stabilize model normalization and Arabic text. |
| Map/location | Functional after recent fixes. | Keep as regression-tested flow. |
| Add property | Functional but not fully schema-aligned. | Fix feature field compatibility and approval lifecycle. |
| Admin property approval | Works partially. | Move to backend or exactly mirror Flutter side effects. |
| Hotels | Read/details/admin partial. | Complete booking, reporting, room management, room panorama. |
| Ads | UI/service exists. | Storage rules/path decision required. |
| Hero slides | React-only admin feature exists. | Rules/storage decision required or keep disabled. |
| Bookings/deals/contracts | Partial. | Secure callable functions and state transitions. |
| Admin authorization | Unsafe for production. | Custom claims or locked role writes required first. |
| Arabic text quality | Several files still contain mojibake. | Fix UTF-8 strings after functional blockers are sequenced. |

## 2. Dependency Order

Do the work in this order. Later phases depend on earlier phases.

### Phase 0 - Freeze and Baseline

Goal: prevent more schema drift while the migration is being corrected.

1. Freeze Firebase collection/path names in a shared migration document.
2. Add a short "do not invent fields" checklist to future React tasks.
3. Run an emulator or staging smoke test for:
   - add property
   - approve property
   - property booking
   - hotel listing/details
   - admin ads upload
   - verification upload
4. Capture one known-good Firestore document for each core model:
   - property
   - property request
   - hotel
   - room type
   - booking
   - deal
   - invoice
   - contract
   - report
   - verification

No code/rules change required.

### Phase 1 - Security Boundary

Goal: make it impossible for normal users to self-promote or set admin-only fields.

Required backend/rules work:

1. Replace client-trusted admin authorization with Firebase custom claims or a rules-protected admin role mechanism.
2. Lock `users/{uid}` self updates so users cannot modify:
   - `role`
   - `isVerified`
   - `isAdmin`
   - `isStaff`
   - admin/status fields
3. Lock owner updates on `properties/{id}` so owners cannot modify:
   - `status`
   - `isVisible`
   - `isFeatured`
   - `featured`
   - `isDistinct`
   - promotion fields
   - moderation fields
4. Lock owner updates on `property_requests/{id}` so users cannot approve/reject their own request.
5. Convert privileged operations to callable/server operations:
   - property approval
   - role changes
   - featured toggles
   - invoice creation
   - contract creation

React files affected later:

| File | Future change |
|---|---|
| `src/app/providers/AuthProvider.tsx` | Read custom claims or server-authorized role state. |
| `src/routes/AdminRoute.tsx` | Stop trusting mutable `users/{uid}.role` alone. |
| `src/pages/admin/AdminRolesPage.tsx` | Call a protected role-management function instead of direct `updateDoc`. |
| `src/services/adminService.ts` | Remove direct privileged role/status writes where needed. |
| `src/services/propertyService.ts` | Ensure owner edits only submit user-safe fields. |

Production gate: **must be complete before public admin deployment**.

### Phase 2 - Schema Compatibility Fixes

Goal: make React read existing Flutter data without breaking Flutter.

React-only safe fixes:

1. `features/global` compatibility:
   - React must read `list`, `values`, `items`, and `features`.
   - React should write both `list` and `values` during transition.
   - Files:
     - `src/services/featureService.ts`
     - `src/services/propertyRequestService.ts`
2. Report status compatibility:
   - Treat `pending` and `open` as active.
   - Prefer writing Flutter-compatible `status: pending` for new reports.
   - Files:
     - `src/services/reportService.ts`
     - `src/pages/admin/ReportsPage.tsx`
3. Property type/listing type normalization:
   - Flutter uses `property_type` for sale/rent in request creation.
   - React uses `listing_type`, `listingType`, and sometimes `property_type`.
   - Add a single helper that separates:
     - offer/listing type
     - real estate type
     - category
   - Files:
     - `src/services/propertyService.ts`
     - `src/pages/properties/PropertiesPage.tsx`
     - `src/pages/properties/PropertyMapPage.tsx`
     - `src/pages/properties/AddPropertyRequestPage.tsx`
4. Country normalization:
   - Support `SYRIA`, `Syria`, `سوريا`, and country code aliases.
   - Files:
     - `src/lib/countries.ts`
     - `src/services/hotelService.ts`
     - `src/services/propertyService.ts`

Production gate: complete before relying on mixed Flutter/React-created content.

### Phase 3 - Storage Path Alignment

Goal: make uploads predictable and compatible.

Needs rules decision before implementation:

| Feature | Current path | Problem | Recommended path/rule |
|---|---|---|---|
| Ads | `ads/{file}` | Current Storage rules deny `ads/**`. | `ads/{adId}/{file}` public read, staff write. |
| Hero slides | `home/hero-slides/{slideId}/{file}` | Current Storage rules deny path. | public read, staff write, or disable feature. |
| Hotels | Flutter: `hotels/{uid}/...`; React: `hotels/{hotelId}/images/...` | Staff writes work under current broad staff rule, but semantics differ. | `hotels/{hotelId}/images/{file}` public read, staff write. |
| Hotel room images | Flutter stores under staff user folder. | React room asset management incomplete. | `hotels/{hotelId}/room_types/{roomTypeId}/images/{file}`. |

React files affected later:

| File | Future change |
|---|---|
| `src/services/storageService.ts` | Update ad/hotel upload paths after rule decision. |
| `src/services/heroSlideService.ts` | Keep disabled or align rules/path. |
| `src/services/hotelService.ts` | Standardize hotel image path after rules update. |
| `src/pages/admin/AdsPage.tsx` | Add Arabic blocked-by-rules state if rules are not changed. |
| `src/pages/admin/HeroSlidesAdminPage.tsx` | Add blocked-by-rules state or feature flag. |

Production gate: complete before enabling admin uploads for ads, hero slides, or hotels.

### Phase 4 - Cloud Functions Contract

Goal: make privileged workflows server-authoritative.

Functions to fix:

1. `createContractForDeal`
   - Require `context.auth`.
   - Verify caller is staff or a party to the deal.
   - Validate deal status and listing type.
   - Reject duplicate or invalid contract creation.
2. `queueAdminEmail`
   - Require `context.auth`.
   - Validate allowed event types.
   - Align payload with React and Flutter.
   - Current mismatch:
     - Flutter sends `emailType`, `dealId`, `bookingId`, rich metadata.
     - React sends `type`, `relatedId`.
3. Add future callable functions:
   - `approvePropertyRequest`
   - `setUserRole`
   - `setPropertyFeatured`
   - `createInvoiceForDeal`

React files affected later:

| File | Future change |
|---|---|
| `src/services/functionsService.ts` | Match callable payloads exactly. |
| `src/services/propertyRequestService.ts` | Replace direct approval with callable. |
| `src/services/invoiceService.ts` | Replace direct create for privileged invoice creation. |
| `src/services/dealService.ts` | Keep user-safe deal create only. |
| `src/pages/admin/PendingPropertiesPage.tsx` | Use callable approval result. |

Production gate: complete before bookings/deals/contracts are treated as production legal/financial records.

### Phase 5 - Property Request Approval Parity

Goal: make React approval match Flutter behavior.

Flutter behavior:

1. Reads `property_requests/{id}`.
2. Creates or updates `properties/{propertyId}`.
3. Sets approved status/audit fields.
4. Copies `property_requests/{id}/panorama_tour/main` to `properties/{propertyId}/panorama_tour/main`.
5. Updates owner user metadata such as property list.
6. Creates owner notification.
7. Deletes the request after approval.

React current behavior:

1. Creates or updates property.
2. Preserves inline/subdoc panorama.
3. Updates request status to `approved`.
4. Does not delete request.
5. Does not fully mirror notification/user side effects.

Recommended final implementation:

- Move approval into a Cloud Function transaction.
- Return `{ propertyId, requestId, status }` to React.
- Keep a separate archived audit collection if retaining approved requests is required.

Files:

| File | Future change |
|---|---|
| `src/services/propertyRequestService.ts` | Replace approval implementation. |
| `src/pages/admin/PendingPropertiesPage.tsx` | Use server result, show Arabic errors. |
| `functions/index.js` | Add transactional approval callable. |
| `firestore.rules` | Restrict direct approval/status mutation. |

### Phase 6 - Hotels Parity

Goal: bring hotel workflow to the same maturity as property workflow.

Required parity items:

1. Hotel details:
   - show existing `hotel_name`, `images`, `contact_name`, `contact_number`, `country`, room types.
2. Room type admin:
   - create/edit/delete room types.
   - support `total_count`, `available_count`, `daily_price`, `nightly_price`, images.
3. Hotel booking:
   - create `users/{uid}/user_bookings/{bookingId}` with Flutter-compatible hotel fields.
   - decrement `hotels/{hotelId}/room_types/{roomTypeId}.available_count` within rules constraints.
   - do not write staff-only room booking subcollection from normal users.
4. Hotel reports:
   - signed-in public creation.
   - admin status management.
5. Room panorama:
   - read `hotels/{hotelId}/room_types/{roomTypeId}/panorama_tour/main`.
   - add admin upload only after Storage path/rules decision.

Files:

| File | Future change |
|---|---|
| `src/pages/hotels/HotelDetailsPage.tsx` | Add booking/report/room panorama entry points. |
| `src/services/hotelService.ts` | Add hotel booking and report helpers or split services. |
| `src/pages/admin/HotelsPage.tsx` | Complete room type CRUD and image management. |
| `src/components/cards/HotelCard.tsx` | Keep alias-safe display. |
| `src/services/bookingService.ts` | Add hotel booking payload compatible with Flutter. |

### Phase 7 - Admin Feature Parity

Goal: close admin gaps that Flutter already supports.

Missing or partial React admin modules:

| Flutter feature | React status | Recommendation |
|---|---|---|
| Admin notifications / FCM | Missing | Add `/admin/notifications` using `fcm_notification_requests` after rules review. |
| WhatsApp/contact settings | Missing | Add `/admin/settings` for `settings/whatsapp_contact`. |
| Report reason management | Missing | Add `/admin/report-reasons`. |
| Identity verification queue | Missing/unclear | Add `/admin/verifications` or integrate into Users page. |
| Add/admin owner roles | Partial and unsafe | Move to protected function/custom claims. |
| Hotel room panorama | Missing | Add after hotel Storage alignment. |

### Phase 8 - Arabic Text / Mojibake Cleanup

Goal: restore a trustworthy Arabic RTL admin/public UI.

Confirmed affected React files include:

- `src/routes/AdminRoute.tsx`
- `src/pages/admin/AdminRolesPage.tsx`
- `src/pages/admin/FeaturesPage.tsx`
- `src/pages/properties/EditPropertyPage.tsx`
- `src/services/bookingService.ts`
- `src/services/dealService.ts`
- `src/services/heroSlideService.ts`
- parts of `src/services/propertyService.ts`

Recommended process:

1. Run a targeted `rg -n "Ø|Ù|Ú|Ã|�" src`.
2. Fix strings in small batches by user-facing route.
3. Build after each batch.
4. Prefer moving repeated Arabic labels into constants if reused.
5. Keep source files UTF-8.

Priority order:

1. Public property edit/add/property details.
2. Auth/admin route blocking messages.
3. Booking/deal/error messages.
4. Admin pages.
5. Legacy unused services.

## 3. Concrete React-Only First PR

The safest first code PR should not require rules/functions changes.

Scope:

1. Read `features/global.list` in:
   - `src/services/featureService.ts`
   - `src/services/propertyRequestService.ts`
2. Write both `list` and `values` in `saveFeatureList`.
3. Normalize report status display and write `pending` for new reports.
4. Fix mojibake in:
   - `src/routes/AdminRoute.tsx`
   - `src/pages/admin/FeaturesPage.tsx`
   - `src/services/bookingService.ts`
   - `src/services/dealService.ts`
5. Add small model normalization tests if the test setup is already working.

Expected risk: Low.  
Build required: Yes.  
Rules/functions changes required: No.

## 4. First Backend PR

Scope:

1. Add callable auth/authorization checks to:
   - `createContractForDeal`
   - `queueAdminEmail`
2. Standardize `queueAdminEmail` payload and update React/Flutter callers deliberately.
3. Add `setUserRole` callable or custom-claims workflow.
4. Restrict user self updates in rules.

Expected risk: High but necessary.  
Requires emulator/rules testing: Yes.  
React can remain backward-compatible while backend is deployed.

## 5. First Storage/Rules PR

Scope:

1. Add staff-only write and public read for:
   - `ads/{adId}/{file}`
   - `home/hero-slides/{slideId}/{file}` if hero slides are kept.
2. Decide hotel canonical path:
   - recommended: `hotels/{hotelId}/images/{file}`
3. Preserve current read access for existing URLs.
4. Add migration notes for existing Flutter hotel image URLs.

Expected risk: Medium.  
Requires deployment coordination: Yes.

## 6. Test Matrix For Next Phase

Run this matrix after the first React-only PR:

| Test | Expected result |
|---|---|
| Home loads | Properties/hotels visible, no mojibake in touched areas. |
| `/properties` filters | Existing Flutter fields still filter correctly. |
| `/map` | Markers from root `latitude/longitude`, `lat/lng`, and `location` show. |
| `/add-property` | Feature chips load from `features/global.list`. |
| Add property request | Firestore stores Flutter-compatible fields plus safe aliases. |
| Admin approve request | Existing behavior still works before backend migration. |
| Property report | Writes `property_reports` with Flutter-compatible status. |
| Admin reports | Displays `pending` and `open` as active. |
| Admin features | Saves both `list` and `values`. |
| Build | `npm run build` passes. |

Run this matrix after backend/rules changes:

| Test | Expected result |
|---|---|
| Normal user cannot set role | Firestore write denied. |
| Normal user cannot set property featured/status approved | Firestore write denied. |
| Owner can submit property edit request | Allowed. |
| Staff can approve property request | Callable succeeds. |
| Normal user cannot approve request | Callable denied. |
| Contract function requires auth | Unauthenticated call denied. |
| Non-party cannot create contract for another deal | Denied. |
| Admin ad upload | Succeeds after Storage rule update. |
| Hero slide upload | Succeeds or feature disabled with clear Arabic error. |
| Hotel room availability update | Only `available_count` update allowed for booking flow. |

## 7. Recommended Work Tickets

### Ticket A - Feature Schema Compatibility

- Files: `featureService.ts`, `propertyRequestService.ts`.
- Acceptance:
  - React reads `features/global.list`.
  - React writes `list` and `values`.
  - Add-property feature chips show Flutter-managed features.

### Ticket B - Report Compatibility

- Files: `reportService.ts`, `ReportsPage.tsx`.
- Acceptance:
  - New property reports write `status: pending`.
  - Admin reports treat `pending` and `open` as unresolved.
  - Existing reports still display.

### Ticket C - Auth Boundary Design

- Files later: `AuthProvider.tsx`, `AdminRoute.tsx`, `AdminRolesPage.tsx`, `functions/index.js`, `firestore.rules`.
- Acceptance:
  - Admin access does not depend on user-editable Firestore fields.
  - Role changes are server-authorized.

### Ticket D - Property Approval Function

- Files later: `functions/index.js`, `propertyRequestService.ts`, `PendingPropertiesPage.tsx`.
- Acceptance:
  - Approval is transactional.
  - Panorama copied.
  - Owner notification created.
  - User property metadata updated.
  - Request archived/deleted consistently.

### Ticket E - Storage Rule Alignment

- Files later: `storage.rules`, `storageService.ts`, `heroSlideService.ts`, `hotelService.ts`.
- Acceptance:
  - Ads upload works.
  - Hero slide behavior is explicitly supported or disabled.
  - Hotel image paths are standardized.

### Ticket F - Hotel Completion

- Files later: `HotelDetailsPage.tsx`, `HotelsPage.tsx`, `hotelService.ts`, `bookingService.ts`.
- Acceptance:
  - Hotel room booking works like Flutter.
  - Room type availability decrements safely.
  - Hotel reports work.
  - Room panorama is readable.

### Ticket G - Mojibake Cleanup

- Files: all `rg "Ø|Ù|Ú|Ã|�"` matches under React `src`.
- Acceptance:
  - No corrupted Arabic in source.
  - `npm run build` passes.
  - Key public/admin error states are readable Arabic.

## 8. Go / No-Go By Phase

| Phase complete | Deployment recommendation |
|---|---|
| Only current state | Internal demo/staging only. |
| Phase 2 and 8 only | Public read-only beta possible; avoid admin production use. |
| Phase 1, 3, 4 complete | Admin beta possible with controlled staff. |
| Phase 5 complete | Property workflow production candidate. |
| Phase 6 complete | Hotel workflow production candidate. |
| All phases complete with tests | Production cutover candidate. |

## 9. Immediate Next Command Plan

When implementation begins, start with Ticket A and Ticket B because they are React-only and low risk:

1. Patch feature compatibility.
2. Patch report status compatibility.
3. Patch the smallest confirmed mojibake files that do not affect logic.
4. Run `npm run build`.
5. Smoke-test `/add-property`, `/admin/features`, and `/admin/reports`.

Do not start Ticket C/D/E until rules/functions deployment authority is confirmed.

