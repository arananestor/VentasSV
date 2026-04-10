# Feature Retro: Fix broken pinEntry and selectWorker tests, update CLAUDE.md

- **Date:** 2026-04-09
- **PR:** #6

## What went well

- Tests rewritten to pure JS logic, 212 tests passing
- CLAUDE.md now has full project context

## What went wrong

- Previous chat installed @testing-library/react-native which is incompatible with React 19.1.0, left broken tests behind after reverting React

## Lesson

- Always verify that ALL files affected by a dependency change are updated, not just the dependency itself
