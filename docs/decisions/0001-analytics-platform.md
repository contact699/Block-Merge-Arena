# ADR 0001: Analytics Platform

**Status:** Active
**Date:** 2026-05-05
**Decision:** PostHog (cloud, US region).

## Context

We need to measure the success metrics from the launch design (`docs/superpowers/specs/2026-05-05-block-merge-launch-design.md`):
- D7 retention ≥ 35%
- Share rate ≥ 8%
- Subscription conversion ≥ 2% within 60d

Two viable options:

| | PostHog | Firebase Analytics |
|---|---|---|
| Funnel + cohort analysis | First-class | Limited; requires BigQuery export |
| Free tier | 1M events/mo | Unlimited |
| Self-host option | Yes | No |
| Already in stack | No | Yes (firebase v12 in deps) |
| SDK quality (RN, Expo SDK 53) | Good — `posthog-react-native` | Adequate — `expo-firebase-analytics` deprecated for SDK 53 |

## Decision

**PostHog.** Funnel quality matters more than cost at our expected scale (≤ 50k MAU in year one ≈ 2M events/mo at $0.31/1k = ~$300/yr — acceptable). Firebase Analytics' deprecated Expo bridge is a real problem on SDK 53 and would force us through BigQuery for any non-trivial funnel question.

## Consequences

- Add `posthog-react-native` to dependencies.
- New env vars: `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST`.
- All event taxonomy lives in `src/lib/analytics/events.ts` — no inline `posthog.capture()` calls anywhere else. New events go through the typed `track()` helper.
- Identify each user once on app cold-start with the anonymous Firebase UID.

## Revisit if

MAU passes 200k (cost crosses $1k/mo) or PostHog event-quality issues emerge. Migration target if we revisit: Firebase Analytics + BigQuery for warehoused analysis.
