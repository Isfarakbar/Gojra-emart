# Testing and Release Report

## Automated acceptance

- Backend unit and security tests: passed (14 passed, 1 guarded integration test skipped without `MONGO_TEST_URI`).
- Backend guarded integration workflow: passed against `gojra_emart_test`; the database was dropped after the run.
- Admin ESLint and Next.js production build: passed.
- Admin Playwright: 7 applicable tests passed across desktop and 390px mobile; the desktop-only mobile-drawer case was skipped by design.
- Flutter analyzer: passed with zero issues.
- Flutter unit and widget tests: 8 passed.
- Android release APK: built successfully.

## Release artifact

- File: `Gojra-EMart-release.apk`
- Size: 59,099,130 bytes
- SHA-256: `7121B125FFB7539CECB78B3DE6AEDF8596B1DB11F60D5004FB5C34C67079692F`

## Android emulator smoke test

- Clean installation and release-mode startup passed on a Pixel 9 emulator.
- Render cold-start skeleton transitioned to the populated home page without crashes.
- Guest Home and Cart, authentication gate, email validation, Orders/Profile sign-in gates, and Cart-to-Home back behavior passed.
- Double-back within two seconds returned to the Android launcher.
- Long admin-configured home titles now render without truncation.
- Android backup is disabled to prevent encrypted secure-storage data being restored without its original keystore.

## Customer workflow acceptance

The following workflows were exercised on a Pixel 9 emulator against a guarded
`gojra_emart_test` database:

- Email login, cached-session restoration, profile update, and app restart.
- Saved-address creation, automatic first-address defaulting, and checkout prefill.
- Product browsing, real image loading, cart add, quantity state, badge, persistence, and Buy Again.
- COD checkout, delivery fee, `SAVE10` promo validation, discount total, GPS permission, and coordinate storage.
- Order placement, success screen, order list, detail view, tracking timeline, cancellation, stock restoration, and reorder preview.
- Delivered-product review eligibility, validation, submission, update mode, and Pending moderation state.
- Support validation, related-order selection, linked ticket creation, and customer ticket history.
- Notification listing, read behavior, and related-order deep-link navigation.
- Backend outage during startup, cached authentication, cart retention, Orders retry state, and successful recovery.
- Android back navigation and two-press exit behavior.

Device-found fixes include:

- Product-card overflow at Pixel dimensions.
- Guest Home making hidden private Orders and Wishlist requests.
- Cart currency values displaying unnecessary decimal suffixes.
- Orders, Support, Notifications, and Home treating network failures as real empty states.
- Support failing to parse paginated customer orders.
- One-tap order cancellation without confirmation.
- In-app order notifications not opening Order Details.
- Temporary network errors deleting the customer session during auto-login.

## Physical-device acceptance still required

These provider and operating-system paths cannot be proven by local mocks:

- Firebase test-phone OTP and a real SMS OTP.
- Google Sign-In using the final Android signing certificate.
- GPS permission granted, denied, denied permanently, and location services disabled.
- FCM foreground display, background delivery, terminated-app delivery, and order deep-link opening.
- Predictive-back swipe, hardware back, and double-back exit on supported Android versions.
- Clean install and upgrade over the previous APK while preserving login and cart state.
- Camera/gallery upload behavior on the Android versions targeted for launch.

## Release risks and credentials

- The Android application ID is still `com.example.frontend`.
- The release variant currently uses the debug signing configuration.
- Before Play Store publication, choose the permanent package ID, configure the matching Firebase Android app, add production signing credentials, and rebuild.
- The backend production audit retains moderate advisories in Firebase Admin transitive Google Cloud packages. The installed direct package is Firebase Admin 14; npm's proposed remediation incorrectly downgrades it to 10.3.0, so no forced downgrade was applied.
- WhatsApp webhook delivery requires `WHATSAPP_APP_SECRET` and the Meta webhook verification token in the deployment environment.
- Live products currently use `loremflickr.com` placeholder URLs. They return random or unrelated images and should be replaced through the admin panel with real Cloudinary-hosted product photos before customer launch.
