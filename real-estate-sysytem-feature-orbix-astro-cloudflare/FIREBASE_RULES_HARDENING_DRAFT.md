# Firebase Rules Hardening Draft

Draft date: 2026-06-19  
Scope: shared Flutter + React Firebase backend  
Status: proposal only, not deployed

Inspected files:

- `rivia-proptech-main/firestore.rules`
- `rivia-proptech-main/storage.rules`
- React Firebase path usage in:
  - `src/services/userService.ts`
  - `src/services/authService.ts`
  - `src/services/storageService.ts`
  - `src/services/propertyService.ts`
  - `src/services/propertyRequestService.ts`
  - `src/services/hotelService.ts`
  - `src/services/heroSlideService.ts`
  - `src/services/adsService.ts`
  - `src/services/reportService.ts`
  - `src/services/verificationService.ts`
  - `src/services/bookingService.ts`
  - `src/services/dealService.ts`
  - `src/services/invoiceService.ts`
  - `src/services/contractService.ts`

No rule files, app code, Cloud Functions, or Flutter files were modified.

## 1. Executive Summary

The current rules are functional for the existing apps but are not production-hardened. The main risks are broad user self-updates, broad property owner updates, broad property request owner updates, unrestricted deal-party status updates, Storage paths missing for ads and hero slides, and document-role based staff checks.

The hardened rules below are intentionally stricter than the current app assumptions. Some proposed changes will require React/Flutter query or workflow updates before deployment, especially:

- Public property reads restricted to visible/approved properties.
- Public hotel reads restricted to visible/approved hotels.
- Property owner direct updates restricted to safe editable fields.
- Property request owner updates restricted so owners cannot approve/reject.
- Role changes moved away from direct client writes.
- Ads and hero slide Storage paths added.

Recommendation: do not deploy this draft directly. Use it as a target, then migrate app queries and privileged writes in phases with emulator tests.

## 2. Firestore Risks Found

1. `users/{uid}` allows self update of the full user document. A user can potentially set `role`, `isVerified`, or `verificationStatus`.
2. Staff checks are based on `users/{uid}.role`. This is acceptable only if role fields are protected by rules or custom claims.
3. `properties/{id}` allows owners to update/delete the full property, including moderation and featured fields.
4. `property_requests/{id}` allows owners to update the full request, including `status`, `approvedBy`, `rejectedBy`, and moderation fields.
5. `deals/{id}` allows deal parties to update the full deal document, including status/payment/contract fields.
6. `fcm_notification_requests/{id}` allows any signed-in user to update request docs.
7. `property_reports` and `hotel_reports` allow signed-in creation but do not validate immutable/report status fields.
8. `features/global` is staff-write, which is fine, but schema must support `list` and `values`.
9. `home_hero_slides` is used by React but has no current Firestore rule.
10. `ads` is used by both apps but has no current Firestore rule.
11. Public property and hotel reads are fully open, including hidden/deleted records.
12. `invoices` staff creation is okay, but any user-facing invoice creation must move through staff/server paths.
13. `contracts` direct writes are correctly denied, but callable Function authorization must be fixed separately.

## 3. Storage Risks Found

1. `ads/{file}` uploads are used but denied by current Storage rules.
2. `home/hero-slides/{slideId}/{file}` uploads are used by React but denied by current Storage rules.
3. Hotel Storage uses two competing patterns:
   - Flutter: `hotels/{uid}/...`
   - React: `hotels/{hotelId}/images/{file}`
4. Current hotel Storage rule allows any admin/owner to write under any `hotels/{userId}/...` path, which is broad but compatible.
5. Current Storage rules do not validate content type or file size.
6. Storage staff checks also depend on document roles.

## 4. Proposed Firestore Rules Draft

This is a draft target. It is not a drop-in replacement until app queries are migrated and tested.

```rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function userDoc(uid) {
      return get(/databases/$(database)/documents/users/$(uid)).data;
    }

    function userExists(uid) {
      return exists(/databases/$(database)/documents/users/$(uid));
    }

    // Production preference: replace document role checks with custom claims:
    // request.auth.token.role in ['owner', 'admin']
    function isOwnerClaim() {
      return isSignedIn() && request.auth.token.role == 'owner';
    }

    function isAdminClaim() {
      return isSignedIn() && request.auth.token.role == 'admin';
    }

    // Transitional fallback for current app. Safe only if users/{uid}.role is locked down.
    function hasDocumentRole(role) {
      return isSignedIn() && userExists(request.auth.uid) && userDoc(request.auth.uid).role == role;
    }

    function isAppOwner() {
      return isOwnerClaim() || hasDocumentRole('owner');
    }

    function isAdmin() {
      return isAdminClaim() || hasDocumentRole('admin');
    }

    function isStaff() {
      return isAppOwner() || isAdmin();
    }

    function isVerifiedUser() {
      return isSignedIn()
        && userExists(request.auth.uid)
        && userDoc(request.auth.uid).isVerified == true;
    }

    function isPublicVisible(data) {
      return data.status != 'deleted'
        && data.isVisible != false
        && (
          data.status == 'approved'
          || data.isApproved == true
          || data.isVisible == true
        );
    }

    function isDealParty(data) {
      return isSignedIn()
        && (
          request.auth.uid == data.customerUserId
          || request.auth.uid == data.ownerUserId
        );
    }

    function changedOnly(keys) {
      return request.resource.data.diff(resource.data).affectedKeys().hasOnly(keys);
    }

    function createdOnly(keys) {
      return request.resource.data.keys().hasOnly(keys);
    }

    function doesNotChange(keys) {
      return !request.resource.data.diff(resource.data).affectedKeys().hasAny(keys);
    }

    function isValidReportStatus(status) {
      return status in ['pending', 'open', 'resolved', 'rejected', 'closed'];
    }

    function isValidRequestStatus(status) {
      return status in ['pending', 'approved', 'rejected'];
    }

    function isOwnUser(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function safeUserCreate(userId) {
      return isOwnUser(userId)
        && request.resource.data.uid == userId
        && request.resource.data.role == null
        && request.resource.data.isAdmin == null
        && request.resource.data.isStaff == null
        && request.resource.data.isVerified == false
        && request.resource.data.verificationStatus == null;
    }

    function safeUserSelfUpdate() {
      return changedOnly([
        'username',
        'displayName',
        'phone',
        'phoneNumber',
        'photoURL',
        'email',
        'updatedAt'
      ])
      && doesNotChange([
        'role',
        'isAdmin',
        'isStaff',
        'isVerified',
        'verificationStatus',
        'isActive',
        'deactivation_reason',
        'created_at',
        'createdAt'
      ]);
    }

    match /users/{userId} {
      allow read: if isOwnUser(userId) || isStaff();
      allow create: if safeUserCreate(userId);
      allow update: if (isOwnUser(userId) && safeUserSelfUpdate()) || isStaff();
      allow delete: if isAppOwner();
    }

    match /users/{userId}/notifications/{notifId} {
      allow read: if isOwnUser(userId) || isStaff();
      allow update: if isOwnUser(userId)
        && changedOnly(['read'])
        && request.resource.data.read == true
        && resource.data.read == false;
      allow create, delete: if isStaff();
    }

    match /users/{userId}/favorites/{propertyId} {
      allow read, create, update, delete: if isOwnUser(userId);
    }

    match /users/{userId}/user_bookings/{bookingId} {
      allow create: if isOwnUser(userId)
        && request.resource.data.customerUserId == userId
        && request.resource.data.status == 'pending';
      allow read: if isOwnUser(userId) || isStaff();
      allow update, delete: if isStaff();
    }

    match /verifications/{verifId} {
      allow create: if isSignedIn()
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.status == 'pending';
      allow read: if isStaff()
        || (isSignedIn() && request.auth.uid == resource.data.userId);
      allow update: if isStaff();
      allow delete: if isSignedIn()
        && request.auth.uid == resource.data.userId
        && resource.data.status == 'rejected';
    }

    match /features/global {
      allow read: if true;
      allow create, update: if isStaff()
        && request.resource.data.keys().hasAny(['list', 'values']);
      allow delete: if isStaff();
    }

    match /property_category/{id} {
      allow read: if true;
      allow create, update, delete: if isStaff();
    }

    match /settings/{docId} {
      allow read: if true;
      allow create, update, delete: if isStaff();
    }

    match /report_reasons/{reasonId} {
      allow read: if true;
      allow create, update, delete: if isStaff();
    }

    function isPropertyOwner() {
      return isSignedIn() && request.auth.uid == resource.data.ownerId;
    }

    function safeOwnerPropertyUpdate() {
      return isPropertyOwner()
        && changedOnly([
          'title',
          'name',
          'description',
          'city',
          'country',
          'countryCode',
          'address',
          'location',
          'latitude',
          'longitude',
          'lat',
          'lng',
          'area',
          'area_unit',
          'bedrooms',
          'bathrooms',
          'features',
          'images',
          'mainImage',
          'imageUrl',
          'contact_name',
          'contact_number',
          'contactPhone',
          'phone',
          'rules',
          'daily_price',
          'nightly_price',
          'selling_price',
          'daily_price_currency',
          'nightly_currency',
          'selling_price_currency',
          'panorama_tour',
          'panoramaTour',
          'panoramaTours',
          'updatedAt'
        ])
        && doesNotChange([
          'status',
          'isVisible',
          'isFeatured',
          'featured',
          'isDistinct',
          'featuredStartedAt',
          'featuredUntil',
          'featuredBy',
          'featuredPlan',
          'featuredNote',
          'featuredOrder',
          'promotionStatus',
          'promotionType',
          'approvedAt',
          'approvedBy',
          'rejectedAt',
          'rejectedBy',
          'adminNote',
          'adminNotes'
        ]);
    }

    match /properties/{propId} {
      // Compatibility warning: public queries must include visible/approved constraints.
      allow read: if isStaff() || isPublicVisible(resource.data);
      allow create: if isStaff();
      allow update: if isStaff() || safeOwnerPropertyUpdate();
      allow delete: if isStaff();

      match /panorama_tour/{docId} {
        allow read: if true;
        allow create, update, delete: if isStaff();
      }

      match /comments/{commentId} {
        allow read: if true;
        allow create: if isSignedIn()
          && request.resource.data.userId == request.auth.uid;
        allow update, delete: if isStaff()
          || (isSignedIn() && request.auth.uid == resource.data.userId);
      }

      match /ratings/{userId} {
        allow read: if true;
        allow create, update: if isOwnUser(userId);
        allow delete: if isOwnUser(userId) || isStaff();
      }

      match /bookings/{bookingId} {
        allow create: if isSignedIn()
          && request.resource.data.customerUserId == request.auth.uid
          && request.resource.data.status == 'pending';
        allow read: if isStaff() || isDealParty(resource.data);
        allow update, delete: if isStaff();
      }
    }

    function safePropertyRequestCreate() {
      return isSignedIn()
        && (isVerifiedUser() || isStaff())
        && request.resource.data.ownerId == request.auth.uid
        && request.resource.data.status == 'pending'
        && request.resource.data.request_type in ['publish', 'edit'];
    }

    function safeOwnerRequestUpdate() {
      return isSignedIn()
        && request.auth.uid == resource.data.ownerId
        && resource.data.status == 'pending'
        && changedOnly([
          'title',
          'description',
          'property_type',
          'propertyType',
          'listing_type',
          'listingType',
          'city',
          'country',
          'countryCode',
          'address',
          'location',
          'latitude',
          'longitude',
          'lat',
          'lng',
          'area',
          'area_unit',
          'bathrooms',
          'bedrooms',
          'features',
          'images',
          'mainImage',
          'property_category_id',
          'property_category_title',
          'contact_number',
          'contact_name',
          'rules',
          'daily_price',
          'nightly_price',
          'selling_price',
          'daily_price_currency',
          'nightly_currency',
          'selling_price_currency',
          'panorama_tour',
          'updatedAt'
        ])
        && doesNotChange([
          'status',
          'approvedAt',
          'approvedBy',
          'rejectedAt',
          'rejectedBy',
          'rejectionReason',
          'adminNote',
          'adminNotes'
        ]);
    }

    match /property_requests/{requestId} {
      allow create: if safePropertyRequestCreate();
      allow read: if isStaff()
        || (isSignedIn() && request.auth.uid == resource.data.ownerId);
      allow update: if isStaff()
        || safeOwnerRequestUpdate();
      allow delete: if isStaff();

      match /panorama_tour/{docId} {
        allow read, write: if isStaff()
          || (
            isSignedIn()
            && request.auth.uid == get(/databases/$(database)/documents/property_requests/$(requestId)).data.ownerId
            && get(/databases/$(database)/documents/property_requests/$(requestId)).data.status == 'pending'
          );
      }
    }

    match /property_reports/{reportId} {
      allow create: if isSignedIn()
        && request.resource.data.reporter_id == request.auth.uid
        && isValidReportStatus(request.resource.data.status)
        && request.resource.data.status in ['pending', 'open'];
      allow read, update, delete: if isStaff();
    }

    match /hotel_reports/{reportId} {
      allow create: if isSignedIn()
        && request.resource.data.reporter_id == request.auth.uid
        && isValidReportStatus(request.resource.data.status)
        && request.resource.data.status in ['pending', 'open'];
      allow read, update, delete: if isStaff();
    }

    match /ads/{adId} {
      allow read: if resource.data.isActive == true || isStaff();
      allow create, update, delete: if isStaff();
    }

    // Optional React-only feature. Enable only if /admin/hero-slides remains supported.
    match /home_hero_slides/{slideId} {
      allow read: if resource.data.isActive == true || isStaff();
      allow create, update, delete: if isStaff();
    }

    match /hotels/{hotelId} {
      allow read: if isStaff() || isPublicVisible(resource.data);
      allow create, update, delete: if isStaff();

      match /room_types/{roomTypeId} {
        allow read: if true;
        allow create, delete: if isStaff();
        allow update: if isStaff()
          || (
            isSignedIn()
            && changedOnly(['available_count'])
            && request.resource.data.available_count is int
            && request.resource.data.available_count >= 0
            && request.resource.data.available_count <= resource.data.total_count
          );

        match /panorama_tour/{docId} {
          allow read: if true;
          allow write: if isStaff();
        }

        match /bookings/{bookingId} {
          allow read, create, update, delete: if isStaff();
        }
      }
    }

    match /deals/{dealId} {
      allow create: if isSignedIn()
        && isVerifiedUser()
        && request.resource.data.customerUserId == request.auth.uid
        && request.resource.data.status == 'pending';
      allow read: if isStaff() || isDealParty(resource.data);

      // Staff can manage directly. Deal parties should not change legal/payment fields directly.
      allow update: if isStaff()
        || (
          isDealParty(resource.data)
          && changedOnly([
            'customerNote',
            'customer_note',
            'proposedPrice',
            'proposed_price',
            'preferredContactMethod',
            'preferred_contact_method',
            'updatedAt'
          ])
        );
      allow delete: if isStaff();
    }

    match /contracts/{contractId} {
      allow read: if isStaff() || isDealParty(resource.data);
      allow create, update, delete: if false;
    }

    match /invoices/{invoiceId} {
      allow create: if isStaff();
      allow read: if isStaff() || isDealParty(resource.data);
      allow update, delete: if isStaff();
    }

    match /manual_payments/{paymentId} {
      allow create: if isSignedIn()
        && request.resource.data.customerUserId == request.auth.uid;
      allow read: if isStaff() || isDealParty(resource.data);
      allow update, delete: if isStaff();
    }

    match /mail/{mailId} {
      allow read, write: if isStaff();
    }

    match /fcm_notification_requests/{requestId} {
      allow create, read, update, delete: if isStaff();
    }

    match /requests/{reqId} {
      allow create: if isSignedIn();
      allow read: if isStaff()
        || (
          isSignedIn()
          && (
            request.auth.uid == resource.data.renterId
            || request.auth.uid == resource.data.ownerId
          )
        );
      allow update, delete: if isStaff();
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 5. Proposed Storage Rules Draft

This draft includes new production paths and keeps compatibility notes for existing Flutter paths.

```rules
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() {
      return request.auth != null;
    }

    // Production preference: use custom claims.
    function isOwnerClaim() {
      return isSignedIn() && request.auth.token.role == 'owner';
    }

    function isAdminClaim() {
      return isSignedIn() && request.auth.token.role == 'admin';
    }

    // Transitional fallback only. Safe if users/{uid}.role is locked down.
    function hasDocumentRole(role) {
      return isSignedIn()
        && exists(/databases/(default)/documents/users/$(request.auth.uid))
        && get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == role;
    }

    function isStaff() {
      return isOwnerClaim()
        || isAdminClaim()
        || hasDocumentRole('owner')
        || hasDocumentRole('admin');
    }

    function isImage() {
      return request.resource != null
        && request.resource.contentType in [
          'image/jpeg',
          'image/png',
          'image/webp'
        ];
    }

    function imageUnder5MB() {
      return request.resource != null && request.resource.size <= 5 * 1024 * 1024;
    }

    function safeImageUpload() {
      return isImage() && imageUnder5MB();
    }

    match /id_verifications/{userId}/{fileName} {
      allow read: if isSignedIn() && (request.auth.uid == userId || isStaff());
      allow write: if isSignedIn()
        && (request.auth.uid == userId || isStaff())
        && safeImageUpload();
    }

    match /properties/{userId}/property_images/{fileName} {
      allow read: if true;
      allow write: if isSignedIn()
        && (request.auth.uid == userId || isStaff())
        && safeImageUpload();
    }

    match /properties/{userId}/panorama_tours/{fileName} {
      allow read: if true;
      allow write: if isSignedIn()
        && (request.auth.uid == userId || isStaff())
        && safeImageUpload();
    }

    // Canonical React hotel image path.
    match /hotels/{hotelId}/images/{fileName} {
      allow read: if true;
      allow write: if isStaff() && safeImageUpload();
    }

    match /hotels/{hotelId}/room_types/{roomTypeId}/images/{fileName} {
      allow read: if true;
      allow write: if isStaff() && safeImageUpload();
    }

    match /hotels/{hotelId}/room_types/{roomTypeId}/panorama_tours/{fileName} {
      allow read: if true;
      allow write: if isStaff() && safeImageUpload();
    }

    // Compatibility path for current Flutter hotel uploads: hotels/{uid}/...
    // Keep during migration if existing Flutter admin uploads still use user-based paths.
    match /hotels_legacy/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if isSignedIn()
        && (request.auth.uid == userId || isStaff())
        && safeImageUpload();
    }

    // If keeping the existing Flutter path without code migration, use this instead of hotels_legacy:
    // match /hotels/{userId}/{allPaths=**} {
    //   allow read: if true;
    //   allow write: if isSignedIn()
    //     && (request.auth.uid == userId || isStaff())
    //     && safeImageUpload();
    // }
    //
    // Warning: this overlaps with canonical hotels/{hotelId}/images and is broader.

    match /ads/{adId}/{fileName} {
      allow read: if true;
      allow write: if isStaff() && safeImageUpload();
    }

    // Optional React-only feature. Enable only if /admin/hero-slides remains supported.
    match /home/hero-slides/{slideId}/{fileName} {
      allow read: if true;
      allow write: if isStaff() && safeImageUpload();
    }

    // Client contract uploads should stay denied unless a specific signed upload flow exists.
    match /contracts/{allPaths=**} {
      allow read, write: if false;
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## 6. Compatibility Matrix

| Proposed change | Flutter impact | React impact | Possible broken flow | Manual test |
|---|---|---|---|---|
| Lock `users/{uid}` self updates | Profile edits still work only for allowed fields. | Profile page works if it only edits safe fields. | Any client role/verification update from Users page fails unless staff/custom claim. | Register, edit profile, admin verify user. |
| Move role changes away from direct client writes | Flutter add-admin flow may fail if it writes `users.role` directly. | `/admin/admin-roles` direct update may fail. | Admin role management. | Owner promotes/demotes admin in staging. |
| Restrict public property read to visible/approved | Flutter public property queries must filter to visible/approved. | React currently does broad fallback reads, which will fail unless queries are updated. | Home, `/properties`, `/map`, `/properties/:id` for hidden records. | Public browsing with only approved visible docs. |
| Restrict owner property update fields | Owners can edit content fields only. | React direct edit may work for safe fields; hide/delete by owner will fail. | Owner hide/delete direct actions. | Owner edit title/images/location; owner cannot feature/approve/hide. |
| Staff-only property moderation | Flutter admin works if staff. | React admin works if staff. | Non-staff direct moderation blocked. | Approve, reject, hide, feature as admin. |
| Restrict property request owner update | User can edit pending request content only. | React request edits ok if safe. | Owner cannot self-approve/reject. | User submit/edit pending request; admin approve. |
| Property request create requires verified user | Existing behavior preserved. | React `/add-property` fails for unverified users. | Add property by unverified accounts. | Verified and unverified submission tests. |
| Reports create only pending/open | Flutter writes `pending`. | React now writes `pending`. | Old React `open` still allowed. | Create report; admin resolves/rejects. |
| Add `ads` Firestore rules | Flutter ads admin works if staff. | React ads admin works if staff. | Public reads only active ads if rule uses `isActive`. | Public ad display and admin CRUD. |
| Add `home_hero_slides` rules | No Flutter impact. | React hero slide admin works if feature kept. | If disabled, admin page should show permission error. | Admin upload/list/toggle hero slide. |
| Restrict hotel public read | Flutter hotel listing must query visible/approved or use staff. | React currently broad reads and filters client-side; query update needed. | Home hotel section, `/hotels/:id`. | Public hotel listing/details. |
| Room `available_count` update only | Flutter hotel booking decrement remains compatible. | Future React hotel booking can decrement only count. | Any client update of other room fields as user fails. | Book room and verify available count. |
| Deal-party update restricted | Flutter/React party edits to legal/payment fields fail. | React admin still can update as staff. | User-side deal status changes if client currently does them. | Customer creates deal; admin changes status. |
| Contracts direct writes denied | Current rule preserved. | React must use Cloud Function. | Direct contract write fails. | Create contract through callable only. |
| Invoice create staff-only | Current rule preserved. | React user flow cannot direct create invoice. | Purchase flow if it calls `createInvoice` as normal user. | Admin invoice create; user read only own invoice. |
| FCM update staff-only | Flutter Function trigger still works if staff creates docs. | React has no FCM UI. | Any signed-in user update currently allowed would fail. | Admin notification queue and function status update. |
| Add Storage content type/size limits | Large/non-image uploads fail. | React upload components must use supported image files. | PDFs or oversized images blocked. | Upload jpg/png/webp under/over 5MB. |
| Add `ads/{adId}/{file}` Storage | Flutter currently uses `ads/{file}.jpg`, so it needs path migration or compatibility rule. | React currently uses `ads/{file}`; needs path migration or compatibility rule. | Ads image upload until app path updated. | Admin ad upload. |
| Add `home/hero-slides` Storage | No Flutter impact. | React hero slide upload works if staff. | Feature remains blocked if not enabled. | Admin hero slide upload. |
| Standardize hotel Storage path | Flutter current `hotels/{uid}/...` may break if legacy path removed. | React hotel upload `hotels/{hotelId}/images` works. | Flutter hotel admin uploads. | Flutter hotel image upload and React hotel image upload. |

## 7. Manual Test Matrix

Run these in Firebase Emulator first, then staging:

| Area | Test | Expected result |
|---|---|---|
| Auth/users | New user registration | Creates own user doc without role/admin fields. |
| Auth/users | User edits own profile | Only safe profile fields update. |
| Auth/users | User tries to set `role: admin` | Denied. |
| Admin users | Staff reads users | Allowed. |
| Admin roles | Owner changes role | Allowed only through future server/custom-claim path. |
| Add property | Verified user creates request | Allowed with `status: pending`. |
| Add property | Unverified user creates request | Denied unless staff. |
| Add property images | User uploads property image | Allowed under `properties/{uid}/property_images`. |
| Add panorama | User uploads panorama image | Allowed under `properties/{uid}/panorama_tours`. |
| Public properties | Anonymous reads approved visible property | Allowed. |
| Public properties | Anonymous reads hidden/deleted property | Denied. |
| Property owner edit | Owner updates title/location/images | Allowed. |
| Property owner escalation | Owner sets `isFeatured` or `status: approved` | Denied. |
| Admin property | Staff hides/features/deletes property | Allowed. |
| Property approval | Staff approves request | Allowed by current direct path, recommended Cloud Function later. |
| Reports | Signed-in user creates property report `pending` | Allowed. |
| Reports | Reporter changes report status | Denied. |
| Admin reports | Staff resolves/rejects report | Allowed. |
| Verification | User submits own verification | Allowed with `pending`. |
| Verification | User self-approves | Denied. |
| Verification upload | User uploads ID image | Allowed for own path. |
| Hotels | Anonymous reads visible approved hotel | Allowed. |
| Hotels | Anonymous reads hidden/deleted hotel | Denied. |
| Hotel admin | Staff creates/updates hotel | Allowed. |
| Hotel images | Staff uploads hotel image | Allowed under canonical path. |
| Room booking | User updates only `available_count` | Allowed if within constraints. |
| Room booking | User changes room price | Denied. |
| Ads | Public reads active ad | Allowed. |
| Ads | Staff creates ad doc and uploads image | Allowed after path migration/rule. |
| Hero slides | Staff uploads hero slide image | Allowed only if optional rules enabled. |
| Deals | Verified customer creates pending deal | Allowed. |
| Deals | Customer changes payment/contract fields | Denied. |
| Deals | Staff updates deal status | Allowed. |
| Invoices | Normal user creates invoice | Denied. |
| Invoices | Staff creates invoice | Allowed. |
| Contracts | Any client direct write | Denied. |
| FCM | Staff creates notification request | Allowed. |
| FCM | Non-staff updates notification request | Denied. |

## 8. Deployment Recommendation

Do not deploy the strict draft in one step. Use phased rollout:

1. Add emulator tests for existing rules and desired behavior.
2. Patch React and Flutter queries to use visible/approved constraints for public property and hotel reads.
3. Move role changes to custom claims or protected Cloud Functions.
4. Move property approval to a protected Cloud Function.
5. Decide Storage canonical paths and migrate app upload paths.
6. Deploy Storage path additions that are additive and tested.
7. Deploy Firestore hardening in stages:
   - user self-update lock
   - reports validation
   - property request lock
   - property owner lock
   - deals/invoices/contracts lock
   - public read restrictions

Recommended first deployable subset after tests:

- Lock user self-updates.
- Lock report creation/status fields.
- Add `ads` and `home/hero-slides` Storage paths if those admin features are kept.
- Keep public property/hotel reads unchanged until app queries are migrated.

## 9. Remaining Cloud Functions Blockers

Rules alone cannot safely complete these workflows:

1. Role changes should use custom claims or a protected callable function.
2. Property request approval should be transactional in Cloud Functions:
   - create/update property
   - copy panorama
   - update owner metadata
   - create notification
   - archive/delete request
3. `createContractForDeal` must enforce:
   - authenticated caller
   - staff or deal-party authorization
   - valid deal status
   - duplicate prevention
4. `queueAdminEmail` must enforce:
   - authenticated caller
   - allowed event type
   - payload schema matching Flutter and React
5. Invoice creation for non-admin purchase flows should be server-owned.
6. Featured/promotion state changes should be staff-only server-authorized operations.
7. FCM notification request status updates should be done by staff/server only, not arbitrary signed-in users.

