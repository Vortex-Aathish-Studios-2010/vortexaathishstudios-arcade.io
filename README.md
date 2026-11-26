# Arcade.io Mini Games

The Android game by Vortex Aathish Studios. The published application ID is
`com.vortexaathishatudios.arcadeio` — keep this exact spelling for Play Store updates.
The Java namespace is separate and remains `com.vortexaathishstudios.arcadeio`.

## Play and develop

- Dark launcher with phone, tablet and desktop layouts, original Play Store icon and illustrated game covers.
- 16 solo games with local scores. Android includes game assets for offline play from installation; the web edition caches them after its first complete load.
- Online two-player Tic Tac Toe and Four in a Row rooms with six-character codes.
- Rankings refresh every two seconds. Offline solo points sync when a named player reconnects; room wins earn 20 points and draws earn 5.

Use Node.js 22.13 or later (the local backend uses `node:sqlite`).

```sh
npm ci
npm run dev
```

Vite serves the game and local room API together. Local data is stored in ignored
`.arcade-local/game.sqlite`. Production API source is in `server/`, with schema in
`migrations/0001_arcade.sql` for a Cloudflare D1 binding named `DB`.

```sh
npm test
npm run test:rooms
npx tsc --noEmit -p tsconfig.app.json
npm run build
```

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
