# Proposed Property Edit Rules Hardening

This proposal is **not deployed** and does not replace `firestore.rules`.

## Findings

1. `properties/{propertyId}` currently rejects ordinary non-owners, but ownership checks only support `ownerId`.
2. Property owners can currently update every property field, including moderation and featured fields.
3. `users/{uid}` currently allows unrestricted self-update. A user could set `role: "admin"` and then satisfy `isStaff()`.
4. Owners can update their own `property_requests` without field restrictions, including moderation fields.

## Proposed patch

```rules
function isPropertyOwner(data) {
  return isSignedIn() && (
    request.auth.uid == data.get('ownerId', '') ||
    request.auth.uid == data.get('ownerUserId', '') ||
    request.auth.uid == data.get('userId', '') ||
    request.auth.uid == data.get('createdBy', '') ||
    request.auth.uid == data.get('postedBy', '') ||
    request.auth.uid == data.get('ownerUid', '') ||
    request.auth.uid == data.get('created_by', '')
  );
}

function isSafeSelfProfileUpdate() {
  return request.resource.data.diff(resource.data).affectedKeys().hasOnly([
    'username', 'displayName', 'photoURL', 'phone', 'phoneNumber',
    'contact_number', 'country', 'city', 'address', 'updatedAt'
  ]);
}

match /users/{userId} {
  allow read: if isSignedIn() && (request.auth.uid == userId || isStaff());
  allow create: if isSignedIn()
    && request.auth.uid == userId
    && !request.resource.data.keys().hasAny([
      'role', 'isAdmin', 'isStaff', 'isAppOwner', 'isOwner', 'isVerified'
    ]);
  allow update: if isStaff()
    || (isSignedIn() && request.auth.uid == userId && isSafeSelfProfileUpdate());
  allow delete: if isAppOwner();
}

match /properties/{propertyId} {
  allow read: if true;
  allow create: if isStaff();
  allow update: if isStaff() || (
    isPropertyOwner(resource.data)
    && isPropertyOwner(request.resource.data)
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly([
      'title', 'name', 'description', 'property_type', 'propertyType',
      'listing_type', 'listingType', 'category', 'city', 'country',
      'countryCode', 'address', 'location', 'latitude', 'longitude',
      'lat', 'lng', 'area', 'bedrooms', 'bathrooms', 'features',
      'images', 'mainImage', 'imageUrl', 'rules', 'contact_name',
      'contact_number', 'daily_price', 'dailyPrice', 'nightly_price',
      'nightlyPrice', 'selling_price', 'sellingPrice', 'currency',
      'daily_price_currency', 'nightly_currency',
      'selling_price_currency', 'panorama_tour', 'panoramaTour',
      'panoramaTours', 'updatedAt'
    ])
  );
  allow delete: if isStaff();
}

match /property_requests/{requestId} {
  allow create: if isSignedIn()
    && (isVerifiedUser() || isStaff())
    && (isStaff() || isPropertyOwner(request.resource.data));
  allow read: if isStaff() || isPropertyOwner(resource.data);
  allow update: if isStaff() || (
    isPropertyOwner(resource.data)
    && isPropertyOwner(request.resource.data)
    && resource.data.status == 'pending'
    && request.resource.data.status == 'pending'
    && request.resource.data.diff(resource.data).affectedKeys().hasOnly([
      'title', 'description', 'property_type', 'listing_type', 'city',
      'country', 'countryCode', 'address', 'location', 'latitude',
      'longitude', 'lat', 'lng', 'area', 'bedrooms', 'bathrooms',
      'features', 'images', 'mainImage', 'rules', 'contact_name',
      'contact_number', 'daily_price', 'nightly_price', 'selling_price',
      'daily_price_currency', 'nightly_currency',
      'selling_price_currency', 'panorama_tour', 'updatedAt'
    ])
  );
  allow delete: if isStaff();
}
```

Before deployment, test Flutter and React profile updates, owner edit requests, admin moderation, and legacy properties that use owner aliases.
