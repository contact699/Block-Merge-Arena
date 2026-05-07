# Block Merge Launch — Manual Checklist

> All tasks the user (not the agent) must complete before App Store / Play Store submission. Update statuses as you go.

## Backend infrastructure

- [ ] Firebase production project created (per ADR 0002)
- [ ] Firebase env vars populated in `.env.local`
- [ ] Firebase Auth → Anonymous sign-in enabled
- [ ] Firestore → security rules per ADR 0002 + ADR 0006 deployed
- [ ] PostHog account created (per ADR 0001)
- [ ] PostHog API key in `.env.local`
- [ ] RevenueCat project created (per ADR 0009)
- [ ] iOS + Android app entries linked in RevenueCat dashboard
- [ ] Entitlement `plus` configured
- [ ] Offering `default` with monthly + annual packages configured
- [ ] RevenueCat API keys in `.env.local`
- [ ] Sentry project created (per ADR 0015)
- [ ] Sentry DSN in `.env.local`
- [ ] Sentry sourcemap upload script wired into EAS post-build hook (`npx @sentry/wizard@latest -i reactNative`)

## Store products

- [ ] App Store Connect — `block_merge_plus_monthly` SKU created (Tier 4 / $3.99)
- [ ] App Store Connect — `block_merge_plus_annual` SKU created (Tier 30 / $29.99) with 7-day intro offer
- [ ] Subscription Group `block_merge_plus` created
- [ ] Apple subscription review materials filled in (display name, description, screenshot)
- [ ] Play Console — `block_merge_plus_monthly` subscription created
- [ ] Play Console — `block_merge_plus_annual` subscription created with 7-day trial offer
- [ ] Both products activated in Play Console

## Legal

- [ ] Termly account created (per ADR 0012)
- [ ] Privacy policy generated → URL: ___________________________________
- [ ] Terms of service generated → URL: ___________________________________
- [ ] Phase 4 plan T11 executed (URLs replace placeholders in `app.json` + `settings.tsx`)

## Assets

- [ ] App icon designer engaged (per ADR 0014)
- [ ] App icon 1024×1024 master delivered → committed at `assets/icon.png`
- [ ] iOS icon variants (light / dark / tinted) generated
- [ ] Android adaptive icon foreground + monochrome generated
- [ ] Screenshot 1 of 6 captured (game board mid-cascade)
- [ ] Screenshot 2 of 6 captured (daily hero)
- [ ] Screenshot 3 of 6 captured (share grid)
- [ ] Screenshot 4 of 6 captured (theme picker)
- [ ] Screenshot 5 of 6 captured (combo theater)
- [ ] Screenshot 6 of 6 captured (leaderboard)
- [ ] 15s preview video shot, edited, exported (1080×1920 portrait)

## Audio (Phase 2 carry-over)

- [ ] `assets/sounds/merge-2x.m4a` generated and committed (per ADR 0004)
- [ ] `assets/sounds/merge-3x.m4a` generated and committed
- [ ] `assets/sounds/merge-5x.m4a` generated and committed
- [ ] `assets/sounds/merge-7x.m4a` generated and committed

## Real-device QA (per ADR 0013)

- [ ] iPhone 13 — cascade hits 60fps target
- [ ] iPhone X — cascade ≥ 30fps minimum
- [ ] Pixel 5 — cascade hits 60fps target
- [ ] Samsung Galaxy A53 — cascade ≥ 30fps minimum
- [ ] Daily run completes end-to-end on each device
- [ ] Paywall renders + sandbox purchase succeeds on iPhone 13
- [ ] Paywall renders + sandbox purchase succeeds on Pixel 5
- [ ] Restore Purchases flips entitlement on a fresh install (iOS)
- [ ] Restore Purchases flips entitlement on a fresh install (Android)
- [ ] Achievement toast surfaces on grant
- [ ] Theme picker applies; subscription downgrade reverts to default
- [ ] Maestro full suite passes on at least one real device

## Submission

- [ ] App Store Connect listing copy populated (per ADR 0016 — en-US + en-GB)
- [ ] Play Console listing copy populated (per ADR 0016 — en-US + en-GB)
- [ ] Screenshots uploaded to both stores
- [ ] Preview video uploaded (App Store Connect requires 1080×1920)
- [ ] Privacy URL field populated in both stores
- [ ] Terms URL field populated in both stores (Play Store only)
- [ ] App reviewed and approved on Apple
- [ ] App reviewed and approved on Google
- [ ] Soft-launch availability flipped to **Canada only** on both stores
- [ ] Day 1 of 14-day soft-launch measurement window started

## Soft-launch metrics gate (after 14 days)

- [ ] Sentry crash-free sessions ≥ 99.5%
- [ ] PostHog D1 retention ≥ 50%
- [ ] PostHog D7 retention ≥ 25%
- [ ] Subscription conversion (extrapolated) ≥ 2% MAU
- [ ] Share rate (`share_grid_tapped / daily_completed`) ≥ 8%
- [ ] App Store rating ≥ 4.6

## Wide launch (per ADR 0017 day-of)

- [ ] All SKUs active in all target markets
- [ ] RevenueCat dashboard verified
- [ ] Sentry Slack alerts confirmed
- [ ] Pre-staged launch posts ready
- [ ] App Store availability flipped worldwide at 08:00 ET
- [ ] Play Console availability flipped worldwide at 08:00 ET
- [ ] Launch announcement posted by 08:30 ET
- [ ] App appears in US App Store search by 09:00 ET
- [ ] First-day Sentry monitoring complete with no critical incidents
- [ ] `git tag launch-v1.0` pushed
