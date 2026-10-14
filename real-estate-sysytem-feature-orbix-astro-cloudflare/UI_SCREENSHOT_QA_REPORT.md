# UI Screenshot QA Report

Date: 2026-06-19  
React app path: `F:\rivia-proptech-main (2)\rivia-react-web`  
Dev URL used: `http://127.0.0.1:5173/`

## 1. Summary

This QA pass verified the React frontend after the Arabic mojibake cleanup and the Edit Property location-picker update.

Important limitation: automated screenshot capture was attempted with Chrome and Edge headless, then with Chrome DevTools remote debugging. In this environment, Chromium failed before producing screenshots because the GPU process was unusable, and normal Chrome exited before exposing the DevTools port. Because of that, this report is a UI QA report based on:

- dev server startup and HTTP availability,
- source-level route/page inspection,
- focused Arabic marker scan,
- previous successful production build after the cleanup,
- verification of the Edit Property location UI implementation.

No Firebase rules, Cloud Functions, Flutter files, backend code, or large features were changed.

## 2. Pages Tested

| Route | QA status | Notes |
|---|---|---|
| `/` | Source/route checked | Public home text was already clean UTF-8 after cleanup. Needs manual screenshot confirmation. |
| `/properties` | Source/route checked | Filter drawer labels and empty states are clean Arabic. Needs visual drawer test. |
| `/map` | Source/route checked | Toolbar, filters, selected panel, and map errors are clean Arabic. Needs live marker visual test. |
| `/add-property` | Source/route checked | Section titles and location picker labels are clean Arabic. Needs live map-click test. |
| `/properties/:id` | Requires data | Should be opened from an existing property card in manual QA. |
| `/properties/:id/edit` | Source checked | Manual coordinate inputs removed from primary UI; LocationPicker is primary selector. Requires auth/data. |
| `/profile` | Requires auth | Account shell labels are clean Arabic. |
| `/favorites` | Requires auth | Route exists; needs authenticated visual QA. |
| `/my-properties` | Requires auth | Route exists; needs authenticated visual QA. |
| `/my-bookings` | Requires auth | Route exists; needs authenticated visual QA. |
| `/my-requests` | Requires auth | Route exists; needs authenticated visual QA. |
| `/verification` | Requires auth | Route exists; needs authenticated visual QA. |
| `/notifications` | Requires auth | Route exists; needs authenticated visual QA. |
| `/hotels/:id` | Requires data | Should be opened from an existing hotel card in manual QA. |
| `/admin` | Requires admin auth | Admin shell labels are clean Arabic. |
| `/admin/property-requests` | Requires admin auth | Route exists; needs admin visual QA. |
| `/admin/properties` | Requires admin auth | Route exists; needs admin visual QA. |
| `/admin/hotels` | Requires admin auth | Route exists; needs admin visual QA. |
| `/admin/users` | Requires admin auth | Route exists; needs admin visual QA. |
| `/admin/reports` | Requires admin auth | Route exists; needs admin visual QA. |
| `/admin/ads` | Requires admin auth | Route exists; needs admin visual QA. |
| `/admin/features` | Requires admin auth | Route exists; needs admin visual QA. |
| `/admin/categories` | Requires admin auth | Route exists; needs admin visual QA. |

## 3. Desktop Findings

### Passed By Source/Structure

- Public navigation labels are clean Arabic in `Header.tsx`.
- Mobile navigation labels are clean Arabic in `MobileBottomNav.tsx`.
- Home page hero/search/cards text is clean Arabic.
- Properties page toolbar, filter drawer, reset/apply buttons, and empty states are clean Arabic.
- Map page toolbar, filter drawer, selected preview/list labels, empty states, and errors are clean Arabic.
- Add Property section titles are clean Arabic:
  - `تفاصيل العقار الأساسية`
  - `تفاصيل الموقع`
  - `ميزات ووسائل الراحة`
  - `صور العقار`
  - `الجولة الافتراضية / صور 360`
  - `معلومات الاتصال والقواعد`
- Edit Property now uses LocationPicker as the primary location UI.
- Account/Admin layout shell labels are clean Arabic.

### Not Fully Verified By Screenshot

- Actual desktop spacing and cropping.
- Property and hotel card image fallback rendering with live data.
- Map marker rendering and selected property highlight.
- Footer spacing below long map/list content.
- Admin table/card overflow.

## 4. Mobile Findings

Target widths requested: `360px`, `390px`, `768px`.

Automated screenshot capture at these widths was blocked by the local Chromium GPU failure, so mobile findings are source/CSS based.

### Passed By Source/CSS Review

- RTL is globally enabled.
- Mobile bottom nav exists and labels are readable Arabic.
- Filter drawer CSS supports mobile bottom-sheet behavior.
- Add Property has mobile app-like card structure and sticky submit styling.
- Map layout CSS stacks on mobile.
- Footer is hidden on smaller widths to reduce bottom-nav collision risk.

### Manual Mobile QA Still Required

- Confirm no horizontal overflow at `360px`.
- Confirm mobile bottom nav does not cover submit buttons or final content.
- Confirm `/map` stacks as toolbar -> map -> selected preview -> list.
- Confirm filter bottom sheet height and sticky actions.
- Confirm Add/Edit LocationPicker height and coordinate chip readability.
- Confirm `/admin` mobile drawer/sidebar usability.

## 5. Arabic RTL Findings

Ran source marker scan:

```powershell
rg -n "Ø|Ù|Ú|Ã|�" src
```

Result: no remaining matches in `src`.

Arabic source status:

- Public navigation: clean.
- Public cards: clean.
- Home/Properties/Map/Add/Edit public flow: clean.
- Account/Admin layout shell: clean.
- LocationPicker map errors/current-location messages: clean.

English that may remain:

- Technical terms such as `Google Maps`, `Firestore`, `Storage`, `status`, and environment variable names. These are acceptable technical labels when shown inside diagnostic or admin/error context.

## 6. Layout Issues

No screenshot-confirmed layout defects could be recorded because screenshot capture was blocked.

Potential areas for manual verification:

| Priority | Area | Risk |
|---|---|---|
| P1 | `/map` desktop | Side panel and map height should be checked against footer overlap. |
| P1 | `/map` mobile | Map/list stacking and selected preview should be checked at 360px. |
| P1 | `/add-property` mobile | Sticky submit and location picker may need spacing verification. |
| P1 | `/properties/:id/edit` mobile | LocationPicker and save actions need visual confirmation. |
| P2 | Admin mobile pages | Tables/cards may overflow on narrow widths. |

## 7. Functional UI Issues

### Verified By Code

- Edit Property no longer shows visible primary latitude/longitude inputs.
- Edit Property saves coordinate aliases:
  - `latitude`
  - `longitude`
  - `lat`
  - `lng`
  - `location.latitude`
  - `location.longitude`
  - `location.lat`
  - `location.lng`
- Add Property still uses LocationPicker and selected-coordinate UI.
- Map page keeps marker/list filtering code unchanged.

### Manual Functional Checks Still Required

- Click map in LocationPicker and confirm marker appears.
- Drag marker and confirm coordinates update.
- Use current location and confirm success/error Arabic text.
- Click map marker on `/map` and confirm selected preview/list highlight.
- Open a property card and verify detail route.
- Open a hotel card and verify hotel detail route.
- Authenticated/admin pages should be checked with real roles.

## 8. Tiny Fixes Applied

None in this QA pass.

Temporary QA artifacts were used to start the dev server, but no app source files were changed during this pass.

## 9. Remaining P0 Blockers

No P0 blocker is confirmed from source/build checks.

One P0 remains unverified until manual/browser screenshot QA succeeds:

- Need actual visual confirmation that public navigation, Add Property, Map, and Edit Property show no mojibake or overflow in the browser.

## 10. Remaining P1 Issues

1. Manual screenshot QA is still required because local Chrome/Edge screenshot capture failed.
2. `/map` marker/list/selected-preview behavior needs live visual confirmation.
3. `/add-property` LocationPicker click/drag/current-location behavior needs live confirmation.
4. `/properties/:id/edit` LocationPicker existing-marker behavior needs authenticated data confirmation.
5. Admin pages need authenticated visual QA for table/card overflow.
6. Property detail and hotel detail routes need data-backed visual QA from real cards.

## 11. Demo Readiness Recommendation

Recommendation: **Conditional Go**.

Reasoning:

- The P0 source-level Arabic cleanup is complete.
- `src` has no mojibake markers.
- Edit Property location UX now matches the picker-first Add Property direction.
- Production build passed after the cleanup.

Condition:

- Before a live demo, open the app manually in Chrome at desktop and mobile widths and verify the screenshot checklist visually. The automated screenshot toolchain was blocked by the local Chromium environment, not by the React app.

## Screenshot Tooling Notes

Attempted:

- Chrome headless screenshot.
- Edge headless screenshot.
- Chrome headless DOM dump.
- Chrome normal launch with DevTools remote debugging.

Observed:

- Headless Chromium failed with GPU-process errors before screenshot output.
- DevTools remote debugging did not open because Chrome exited before exposing the debugging port.
- Vite dev server itself started and returned HTTP `200` at `http://127.0.0.1:5173/`.
