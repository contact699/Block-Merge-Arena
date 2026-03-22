# Maestro E2E Testing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up Maestro E2E testing for Block Merge Arena on Android with functional test coverage across all 16 screens.

**Architecture:** Add `testID` props to interactive elements across all screens, then create Maestro YAML flow files organized by feature area. Each flow navigates to a screen, verifies elements, and interacts with key features.

**Tech Stack:** Maestro CLI, YAML flow definitions, Android Emulator, Expo dev build with `com.blockmergearena.app` package ID.

---

### Task 1: Add testIDs to Home Screen (index.tsx)

**Files:**
- Modify: `src/app/index.tsx`

**Step 1: Add testID props to all navigation buttons and key elements**

In `src/app/index.tsx`, add these testID props:

- Line 37 `<SafeAreaView>`: add `testID="home-screen"`
- Line 41 Settings `<Pressable>`: add `testID="settings-button"`
- Line 65 Tournament `<Pressable>`: add `testID="tournament-button"`
- Line 85 Endless `<Pressable>`: add `testID="endless-mode-button"`
- Line 97 Leaderboard `<Pressable>`: add `testID="leaderboard-button"`
- Line 107 Replays `<Pressable>`: add `testID="replays-button"`
- Line 117 Shop `<Pressable>`: add `testID="shop-button"`
- Line 126 Achievements `<Pressable>`: add `testID="achievements-button"`
- Line 136 Tutorials `<Pressable>`: add `testID="tutorials-button"`
- Line 146 Ranks `<Pressable>`: add `testID="ranks-button"`
- Line 156 Battle Pass `<Pressable>`: add `testID="battlepass-button"`
- Line 166 Squads `<Pressable>`: add `testID="squads-button"`
- Line 176 Friends `<Pressable>`: add `testID="friends-button"`
- Line 187 Share `<Pressable>`: add `testID="share-button"`

**Step 2: Verify no TypeScript errors**

Run: `cd C:/Users/computer/Block-Merge-Arena && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/app/index.tsx
git commit -m "test: add testIDs to home screen for Maestro E2E"
```

---

### Task 2: Add testIDs to Game Screen (game.tsx) and GameBoard Component

**Files:**
- Modify: `src/app/game.tsx`
- Modify: `src/components/GameBoard.tsx`

**Step 1: Add testIDs to game.tsx**

- Line 254 `<SafeAreaView>`: add `testID="game-screen"`
- Line 287-296 Game Over `<View>` (the one with "Game Over!"): add `testID="game-over-banner"`
- Line 308 `<GameBoard>`: add `testID="game-board"`
- Line 365-373 New Game `<Pressable>`: add `testID="new-game-button"`

**Step 2: Add testIDs to GameBoard.tsx cells**

In `src/components/GameBoard.tsx`, add `testID={`cell-${rowIndex}-${colIndex}`}` to each `<Pressable>` at line 74.

**Step 3: Verify no TypeScript errors**

Run: `cd C:/Users/computer/Block-Merge-Arena && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 4: Commit**

```bash
git add src/app/game.tsx src/components/GameBoard.tsx
git commit -m "test: add testIDs to game screen and board component"
```

---

### Task 3: Add testIDs to Tournament Screen

**Files:**
- Modify: `src/app/tournament.tsx`

**Step 1: Add testIDs**

- Line 433 `<SafeAreaView>`: add `testID="tournament-screen"`
- Line 460 Back `<Pressable>`: add `testID="back-button"`
- Line 473 View Standings `<Pressable>`: add `testID="view-standings-button"`
- Line 830-838 Start Tournament `<Pressable>`: add `testID="start-tournament-button"`

**Step 2: Commit**

```bash
git add src/app/tournament.tsx
git commit -m "test: add testIDs to tournament screen"
```

---

### Task 4: Add testIDs to Shop, Settings, Leaderboard Screens

**Files:**
- Modify: `src/app/shop.tsx`
- Modify: `src/app/settings.tsx`
- Modify: `src/app/leaderboard.tsx`

**Step 1: Shop testIDs**

- Line 284 `<SafeAreaView>`: add `testID="shop-screen"`
- Line 287 Back `<Pressable>`: add `testID="back-button"`
- Line 316-329 Themes tab `<Pressable>`: add `testID="themes-tab"`
- Line 331-345 Blocks tab `<Pressable>`: add `testID="blocks-tab"`
- Line 347-359 Gems tab `<Pressable>`: add `testID="gems-tab"`

**Step 2: Settings testIDs**

- Line 89 `<SafeAreaView>`: add `testID="settings-screen"`
- Line 93 Back `<Pressable>`: add `testID="back-button"`
- Line 107 Display Name `<TextInput>`: add `testID="display-name-input"`
- Line 307 Save `<Pressable>`: add `testID="save-button"`
- Line 312 Reset `<Pressable>`: add `testID="reset-button"`

**Step 3: Leaderboard testIDs**

- Line 87 `<SafeAreaView>`: add `testID="leaderboard-screen"`
- Line 91 Back `<Pressable>`: add `testID="back-button"`
- Line 175 All Time tab: add `testID="all-time-tab"`
- Line 188 Endless tab: add `testID="endless-tab"`
- Line 200 Tournament tab: add `testID="tournament-tab"`
- Line 212 Recent tab: add `testID="recent-tab"`

**Step 4: Commit**

```bash
git add src/app/shop.tsx src/app/settings.tsx src/app/leaderboard.tsx
git commit -m "test: add testIDs to shop, settings, leaderboard screens"
```

---

### Task 5: Add testIDs to Social Screens (Friends, Squads, Share)

**Files:**
- Modify: `src/app/friends.tsx`
- Modify: `src/app/squads.tsx`
- Modify: `src/app/share.tsx`

**Step 1: Friends testIDs**

- Main `<SafeAreaView>`: add `testID="friends-screen"`
- Back button: add `testID="back-button"`
- Add friend button (the ➕): add `testID="add-friend-button"`
- Friend code input: add `testID="friend-code-input"`
- Send Request button: add `testID="send-request-button"`
- Tab buttons: add `testID="friends-tab"`, `testID="requests-tab"`, `testID="challenges-tab"`, `testID="activity-tab"`

**Step 2: Squads testIDs**

- Main `<SafeAreaView>`: add `testID="squads-screen"`
- Back button: add `testID="back-button"`
- Tab buttons: `testID="my-squad-tab"`, `testID="discover-tab"`, `testID="squad-leaderboard-tab"`, `testID="invites-tab"`
- Create squad form name input: `testID="squad-name-input"`
- Create squad button: `testID="create-squad-button"`

**Step 3: Share testIDs**

- Main `<SafeAreaView>`: add `testID="share-screen"`
- Back button: add `testID="back-button"`

**Step 4: Commit**

```bash
git add src/app/friends.tsx src/app/squads.tsx src/app/share.tsx
git commit -m "test: add testIDs to friends, squads, share screens"
```

---

### Task 6: Add testIDs to Remaining Screens

**Files:**
- Modify: `src/app/achievements.tsx`
- Modify: `src/app/tutorials.tsx`
- Modify: `src/app/ranks.tsx`
- Modify: `src/app/battlepass.tsx`
- Modify: `src/app/replays.tsx`
- Modify: `src/app/welcome.tsx`

**Step 1: Achievements testIDs**

- Main SafeAreaView: `testID="achievements-screen"`
- Back button: `testID="back-button"`

**Step 2: Tutorials testIDs**

- Main SafeAreaView: `testID="tutorials-screen"`
- Back button: `testID="back-button"`

**Step 3: Ranks testIDs**

- Main SafeAreaView: `testID="ranks-screen"`
- Back button: `testID="back-button"`
- Show All Ranks button: `testID="show-all-ranks-button"`

**Step 4: Battle Pass testIDs**

- Main SafeAreaView: `testID="battlepass-screen"`
- Back button: `testID="back-button"`

**Step 5: Replays testIDs**

- Main SafeAreaView: `testID="replays-screen"`
- Back button: `testID="back-button"`
- Enter Code button/modal: `testID="enter-code-button"`

**Step 6: Welcome testIDs**

- Main SafeAreaView: `testID="welcome-screen"`
- Let's Play button: `testID="lets-play-button"`

**Step 7: Commit**

```bash
git add src/app/achievements.tsx src/app/tutorials.tsx src/app/ranks.tsx src/app/battlepass.tsx src/app/replays.tsx src/app/welcome.tsx
git commit -m "test: add testIDs to achievements, tutorials, ranks, battlepass, replays, welcome"
```

---

### Task 7: Create Maestro Config and Home Navigation Flow

**Files:**
- Create: `.maestro/config.yaml`
- Create: `.maestro/flows/navigation/home-navigation.yaml`

**Step 1: Create `.maestro/config.yaml`**

```yaml
# Maestro E2E Test Configuration
# Block Merge Arena - Android
appId: com.blockmergearena.app
name: Block Merge Arena E2E Tests
```

**Step 2: Create `.maestro/flows/navigation/home-navigation.yaml`**

```yaml
appId: com.blockmergearena.app
name: Home Screen Navigation
---
# Launch app
- launchApp

# Wait for home screen to load (may redirect from welcome)
- extendedWaitUntil:
    visible:
      text: "Block Merge"
    timeout: 10000

# Verify home screen elements
- assertVisible:
    id: "home-screen"
- assertVisible:
    text: "Block Merge"
- assertVisible:
    text: "Arena"

# Test navigation to each screen and back

# 1. Settings
- tapOn:
    id: "settings-button"
- assertVisible:
    id: "settings-screen"
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"

# 2. Endless Mode
- tapOn:
    id: "endless-mode-button"
- assertVisible:
    id: "game-screen"
- back
- assertVisible:
    id: "home-screen"

# 3. Tournament
- tapOn:
    id: "tournament-button"
- assertVisible:
    id: "tournament-screen"
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"

# 4. Leaderboard
- tapOn:
    id: "leaderboard-button"
- assertVisible:
    id: "leaderboard-screen"
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"

# 5. Replays
- tapOn:
    id: "replays-button"
- assertVisible:
    id: "replays-screen"
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"

# 6. Shop
- tapOn:
    id: "shop-button"
- assertVisible:
    id: "shop-screen"
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"

# 7. Achievements
- tapOn:
    id: "achievements-button"
- assertVisible:
    id: "achievements-screen"
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"

# 8. Tutorials
- tapOn:
    id: "tutorials-button"
- assertVisible:
    id: "tutorials-screen"
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"

# 9. Ranks
- scroll down
- tapOn:
    id: "ranks-button"
- assertVisible:
    id: "ranks-screen"
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"

# 10. Battle Pass
- scroll down
- tapOn:
    id: "battlepass-button"
- assertVisible:
    id: "battlepass-screen"
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"

# 11. Squads
- scroll down
- tapOn:
    id: "squads-button"
- assertVisible:
    id: "squads-screen"
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"

# 12. Friends
- scroll down
- tapOn:
    id: "friends-button"
- assertVisible:
    id: "friends-screen"
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"

# 13. Share
- scroll down
- tapOn:
    id: "share-button"
- assertVisible:
    id: "share-screen"
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"
```

**Step 3: Commit**

```bash
git add .maestro/
git commit -m "test: add Maestro config and home navigation flow"
```

---

### Task 8: Create Gameplay Flows (Endless + Tournament)

**Files:**
- Create: `.maestro/flows/gameplay/endless-mode.yaml`
- Create: `.maestro/flows/gameplay/tournament.yaml`

**Step 1: Create endless-mode flow**

```yaml
appId: com.blockmergearena.app
name: Endless Mode Gameplay
---
- launchApp

- extendedWaitUntil:
    visible:
      text: "Block Merge"
    timeout: 10000

# Navigate to game
- tapOn:
    id: "endless-mode-button"
- assertVisible:
    id: "game-screen"

# Verify game board and UI elements
- assertVisible:
    id: "game-board"
- assertVisible:
    text: "Block Merge Arena"

# Verify instruction text
- assertVisible:
    text: "Select a piece below, then tap the board to place it"

# Tap on first piece to select it
- tapOn:
    id: "cell-0-0"

# Try placing on board (tap several cells to attempt a valid placement)
- tapOn:
    id: "cell-1-1"
- tapOn:
    id: "cell-2-2"
- tapOn:
    id: "cell-3-3"

# Verify game is still running (score display visible)
- assertVisible:
    text: "Block Merge Arena"

# Go back to home
- back
- assertVisible:
    id: "home-screen"
```

**Step 2: Create tournament flow**

```yaml
appId: com.blockmergearena.app
name: Tournament Mode
---
- launchApp

- extendedWaitUntil:
    visible:
      text: "Block Merge"
    timeout: 10000

# Navigate to tournament
- tapOn:
    id: "tournament-button"
- assertVisible:
    id: "tournament-screen"

# Verify tournament info is displayed
- assertVisible:
    text: "← Back"

# Verify start button
- assertVisible:
    id: "start-tournament-button"
- assertVisible:
    text: "Start Tournament"

# Start the tournament
- tapOn:
    id: "start-tournament-button"

# Wait for game board to appear
- extendedWaitUntil:
    visible:
      id: "game-board"
    timeout: 5000

# Verify game board and instruction
- assertVisible:
    id: "game-board"
- assertVisible:
    text: "Select a piece below, then tap the board to place it"

# Play briefly - tap some cells
- tapOn:
    id: "cell-0-0"
- tapOn:
    id: "cell-2-2"

# Go back (ends tournament)
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"
```

**Step 3: Commit**

```bash
git add .maestro/flows/gameplay/
git commit -m "test: add Maestro flows for endless and tournament modes"
```

---

### Task 9: Create Social Feature Flows

**Files:**
- Create: `.maestro/flows/social/friends.yaml`
- Create: `.maestro/flows/social/squads.yaml`
- Create: `.maestro/flows/social/share.yaml`

**Step 1: Create friends flow**

```yaml
appId: com.blockmergearena.app
name: Friends Screen
---
- launchApp

- extendedWaitUntil:
    visible:
      text: "Block Merge"
    timeout: 10000

# Navigate to friends
- scroll down
- tapOn:
    id: "friends-button"
- assertVisible:
    id: "friends-screen"

# Verify friend code is displayed
- assertVisible:
    text: "Your Friend Code"

# Test tabs
- tapOn:
    text: "📬 Requests"
- assertVisible:
    text: "No Pending Requests"

- tapOn:
    text: "⚔️ Challenges"
- assertVisible:
    text: "No Challenges"

- tapOn:
    text: "📊 Activity"
- assertVisible:
    text: "No Activity"

# Test add friend modal
- tapOn:
    text: "👥 Friends"
- tapOn:
    id: "add-friend-button"
- assertVisible:
    text: "Add Friend"
- assertVisible:
    text: "Friend Code"

# Close modal
- tapOn:
    text: "✕"

# Go back
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"
```

**Step 2: Create squads flow**

```yaml
appId: com.blockmergearena.app
name: Squads Screen
---
- launchApp

- extendedWaitUntil:
    visible:
      text: "Block Merge"
    timeout: 10000

# Navigate to squads
- scroll down
- tapOn:
    id: "squads-button"
- assertVisible:
    id: "squads-screen"

# Test tabs
- tapOn:
    id: "discover-tab"
- tapOn:
    id: "squad-leaderboard-tab"
- tapOn:
    id: "invites-tab"
- tapOn:
    id: "my-squad-tab"

# Go back
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"
```

**Step 3: Create share flow**

```yaml
appId: com.blockmergearena.app
name: Share Screen
---
- launchApp

- extendedWaitUntil:
    visible:
      text: "Block Merge"
    timeout: 10000

# Navigate to share
- scroll down
- tapOn:
    id: "share-button"
- assertVisible:
    id: "share-screen"

# Verify share screen content
- assertVisible:
    text: "Share & TikTok"

# Go back
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"
```

**Step 4: Commit**

```bash
git add .maestro/flows/social/
git commit -m "test: add Maestro flows for friends, squads, share screens"
```

---

### Task 10: Create Progression Feature Flows

**Files:**
- Create: `.maestro/flows/progression/achievements.yaml`
- Create: `.maestro/flows/progression/battlepass.yaml`
- Create: `.maestro/flows/progression/ranks.yaml`

**Step 1: Create achievements flow**

```yaml
appId: com.blockmergearena.app
name: Achievements Screen
---
- launchApp

- extendedWaitUntil:
    visible:
      text: "Block Merge"
    timeout: 10000

# Navigate to achievements
- tapOn:
    id: "achievements-button"
- assertVisible:
    id: "achievements-screen"

# Verify achievements UI
- assertVisible:
    text: "← Back"

# Go back
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"
```

**Step 2: Create battlepass flow**

```yaml
appId: com.blockmergearena.app
name: Battle Pass Screen
---
- launchApp

- extendedWaitUntil:
    visible:
      text: "Block Merge"
    timeout: 10000

# Navigate to battle pass
- scroll down
- tapOn:
    id: "battlepass-button"
- assertVisible:
    id: "battlepass-screen"

# Verify battle pass UI
- assertVisible:
    text: "← Back"

# Go back
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"
```

**Step 3: Create ranks flow**

```yaml
appId: com.blockmergearena.app
name: Ranks Screen
---
- launchApp

- extendedWaitUntil:
    visible:
      text: "Block Merge"
    timeout: 10000

# Navigate to ranks
- scroll down
- tapOn:
    id: "ranks-button"
- assertVisible:
    id: "ranks-screen"

# Verify rank info is shown
- assertVisible:
    text: "← Back"

# Toggle show all ranks
- tapOn:
    id: "show-all-ranks-button"

# Go back
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"
```

**Step 4: Commit**

```bash
git add .maestro/flows/progression/
git commit -m "test: add Maestro flows for achievements, battlepass, ranks"
```

---

### Task 11: Create Economy and Utility Flows

**Files:**
- Create: `.maestro/flows/economy/shop.yaml`
- Create: `.maestro/flows/economy/replays.yaml`
- Create: `.maestro/flows/settings/settings.yaml`
- Create: `.maestro/flows/settings/tutorials.yaml`

**Step 1: Create shop flow**

```yaml
appId: com.blockmergearena.app
name: Shop Screen
---
- launchApp

- extendedWaitUntil:
    visible:
      text: "Block Merge"
    timeout: 10000

# Navigate to shop
- tapOn:
    id: "shop-button"
- assertVisible:
    id: "shop-screen"

# Verify shop header
- assertVisible:
    text: "Shop"
- assertVisible:
    text: "Customize your experience"

# Test tab switching
- tapOn:
    id: "themes-tab"
- assertVisible:
    text: "Themes"

- tapOn:
    id: "blocks-tab"
- assertVisible:
    text: "Blocks"

- tapOn:
    id: "gems-tab"
- assertVisible:
    text: "Gems"

# Switch back to themes
- tapOn:
    id: "themes-tab"

# Go back
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"
```

**Step 2: Create replays flow**

```yaml
appId: com.blockmergearena.app
name: Replays Screen
---
- launchApp

- extendedWaitUntil:
    visible:
      text: "Block Merge"
    timeout: 10000

# Navigate to replays
- tapOn:
    id: "replays-button"
- assertVisible:
    id: "replays-screen"

# Verify replays header
- assertVisible:
    text: "← Back"

# Go back
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"
```

**Step 3: Create settings flow**

```yaml
appId: com.blockmergearena.app
name: Settings Screen
---
- launchApp

- extendedWaitUntil:
    visible:
      text: "Block Merge"
    timeout: 10000

# Navigate to settings
- tapOn:
    id: "settings-button"
- assertVisible:
    id: "settings-screen"

# Verify settings sections
- assertVisible:
    text: "Profile"
- assertVisible:
    text: "Audio"
- assertVisible:
    text: "Display Name"

# Edit display name
- tapOn:
    id: "display-name-input"
- eraseText:
    charactersToErase: 30
- inputText: "TestPlayer"

# Scroll to see more settings
- scroll down
- assertVisible:
    text: "Haptics"
- assertVisible:
    text: "Gameplay"

# Scroll to save button
- scroll down
- assertVisible:
    id: "save-button"
- assertVisible:
    id: "reset-button"

# Verify app version
- assertVisible:
    text: "Block Merge Arena v1.0.0"

# Go back
- scroll up
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"
```

**Step 4: Create tutorials flow**

```yaml
appId: com.blockmergearena.app
name: Tutorials Screen
---
- launchApp

- extendedWaitUntil:
    visible:
      text: "Block Merge"
    timeout: 10000

# Navigate to tutorials
- tapOn:
    id: "tutorials-button"
- assertVisible:
    id: "tutorials-screen"

# Verify tutorials header
- assertVisible:
    text: "← Back"

# Go back
- tapOn:
    id: "back-button"
- assertVisible:
    id: "home-screen"
```

**Step 5: Commit**

```bash
git add .maestro/flows/economy/ .maestro/flows/settings/
git commit -m "test: add Maestro flows for shop, replays, settings, tutorials"
```

---

### Task 12: Create Run Script, npm Scripts, and .gitignore Update

**Files:**
- Create: `.maestro/scripts/run-all.sh`
- Modify: `package.json`

**Step 1: Create run-all.sh script**

```bash
#!/bin/bash
# Run all Maestro E2E tests for Block Merge Arena
# Usage: ./run-all.sh [--platform android|ios]

set -e

PLATFORM="${1:-android}"
FLOWS_DIR="$(dirname "$0")/../flows"

echo "=== Block Merge Arena E2E Tests ==="
echo "Platform: $PLATFORM"
echo ""

# Run all flows
maestro test "$FLOWS_DIR" --format junit --output ".maestro/reports/results.xml"

echo ""
echo "=== All tests complete ==="
```

**Step 2: Add npm scripts to package.json**

Add these scripts:
```json
"e2e": "maestro test .maestro/flows",
"e2e:navigation": "maestro test .maestro/flows/navigation",
"e2e:gameplay": "maestro test .maestro/flows/gameplay",
"e2e:social": "maestro test .maestro/flows/social",
"e2e:progression": "maestro test .maestro/flows/progression",
"e2e:economy": "maestro test .maestro/flows/economy",
"e2e:settings": "maestro test .maestro/flows/settings"
```

**Step 3: Add reports directory to .gitignore**

Append `.maestro/reports/` to `.gitignore`.

**Step 4: Commit**

```bash
git add .maestro/scripts/ package.json .gitignore
git commit -m "test: add Maestro run scripts and npm e2e commands"
```

---

### Task 13: Handle Welcome Screen Bypass for Tests

**Files:**
- Create: `.maestro/flows/onboarding/welcome.yaml`
- Modify: `.maestro/flows/navigation/home-navigation.yaml` (add welcome bypass)

**Step 1: Create welcome onboarding flow**

```yaml
appId: com.blockmergearena.app
name: Welcome Onboarding
---
- launchApp

# On first launch, welcome screen appears
- extendedWaitUntil:
    visible:
      id: "welcome-screen"
    timeout: 10000

# Verify welcome content
- assertVisible:
    text: "Block Merge"
- assertVisible:
    text: "Arena"
- assertVisible:
    text: "Strategic Gameplay"
- assertVisible:
    text: "Merge for Multipliers"
- assertVisible:
    text: "Daily Tournaments"

# Complete tutorial by tapping through steps
- tapOn:
    text: "Next"
- tapOn:
    text: "Next"
- tapOn:
    text: "Next"
- tapOn:
    text: "Next"

# If rewards modal appears, finish
- extendedWaitUntil:
    visible:
      text: "Welcome Complete!"
    timeout: 5000
- tapOn:
    id: "lets-play-button"

# Should be on home screen now
- assertVisible:
    id: "home-screen"
```

**Step 2: Commit**

```bash
git add .maestro/flows/onboarding/
git commit -m "test: add Maestro welcome onboarding flow"
```

---

### Task 14: Final Verification

**Step 1: Verify all Maestro flow files exist**

Run: `find .maestro -name "*.yaml" | sort`

Expected output:
```
.maestro/config.yaml
.maestro/flows/economy/replays.yaml
.maestro/flows/economy/shop.yaml
.maestro/flows/gameplay/endless-mode.yaml
.maestro/flows/gameplay/tournament.yaml
.maestro/flows/navigation/home-navigation.yaml
.maestro/flows/onboarding/welcome.yaml
.maestro/flows/progression/achievements.yaml
.maestro/flows/progression/battlepass.yaml
.maestro/flows/progression/ranks.yaml
.maestro/flows/settings/settings.yaml
.maestro/flows/settings/tutorials.yaml
.maestro/flows/social/friends.yaml
.maestro/flows/social/share.yaml
.maestro/flows/social/squads.yaml
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Dry-run validation (if Maestro is installed)**

Run: `maestro test .maestro/flows --dry-run 2>&1 || echo "Maestro not installed - install with: curl -Ls 'https://get.maestro.mobile.dev' | bash"`
