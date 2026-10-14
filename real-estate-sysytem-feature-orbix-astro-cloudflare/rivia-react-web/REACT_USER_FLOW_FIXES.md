# React User Flow Fixes

## What Changed

- Reworked the React home page to feel more like a mobile app entry point and less like a marketing landing page.
- Added quick actions from home for:
  - العقارات
  - الخريطة
  - المفضلة
  - الحساب / الدخول
- Added a stronger 360 tour entry on home when a property with tour data exists.
- Added a 360 badge on property cards and map cards when panorama data is present.
- Added a stronger tour callout on the property details page.
- Split property details into clearer sale and rent journeys:
  - sale properties now lead to `طلب شراء`
  - rent properties now lead to `طلب معاينة / حجز`
  - separate tour and map CTAs remain visible
- Added a dedicated purchase-intent page at `/properties/:id/purchase`.
- Upgraded the booking page to a Flutter-like appointment form with:
  - customer name / phone
  - visit type
  - preferred contact method
  - appointment date / time
  - alternative date / time
  - stay-style fields only when the property looks like daily rent / hotel-like
- Booking writes now queue admin email notifications through the safe `queueAdminEmail` wrapper after the user booking is saved.
- Purchase requests now prefer `deals/{dealId}` and fall back to `users/{uid}/user_bookings` when rules block the deal write.
- Purchase requests now queue admin email notifications through the safe wrapper after successful request creation.
- Kept the existing login, favorites, comments, ratings, reports, edit property, booking, profile, notifications, and admin flows intact.

## What Now Matches Better

- Home now starts from search and browse, not from a generic landing pitch.
- The public shell feels more app-like on mobile because the bottom navigation is still present.
- Tour visibility is clearer at the property card and property details layers.
- The map browsing flow has a more obvious path into property details and the tour route.
- Sale properties now read like a purchase journey instead of a generic property CTA.
- Booking and purchase flows now match the Flutter split more closely:
  - booking / appointment path for rentals and visits
  - purchase-intent path for sale properties
  - admin notification is triggered after successful writes

## What Still Does Not Match

- The Flutter purchase flow still has deeper contract / invoice sequencing and verification nuance than the current React version.
- The Flutter hotel journey is not reproduced as a full user flow on web.
- The Flutter panorama viewer is still better represented by a lightweight web fallback, not the same native viewer behavior.
- The Flutter home screen has a denser mobile feel than the current web layout on small phones.

## What Still Needs Screenshots / Videos

- Flutter `HomeScreen` on a real phone-sized viewport.
- Flutter `PropertyDetailsScreen` with:
  - rent property
  - sale property
  - panorama present
  - panorama absent
- Flutter `GoogleMapsScreen` / map picker behavior.
- Flutter `PanoramaViewerScreen` hotspot navigation.
- Flutter `AddPropertyScreen`, `MyBookingsScreen`, and `IdentifyVerificationScreen`.
- Flutter `PriceAndBooking` / `PaymentPage` purchase sheets for a side-by-side match of the sale flow.

## Notes

- No Flutter files were changed.
- No Firebase rules, Storage rules, or Cloud Functions were changed.
- No new backend schema was added in this pass.
