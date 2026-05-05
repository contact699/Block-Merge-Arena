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
│   ├── index.tsx                # Home screen
│   ├── game.tsx                 # Main gameplay
│   ├── tournament.tsx           # Daily tournaments
│   ├── leaderboard.tsx          # Rankings
│   ├── replays.tsx              # Ghost replay viewer
│   ├── shop.tsx                 # Cosmetic shop
│   ├── settings.tsx             # Settings
│   ├── achievements.tsx         # Achievements
│   ├── tutorials.tsx            # Tutorial system
│   ├── ranks.tsx                # Ranked ladder
│   ├── battlepass.tsx           # Battle pass
│   ├── squads.tsx               # Squad/clan system
│   ├── friends.tsx              # Friends & challenges
│   ├── share.tsx                # Social sharing
│   └── welcome.tsx              # Onboarding
│
├── components/                   # Reusable UI
│   ├── GameBoard.tsx            # 8x8 game grid
│   ├── BlockPiece.tsx           # Tetris-style blocks
│   ├── GemDisplay.tsx           # Gem visualization
│   ├── ScoreDisplay.tsx         # Score with multiplier
│   ├── PowerUpButton.tsx        # Power-up activation
│   ├── ComboAnimation.tsx       # Combo effects
│   ├── ReplayPlayer.tsx         # Replay playback
│   ├── TournamentTimer.tsx      # 5-min countdown
│   └── TutorialOverlay.tsx      # Tutorial hints
│
└── lib/                          # Core logic
    ├── types/                    # TypeScript definitions
    │   ├── game.ts              # Game state types
    │   ├── replay.ts            # Replay system types
    │   ├── shop.ts              # Shop & cosmetics
    │   ├── settings.ts          # Settings types
    │   ├── achievements.ts      # Achievement types
    │   ├── tutorial.ts          # Tutorial types
    │   ├── ranks.ts             # Ranked system
    │   ├── battlepass.ts        # Battle pass types
    │   ├── squad.ts             # Squad types
    │   ├── friends.ts           # Friends types
    │   └── social.ts            # Social sharing types
    │
    ├── game/                     # Game engine
    │   ├── board.ts             # Board logic
    │   ├── pieces.ts            # Piece generation
    │   ├── merge.ts             # Gem merging
    │   ├── powerups.ts          # Power-up effects
    │   └── replay-recorder.ts   # Replay recording
    │
    ├── firebase/                 # Backend
    │   ├── config.ts            # Firebase setup
    │   ├── auth.ts              # Anonymous auth
    │   ├── api.ts               # Score submission
    │   ├── types.ts             # Firebase types
    │   └── index.ts             # Exports
    │
    ├── utils/                    # Utilities
    │   ├── leaderboard.ts       # Local + global scores
    │   ├── tournament.ts        # Tournament logic
    │   ├── replay.ts            # Replay storage
    │   ├── currency.ts          # Virtual currency
    │   ├── inventory.ts         # Player inventory
    │   ├── settings.ts          # Settings storage
    │   ├── achievements.ts      # Achievement tracking
    │   ├── tutorial.ts          # Tutorial state
    │   ├── ranks.ts             # Rank calculations
    │   ├── battlepass.ts        # Battle pass progress
    │   ├── squad.ts             # Squad management
    │   ├── friends.ts           # Friend system
    │   └── social.ts            # Social sharing
    │
    ├── shop/
    │   └── catalog.ts           # Shop items
    │
    ├── battlepass/
    │   └── catalog.ts           # Battle pass rewards
    │
    └── tutorial/
        └── catalog.ts           # Tutorial steps
```

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
| ⏱️ Freeze | Pause timer (tournament only) |

---

## 🏆 Game Modes

### Endless Mode
- No time limit
- Practice and beat your high score
- Perfect for learning strategies

### Daily Tournament
- **Same pieces for all players** (seeded by date)
- **5-minute time limit**
- Global real-time leaderboard
- New tournament every day at midnight UTC

---

## 📊 Progression Systems

### Ranked Ladder
Bronze → Silver → Gold → Platinum → Diamond → Master → Grandmaster
- Earn rank points from tournament performance
- Seasonal resets with rewards

### Battle Pass (30 levels)
- **Free tier**: Coins, basic cosmetics
- **Premium tier**: Exclusive themes, gems, power-ups
- XP from gameplay, daily challenges

### Achievements
- 20+ achievements with gem rewards
- Track combos, scores, streaks, and more

---

## 👥 Social Features

### Squads
- Create or join 10-person squads
- Combined squad score leaderboard
- Squad activity feed
- Leader/Co-Leader/Member roles

### Friends
- Add friends via 8-character friend codes
- Challenge friends to beat your score
- Share replays with friends
- Friend leaderboard

### Replays
- Every game records a replay
- 6-character shareable codes
- Ghost visualization (watch moves play back)
- Share epic moments

### Social Sharing
- One-tap share to TikTok
- Instagram, Twitter, Facebook support
- Auto-capture epic combos (3+ combos, 3x+ multipliers)
- Generated captions and hashtags

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

### Pre-Launch
- [x] All 49 features implemented
- [x] No TypeScript errors
- [x] App.json configured for Block Merge Arena
- [x] Firebase backend ready
- [ ] Create app store assets (icon, screenshots)
- [ ] Write app store descriptions
- [ ] Set up analytics (Firebase Analytics)
- [ ] Configure push notifications
- [ ] Test on real devices (iOS + Android)
- [ ] Performance optimization pass

### App Store Requirements
- [ ] iOS: Apple Developer account, App Store Connect
- [ ] Android: Google Play Console
- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] Age rating (rated for ages 10+)

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

