# Block Merge — Launch Design

**Date:** 2026-05-05
**Timeline:** 8–12 weeks to wide launch
**Owner:** robchiarello@gmail.com
**Status:** Design approved, awaiting implementation plan

---

## 1. Positioning & North Star

**Product name.** Rename **Block Merge Arena → Block Merge**. "Arena" reads competitive-esports — wrong audience.

**One-sentence pitch.** *A daily block puzzle where the leftover pieces fuse into multipliers. One run a day, same pieces for everyone, share your grid.*

**Audience.** Adult crossover puzzlers — the people who already do Wordle, NYT Mini, Connections, Spelling Bee. Smartphone-primary. Willing to pay $4–5/month for a puzzle they love.

**Hook.** The merge cascade. Every block puzzle clears lines for points. **Ours clears, then the leftover gems cluster by color and fuse into multipliers** — and the multiplier is visible on the share grid. That's the differentiator. That's the screenshot. That's the TikTok clip.

**Success metrics for v1 launch.**
| Metric | Target | Why |
|---|---|---|
| D7 retention | ≥ 35% | Daily-ritual benchmark; NYT Games ≈ 40% |
| Share rate (share / completed run) | ≥ 8% | The grid is the growth engine |
| Subscription conversion (% MAU within 60d) | ≥ 2% | Sustainable subscription floor |
| App Store rating | ≥ 4.6 | Required for organic discovery vs. Block Blast (4.7) |

---

## 2. Scope — What Ships, What Gets Cut

**Eight screens ship in v1.**

| Screen | Role | Notes |
|---|---|---|
| Daily | The hero. One run/day, same pieces, no timer. | Renamed from "Tournament" |
| Endless | Free unlimited practice. | Existing — apply redesign |
| Leaderboard | Global daily standings + your friends list (people who imported your share). | Existing — strip rank/season language |
| Replays | 6-character replay codes; watch ghost playback. Subscriber feature: one-tap GIF export. | Existing — surface as TikTok funnel |
| Achievements | Six tasteful badges (no XP/levels). Examples: First 5× merge, 100 dailies, Sub-3-min run. | Existing — slim from 20+ to 6 |
| Settings | Audio, haptics, theme, account, subscription mgmt. | Existing — restyle |
| Share | The annotated grid + replay-code companion. | Existing share screen, new format |
| Shop | Cosmetic themes only (no gameplay-affecting purchases). | Existing — strip power-up bundles |

**Cut from v1.** Squads, Battle Pass, Ranks Ladder (Bronze→GM), Friends-by-code, Tutorials-as-screen, current 5-min Tournament timer mode.

> Existing code for cut features stays in git history but is **deleted from the build** to slim the binary, reduce QA surface, and avoid dead routes that confuse early users.

**One mode preserved as a "could-revisit" feature, not in v1:** the existing 5-min Tournament code becomes the basis for a future "Sprint" mode for subscribers — not in the launch build.

---

## 3. Daily Ritual & Share Grid

### Daily run rules

- **One run per day.** Each player gets access to the day's puzzle at their **local midnight**.
- **Same puzzle for everyone, indexed by global date** (UTC date string seeds the piece sequence). Two players in different timezones playing on "their May 5th" play the same puzzle; they just unlock it at different wall-clock times.
- **No time limit.** Run lasts until no valid placements remain.
- **No retries.** If you bust at 1,000, your daily score is 1,000. Discipline is half the ritual.
- **Piece sequence is finite per day** so every player eventually runs out of moves on the same set — leaderboard ceiling is the same for all players.
- **Leaderboard for puzzle #N** stays live until 36 hours after first availability (covers all timezones with margin), then archives.

### Daily archive

- **Subscriber feature.** Free users get today's puzzle. Subscribers get every past daily back to launch day.
- Archive playback follows the same rules (one run, no timer, no retries — but you can revisit *any* day, just one run per day per archived puzzle).
- Archive completion shows on the player's "Daily Streak" stat (n / total).

### Share grid format

Format optimized for paste-anywhere (group chats, Twitter, Slack, iMessage). The merge mechanic must be visible.

```
Block Merge #142 · 24,180 · ×7 combo
🟧🟧⬜🟦🟦🟦⬜⬜
🟧🔴⁵⬜🟦🟦⬜⬜⬜
⬜🟨🟨🟪🟪⬜🟢⁴⬜
⬜⬜⬜⬜⬜⬜⬜⬜
⬜🟦🟦⬜🟧⬜⬜🟪
⬜⬜⬜⬜⬜🟧🟧⬜
⬜⬜⬜⬜⬜⬜⬜⬜
⬜⬜⬜⬜⬜⬜⬜⬜
blockmerge.app
```

**Symbol rules.**
- `⬜` empty cell
- `🟧🟦🟩🟨🟪🟥🟫` blocks (ember, cobalt, forest, mustard, plum, rose, teal — colors from the design palette)
- `🔴⁵` `🟢⁴` etc. — **merged gems with multiplier shown as superscript number after the colored circle**. Circles are visually distinct from squares; the superscript is the differentiator number.

The url at the bottom is the conversion vector — a recipient who pastes this in a group chat sees the puzzle, the merge artifacts, the score, and a way to play.

### Replay-code companion

Underneath every share grid, an optional **6-character replay code** (e.g. `K7P2QM`). Recipients enter the code in the app to watch the ghost playback. This is the *bonus* layer — not the primary share — but it serves the "watch this 47× combo" use case for friends-watching-friends.

---

## 4. The Merge Cascade — Spectacle Spec

This is the differentiator's actual feel. Every other section is positioning; this is what makes someone say *"oh damn"* and clip it.

### Visual

| Stage | Duration | What happens |
|---|---|---|
| Line clear | 80 ms | Cleared cells flash white, then collapse with a brief "shed" animation. |
| Gem reveal | 60 ms | Surviving gems pulse once at 1.05× scale. |
| Cluster pull | 280 ms | Same-color gems pull toward each other with elastic motion (overshoot 8%, settle). |
| Fusion | 180 ms | Cluster merges into a single larger gem. The multiplier number animates 0× → N× with a slight overshoot. |
| Hold | 100 ms | Gem holds at peak brightness, glow pulse outward. |

Total cascade ≈ 700 ms per merge. Multiple merges chain visually but compress timing (each subsequent merge is 80% of the previous duration).

### Slow-mo

For **5× and above**, time briefly slows to 0.55× for the cluster-pull and fusion phases (≈ 250 ms real time, feels like 450 ms). Snaps back to normal speed after fusion. This is the "TikTok moment."

### Audio (per multiplier tier)

| Tier | Sound design |
|---|---|
| 2× | Single warm bell strike. Soft, satisfying. |
| 3× | Layered bells (a third + a fifth). Light chord. |
| 5× | Bells + sustained low hum. Feels weighty. |
| 7×+ | Full chord swell + sub-bass thump. *The* clip moment. |
| Chain bonus | Each chained merge adds a rising pitch shift (each successive merge is one semitone higher, capped at 8). |

Sound design is the cheapest leverage we have for "this game feels different." Budget for an actual sound designer, not stock.

### Haptic

| Tier | Pattern |
|---|---|
| 2× | Single light tap |
| 3× | Single medium tap |
| 5× | Heavy tap + 80 ms delayed second light tap |
| 7×+ | Heavy + double-pulse |

iOS `expo-haptics` already in the dependency list. Android equivalents.

### Reduced motion

All cascade animations honor system "Reduce Motion" — slow-mo disabled, durations halved, no overshoot/elastic motion. Audio + haptic still fire so the spectacle is preserved.

---

## 5. Monetization & Onboarding

### Subscription model

| Tier | Price | What you get |
|---|---|---|
| Free | $0 | Today's daily, endless mode, basic leaderboard, share grid, share-via-replay-code |
| **Block Merge+** monthly | $3.99 | Daily archive (every past puzzle), one-tap GIF export from any replay, monthly cosmetic theme, no ads* |
| **Block Merge+** annual | $29.99 | Same as monthly + an exclusive annual "Founder" theme |
| Free trial | 7 days, annual only | Lower friction to commit to annual |

\*v1 has no ads anywhere. The "no ads" line in the subscription tier is forward-compat — if we ever experiment with light interstitials in endless, subscribers are immune by definition.

### Why subscription, not IAP?

Audience B already pays for puzzles by subscription elsewhere. The daily archive is a feature they value (NYT Games charges for it). Cosmetic IAP alone cannot fund growth. Ads + IAP would actively undercut the brand.

### Implementation

- **RevenueCat** is already in `package.json` (`react-native-purchases`). Use it.
- Subscription state stored in Firestore on the user's profile, mirrored to AsyncStorage for offline resilience.
- Paywall surfaces at: archive entry, GIF export tap, theme purchase. Never on the daily itself.

### Cosmetic theme rotation

- **One new theme per month** for subscribers. Example: warm cream (default), cool sage, mono, neon (already specified by the existing tactile-console palette tokens).
- Free users can preview themes but cannot apply them.
- Theme selection lives in Settings, not Shop. Shop becomes purely browse-and-buy individual themes (one-time, $1.99 each — for non-subscribers who want one specific theme).

### Onboarding (replaces tutorials-as-screen)

Tutorials screen is cut. The merge mechanic is taught via a **silent first-run demo** on the welcome screen.

**Three auto-played 3-second loops, no narration:**
1. Hand places a piece on the board → line completes.
2. Line clears, two same-color gems remain, gems pull together → "2×" appears on the merged gem.
3. A bigger merge — three gems → "3×" — followed by a chord and a satisfying haptic.

User taps "Start playing." That's the entire tutorial. The mechanic is shown, not explained.

If a player asks for help mid-game, a contextual "What's a merge?" tooltip appears once when they first place a piece adjacent to a gem.

---

## 6. Architecture Changes

### Code that gets deleted

- `src/app/squads.tsx`, `src/app/battlepass.tsx`, `src/app/ranks.tsx`, `src/app/friends.tsx`, `src/app/tutorials.tsx`
- Supporting `src/lib/utils/squad.ts`, `battlepass.ts`, `ranks.ts`, `friends.ts`
- `src/lib/types/squad.ts`, `battlepass.ts`, `ranks.ts`, `friends.ts`
- `src/lib/battlepass/catalog.ts`, `src/lib/tutorial/catalog.ts`
- `src/components/TutorialOverlay.tsx`
- Maestro flows under `.maestro/flows/social/squads`, `.maestro/flows/progression/ranks`, `.maestro/flows/progression/battlepass`, `.maestro/flows/social/friends`, `.maestro/flows/onboarding/tutorial`

### Code that gets restyled (apply tactile-console)

- `src/app/tournament.tsx` → `src/app/daily.tsx` (rename + redesign + remove timer)
- `src/app/leaderboard.tsx`, `src/app/replays.tsx`, `src/app/shop.tsx`, `src/app/settings.tsx`, `src/app/share.tsx`, `src/app/achievements.tsx` (redesign only)

### Code that gets added

- `src/lib/share/grid.ts` — annotated emoji grid generator (board state → string).
- `src/lib/daily/seed.ts` — daily seed system (already partially exists in `src/lib/utils/tournament.ts`; consolidate).
- `src/lib/daily/archive.ts` — past-puzzle index, fed by Firestore.
- `src/lib/subscription/revenuecat.ts` — RevenueCat wrapper, subscription state hook.
- `src/components/cascade/MergeAnimation.tsx` — Reanimated-driven cascade with slow-mo support.
- `src/lib/audio/cascade.ts` — sound triggers per multiplier tier, using `expo-av`.
- `src/lib/haptics/cascade.ts` — haptic triggers per multiplier tier, using `expo-haptics`.
- `src/lib/analytics/events.ts` — analytics wrapper (PostHog or Firebase Analytics — pick during Phase 1).

### Code that gets configured

- Firebase env vars in `.env.production` (currently placeholders).
- App rename: `app.json` → `name: "Block Merge"`, bundle id stays.
- Splash screen + icon redesign (cream paper + ember "M" logomark).

---

## 7. Launch Plan — 8 to 12 Weeks

### Phase 1 · Foundation (weeks 1–3)

- [ ] Populate Firebase production credentials; validate auth + Firestore on real iPhone + low-end Android.
- [ ] Apply tactile-console redesign to the remaining 6 keep-list screens.
- [ ] Delete cut screens, types, utils, catalogs, Maestro flows. Update routing.
- [ ] Rename "Block Merge Arena" → "Block Merge" everywhere (app.json, copy, splash, icon).
- [ ] Wire analytics. Decision point: PostHog (better funnel analysis) vs. Firebase Analytics (already-integrated). Default to PostHog unless cost is a concern.

**Phase 1 gate:** All eight remaining screens visually consistent. Firebase live. Analytics firing. Cuts merged.

### Phase 2 · Differentiator (weeks 4–6)

- [ ] Annotated emoji grid share format (`src/lib/share/grid.ts`). Unit-tested against representative board states.
- [ ] Merge cascade animation system (Reanimated + Skia where needed for the glow pulse).
- [ ] Audio asset commission — engage a sound designer for 4 tier sounds + chain pitch system. ~2 weeks lead time, kick off in week 1.
- [ ] Haptic patterns per tier.
- [ ] Daily run model migration: drop 5-minute timer, switch to one-run-no-timer-no-retries.
- [ ] Daily archive Firestore schema + paywall hook.

**Phase 2 gate:** Merge cascade feels good on a real device. Share grid renders correctly. One-run daily plays end-to-end.

### Phase 3 · Monetization (weeks 7–9)

- [ ] RevenueCat integration. Three SKUs: monthly, annual, annual with trial.
- [ ] Paywall UI at archive entry, GIF export tap, theme apply.
- [ ] Cosmetic theme rotation system + shop simplification.
- [ ] App Store / Play Store subscription product creation.
- [ ] Privacy policy + terms of service URLs (required for subscription).

**Phase 3 gate:** Subscription flow works end-to-end on TestFlight + Play Console internal track.

### Phase 4 · Polish & Launch Gates (weeks 10–12)

- [ ] Sound design pass, mixed and normalized.
- [ ] Performance optimization on real devices: cascade animation must hit 60 fps on iPhone 12 / Pixel 5; 30 fps minimum on iPhone X / mid-range Android.
- [ ] Real-device QA: iPhone X, iPhone 14, iPhone 15 Pro, Pixel 5, Pixel 8, low-end Samsung A-series.
- [ ] App Store assets: icon (1024×), screenshots (six per platform), preview video (15s of merge cascades), descriptions in en-US + en-GB.
- [ ] Soft-launch territory chosen: **Canada or New Zealand** (English-speaking, smaller App Store, allows two weeks of retention measurement before wide launch).
- [ ] Two-week soft-launch measurement window. Gate to wide launch: D7 ≥ 25% (looser than success metric — soft-launch proves the loop, not the final number) and crash-free rate ≥ 99.5%.
- [ ] Wide launch — Tuesday morning ET, two weeks after soft-launch confirms numbers.

**Launch gate (final):** Crash-free ≥ 99.5%, D1 ≥ 50%, D7 ≥ 25% in soft-launch territory. Subscription billing verified. Privacy policy live. App Store rating mechanism wired.

---

## Out of Scope for v1 (explicit non-goals)

These come up naturally and should be deliberately deferred:

- Multiplayer / asynchronous co-op
- Live tournaments (real-time same-time competitions)
- Sprint mode (5-min timed) — Phase 5 candidate, not v1
- Ad monetization
- Cross-platform sync via Apple/Google account (anonymous-only in v1)
- Push notifications beyond "your daily is ready" — keep ONE tasteful daily notification, no streak nags or re-engagement spam
- Web version
- AI coach / hint system
- Cosmetics that affect gameplay (distinct from cosmetics that affect aesthetics)

---

## Open questions for the implementation plan

1. **Analytics platform.** PostHog or Firebase Analytics? Recommend PostHog for funnel/cohort analysis, but check cost projections at expected MAU.
2. **Sound designer engagement.** Hire freelancer (~$2–4k for 4 tier sounds + chain system + UI sounds) or use AI-assisted sound generation (cheaper, lower ceiling). Recommend freelancer; this is the differentiator.
3. **Soft-launch country choice.** Canada vs. New Zealand. Canada has more volume, NZ has smaller market for cleaner signal. Recommend Canada.
4. **Cosmetic theme cadence.** Monthly is the design — confirm we have art capacity to deliver one new theme/month after launch.
