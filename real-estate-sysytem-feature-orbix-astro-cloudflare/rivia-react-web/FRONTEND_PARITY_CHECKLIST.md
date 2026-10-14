# Frontend Parity Checklist

## Public Flow

- [ ] Open `/` on desktop and mobile.
- [ ] Confirm the home page starts with search and browse actions.
- [ ] Confirm the home quick actions open the correct routes.
- [ ] Confirm the tour CTA appears when a property has panorama data.
- [ ] Open `/properties` and verify cards look app-like.
- [ ] Open `/properties/:id` and verify:
  - [ ] gallery
  - [ ] price
  - [ ] features
  - [ ] map action
  - [ ] tour CTA
  - [ ] favorite button
  - [ ] booking / purchase CTA label
  - [ ] sale property primary CTA is `طلب شراء`
  - [ ] rent property primary CTA is `طلب معاينة / حجز`
- [ ] Open `/map` and `/properties/map`.
- [ ] Confirm missing `VITE_GOOGLE_MAPS_API_KEY` shows Arabic fallback text.
- [ ] Confirm marker click updates the visible property card.
- [ ] Open `/properties/:id/tour`.
- [ ] Confirm no tour data shows Arabic empty state.
- [ ] Confirm panorama data loads from the property document or subcollection.
- [ ] Confirm hotspots or thumbnail rail render if data exists.

## Auth / Account Flow

- [ ] Login and register still work.
- [ ] Favorites page loads and toggles without crashing.
- [ ] My properties shows owned properties and requests.
- [ ] My bookings loads mixed schema safely and shows:
  - [ ] booking type
  - [ ] appointment date / time
  - [ ] visit type
  - [ ] preferred contact method
  - [ ] cancel action only when pending / rescheduled
- [ ] My deals shows:
  - [ ] purchase intent
  - [ ] proposed price
  - [ ] payment status
  - [ ] contract status
- [ ] Verification page keeps email verification separate from identity verification.
- [ ] Notifications load and mark as read safely.
- [ ] Profile shortcuts still point to the correct pages.

## User Actions

- [ ] Comment submit / delete works or shows a safe Arabic permission error.
- [ ] Rating submit works or shows a safe Arabic permission error.
- [ ] Report property modal submits or shows a safe Arabic permission error.
- [ ] Add property request works or shows a safe Arabic storage/firestore error.
- [ ] Booking flow opens and displays the correct page title and fields.
- [ ] Sale property purchase flow opens `/properties/:id/purchase`.
- [ ] Sale property booking flow opens `/properties/:id/book` for `طلب معاينة`.
- [ ] Rent property booking flow uses appointment fields and contact CTA.
- [ ] Admin booking status update works for confirmed / rejected / cancelled / completed / rescheduled.
- [ ] Admin deal status update works for negotiating / confirmed / rejected.
- [ ] Admin email warning / success behavior appears after booking / purchase submission.

## Mobile

- [ ] Bottom navigation is visible on mobile public pages.
- [ ] Mobile drawer opens and closes cleanly.
- [ ] Public cards and detail pages do not overflow narrow screens.
- [ ] Map page uses a usable stacked/bottom-sheet style layout.
- [ ] Tour page remains usable on a phone viewport.

## What to Capture

- [ ] Home page desktop screenshot.
- [ ] Home page mobile screenshot.
- [ ] Property detail page with tour.
- [ ] Map page with selected property drawer/card.
- [ ] Tour page with hotspots.
- [ ] Any remaining mismatch between Flutter and web in a side-by-side screenshot.
