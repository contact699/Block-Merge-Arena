# ADR 0014: App Icon + Store Asset Specs

**Status:** Active
**Date:** 2026-05-07

## Icon

**Decision:** Hire a designer via a curated marketplace (Dribbble Pro / Working Not Working / Fiverr Pro tier). Budget ~$300–600. Brief:
- Concept: ember-on-cream block with a soft inner shadow. Single block, slight tilt.
- 1024×1024 master file.
- iOS variants: light + dark + tinted (iOS 18+).
- Android: adaptive icon foreground + monochrome variant.

Why hire vs. DIY: a launch icon is what gets clicked or scrolled past in the App Store. The ROI on a $400 designer is much better than 8 hours of mediocre DIY in Figma. Use a designer who has shipped icon redesigns for puzzle/casual games specifically.

## Screenshots — six per platform

iOS App Store and Play Console both want six (or up to ten) screenshots. Use the same six for both, sized per the requirements of each.

**Shot list:**
1. **The hook:** game board mid-cascade with a 5× ember merge highlighted. Caption: "Place. Clear. Merge."
2. **Daily ritual:** the daily hero card with the streak count visible. Caption: "Same puzzle for everyone."
3. **Share grid:** an emoji-grid screenshot with a recognizable score. Caption: "Share your daily."
4. **Theme picker:** the four themes side by side. Caption: "Make it yours."
5. **Combo theater:** an active 7-line clear with the multiplier strip showing 9×. Caption: "Big risks. Bigger merges."
6. **Leaderboard:** today's leaderboard with the player highlighted. Caption: "Beat them all."

## Preview video — 15 seconds

Both stores accept a 15s preview. Single video, run the merge cascade twice (once 3×, once 7×), end with the share grid being copied + pasted. Background music: subtle ambient (or silence — Apple recommends short videos that read at low volume).

Shot:
1. (0–3s) Player taps to place a piece, line clears.
2. (3–6s) Three gems pulse, fuse into a 3× cluster — first cascade.
3. (6–10s) Camera tilts. Another piece placed, big multi-line clear, 7× cascade with slow-mo.
4. (10–13s) Share grid renders below the board.
5. (13–15s) "Block Merge" wordmark + App Store badge.

Format: 1080×1920 portrait, .mp4, ≤30MB, no audio dialog.

## Submission checklist (manual)

See `docs/launch/manual-checklist.md` for the full per-asset list.
