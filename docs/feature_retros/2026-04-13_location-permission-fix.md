# Feature Retro: Location Permission & Static Map Fix

- **Date:** 2026-04-13
- **PR:** #27

## Problem

`sale.geo` was always `null`. The static map in SaleDetailScreen never appeared. Permission status stayed at `undetermined`.

## Root cause

The expo-location config plugin was missing from app.config.js. Without it, `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` were never injected into AndroidManifest. This meant `requestForegroundPermissionsAsync` never triggered the native permission dialog — it silently returned `undetermined` every time.

Additionally, PaymentScreen had a race condition: the permission request fired in `useEffect` (on mount) independently from `getLocation` (called at checkout time). If the permission dialog hadn't resolved by the time the user tapped REGISTRAR, `getLocation` would see `undetermined` and return `null`.

## Fix

1. Added `expo-location` plugin to `app.config.js` with a Spanish-language permission description.
2. Removed the `useEffect` permission request — moved it into `getLocation` itself.
3. `getLocation` now checks status first: if `undetermined`, requests permission inline; if `granted`, gets position; if `denied`, returns `null` silently. Timeout of 5 seconds on `getCurrentPositionAsync`.
4. Extracted pure logic to `src/utils/geoLogic.js` (`shouldRequestPermission`, `canGetLocation`, `buildGeoPayload`) for testability.

## Impact

- New sales (post-merge) will include geo data if the user grants permission.
- Old sales remain with `geo: null` — expected, no migration needed.
- Static map in SaleDetailScreen will render for sales that have geo data.

## Lesson

Any Expo module that requires native permissions needs its config plugin in `app.config.js`. This should be verified on every Expo SDK upgrade and whenever a new native module is added. The `plugins` array is the source of truth for Android/iOS permissions.
