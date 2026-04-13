# Feature Retro: Remove Duplicate app.json

- **Date:** 2026-04-13
- **PR:** #25

## Problem

app.json and app.config.js coexisted with different extras. app.json did not have `googleMapsKey`, app.config.js did. Expo resolved one or the other depending on context (CLI, dev client, EAS), which caused the static map in SaleDetailScreen to silently fail — no key, no map image, no error.

## Proof of conflict

app.json had `"name": "VentaSV"` (typo — missing the second 's') while app.config.js had `"name": "VentasSV"`. The commit ae9d07f fixed the name only in app.config.js, leaving app.json desynchronized. This confirms both files were being maintained independently and diverging.

## Fix

Delete app.json. app.config.js remains as the single source of truth for Expo configuration, including the `googleMapsKey` loaded via dotenv.

## Lesson

Never have both app.json and app.config.js in the same project. Expo documents that it prefers one over the other, but the actual behavior varies between Expo CLI, dev client, and EAS Build. A single app.config.js with dotenv is the safest pattern.
