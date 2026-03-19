# ARCADE.IO — Replit Migration & Improvement Log

## Project Overview
ARCADE.IO is a multi-game web application featuring two arcades:
- **Brain Arcade** — Puzzle & strategy games (Memory Match, Sliding Puzzle, Tetris, Sudoku, Konoodle, Word Search, Snake, Tic-Tac-Toe)
- **Entertainment Arcade** — Sports & action games (Chess, Archery, Penalty Kick, Basketball, Racing, Tennis, Cricket, Obstacle Race, Hide & Seek)

## Tech Stack
- **Frontend**: React + TypeScript + Vite (port 5000)
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **Backend/DB**: Supabase (leaderboard, multiplayer realtime)
- **Routing**: React Router v6

## Environment Variables Required
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key

## Key Architecture

### Entry Point
- `src/main.tsx` → `src/App.tsx`
- App flow: SplashScreen → DeviceSelector → Home (arcade selection) → GamePage / EntertainmentGamePage

### Game Data
- `src/lib/gameData.tsx` — Brain arcade games list (GameInfo)
- `src/lib/entertainmentData.tsx` — Entertainment arcade games list (EntertainmentGameInfo)

### Pages
- `src/pages/Index.tsx` — Home/hub with arcade selector
- `src/pages/GamePage.tsx` — Wrapper for brain games (full-screen layout)
- `src/pages/EntertainmentGamePage.tsx` — Wrapper for entertainment games (full-screen layout, no boxing)
- `src/pages/LeaderboardPage.tsx` — World leaderboard with delete & name-uniqueness check
- `src/pages/EntertainmentPage.tsx` — Entertainment arcade lobby

### Supabase Client
- `src/integrations/supabase/client.ts` — Resilient client with placeholder fallback when env vars missing

## Changes Made (Replit Migration + Improvements)

### Migration
1. Fixed `vite.config.ts` — removed lovable-tagger, set port 5000, `server.allowedHosts: true`
2. Fixed CSS `@import` order (before @tailwind directives)
3. Supabase client made resilient — warns gracefully when secrets missing

### UI / UX Improvements
1. **Cinematic Splash Screen** — Two-phase sequence:
   - Phase 1 (3.2s): ARCADE.IO big with starfield, letterbox reveal, text glow
   - Phase 2 (4.2s): Founder + Co-founder photo placeholders + pulsing "THE KANNAYIL BROTHERS"
2. **Bigger game card icons** — Icons fill the card top section (w-20 h-20 container, icon fills it)
3. **Full-screen game layouts** — GamePage & EntertainmentGamePage use flex column to fill viewport height; no max-width constraint on game area
4. **Boxing removed** — Not in entertainmentData, not imported in EntertainmentGamePage

### Game Improvements
5. **Chess** — Added white/black color selection screen after choosing bot mode; board flips when playing as black
6. **Penalty Kick** — Complete rebuild: click LEFT/CENTER/RIGHT zones on goal; ball animates from spot to goal; keeper dives; night stadium with stadium lights
7. **Basketball** — Fixed drag origin (only near ball); ball follows proper parabola; goes through rim visually; +2 score flash; rim glow on score
8. **Racing** — Real SVG top-down car replaces emoji; obstacle SVG cars with colors; progressive speed; animated road with lane markings; exhaust trail on player car
9. **Archery** — Wind indicator (calm/light/moderate/strong) with deflection preview; arrow flight animation; point flash labels; bow animation
10. **Leaderboard** — Delete button on every entry (confirm → CONFIRM/CANCEL); "name already taken" validation on submit with error message

## Founders
- Founder: Aathish Kannayil Ajesh
- Co-Founder: Aagney Kannayil Ajesh
- AKA: The Kannayil Brothers

## Notes
- Photo placeholders are in SplashScreen.tsx — replace with actual photos when provided
- Supabase credentials needed for leaderboard & multiplayer to work
