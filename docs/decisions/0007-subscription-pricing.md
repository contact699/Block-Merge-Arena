# ADR 0007: Subscription Pricing

**Status:** Active
**Date:** 2026-05-06
**Decision:** Flat USD reference prices ($3.99/mo, $29.99/yr) with store-managed localized pricing tiers. Annual SKU includes a 7-day free trial.

## Context

The launch design committed to subscription monetization at $3.99/mo and $29.99/yr (per § 5 of the spec). RevenueCat lets us ship one product per platform with a price *tier*; Apple and Google then localize automatically (e.g., $3.99 USD ≈ €3.99 EUR ≈ ¥600 JPY at the equivalent tier).

Two viable approaches:

1. **Flat USD, localized tiers** — pick one Apple/Google tier per SKU. Stores show local currency at the equivalent tier. Simpler operations.
2. **Per-region custom pricing** — set explicit prices per market in App Store Connect and Play Console. More control but more operational overhead and more SKUs to maintain.

## Decision

Approach 1 — flat USD with store-tier localization. Reasons:
- v1 has no data on which markets convert. Per-region pricing should follow market data, not preemptive guessing.
- One SKU per platform is the simplest setup; lowest risk of mis-priced markets at launch.
- RevenueCat has a clean abstraction over store tiers — switching to per-region later is a dashboard change, not a code change.

## SKU plan

| SKU id | Type | Apple tier | Google tier | Free trial |
|---|---|---|---|---|
| `block_merge_plus_monthly` | auto-renew subscription | Tier 4 ($3.99) | Tier 4 ($3.99) | none |
| `block_merge_plus_annual` | auto-renew subscription | Tier 30 ($29.99) | Tier 30 ($29.99) | 7 days |

## Consequences

- App Store Connect and Play Console get exactly two products per platform.
- The annual SKU is the trial-bearing one; monthly has no trial.
- Local prices vary by market according to Apple's / Google's price tier tables.

## Revisit if

3-month MRR hits $10k+ and we want to optimize ARPU per market — at that scale, per-region pricing is worth the operational overhead.
