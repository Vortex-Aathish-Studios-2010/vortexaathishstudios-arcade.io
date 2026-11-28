# Arcade.io Mini Games

The Android game by Vortex Aathish Studios. The published application ID is
`com.vortexaathishatudios.arcadeio` — keep this exact spelling for Play Store updates.
The Java namespace is separate and remains `com.vortexaathishstudios.arcadeio`.

## Play and develop

- Dark launcher with phone, tablet and desktop layouts, original Play Store icon and illustrated game covers.
- A larger matte interface, editable username and ten illustrated avatars, plus a daily play streak.
- Shell Game starts with three slow swaps; each win advances a level, a miss drops one level, and points remain saved.
- 16 solo games with local scores. Android includes game assets for offline play from installation; the web edition caches them after its first complete load.
- Online rooms for all 16 games, plus Four in a Row. Chess, Tic Tac Toe and Four in a Row share a server-validated board; Snake shares a server-authoritative arena, Gravity Run shows both players on the same course, and the other games use timed score challenges with readiness, a shared countdown, live scores and one attempt per player.
- Gravity Flip increases speed and narrows passable gaps with score. Snake uses smooth canvas animation, keyboard, swipe and touch controls. Konoodle supports measured touch dragging, rotate/flip, valid-drop previews and undo.
- Chess uses chess.js rules and the bundled Stockfish 19 lite engine, set to 2000 Elo with a 1.2-second move budget. This is an engine setting, not a measured rating. Local two-player chess rotates toward the next player.
- An animated loading screen credits Founder Aathish Kannayil Ajesh and Co-founder Aagney Kannayil Aajehs.
- Rankings refresh every two seconds. Offline solo points sync when a named player reconnects; room wins earn 20 points and draws earn 5.

Use Node.js 22.13 or later (the local backend uses `node:sqlite`).

```sh
npm ci
npm run dev
```

Vite serves the game and local room API together. Local data is stored in ignored
`.arcade-local/game.sqlite`. Production API source is in `server/`, with schema in
`migrations/` for a Cloudflare D1 binding named `DB`. Apply migrations in order; the avatar and room migrations preserve existing players and scores.

```sh
npm test
npm run test:rooms
npx tsc --noEmit -p tsconfig.app.json
npm run build
```

## Public browser preview

After `npm run build`, run `python3 scripts/build-preview.py` to regenerate the
self-contained GitHub Pages edition in `preview/`. It includes all solo games,
profiles, live rankings and two-player rooms. Solo games cache for offline use
after the first load. Online features use the hosted API with the GitHub Pages
origin explicitly allowed by the server. Offline points remain visible and retry
sync when connected. A username is required to appear in public rankings.

Reloading an active score challenge submits its saved attempt; it does not grant a new attempt. Scores are submitted by clients for casual play and are not an anti-cheat or rated competition system. Chess and other shared-board moves are validated on the server.

Stockfish binaries, GPL-3.0 license, corresponding source archive and provenance are in `public/engine/`. The engine runs in a worker and is cached for offline play.

## Device orientation and offline play

The Android APK embeds all 16 solo games, images, synthesized audio, fonts and the chess engine. It needs no initial internet connection or sign-in for solo play. Scores, settings and progress stay on the device and sync when connected. First launch can continue into solo play offline; reserving or changing a globally unique username requires internet. Online rooms and live rankings need a connection.

Phones use portrait menus and board games; Snake, Konoodle and Gravity Flip switch to landscape while playing. Returning to the menu restores portrait. Tablets keep system rotation and adapt between portrait and landscape; laptop windows use the wide keyboard-and-mouse layout. Resizing does not remount the current game. Android may override requested rotation in multi-window mode; responsive layouts remain available.

## Android preview

Install JDK 21+, the Android SDK and build tools, then:

```sh
npm run android:sync
cd android
./gradlew assembleDebug
```

The debug app is **Arcade.io Preview**, package
`com.vortexaathishatudios.arcadeio.preview`. It can coexist with the installed
Play Store app. It is not a Play Store update.

## Play Store update

`npm run android:release` checks package identity and public Android API access,
builds and embeds the web assets, then produces an upload-signed Android App Bundle.
Set these environment variables securely in the build environment:

| Variable | Value |
| --- | --- |
| `ARCADE_VERSION_CODE` | An unused integer higher than **all** version codes already uploaded to Play Console |
| `ARCADE_VERSION_NAME` | Display version; defaults to `2.0.0` |
| `ARCADE_UPLOAD_KEYSTORE` | Absolute path to this app's existing Play upload keystore |
| `ARCADE_UPLOAD_KEY_ALIAS` | Existing upload key alias |
| `ARCADE_UPLOAD_STORE_PASSWORD` | Keystore password |
| `ARCADE_UPLOAD_KEY_PASSWORD` | Key password |
| `VITE_ARCADE_API_URL` | Public HTTPS origin of the game API |

Do not commit signing keys or passwords. `VITE_` values are public app configuration,
so never put a secret in them. `npm run android:release -- --check` only checks prerequisites.
The current hosted API is `https://vortex-arcade-minigames.ajuponnu2009.chatgpt.site`.

The output is `android/app/build/outputs/bundle/release/app-release.aab`.
Upload it to the existing app's internal testing track first. Verify an upgrade
from the currently published version, airplane-mode gameplay, touch controls,
rotation, and rooms between two devices before production rollout.

Public rankings store the chosen display name, scores and an anonymous player
identifier; room state is also stored. Update the store's privacy/data-safety
answers to match this online functionality. The previous “No data collected”
declaration does not describe the new online features.

See [release notes](release-notes/en-US.txt) for the player-facing update text.

## Live games and player names

Snake uses a 48 × 30 shared arena with wall wrapping, safe bomb spawning, separate food growth, and authoritative body/bomb collisions. Gravity Run shares a course and streams both players' positions and gravity flips. Clients render with requestAnimationFrame and bounded prediction; HTTP input/snapshot requests run about every 100 ms without overlapping. Network latency and device performance still affect play. A 10-second missed heartbeat ends the live round. Quick-match pairs waiting players for the selected game; room codes remain available.

Names are 3–15 ASCII letters, numbers or underscores, case-insensitive. Availability is advisory; the database's unique index decides the reservation atomically. Migration 0004 preserves existing scores and reserves valid legacy names for their original anonymous identity. Profiles are tied to this device's saved identity, not a password account; clearing app data loses that identity and local progress.
