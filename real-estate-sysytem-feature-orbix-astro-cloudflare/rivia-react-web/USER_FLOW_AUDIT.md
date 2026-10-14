# User Flow Audit

## 1. Main Flutter User Journeys

### Journey A: Visitor browsing properties
1. Open app.
2. Land on `HomeScreen`.
3. Search and open filters from the search/filter bar.
4. Browse property cards and hotel cards.
5. Open `PropertyDetailsScreen`.
6. Open `LocationPickerPage` or Google Maps view from the property details location action.
7. Open `PanoramaViewerScreen` through the panorama CTA.
8. Prompt login when the user taps favorite, booking, comment, rating, report, or add-property actions.

### Journey B: Logged-in user exploring a property
1. Login or sign up.
2. Browse home/listing pages.
3. Favorite a property.
4. Open details.
5. View gallery, location, features, comments, ratings, and report dialog.
6. Open map/location.
7. Open virtual tour.
8. Request booking or purchase depending on property type.
9. See the request later in `MyBookingsScreen`, `MyDeals`, `MyInvoices`, and `MyContracts` if the flow reaches those collections.

### Journey C: Add property
1. Open `AddPropertyScreen`.
2. Fill basic details, site details, conveniences, photos, and contact info.
3. Upload property images.
4. Upload panorama images when present.
5. Submit to `property_requests`.
6. Wait for admin approval.

### Journey D: Booking / appointment
1. Open property details.
2. Tap booking CTA.
3. Pick dates and guest count.
4. Submit booking request.
5. Request is written to `users/{uid}/user_bookings`.
6. If allowed, mirror to `properties/{propertyId}/bookings`.
7. User later sees it in `MyBookingsScreen`.
8. User can cancel in the UI if rules allow.

### Journey E: Purchase
1. Open a sale property.
2. Tap purchase CTA.
3. Confirm name, phone, email, and note.
4. Create deal.
5. Trigger contract creation through Cloud Function.
6. Create invoice.
7. Queue admin email.
8. User sees progress in deals/invoices/contracts screens.

### Journey F: Profile / account
1. Open profile.
2. See email verification and identity verification separately.
3. Open favorites, bookings, properties, verification, notifications, deals, invoices, and contracts.

### Journey G: Hotels
1. Browse hotel cards from home.
2. Open hotel details.
3. Open room types and booking flows.
4. See hotel availability and room-specific booking data.

## 2. Screens in Each Journey

| Journey | Flutter screens |
|---|---|
| A | `HomeScreen`, `PropertyDetailsScreen`, `GoogleMapsScreen`, `PanoramaViewerScreen`, login/register screens |
| B | `LoginScreen`, `SignUpScreen`, `HomeScreen`, `PropertyDetailsScreen`, `GoogleMapsScreen`, `PanoramaViewerScreen`, comments/ratings/report widgets, booking/purchase widgets |
| C | `AddPropertyScreen`, `CapturePage`/panorama editor screens |
| D | `PriceAndBooking`, `PaymentPage`, `MyBookingsScreen` |
| E | `PriceAndBooking`, `PurchaseInvoiceDetailsScreen`, `MyDeals`, `MyContracts`, `MyInvoices` |
| F | `MyInformationScreen`, `FavoritesScreen`, `MyBookingsScreen`, `NotificationsScreen`, `IdentifyVerificationScreen` |
| G | `ShowHotelsScreen`, `HotelDetailsScreen`, `HotelBookingScreen` |

## 3. Buttons / Actions in Each Journey

- Home search input and filter button.
- Property card tap.
- Favorite toggle.
- Details page edit/delete actions for owner/admin.
- Location map button.
- Panorama CTA.
- Comment submit / delete.
- Rating submit.
- Report property dialog.
- Booking / purchase CTA.
- Add-property submit.
- Verification upload submit.
- Notification mark-as-read.
- Hotel open / booking / availability actions.

## 4. Firebase Collections Used

- `properties`
- `properties/{propertyId}/comments`
- `properties/{propertyId}/ratings`
- `properties/{propertyId}/panorama_tour/main`
- `properties/{propertyId}/panorama_tours/main`
- `properties/{propertyId}/tour/main`
- `properties/{propertyId}/bookings`
- `property_requests`
- `property_reports`
- `report_reasons`
- `users`
- `users/{uid}/favorites`
- `users/{uid}/notifications`
- `users/{uid}/user_bookings`
- `deals`
- `invoices`
- `contracts`
- `verifications/{uid}`
- `hotels`
- `hotels/{hotelId}/room_types`
- `hotels/{hotelId}/room_types/{roomTypeId}/bookings`
- `ads`
- `property_category`
- `features/global`
- `hotel_reports`

## 5. Storage Paths Used

- `properties/{uid}/property_images/{fileName}`
- `properties/{uid}/panorama_tours/{fileName}`
- `id_verifications/{uid}/front`
- `id_verifications/{uid}/back`
- `ads/{fileName}`

## 6. Cloud Functions Used

- `createContractForDeal`
- `queueAdminEmail`

## 7. React Pages That Currently Do Not Fully Match Flutter

- Home is now closer, but still more web-like than the Flutter app drawer-first mobile experience.
- Property details now has stronger parity, but the Flutter purchase confirmation flow is still richer than the current web request surface.
- Booking and purchase are split across multiple React pages and still need a single Flutter-like entry path per property type.
- Hotels are visible as cards, but the full public hotel journey is not a first-class user flow in React.
- Virtual tour is web-immersive, but it is still a lightweight web fallback rather than the same package-based Flutter viewer.

## 8. Priority Fixes Needed

1. Make sale properties open a dedicated purchase-intent path that feels like Flutter.
2. Give booking flows a clearer rent vs purchase split on web.
3. Add the public hotel journey only if the product wants web parity there.
4. Collect screenshots of the Flutter property details and map/tour flows for pixel-level alignment.
5. Keep the mobile public shell app-like and avoid admin-looking structures on user pages.
