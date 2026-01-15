# Block Merge Arena - AI Assistant Guide

> **Project:** Block Merge Arena - Competitive block puzzle game for Gen Z (ages 10-15)
> **Tech Stack:** Expo SDK 53, React Native 0.79.6, TypeScript (strict), Firebase/Supabase
> **Package Manager:** NPM (with legacy-peer-deps flag)
> **Target Platform:** iOS & Android mobile

---

## 📋 Quick Reference

<stack>
  **Core:** Expo SDK 53.0.22, React Native 0.79.6, React 19.0.0, TypeScript 5.8.3 (strict mode)
  **Package Manager:** NPM with legacy-peer-deps — lock file: package-lock.json
  **Backend:** Firebase (or Supabase) for multiplayer, leaderboards, tournaments
  **Router:** Expo Router ~5.1.8 (file-based routing)
  **State:** Zustand 5.0.9 (game state), @tanstack/react-query 5.90.2 (server state)
  **Styling:** NativeWind ~4.1.23 + Tailwind CSS 3.4.17
  **Animations:** react-native-reanimated 3.17.4 (for combo effects, block animations)
  **Gestures:** react-native-gesture-handler ~2.24.0 (drag-and-drop blocks)
  **Icons:** lucide-react-native ^0.468.0
  **Graphics:** @shopify/react-native-skia v2.0.3 (for game board rendering)
</stack>

---

## 🏗️ Project Structure

<structure>
```
/home/user/blend/
├── src/
│   ├── app/                      # Expo Router file-based routes
│   │   ├── _layout.tsx          # Root layout
│   │   ├── index.tsx            # Home screen (Play button, tournament info)
│   │   ├── game.tsx             # Main game screen
│   │   ├── tournament.tsx       # Daily tournament screen
│   │   ├── leaderboard.tsx      # Global/friends leaderboard
│   │   ├── squad.tsx            # Squad/clan management
│   │   └── shop.tsx             # Cosmetic shop & battle pass
│   │
│   ├── components/              # Reusable UI components
│   │   ├── GameBoard.tsx        # Main game board (8x8 or 10x10 grid)
│   │   ├── BlockPiece.tsx       # Draggable block piece
│   │   ├── GemDisplay.tsx       # Gem visualization and merge effects
│   │   ├── ScoreDisplay.tsx     # Score counter with multiplier
│   │   ├── PowerUpButton.tsx    # Power-up activation buttons
│   │   ├── ComboAnimation.tsx   # Epic combo visual effects
│   │   ├── GhostReplay.tsx      # Ghost replay overlay
│   │   └── TournamentTimer.tsx  # 5-minute countdown timer
│   │
│   └── lib/                     # Utilities, state, types
│       ├── types/
│       │   └── game.ts          # Game types (Block, Gem, PowerUp, GameState)
│       ├── state/
│       │   └── game-store.ts    # Zustand store (game state, scores)
│       ├── game/
│       │   ├── board.ts         # Board logic (placement, clearing)
│       │   ├── pieces.ts        # Block piece generation
│       │   ├── merge.ts         # Gem merge logic
│       │   ├── scoring.ts       # Score calculation
│       │   └── validation.ts    # Valid move detection
│       ├── utils/
│       │   └── tournament.ts    # Daily tournament seed generation
│       ├── cn.ts                # className merge utility
│       └── useColorScheme.ts    # Theme utilities
│
├── .env                         # Environment variables (Firebase keys)
├── .npmrc                       # NPM configuration (legacy-peer-deps)
├── package.json                 # Dependencies
├── package-lock.json            # NPM lockfile
├── tsconfig.json                # TypeScript config (strict mode, @/* alias)
├── tailwind.config.js           # Custom theme (neon colors, teen aesthetic)
├── global.css                   # Global Tailwind directives
├── eas.json                     # EAS Build configuration
└── CLAUDE.md                    # AI assistant guide (this file)
```
</structure>

---

## 🎯 Project Context: What is Block Merge Arena?

**Block Merge Arena** is a **competitive block puzzle game** targeting Gen Z (ages 10-15). It combines classic block puzzle mechanics with:
- **Daily tournaments** (same starting pieces for all players)
- **Merge mechanics** (cleared blocks drop gems that merge for score multipliers)
- **Power-ups** (strategic loadout system)
- **Social features** (squads, ghost replays, TikTok sharing)

### Core Differentiator from Block Blast
Block Blast is a **relaxing, solo, endless** block puzzle. Block Merge Arena is **competitive, social, and skill-based**.

---

## 🎮 Game Mechanics

### 1. Core Block Puzzle
- **8x8 or 10x10 grid** (decide based on mobile screen size)
- **Tetris-style pieces** (various shapes: L, T, I, Square, etc.)
- Drag and drop pieces onto the board
- Clear horizontal or vertical lines (full rows/columns)
- No time limit in endless mode (except tournaments)

### 2. Merge Mechanic (The Innovation)
When you clear lines:
1. Cleared blocks drop **colored gems** (random colors: red, blue, green, yellow, purple, orange)
2. **2+ gems of same color touching → merge** into larger gem
3. Larger gems = **score multipliers**:
   - Small (2 gems): 1x
   - Medium (3 gems): 2x
   - Large (4 gems): 3x
   - Mega (5+ gems): 5x
4. Next line clear gets multiplier bonus
5. Creates **risk/reward**: clear now or wait for bigger merge?

### 3. Power-Ups (Loadout System)
Players pick **2 power-ups** before starting a match:

| Power-Up | Effect | Uses |
|----------|--------|------|
| 🔄 Reroll | Swap one piece for different shape | 1 |
| 💣 Blast | Clear 3x3 area | 1 |
| ⏱️ Freeze | Pause timer (tournament mode) | 1 |
| 🎯 Target | AI suggests best placement | 1 |
| 🌈 Color Bomb | Clear all blocks of one color | 1 |

Unlock more power-ups by reaching higher ranks.

### 4. Daily Tournaments
- **Same 3 starting pieces** for all players globally
- **5-minute rounds**, best score wins
- See friends' scores update in real-time
- Prizes: gems (virtual currency), cosmetic unlocks, leaderboard rank

### 5. Progression System
**Ranked Ladder:**
- Bronze → Silver → Gold → Platinum → Diamond
- Seasonal resets (3 months)
- Unlock cosmetics at each rank

**Battle Pass:**
- Free tier + Premium ($4.99/season)
- 30 levels of rewards
- Cosmetics, power-ups, exclusive themes

---

## 📝 TypeScript Guidelines

<typescript>
  **Strict Mode:** Enabled in tsconfig.json

  **Explicit Type Annotations:**
  ```typescript
  // ✅ Correct
  const [board, setBoard] = useState<GameBoard>([]);
  const [score, setScore] = useState<number>(0);

  // ❌ Wrong
  const [board, setBoard] = useState([]);
  const [score, setScore] = useState(0);
  ```

  **Path Alias:**
  Use `@/*` instead of relative imports
  ```typescript
  // ✅ Correct
  import { GameBoard } from '@/lib/types/game';
  import { cn } from '@/lib/cn';

  // ❌ Avoid
  import { GameBoard } from '../../lib/types/game';
  ```

  **Game State Types:**
  All game types defined in `@/lib/types/game.ts`:
  - `GameBoard`, `CellState`, `BlockShape`, `GamePiece`
  - `Gem`, `PowerUp`, `GameState`, `TournamentRound`
</typescript>

---

## 🎨 Styling & Design

<styling>
  **Framework:** NativeWind ~4.1.23 + Tailwind CSS 3.4.17

  **Use `cn()` Helper:**
  ```tsx
  import { cn } from '@/lib/cn';

  <View className={cn(
    'p-4 rounded-lg',
    isActive && 'bg-purple-500',
    className
  )} />
  ```

  **Teen-Friendly Aesthetic:**
  - **Bold, vibrant colors** (neon purple, electric blue, hot pink)
  - **Dark mode default** (black background, neon accents)
  - **High contrast** for visibility
  - **Smooth animations** (block placement, gem merges, combos)
  - **Modern fonts** (avoid overused fonts like Space Grotesk)

  **Color Palette:**
  - Background: Black (#000000), Dark gray (#0a0a0a)
  - Primary: Purple (#a855f7), Blue (#3b82f6)
  - Accents: Pink (#ec4899), Orange (#f97316)
  - Gems: Red, Blue, Green, Yellow, Purple, Orange (vibrant shades)
</styling>

---

## 🎯 Development Phases

### Phase 1 - MVP (Core Game) ✨
**Goal:** Playable solo endless mode with basic mechanics

**Tasks:**
1. ✅ Set up project structure
2. ⏳ Implement game board (8x8 grid, cell rendering)
3. ⏳ Create block piece shapes (5-7 different shapes)
4. ⏳ Drag-and-drop placement mechanic
5. ⏳ Line clearing logic (horizontal + vertical)
6. ⏳ Basic scoring system
7. ⏳ Game over detection (no valid moves)
8. ⏳ Local high score tracking

**Deliverable:** Playable game with core block puzzle mechanics

---

### Phase 2 - Merge Mechanic & Polish
**Goal:** Add the differentiating merge system

**Tasks:**
1. Gem drop system (cleared blocks → gems)
2. Merge detection (2+ same color)
3. Score multipliers (2x, 3x, 5x)
4. Visual effects (gem animations, combo text)
5. UI polish (score display, piece preview)

**Deliverable:** Full merge mechanic working with visual feedback

---

### Phase 3 - Competitive Layer
**Goal:** Daily tournaments and multiplayer features

**Tasks:**
1. Firebase setup (authentication, database, storage)
2. Daily tournament algorithm (seeded piece generation)
3. 5-minute timed mode
4. Real-time leaderboard
5. Ghost replay system

**Deliverable:** Competitive multiplayer experience

---

### Phase 4 - Monetization & Social
**Goal:** Revenue streams and viral features

**Tasks:**
1. Rewarded ads (AdMob integration)
2. Cosmetic shop (board themes, block skins)
3. Battle pass system
4. Power-up system (5 power-ups)
5. Squad/clan system
6. TikTok share integration

**Deliverable:** Monetized, social game ready for launch

---

## 🔧 Development Workflows

<workflows>
  **Package Manager: NPM**
  **IMPORTANT:** Always use `--legacy-peer-deps` flag

  ```bash
  # Install dependencies
  npm install --legacy-peer-deps

  # Install new package
  npm install --legacy-peer-deps <package-name>

  # Start dev server
  npm start

  # Type checking
  npm run typecheck

  # Linting
  npm run lint
  ```

  **Hot Reload:**
  - Code changes trigger automatic reload
  - Check `expo.log` for errors

  **Testing on Device:**
  - Use Expo Go app for testing
  - Or build dev client with EAS Build
</workflows>

---

## 🚫 Forbidden Files (DO NOT EDIT)

<forbidden_files>
  - `patches/` directory (package patches)
  - `babel.config.js`
  - `metro.config.js`
  - `app.json`
  - `tsconfig.json`
  - `nativewind-env.d.ts`
</forbidden_files>

---

## 💡 Key Principles

1. **Mobile-First:** Design for thumb zones, one-handed play
2. **Teen Appeal:** Vibrant, modern aesthetic (not childish, not adult)
3. **Competitive:** Everything should feel like a competition or challenge
4. **Social:** Enable sharing, bragging, and friend comparisons
5. **Fair-to-Play:** Can compete without paying
6. **TypeScript Strict:** All types must be explicit
7. **Performance:** 60fps animations, smooth drag-and-drop
8. **Viral Mechanics:** TikTok-friendly moments (epic combos, record replays)

---

## 🎯 Target Audience

**Age:** 10-15 years old (Gen Z)
**Motivations:**
- Compete with friends
- Show off skills on social media
- Collect cosmetics and badges
- Daily habit (tournament times)
- Status symbols (ranks, exclusive skins)

**Marketing Angle:**
"Block Blast is for relaxing. Block Merge Arena is for winning."

---

## 📖 Quick Command Reference

```bash
# Start development
npm start

# Install dependencies
npm install --legacy-peer-deps

# Install new package
npm install --legacy-peer-deps <package-name>

# Type checking
npm run typecheck

# Linting
npm run lint

# Check logs
cat expo.log
```

---

## 🚀 Getting Started Checklist

When starting a new task:

- [ ] Read the task requirements carefully
- [ ] Check existing game types in `@/lib/types/game.ts`
- [ ] Use TypeScript strict mode (explicit types)
- [ ] Test on actual device (not just simulator)
- [ ] Ensure 60fps performance for animations
- [ ] Consider teen aesthetic (vibrant, modern, competitive)
- [ ] Think about viral moments (TikTok-worthy)

---

**Remember:** You're building a competitive puzzle game for Gen Z. Make it vibrant, social, and addictive. 🎮✨
