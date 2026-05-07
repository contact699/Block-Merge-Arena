# ADR 0017: Launch Procedures

**Status:** Active
**Date:** 2026-05-07

## Soft launch — Canada, two-week measurement

### Day 0 (submission day)

1. Build production EAS profiles for iOS + Android.
   ```bash
   npx eas build --profile production --platform ios
   npx eas build --profile production --platform android
   ```
2. Submit for review:
   ```bash
   npx eas submit --platform ios
   npx eas submit --platform android
   ```
3. In App Store Connect → Pricing & Availability → set **Canada only**.
4. In Play Console → Countries / regions → set **Canada only**.
5. Submit for review.

### Days 1–3 (review window)

- Apple review usually clears within 24h. Google Play within 4–8h.
- If rejected: read the rejection, fix, re-submit. Common rejections:
  - Privacy URL 404 — check Termly URL is live (per ADR 0012).
  - Subscription metadata missing — check ADR 0009 was followed.
  - Test account doesn't work — provide a sandbox tester.

### Days 4–17 (measurement window)

Daily ritual:
1. Check Sentry dashboard. Crash-free target: ≥ 99.5%.
2. Check PostHog `app_opened` cohort retention. D1 ≥ 50%, D7 ≥ 25%.
3. Check `subscription_purchased` count. Sub conversion ≥ 2% MAU within 60d (extrapolate at 14d).
4. Check `share_grid_tapped / daily_completed`. Share rate ≥ 8%.
5. App Store rating — must be ≥ 4.6 by day 14.

### Day 14 — gate decision

Pass: proceed to wide launch.
Fail: identify the failing metric. Likely fixes:
- Crashes — Sentry will name the source. Hot-fix and re-submit.
- D1 too low — onboarding regressions. Probably the welcome flow.
- D7 too low — retention failure. Game itself is the issue. (Hardest to fix; may need to delay wide launch.)
- Sub conversion too low — paywall friction. Try `theme_apply` paywall as a softer gate.

## Wide launch — Tuesday morning ET

### Pre-flight (the day before)

- [ ] Verify all SKUs active in App Store Connect + Play Console.
- [ ] Verify RevenueCat dashboard shows offerings live in all target markets.
- [ ] Verify Sentry alert routing is on (Slack channel #block-merge-launch).
- [ ] Pre-stage social posts (Twitter, TikTok, IG).
- [ ] Notify any waitlist subscribers / press contacts.

### Day-of

1. **08:00 ET** — flip availability in App Store Connect (Pricing & Availability → all worldwide).
2. **08:00 ET** — flip availability in Play Console (Countries → all worldwide).
3. **08:30 ET** — post launch announcement on Twitter / TikTok with screenshots + 15s video.
4. **09:00 ET** — confirm app shows up in US App Store search ("block merge").
5. **All day** — monitor Sentry every 30 min for unexpected crash spikes.
6. **18:00 ET** — review the day's PostHog dashboard. Tomorrow's adjustments based on hour-by-hour install / churn.

### Kill-switch playbook

If a critical bug surfaces during launch:

1. **Less than 30 min to fix:** push a hot-fix EAS Update (no store re-submission required). User opens the app, OTA pulls the fix.
   ```bash
   npx eas update --branch production --message "hotfix: <issue>"
   ```
2. **More than 30 min to fix:** flip availability OFF in App Store Connect + Play Console. Both stores let you remove the app from sale within minutes. The existing installed base keeps working; new installs are blocked.
3. **Game is fundamentally broken:** force-show a maintenance screen via a remote-config flag. (Phase 4 doesn't ship a remote-config system — if needed, a Firebase Remote Config integration is a fast follow-up.)

### Post-launch week 1

Daily review of:
- New 1-star reviews — respond if signal, ignore if pure venting.
- Sentry top-5 issues — fix the top issue weekly.
- PostHog funnel: install → daily run → share → subscribe. Find the biggest drop-off, prioritize fix.
