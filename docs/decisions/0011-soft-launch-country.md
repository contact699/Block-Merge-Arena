# ADR 0011: Soft-launch Country

**Status:** Active
**Date:** 2026-05-07
**Decision:** Canada. Two-week measurement window before wide launch.

## Context

The launch design (§ 7 Phase 4) called out Canada vs. New Zealand as candidates. Both are English-speaking, smaller App Store / Play Store markets where a soft launch generates real retention numbers without burning the global launch.

| Factor | Canada | New Zealand |
|---|---|---|
| Population | 39M | 5M |
| iOS market share | ~57% | ~33% |
| Daily active mobile gamers | High | Lower |
| Time zone overlap with US ops | Same | 17h offset |
| Marketing influence on US launch | Cross-pollinates US TikTok | Limited |

## Decision

**Canada.** Reasons:
1. Higher install volume → faster to statistically meaningful retention numbers.
2. Same time zones — easier ops, clearer event timestamps in PostHog.
3. Cross-pollination with US-language social media boosts the wide-launch moment.
4. NZ's smaller market means a misfire in NZ tells us less about US-market behavior.

## Procedure

1. After Phase 4 code work + asset prep, build production EAS profiles for iOS + Android.
2. In App Store Connect → submit for review → in **Pricing and Availability**, select **Canada only**.
3. In Play Console → submit → in **Countries / regions**, select **Canada only**.
4. Once approved, monitor for 14 days. Gate to wide launch:
   - Crash-free sessions ≥ 99.5% (Sentry)
   - D1 retention ≥ 50%
   - D7 retention ≥ 25%
   - Subscription conversion (extrapolated) ≥ 2% MAU
   - Share rate (`share_grid_tapped / daily_completed`) ≥ 8%
   - App Store rating ≥ 4.6
5. If any gate fails, fix and re-soft-launch for another 14 days.

## Revisit if

Canada conversion looks anomalously different from US benchmarks (rare but possible) — could expand to multi-country soft launch (Canada + UK + AU).
