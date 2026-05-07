# ADR 0015: Crash Reporting

**Status:** Active
**Date:** 2026-05-07
**Decision:** Sentry via `@sentry/react-native`. Free tier (5k events/mo) covers v1 scale.

## Context

The launch gate requires crash-free sessions ≥ 99.5%. We need real-time crash visibility tied to git SHAs (sourcemaps) and PostHog user IDs.

| | Sentry | Firebase Crashlytics |
|---|---|---|
| RN integration quality | First-class, well-maintained | Adequate but Expo SDK 53 bridge is finicky |
| Sourcemap upload | Built into the EAS build hook | Requires custom plugin work for Expo |
| Free tier | 5k events/mo | Unlimited |
| Alert quality | Strong (Slack/email per issue, deduplication, regression detection) | Basic |
| Already in stack | No | Yes (firebase) |

## Decision

**Sentry.** Reasons:
1. Better Expo SDK 53 RN bridge — matches our existing PostHog-on-RN choice for the same reason.
2. EAS Build has a documented Sentry sourcemap upload step. Crashlytics requires a custom Expo config plugin.
3. Sourcemap → release association → fast root-cause triage. Crashlytics requires more glue.
4. Slack alerting at issue creation is the difference between catching a regression in 30 minutes vs. 4 hours.

Cost projection: 5k events / month is enough for v1. At 50k MAU + 99.5% crash-free → ~250 crash events / month → well under cap.

## Consequences

- New env vars: `EXPO_PUBLIC_SENTRY_DSN` (the project DSN — safe to ship in client).
- New dep: `@sentry/react-native`.
- New scripts: sourcemap upload as an EAS post-build hook (Phase 4 manual setup).
- All `track()` calls in `src/lib/analytics/events.ts` also fire a Sentry breadcrumb so crash reports include the player's last 20 events.

## Revisit if

50k+ MAU and event volume crosses the free-tier ceiling — at that scale Sentry's $26/mo Team tier is fine, no migration needed.
