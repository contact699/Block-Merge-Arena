# ADR 0013: Performance Baseline + Measurement Procedure

**Status:** Active
**Date:** 2026-05-07
**Decision:** Pin the 60fps cascade gate to **iPhone 13** and **Pixel 5**. The 30fps minimum gate is **iPhone X** and **Samsung Galaxy A53** (the lowest-end devices we still support).

## Context

The launch design committed to 60fps cascade on a "current mid-range premium" device and 30fps on a "low-end Android" floor. We need exact device names so QA + perf work has a target.

## Decision

| Tier | Devices | Frame target | Acceptable failure |
|---|---|---|---|
| Premium | iPhone 13, Pixel 5 | 60fps sustained during 7×+ cascade | Any drop below 50fps for >2 frames |
| Floor | iPhone X, Samsung Galaxy A53 | 30fps minimum during 5×+ cascade | Any drop below 24fps |

Why these picks:
- **iPhone 13** — released late 2021; "current mid-range premium" by mid-2026 standards.
- **Pixel 5** — same era; reasonable Android perf reference.
- **iPhone X** — oldest iOS device we want to support (iOS 17+ floor).
- **Samsung Galaxy A53** — popular low-end Android in 2024–25; representative of the bottom 20% of Android installs.

## Measurement procedure

1. Build production EAS bundles for iOS + Android.
2. Install on each target device.
3. Run a 5-minute "cascade torture test" — open Endless mode, force a high-multiplier setup, watch the cascade fire.
4. Use:
   - **iOS:** Xcode Instruments → Animation Hitches template, with the device tethered.
   - **Android:** `adb shell dumpsys gfxinfo com.blockmergearena.app` after a session, or Android Studio Profiler.
5. Log frame stats. Failures get filed as Sentry issues with `perf-` tag.

## Failure remedies

If a tier fails:
1. Profile to find the hotspot (most likely candidates: Reanimated worklet hot loops, Skia overdraw if used, AsyncStorage bursts, Firestore re-renders).
2. Apply targeted fix — usually `useMemo`, `React.memo`, or `runOnUI` boundary tightening.
3. Re-measure. Don't ship until the gate passes.

## Out of scope for v1

- ProMotion 120Hz on iPhone 13 Pro and up (we target 60Hz; ProMotion is a future polish task).
- Tablet performance (iPad / Android tablet aren't supported in v1).
