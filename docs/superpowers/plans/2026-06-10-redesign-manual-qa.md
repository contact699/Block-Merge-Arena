# Redesign Manual Device-QA Checklist
**Date:** 2026-06-10
**Branch:** redesign/core-interaction
**Covers:** spec §7 perf budget + interaction feel — steps that cannot run headlessly

---

## Prerequisites
- Physical device or simulator attached (`npx expo run:ios` / `npx expo run:android`)
- RN performance monitor available (shake → Perf Monitor, or `adb shell am start ...`)
- Maestro CLI installed and device detected (`maestro --version`)
- Reduce Motion toggle accessible via iOS Settings › Accessibility or Android equivalent

---

## 1. Drag-to-Place Interaction

- [ ] **Lift height** — drag a piece from the tray; it should visually lift ~72 pt above the touch point, separating cleanly from other tray pieces
- [ ] **Ghost preview snaps to grid** — while dragging over the board the ghost preview snaps cell-by-cell (not freeform); confirm grid snap feels crisp, no sub-cell wobble
- [ ] **Valid cell tint** — hovering over a valid placement cell shows a colour-tinted highlight matching the piece colour
- [ ] **Invalid cell tint** — hovering over an occupied or out-of-bounds area shows a grey/desaturated tint (no colour)
- [ ] **Release on valid cell** — piece springs into place with a short settle animation; board state updates immediately
- [ ] **Release on invalid cell** — piece springs back to its tray slot with a rubber-band return animation; tray state unchanged
- [ ] **Tap-tap fallback** — tap a tray piece to select it (highlight visible), then tap a board cell to place; confirm this still works independently of drag

---

## 2. Line Clear → Gem & Cascade Flow

- [ ] **Gems appear** — clearing a line causes coloured gem tokens to appear on the board; each gem shows its tier/multiplier label (e.g. ×2, ×3, ×5)
- [ ] **Merge triggers cascade** — two or more same-colour adjacent gems merge; the merge should produce a noticeable slow-motion burst animation
- [ ] **Haptic on merge** — confirm a haptic pulse fires at the moment of each merge (use a physical device; simulator may skip haptics)
- [ ] **Sound on merge** — confirm the merge SFX plays (audio not muted in Settings)
- [ ] **Cascade chain** — if the merge creates new adjacencies, confirm the chain fires in sequence with brief slow-mo between each burst

---

## 3. Score Integrity (Audit C2)

- [ ] **Final-move score saved** — play Endless until game-over; check the local high-score / Firebase write includes the score earned on the _last_ move before the board locked (not just the penultimate state)
- [ ] **Score display matches stored value** — score shown on game-over screen equals the value retrievable from Settings › Stats or the Leaderboard entry

---

## 4. Daily Mode Determinism & One-Run Gate

- [ ] **Same seed → same board** — on two separate devices (or two simulator instances with different user IDs), start Daily on the same calendar date; confirm piece sequence is identical move-for-move
- [ ] **One-run-per-day enforced** — after completing (or abandoning) a Daily run, return to Home; confirm the Daily hero card shows a "completed" state and tapping it does not start a new run
- [ ] **Replay records move #1** — open the replay for today's run; confirm the first move is captured (replay doesn't start from move #2)

---

## 5. Performance Budget (spec §7)

Run each test with RN Perf Monitor visible. Accept ≥55 fps as passing (monitor jitter is normal).

| Scenario | Device | Target | Pass? |
|----------|--------|--------|-------|
| Full cascade (5+ gem chain) | iPhone 13 or equivalent | ≥ 60 fps | [ ] |
| Full cascade (5+ gem chain) | Pixel 5 _or_ Galaxy A53 | ≥ 30 fps | [ ] |
| Dragging piece across board | Any device | JS thread unblocked (JS fps stays near 60 while UI thread drops are acceptable) | [ ] |
| Idle home screen | Any device | No frame drops > 16 ms in steady state | [ ] |

**How to check JS thread:** In RN Perf Monitor the top row is JS fps; it should stay ≥55 while the UI thread (bottom row) handles the drag gesture natively.

---

## 6. Reduce Motion Accessibility

- [ ] **Enable Reduce Motion** on device (iOS: Settings › Accessibility › Motion › Reduce Motion; Android: Settings › Accessibility › Remove Animations)
- [ ] Launch the app and trigger a cascade
- [ ] Confirm cascades become **crossfades** (dissolve between states) rather than spring/burst animations
- [ ] Confirm crossfade duration is approximately **half** of the normal animation duration (should feel noticeably quicker/simpler, not a full-length fade)
- [ ] Tap-tap placement still completes (no animation regressions)

---

## 7. Full Maestro Suite (device-attached)

```bash
# Run the complete flow suite against an attached device/emulator
npm run e2e

# Or run the new drag-place flow individually
npx maestro test .maestro/flows/gameplay/drag-place.yaml
```

- [ ] All flows pass with no `FAILED` steps
- [ ] `drag-place.yaml` — screen survives the swipe gesture (no crash, `game-screen` still visible)
- [ ] `endless-mode.yaml` — board cells interactive, back navigation works
- [ ] `home-navigation.yaml` — all nav destinations reachable and back-navigable

---

## Sign-off

| Tester | Device | OS Version | Date | Result |
|--------|--------|------------|------|--------|
| | | | | |
| | | | | |
