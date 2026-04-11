# Feature Retro: CLAUDE.md Housekeeping

- **Date:** 2026-04-11
- **PR:** #18
- **Architecture doc:** docs/architecture_design/claude_md_housekeeping.md

## Changes

- Test count: 212/15 → 300/19 (Commands and Testing sections)
- Unit test list: added 4 missing suites (displayComponents, formComponents, homeScreen, productPermissions)
- New section: "Process Rules — Learned from Retros" with 3 rules extracted from 7 retrospectives
- Priority list: marked 3 items done, removed stale item (adaptive PIN dots), added 4 new priorities (PinKeypadModal, sales date picker, static map verification, reordered list)

## What went well

- Architecture design doc (PR #17) defined exact changes before implementation — zero ambiguity
- All changes are documentation-only, zero regression risk
- Process rules now codified so they survive context window compression

## What went wrong

- CLAUDE.md drifted for 10 PRs before being updated — every conversation between PR #6 and now operated with stale context (wrong test count, missing suites, done items still listed as pending)

## Lesson

- CLAUDE.md verification should be a checklist item on every PR, not a separate housekeeping task. The new process rule codifies this going forward.
