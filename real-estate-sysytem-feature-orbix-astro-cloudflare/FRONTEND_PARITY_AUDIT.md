# Frontend Parity Audit

Audit scope: Flutter UI/UX in `rivia-proptech-main` compared with React UI/UX in `rivia-react-web`.

This report is intentionally frontend-only. It does not audit Firebase rules, Cloud Functions, backend security, or data ownership.

## 1. Executive Summary

The React web app has broad route coverage and several strong web-native UI upgrades, especially the `/properties` filter drawer, `/map` page, add-property card sections, admin route coverage, and desktop layouts. It is not yet at Flutter frontend parity because the React UI still has widespread corrupted Arabic text, several missing mobile-first Flutter flows, and inconsistent visual rhythm between public pages, account pages, and admin pages.

The Flutter app is a mobile-first product with blue gradient app bars, rounded white cards, bottom sheets, drawer navigation, and dense RTL user flows. The React app is closer to a responsive web dashboard/site. That is acceptable for web, but the migration should intentionally decide which Flutter patterns are mandatory and which are web adaptations.

Current frontend readiness: **5.5 / 10**.

Primary blocker before demo: **Arabic mojibake in React public and navigation UI**.

## 2. Flutter Frontend Inventory

| Flutter area | Purpose | Key UI sections/actions | Navigation entry | Visual notes |
|---|---|---|---|---|
| `features/home_section/home_screen.dart` | Main browsing entry | Sliver hero, search card, filter button, ads, property/hotel content | Drawer/home | Mobile-first, large blue gradient app bar, rounded search card |
| `features/home_section/widgets/show_filter_bottom_sheet.dart` | Property filtering | Listing type chips, categories, feature OR/AND mode, location radius | Home filter icon | Draggable bottom sheet, compact chips, strong CTA |
| `core/widgets/proprty_card.dart` | Property preview | Image, favorite, badge, title, location, price, specs | Home, lists | Rounded card, image-first mobile hierarchy |
| `features/property_details_section/property_details_screen.dart` | Property details | Gallery, price/booking, contact owner, features, rules, comments, ratings, report, panorama | Property card | App-like detail flow with stacked cards |
| `features/add_property_section/add_property_screen.dart` | Add property request | Basic details, site details, amenities, photos, contact/rules, submit | Drawer/add property | Multi-section card form |
| `features/google_maps_section/google_maps_screen.dart` | Map/location selection | Map picker, current location, selected coordinates | Add/edit location | Dedicated map selection experience |
| `features/edit_property_section/edit_property_screen.dart` | Edit property | Same section pattern as add property | My properties/details | Mobile section cards |
| `features/panorama_*` | 360 capture, editor, viewer | Capture, hotspots, virtual tour viewer | Details/tour flows | Specialized immersive flow |
| `features/favourite_section/favorites_screen.dart` | Saved listings | Saved property cards | Drawer/favorites | Card list |
| `features/my_property_section/*` | User properties and requests | My properties, pending request cards | Drawer/profile | Owner management flow |
| `features/my_booking_section/*` | User bookings | Booking cards, status chips | Drawer/bookings | Compact status-led cards |
| `features/payment_section/*` | Payment/purchase | Invoice details, date payment, WhatsApp payment | Booking/purchase | Transaction-focused mobile screens |
| `features/hotel_section/*` | Hotels | Hotel listing, details, booking, report dialog | Drawer/hotels | Flutter has a fuller hotel journey than React |
| `features/identify_section/*` | Verification | Identity form/upload/status | Drawer/verification | Card form |
| `features/login_sction`, `sign_up_section` | Auth | Login/register forms | Drawer/auth | Mobile auth screens |
| `features/my_information_section` | Profile | User info/account actions | Drawer/profile | Account card layout |
| `features/notification_section` | Notifications | Notification list | Drawer/notifications | Mobile list |
| `features_admin/control_panel_section` | Admin dashboard | Status cards, action cards | Admin drawer entry | Blue app bar + dashboard cards |
| `features_admin/admin_pending_properties_section` | Review property requests | Request cards, details, owner info, panorama | Admin dashboard | Review workflow is mobile card based |
| `features_admin/properties_visibility_section` | Property visibility | Show/hide properties | Admin dashboard | Moderation tool |
| `features_admin/add_distinct_property` | Featured listings | Mark/remove distinct | Admin dashboard | Featured management |
| `features_admin/add_hotel_sectoin` | Hotel admin | Add hotel, room groups, photos, location | Admin dashboard | More complete hotel admin UI |
| `features_admin/admin_booking_section` | Booking admin | Pending booking review | Admin dashboard | Status workflow |
| `features_admin/admin_users_section`, `add_admin_section` | User/admin management | User cards, add admin | Admin dashboard | Admin staff UI |
| `features_admin/ads_section` | Ads admin | Add/edit ad bottom sheets, ad tiles | Admin dashboard | Flutter has ad placement tooling |
| `features_admin/property_features_section`, `property_category_section` | Options admin | Feature/category management | Admin dashboard | Reference-data UI |
| `features_admin/report_reason_section`, `report_section` | Reports | Report reasons and reports | Admin dashboard | Report reason UI exists in Flutter |
| `features_admin/admin_notifications_section` | Admin notifications | Send/manage notifications | Admin dashboard | Missing clear React equivalent |
| `features_admin/whatsapp_contact_section` | WhatsApp contact settings | Contact configuration | Admin dashboard | Missing React equivalent |

Core Flutter visual system:

- Blue gradient app bars with rounded lower edges.
- White rounded cards with soft shadows.
- Drawer navigation with RTL layout and app branding.
- Bottom sheets for filters and contextual actions.
- Mobile-first form sections with large CTAs.
- Cairo-like Arabic typography and dense but readable mobile spacing.

## 3. React Frontend Inventory

| React route/page | Purpose | Key UI sections/actions | Components/layout | Visual notes |
|---|---|---|---|---|
| `/` `HomePage.tsx` | Public home | Static hero, search, CTAs, quick links, properties, hotels | `PublicLayout`, cards | Compact web hero; no carousel; Arabic text currently corrupted in source/UI |
| `/properties` | Property listing | Search, filter drawer, property grid | `PropertyCard`, drawer filters | Good web filter UX; text corruption remains |
| `/map`, `/properties/map` | Property map | Toolbar, filter drawer, map, unified side panel | `PropertyMap`, map sidebar | Recently improved; closer to app-like map, still needs mobile QA/text cleanup |
| `/properties/:id` | Property details | Gallery, details, actions, tour/report/favorite sections | `ImageGallery`, detail cards | Partial Flutter parity; layout is web-specific |
| `/properties/:id/edit` | Edit property | Edit form, location picker | `LocationPicker` | Partial; manual coordinates still appear in edit flow |
| `/properties/:id/book`, `/properties/:id/purchase` | Booking/purchase | Booking/purchase forms | Protected pages | Partial payment/booking parity |
| `/properties/:id/tour` | Panorama tour | Virtual tour viewer | Tour components | Exists; parity depends on tour data shape and mobile polish |
| `/add-property` | Add property request | App-like header, card sections, images, panorama, location picker, submit | `LocationPicker`, upload UI | One of the stronger Flutter-like React flows; Arabic text corrupted |
| `/my-properties` | Owner properties | User property management | Account layout | Partial parity |
| `/my-requests` | User property requests | Request list/status | Account layout | Partial parity |
| `/my-bookings` | User bookings | Booking list/status | Account layout | Partial parity |
| `/my-deals`, `/my-invoices`, `/my-contracts` | Transactions | Deal/invoice/contract lists | Account layout | Extra/partial web surfaces |
| `/favorites` | Favorites | Saved property list | Account layout | Exists |
| `/profile` | Profile | Profile/account info | Account layout | Exists; layout differs from Flutter mobile drawer flow |
| `/verification` | Verification | Verification form/status | Account layout | Exists; needs parity review against Flutter upload/status states |
| `/notifications` | Notifications | Notification list | Account layout | Exists |
| `/hotels/:id` | Hotel details | Gallery, hotel info, room types, disabled booking CTA | `HotelCard`, details page | Partial; no full hotel booking/report journey |
| `/login`, `/register` | Auth | Login/register forms | Public auth pages | Exists; text cleanup needed |
| `/admin` | Admin dashboard | Dashboard metrics/actions | `AdminLayout` | Web dashboard, not Flutter mobile control panel |
| `/admin/property-requests` | Review requests | Request review/approval | Admin page | Partial parity |
| `/admin/properties` | Property admin | Manage listings/visibility | Admin page | Partial parity |
| `/admin/hotels` | Hotel admin | Add/edit/hide/feature hotels | Admin page | Partial; room-type editing may be incomplete |
| `/admin/users` | Users | User management | Admin page | Partial |
| `/admin/bookings` | Bookings admin | Booking list/actions | Admin page | Partial |
| `/admin/reports` | Reports | Property/hotel reports | Admin page | Partial; report reason admin missing |
| `/admin/ads` | Ads admin | Manage ads | Admin page | Exists; public placement parity unclear |
| `/admin/categories`, `/admin/features` | Options admin | Manage category/feature lists | Admin page | Exists |
| `/admin/deals`, `/admin/invoices`, `/admin/contracts` | Transaction admin | Manage transaction records | Admin page | Extra/partial |
| `/admin/admin-roles` | Admin roles | Staff/admin role UI | Admin page | Extra/partial |
| `/admin/hero-slides` | Hero slides | Admin carousel data | Admin page | Extra in React; public home no longer uses carousel |

React layout system:

- `PublicLayout`: desktop header, mobile drawer, mobile bottom nav, footer.
- `AccountLayout`: account sidebar and protected account pages.
- `AdminLayout`: desktop admin sidebar plus mobile admin toggle.
- `globals.css`: Cairo/Alexandria fonts, RTL defaults, filter drawers, mobile bottom nav, map layout, add-property mobile shell.

## 4. Screen-by-Screen Parity Table

| Flutter screen/widget | React route/page | Status | Visual parity | Workflow parity | Mobile parity | Notes | Priority |
|---|---|---:|---:|---:|---:|---|---|
| HomeScreen | `/` | Partial | 5 | 6 | 6 | React has clean web home but lacks Flutter SliverAppBar/ad/filter feel; mojibake is blocking | P0 |
| Home filter bottom sheet | `/properties` filter drawer, `/map` drawer | Partial | 7 | 7 | 7 | React drawer is good; Flutter has OR/AND feature mode and location radius | P1 |
| PropertyCard | `PropertyCard` | Partial | 6 | 7 | 6 | Click behavior exists; Arabic/card labels need cleanup | P0 |
| Property details | `/properties/:id` | Partial | 6 | 6 | 6 | Needs closer gallery/price/contact/report/rating hierarchy parity | P1 |
| AddPropertyScreen | `/add-property` | Partial | 7 | 7 | 8 | Strong React implementation; corrupted Arabic must be fixed | P0 |
| LocationPickerPage | `LocationPicker`, `/map` | Partial | 7 | 7 | 6 | Real map picker exists; verify mobile and visible marker states | P1 |
| EditPropertyScreen | `/properties/:id/edit` | Partial | 5 | 5 | 5 | Manual coordinate fields remain; should match picker-first add flow | P0 |
| Panorama viewer/editor | `/properties/:id/tour` | Partial | 6 | 6 | 6 | Viewer exists; editor/capture parity unclear | P2 |
| FavoritesScreen | `/favorites` | Partial | 6 | 7 | 6 | Exists through account layout | P2 |
| MyPropertyScreen | `/my-properties` | Partial | 6 | 6 | 6 | Exists, but Flutter pending/request card experience may be richer | P2 |
| Pending requests | `/my-requests` | Partial | 6 | 6 | 6 | Exists | P2 |
| MyBookingsScreen | `/my-bookings` | Partial | 6 | 6 | 6 | Exists, parity depends on status actions | P2 |
| Payment screens | `/properties/:id/purchase`, `/my-invoices` | Partial | 5 | 5 | 5 | Flutter has payment/WhatsApp payment screens | P1 |
| Login/Sign up | `/login`, `/register` | Partial | 6 | 7 | 6 | Exists; text cleanup needed | P1 |
| Verification screen | `/verification` | Partial | 6 | 6 | 6 | Exists; compare upload/status states before beta | P1 |
| Notifications | `/notifications` | Partial | 6 | 6 | 6 | User notifications exist; admin notifications unclear | P2 |
| Profile | `/profile` | Partial | 6 | 6 | 6 | Account sidebar differs from Flutter drawer profile flow | P2 |
| Hotels listing | Home hotels only | Missing/Partial | 4 | 3 | 4 | Flutter has dedicated hotel listing; React only exposes hotel cards through home/details | P1 |
| Hotel details | `/hotels/:id` | Partial | 5 | 4 | 5 | Room types display exists; booking/report flows incomplete | P1 |
| Hotel booking | None clear | Missing | 0 | 0 | 0 | Flutter has hotel booking screen | P1 |
| Hotel report dialog | None clear | Missing | 0 | 0 | 0 | Flutter has hotel report UI | P2 |
| Admin dashboard | `/admin` | Partial | 5 | 6 | 5 | React is web-dashboard style; Flutter is mobile card dashboard | P1 |
| Pending properties admin | `/admin/property-requests` | Partial | 6 | 6 | 5 | Exists; verify request detail/panorama/location preview parity | P1 |
| Property visibility/featured | `/admin/properties` | Partial | 6 | 6 | 5 | Exists but Flutter splits visibility/distinct flows | P1 |
| Hotel admin | `/admin/hotels` | Partial | 6 | 5 | 5 | Exists; room-type edit parity uncertain | P1 |
| Admin bookings | `/admin/bookings` | Partial | 5 | 5 | 5 | Exists | P2 |
| Admin users/add admin | `/admin/users`, `/admin/admin-roles` | Partial | 5 | 5 | 5 | Exists; UX differs | P1 |
| Ads admin | `/admin/ads` | Partial | 6 | 6 | 5 | Admin exists; public ad placements need parity check | P2 |
| Features/categories admin | `/admin/features`, `/admin/categories` | Partial | 6 | 7 | 5 | Exists and recently made schema-compatible | P2 |
| Report reasons admin | None clear | Missing | 0 | 0 | 0 | Flutter has report reason screen | P1 |
| Reports admin | `/admin/reports` | Partial | 5 | 6 | 5 | Exists; labels/status text need cleanup | P1 |
| Admin notifications | None clear | Missing | 0 | 0 | 0 | Flutter has admin notifications screen | P1 |
| WhatsApp contact settings | None clear | Missing | 0 | 0 | 0 | Flutter has dedicated admin setting | P2 |
| Hero slides admin | `/admin/hero-slides` | Extra in React | 5 | 5 | 5 | Kept as optional React-only feature | P3 |

## 5. User Flow Parity Analysis

### 5.1 Visitor Browsing

Flutter flow: Home -> property card -> details -> map/location/tour.

React flow: Home -> properties/details/map/tour.

React has the essential browsing routes and improved desktop list/map separation. The `/properties` filter drawer and `/map` toolbar/drawer are good web adaptations. However, the React home page no longer resembles Flutter's large mobile SliverAppBar experience, public Arabic text is corrupted, and Flutter's ad-aware home content is not clearly matched in React public placement.

Frontend readiness: **Partial, P0 due Arabic text**.

### 5.2 Add Property

Flutter flow: multi-card form sections -> images -> location -> amenities -> contact/rules -> submit.

React flow: `/add-property` has a strong app-like shell, rounded sections, image/panorama upload surfaces, and a real `LocationPicker`.

React is close here. The main gaps are corrupted Arabic labels, verification of mobile spacing, and ensuring edit-property follows the same picker-first behavior instead of manual coordinate typing.

Frontend readiness: **Mostly partial-to-good, P0 text cleanup**.

### 5.3 Property Details

Flutter details emphasize mobile hierarchy: image/gallery, price/booking block, summary cards, contact owner, features/rules, panorama, comments, ratings, and report dialog.

React details exist and include core sections, but the experience is more web-card based and may not preserve the exact Flutter action order. Comments, ratings, report, and booking/purchase CTAs need screen-level QA against Flutter before beta.

Frontend readiness: **Partial, P1**.

### 5.4 Map

Flutter has a map/location selection screen. React has a richer public property map with markers, filters, selected preview, and list sidebar.

React is stronger for desktop browsing, but must keep mobile behavior simple: toolbar first, map full width, selected preview/list below, no footer overlap. The current React map structure is close after recent cleanup, but text corruption and mobile screenshot QA remain.

Frontend readiness: **Partial-to-good, P1**.

### 5.5 Hotels

Flutter has hotel listing, hotel details, hotel booking, room types, and hotel report UI.

React has hotel cards and `/hotels/:id`, but no clear dedicated `/hotels` listing, no complete hotel booking journey, and no hotel report dialog parity.

Frontend readiness: **Partial, P1**.

### 5.6 Profile / Account

Flutter uses drawer navigation into profile, verification, notifications, favorites, bookings, and my properties.

React uses account layout/sidebar plus mobile bottom nav. Coverage is broad, but visual parity is lower because the account area feels like a web dashboard rather than Flutter mobile screens. Mojibake in account navigation is a blocker.

Frontend readiness: **Partial, P1/P2**.

### 5.7 Admin

Flutter admin is a mobile control panel with status/action cards and multiple focused tools. React admin has broad route coverage and a more desktop-dashboard structure.

React is acceptable for web admin, but parity gaps remain: admin notifications, WhatsApp contact settings, report reasons, explicit verification queue, and Flutter-like request review detail quality.

Frontend readiness: **Partial, P1**.

## 6. Visual Design Comparison

### Where React Matches Flutter

- Rounded cards and soft shadows are widely used.
- Add Property form is sectioned similarly to Flutter.
- Filter drawer/bottom sheet pattern is close to Flutter bottom-sheet behavior.
- Mobile bottom nav gives React a native-app navigation affordance.
- Map and location picker now provide real map interactions.
- Cards are image-first and clickable in the same spirit as Flutter.

### Where React Feels Too Web-Like

- Public header and admin/account sidebars do not match Flutter's drawer/app-bar rhythm.
- Admin pages are desktop dashboard/table oriented; Flutter admin is card/action oriented.
- Property details feel less like a guided mobile detail page and more like a web content page.
- Home hero is clean and compact, but no longer resembles Flutter's blue SliverAppBar hero.

### Where React Is Better Than Flutter

- Desktop property filtering and map browsing are more appropriate for web.
- Admin route breadth is clear and scalable.
- Public map sidebar/list is better suited for desktop real estate discovery.
- Route-level separation is stronger for shareable URLs.

### Visual Issues

- Widespread mojibake severely damages perceived quality.
- Some legacy unused CSS remains, including hero carousel-related classes.
- Admin/account/public areas do not yet share one consistent card, heading, empty-state, and button language.
- Mobile footer/bottom-nav spacing needs recurring screenshot QA.

## 7. Component Parity Table

| Component | Flutter equivalent | React equivalent | Visual parity | Behavior parity | Notes |
|---|---|---|---:|---:|---|
| Property card | `proprty_card.dart` | `PropertyCard.tsx` | 6 | 7 | React clickable card exists; labels/text need cleanup |
| Hotel card | `hotel_card.dart` | `HotelCard.tsx` | 5 | 5 | React supports click/details; booking/report parity missing |
| Add property sections | add_property widgets | `AddPropertyRequestPage`, `FormSection` | 7 | 7 | Strong parity; text cleanup needed |
| Image gallery | property details/gallery widgets | `ImageGallery` | 6 | 6 | Needs detail QA |
| Panorama viewer | panorama viewer/editor widgets | tour components | 6 | 6 | Viewer exists; capture/editor parity unclear |
| Map picker | `LocationPickerPage` | `LocationPicker.tsx` | 7 | 7 | Real picker exists; mobile/current-location QA needed |
| Filter bottom sheet | `show_filter_bottom_sheet.dart` | filter drawer/bottom sheet CSS/pages | 7 | 7 | Missing OR/AND and radius parity |
| Admin dashboard cards | control panel cards | Admin dashboard | 5 | 6 | React web dashboard differs by design |
| Upload tiles | Flutter image upload widgets | Image uploader components | 6 | 6 | Needs mobile upload QA |
| Feature chips | Flutter chips | React feature chips | 7 | 6 | Schema compatibility improved; OR/AND missing |
| Country/city selects | Flutter dropdowns | React selects | 6 | 6 | Needs consistent Arabic labels |
| Empty states | Multiple Flutter no-data widgets | `EmptyState` | 6 | 6 | React has reusable component; text cleanup needed |
| Error/loading states | Flutter dialogs/snackbars | React cards/states | 5 | 6 | Arabic consistency is uneven |
| Mobile navigation | Drawer | Header drawer + bottom nav | 6 | 6 | React has bottom nav, but labels corrupted |
| Details drawer/modal | Flutter dialogs/bottom sheets | `DetailsDrawer`, dialogs | 5 | 5 | Good base, but visual language not unified |

## 8. Responsive / Mobile Parity

React has meaningful responsive work:

- Mobile bottom nav under `767px`.
- Mobile drawer from header.
- Filter drawers become bottom sheets.
- Add Property uses a mobile-app shell with sticky submit actions.
- Map layout stacks on mobile.
- Footer is hidden on smaller widths to avoid bottom-nav collisions.

Remaining mobile risks:

- Mojibake in nav makes mobile unusable for Arabic users.
- Admin pages may be too table-heavy for mobile compared with Flutter admin cards.
- Property details need mobile screenshot QA for CTA visibility.
- Map side panel/list must be verified under 360px and 390px widths.
- Edit property still exposes manual coordinate fields, which conflicts with the map-picker-first UX.
- Footer/bottom-nav spacing should be tested on all long pages.

## 9. Arabic RTL / Mojibake Findings

React is configured for RTL globally, but source text quality is the largest frontend problem.

Search markers used: `Ø`, `Ù`, `Ú`, `Ã`, replacement-character style corruption.

High-priority public UI files with corrupted Arabic:

- `rivia-react-web/src/pages/HomePage.tsx`
- `rivia-react-web/src/components/layout/Header.tsx`
- `rivia-react-web/src/components/layout/MobileBottomNav.tsx`
- `rivia-react-web/src/components/cards/PropertyCard.tsx`
- `rivia-react-web/src/components/cards/HotelCard.tsx`
- `rivia-react-web/src/pages/properties/PropertiesPage.tsx`
- `rivia-react-web/src/pages/properties/PropertyMapPage.tsx`
- `rivia-react-web/src/pages/properties/AddPropertyRequestPage.tsx`
- `rivia-react-web/src/pages/properties/EditPropertyPage.tsx`
- `rivia-react-web/src/components/map/PropertyMap.tsx`
- `rivia-react-web/src/components/map/LocationPicker.tsx`

High-priority account/admin shell files:

- `rivia-react-web/src/layouts/AccountLayout.tsx`
- `rivia-react-web/src/layouts/AdminLayout.tsx`
- `rivia-react-web/src/components/ui/DetailsDrawer.tsx`

Service/internal text also appears affected in places, especially older property/map/hotel helper messages. These are lower priority than visible navigation and public forms, but still affect error states.

Classification:

- Critical public UI: Home, Header, MobileBottomNav, Properties, Add Property, Property Details, Map, cards.
- Admin UI: AdminLayout, admin pages, report/feature/hotel/property-request labels.
- Service/error text: property/hotel/report/map errors.
- Low priority: debug-only messages and legacy compatibility labels not shown to users.

## 10. Frontend-Only Production Blockers

| Priority | Blocker | Impact |
|---|---|---|
| P0 | Widespread mojibake in React public UI | Blocks Arabic demo quality and user trust |
| P0 | Navigation labels corrupted in Header/MobileBottomNav/Account/Admin layouts | Users cannot reliably navigate |
| P0 | Add Property text corruption | Core acquisition flow looks broken |
| P0 | Edit Property still exposes manual coordinate fields | Conflicts with required map-picker UX |
| P1 | Hotel booking UI missing | Flutter hotel flow is not matched |
| P1 | Hotel report UI missing | Flutter report flow not matched |
| P1 | Dedicated hotel listing route missing/unclear | Hotel discovery weaker than Flutter |
| P1 | Admin notifications missing | Flutter admin tool not matched |
| P1 | Report reasons admin missing | Flutter moderation setup not matched |
| P1 | Explicit identity verification admin queue missing/unclear | Verification workflow parity risk |
| P1 | Public ad placements unclear | Flutter home has ad-aware content |
| P1 | Property details action hierarchy needs parity QA | Booking/contact/report/rating may feel inconsistent |
| P2 | React visual language split between public/account/admin | Product feels less cohesive |
| P2 | Unused carousel CSS and old visual classes | Maintenance/design debt |
| P2 | Mobile admin pages likely table-heavy | Flutter admin is mobile-card first |

## 11. Recommended UI Fix Roadmap

### P0: Before Demo

1. Clean mojibake in public navigation and public routes.
2. Clean mojibake in `AddPropertyRequestPage`, `PropertyCard`, `HotelCard`, `PropertyMapPage`, and `LocationPicker`.
3. Remove manual coordinate inputs from Edit Property or demote them behind an advanced/debug section.
4. Run mobile screenshots for `/`, `/properties`, `/add-property`, `/map`, `/properties/:id`.
5. Verify every primary CTA is readable and visible in Arabic RTL.

### P1: Before Beta

1. Add or expose a dedicated hotel listing route.
2. Implement hotel booking UI parity or clearly mark the flow as unavailable.
3. Add hotel report action parity.
4. Add admin report reason management.
5. Add admin notifications management or equivalent route.
6. Add explicit admin identity verification review screen if not already covered.
7. Bring property details closer to Flutter order: gallery, price/booking, specs, description, features, location, contact/report/rating.
8. Add public ad placements if ads are part of the production Flutter home experience.
9. Standardize empty/loading/error states across public/account/admin.
10. QA mobile filter drawer, map bottom layout, and account pages at 360px, 390px, 768px.

### P2: Polish

1. Align React public/account/admin cards into one design system.
2. Remove unused hero carousel/static visual CSS if confirmed unused.
3. Decide whether React should emulate Flutter blue app bars more strongly on mobile.
4. Add Flutter-like status chips and action-card components to admin pages.
5. Add consistent skeleton/loading patterns.

## 12. Scores

| Area | Score | Rationale |
|---|---:|---|
| Screen coverage | 7 / 10 | Most major routes exist, but hotels/admin support screens are incomplete |
| Visual parity | 5.5 / 10 | Good cards/drawers, but React feels more web-dashboard than Flutter mobile app |
| Workflow parity | 6 / 10 | Property browsing/add/map are decent; hotel/payment/admin parity gaps remain |
| Mobile parity | 6.5 / 10 | Good responsive patterns, but needs screenshot QA and admin/mobile refinement |
| RTL quality | 3 / 10 | RTL CSS exists, but mojibake is widespread |
| Admin UI parity | 5 / 10 | Route coverage is broad, but several Flutter admin tools are missing or visually different |
| Overall frontend readiness | 5.5 / 10 | Not demo-ready until Arabic text/navigation cleanup; beta needs hotel/admin parity work |

## Final Recommendation

Frontend Go/No-Go: **No-Go for polished Arabic demo until P0 text/navigation issues are fixed**.

React has a viable frontend foundation and enough screen coverage to continue migration. The next compatibility PR should be a focused UI text cleanup across public navigation, public cards, Add Property, Map, and LocationPicker, followed by screenshot QA on mobile and desktop.
