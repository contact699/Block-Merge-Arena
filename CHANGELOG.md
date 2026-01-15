# Changelog

All notable changes to Block Merge Arena will be documented in this file.

## [1.0.0] - 2026-01-15 - Initial Release 🎉

### 🎮 Core Gameplay
- 8x8 game grid with Tetris-style block pieces
- Tap-to-place mechanic for intuitive controls
- Horizontal and vertical line clearing
- Game over detection when no valid moves remain
- Solo endless mode with local high score tracking

### 💎 Merge System
- Colored gem drops when blocks are cleared
- Gem merging mechanics (2+ same color combine)
- Score multiplier system (2x, 3x, 5x for merged gems)
- Combo animations and visual effects

### 🏆 Daily Tournaments
- Same pieces for all players (seeded by date)
- 5-minute tournament rounds with timer
- Global real-time leaderboard
- Tournament ranking with live updates

### ⚡ Power-Ups
- Power-up loadout system (pick 2 before match)
- Reroll: Swap current piece for different shape
- Blast: Clear 3x3 area around tap
- Freeze: Pause timer in tournament mode

### 🔥 Firebase Backend
- Firebase SDK integration
- Anonymous authentication
- Firestore database for users and scores
- Real-time global leaderboard sync

### 👻 Replay System
- Replay recording during gameplay
- 6-character shareable replay codes
- Ghost visualization playback engine
- ReplayPlayer component with controls

### 🛒 Shop & Economy
- Virtual currency system (gems and coins)
- Cosmetic shop with themes and skins
- Purchase system with virtual currency
- Coin rewards integrated into gameplay

### ⚙️ Settings
- Audio controls (music, sound effects)
- Display preferences
- Account settings
- Haptic feedback toggle

### 🏅 Achievements
- 20+ achievements with gem rewards
- Achievement tracking during gameplay
- Achievement badges and progress display

### 📚 Tutorial
- Interactive onboarding for new players
- Step-by-step gameplay tutorials
- Tips and hints system

### 📊 Ranked System
- Ranked ladder: Bronze → Silver → Gold → Platinum → Diamond → Master → Grandmaster
- Rank points from tournament performance
- Seasonal reset mechanics
- Rank rewards and badges

### 🎫 Battle Pass
- 30-level seasonal battle pass
- Free tier with basic rewards
- Premium tier ($4.99) with exclusive items
- XP from gameplay and daily challenges

### 🛡️ Squad System
- Create and join 10-person squads
- Squad tags (2-4 characters)
- Public and private squad options
- Leader/Co-Leader/Member roles
- Squad leaderboards
- Activity feed for squad events

### 👥 Friends System
- 8-character unique friend codes
- Friend requests and management
- Friend challenges (beat their score)
- Share replays with friends
- Friend leaderboard
- Favorite friends (pin to top)
- Block user functionality

### 📱 Social Sharing
- TikTok integration with deep linking
- Instagram Stories support
- Twitter/X share with hashtags
- Facebook sharing
- Auto-capture epic moments (3+ combos)
- Generated captions and hashtags
- Share stats tracking

---

## Development Timeline

- **Jan 5, 2026**: Project setup, core game engine
- **Jan 6, 2026**: Merge mechanics, power-ups, Firebase integration
- **Jan 7, 2026**: Replay system, shop, settings
- **Jan 8, 2026**: Achievements, tutorials, ranked system
- **Jan 14, 2026**: Battle pass, squad system
- **Jan 15, 2026**: Friends, TikTok integration, final polish

---

## Tech Stack

- Expo SDK 53.0.22
- React Native 0.79.6
- TypeScript 5.8.3 (strict mode)
- NativeWind 4.1.23 (Tailwind CSS)
- Firebase (Auth, Firestore)
- React Native Reanimated
- React Native Gesture Handler

---

**Block Merge Arena v1.0.0 - Ready for Launch! 🚀**
