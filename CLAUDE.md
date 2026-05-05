# Block Merge — Project Guide

> **Project:** Block Merge — Daily block puzzle with merge cascade for adult crossover puzzlers (Wordle/NYT Games audience)
> **Status:** Phase 1 of launch plan in progress — see `docs/superpowers/plans/2026-05-05-phase-1-foundation.md`
> **Tech Stack:** Expo SDK 53, React Native 0.79.6, TypeScript (strict), Firebase
> **Package Manager:** NPM (with legacy-peer-deps flag)
> **Target Platform:** iOS & Android mobile

---

## Source of truth

- **Launch design:** `docs/superpowers/specs/2026-05-05-block-merge-launch-design.md`
- **Phase 1 plan:** `docs/superpowers/plans/2026-05-05-phase-1-foundation.md`
- **Design tokens:** `src/lib/design/tokens.ts`
- **Tactile primitives:** `src/components/design/`

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm start

# Run on specific platform
npm run ios
npm run android
npm run web

# Type check
npm run typecheck

# Lint
npm run lint
```

---

## 📱 App Screens (v1)

| Screen | Route | Description |
|--------|-------|-------------|
| Home | `/` | Daily hero card + nav |
| Welcome | `/welcome` | First-run onboarding |
| Daily | `/daily` | One run per day, no timer |
| Endless | `/game` | Free practice, unlimited |
| Leaderboard | `/leaderboard` | Daily standings |
| Replays | `/replays` | 6-char ghost replays |
| Achievements | `/achievements` | Six tasteful badges |
| Settings | `/settings` | Audio, theme, account |
| Share | `/share` | Annotated emoji grid |
| Shop | `/shop` | Cosmetic themes only |

**Cut from v1:** Squads, Battle Pass, Ranks Ladder, Friends-by-code, Tutorials-as-screen, 5-min Sprint mode.

---

## 🏗️ Project Structure

```
src/
├── app/                          # Expo Router screens
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # Home
│   ├── welcome.tsx              # First-run onboarding
│   ├── game.tsx                 # Endless mode
│   ├── tournament.tsx           # Daily run (renamed → daily.tsx in T10)
│   ├── leaderboard.tsx          # Daily standings
│   ├── replays.tsx              # 6-char ghost replays
│   ├── achievements.tsx         # Six tasteful badges
│   ├── settings.tsx             # Audio · theme · account
│   ├── share.tsx                # Annotated emoji grid (Phase 2)
│   └── shop.tsx                 # Cosmetic themes only
│
├── components/                   # Reusable UI
│   ├── design/                  # Tactile-console primitives
│   │   ├── TactileCell.tsx      # Gradient block cell
│   │   ├── Pill.tsx             # Inline labels
│   │   ├── TactileButton.tsx    # Primary / cobalt / ink / plain
│   │   └── GlassCard.tsx        # GlassCard + DeepCard
│   ├── GameBoard.tsx            # 8x8 deep-dark board
│   ├── BlockPiece.tsx           # Piece tray
│   ├── GemDisplay.tsx           # Gem visualization
│   ├── ScoreDisplay.tsx         # Score with multiplier
│   ├── PowerUpButton.tsx        # Power-up activation
│   ├── ComboAnimation.tsx       # Cascade animations (Phase 2 polish)
│   └── ReplayPlayer.tsx         # Replay playback
│
└── lib/
    ├── design/
    │   └── tokens.ts            # Palette, fonts, shadows
    ├── types/                    # game, replay, shop, settings, achievements, social
    ├── game/                     # board, pieces, merge, powerups, replay-recorder
    ├── firebase/                 # config, auth, api, types
    ├── shop/                     # catalog
    └── utils/                    # leaderboard, tournament, replay, currency, inventory, settings, achievements, tutorial (welcome flag only), social
```

(Cut from this tree in Phase 1: `lib/types/{squad,battlepass,ranks,friends}.ts`, `lib/utils/{squad,battlepass,ranks,friends}.ts`, `lib/battlepass/`, `lib/tutorial/`, `components/TutorialOverlay.tsx`, plus the matching screens.)

---

## 🎮 Game Mechanics

### Core Gameplay
- **8x8 grid** with Tetris-style blocks
- **Tap-to-place** mechanic (select piece, tap cell)
- **Line clearing** - complete horizontal or vertical lines
- **Game over** when no valid moves remain

### Merge System (The Innovation)
1. Cleared blocks drop **colored gems**
2. **2+ same-color gems touching → merge**
3. Merged gems give **score multipliers**:
   - 2 gems: 2x multiplier
   - 3 gems: 3x multiplier
   - 4+ gems: 5x multiplier
4. Creates risk/reward: clear now or wait for bigger merge?

### Power-Ups (Pick 2 before match)
| Power-Up | Effect |
|----------|--------|
| 🔄 Reroll | Swap current piece for different shape |
| 💣 Blast | Clear 3x3 area around tap |
| 🎯 Target | Suggests an optimal placement |

---

## 🏆 Game Modes

### Endless
- No time limit
- Free, unlimited practice
- Beat your high score

### Daily
- **One run per day**, no timer (Phase 2 owns the timer-removal migration)
- **Same piece sequence for everyone**, seeded by global date
- Subscriber-only archive of past dailies (Phase 3)

---

## 📊 Progression (v1)

### Achievements (six tasteful badges, status-only — no XP)
- First Merge, Five-Cluster, Daily Debut, A Week Steady, Quick Hand, Centurion

(Ranked ladder and battle pass are CUT from v1. They were juvenile-coded for the adult crossover audience we're targeting.)

---

## 👥 Social (v1)

### Replays
- Every run records a replay
- 6-character shareable code
- Ghost playback for friends-watching-friends

### Daily share grid
- Annotated emoji grid showing the player's final board state
- Merged gems render as colored circles with multiplier numbers
- Same artifact as the differentiator — one share = one merge story
- (Format generator lands in Phase 2)

(Squads, friend codes, and TikTok auto-capture are CUT from v1.)

---

## 💰 Economy

### Currencies
- **Gems** 💎 - Premium currency
- **Coins** 🪙 - Earned from gameplay

### Shop
- Themes (board colors, backgrounds)
- Block skins (visual styles)
- Power-up skins
- Profile customization

---

## 🔧 Technical Details

### Stack
- **Expo SDK 53.0.22** - React Native framework
- **React Native 0.79.6** - Mobile UI
- **TypeScript 5.8.3** - Strict mode enabled
- **NativeWind 4.1.23** - Tailwind CSS styling
- **Firebase** - Auth, Firestore, real-time sync
- **AsyncStorage** - Local persistence

### Path Aliases
Use `@/*` for imports:
```typescript
import { GameBoard } from '@/lib/types/game';
import { cn } from '@/lib/cn';
```

### Styling
Use NativeWind with `cn()` helper:
```tsx
<View className={cn(
  'p-4 rounded-lg',
  isActive && 'bg-purple-500'
)} />
```

---

## 🚀 Launch Checklist

### Phase 1 (Foundation, weeks 1–3)
- [x] No TypeScript errors
- [x] Tactile-console redesign foundation (tokens + primitives)
- [x] Cuts merged (squads, battlepass, ranks, friends, tutorials-as-screen)
- [ ] Backend: populate Firebase production env vars (see `docs/decisions/0002-firebase-production-setup.md`)
- [ ] Analytics: PostHog wired and verified live (see `docs/decisions/0001-analytics-platform.md`)
- [ ] Restyle: Daily, Leaderboard, Replays, Achievements, Settings, Share, Shop
- [ ] Maestro flow cleanup
- [ ] Phase 1 gate verification

### Phase 2 (Differentiator, weeks 4–6)
- [ ] Annotated emoji share grid generator
- [ ] Merge cascade animation (visual + audio + haptic)
- [ ] Daily run model migration: drop 5-min timer, switch to one-run-no-timer
- [ ] Daily archive Firestore schema

### Phase 3 (Monetization, weeks 7–9)
- [ ] RevenueCat integration
- [ ] Paywall surfaces (archive, GIF export, theme apply)
- [ ] Cosmetic theme rotation

### Phase 4 (Polish & Launch Gates, weeks 10–12)
- [ ] Sound design pass
- [ ] Performance optimization on real devices
- [ ] App Store assets (icon, screenshots, descriptions, preview video)
- [ ] Soft launch territory (Canada or NZ) → wide launch

### App Store Requirements
- [ ] iOS: Apple Developer account, App Store Connect
- [ ] Android: Google Play Console
- [ ] Privacy policy URL
- [ ] Terms of service URL

### Firebase Setup (Production)
1. Create Firebase project at console.firebase.google.com
2. Enable Anonymous Authentication
3. Create Firestore database
4. Add security rules for scores, users, replays
5. Update `.env` with production keys

---

## 📝 Commands

```bash
# Development
npm start                 # Start Expo dev server
npm run ios              # Run on iOS simulator
npm run android          # Run on Android emulator
npm run web              # Run in browser

# Quality
npm run typecheck        # Check TypeScript
npm run lint             # Run ESLint

# Build
npx eas build --platform ios     # Build for iOS
npx eas build --platform android # Build for Android
npx eas submit                   # Submit to stores
```

