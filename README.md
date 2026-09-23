# Sundry Foods Player (Android)

The app that runs on the Android box behind each screen. It pairs once with the
signage console, then plays only what a line manager has approved and published,
keeps the console's health board green, shows the live announcement ticker, runs
the counter queue board on QMS screens, and **updates itself** when a new build
is published.

## What it does

| Behaviour       | Detail                                                                              |
| --------------- | ----------------------------------------------------------------------------------- |
| Pairing         | Technician types the PIN the console shows for that screen; the box stores its code  |
| Playback        | Polls `GET /screens/:code/playback` every minute; images and video, in order         |
| Offline         | Every asset is cached on the box, so a dropped line keeps the last rotation playing  |
| Ticker          | The live approved announcement is overlaid across the bottom                         |
| Queue board     | Screens of type QMS show `GET /public/queue/board/:code`, refreshed every 5s         |
| Health          | Heartbeat every 60s, carrying an immediate resync if the console requested one       |
| Kiosk           | Full-screen, landscape, screen kept awake, restarts after a power cut, can be HOME   |
| Self-update     | Checks `GET /public/player/update` on launch, on boot and every 6 hours              |

Note: the API paths above have no `/api` prefix — that's how the deployed backend
(`https://api.areafiftysix.com`) actually serves them. `Api.kt` matches this.

## Build

Requires JDK 17 and the Android SDK (or Android Studio).

The Gradle wrapper binary is not committed; generate it once with a local Gradle
8.7 (`gradle wrapper`) or just open the folder in Android Studio, which does it
for you.

```bash
cd player
# Defaults to the real, permanent backend (api.areafiftysix.com) — override
# only for a different environment, e.g. a local dev API:
./gradlew assembleRelease -PapiBaseUrl=http://10.0.0.5:3000
# APK: app/build/outputs/apk/release/app-release.apk
```

Release signing reads `player/keystore.properties` (git-ignored):

```
storeFile=sundry-player.jks
storePassword=...
keyAlias=player
keyPassword=...
```

**Use the same keystore for every release.** Android only installs an update
over an existing app when both are signed with the same key.

## Installing on a box

1. Sideload the APK once (`adb install -r app-release.apk`, or a USB stick).
2. Open the app, confirm the console address and type the pairing PIN from
   Screens → the screen → pairing.
3. Optional but recommended: set the player as the home app so it comes back by
   itself after a power cut, and allow "install unknown apps" for it once so
   updates apply without a prompt.

For a fully unattended fleet, provision the box with the player as **device
owner**:

```bash
adb shell dpm set-device-owner com.sundryfoods.player/.update.BootReceiver
```

Device-owner boxes install their own updates silently. Anything else shows a
single one-tap confirmation.

## Releasing an update

This is automatic on every push to `main` — CI in `.github/workflows/build-player.yml`
builds the debug APK, publishes it to this repo's `latest-debug` GitHub Release (a
permanent, public URL since this repo is public), then registers it with the
backend so every paired box picks it up on its next check — within six hours, or
immediately on its next restart. The checksum is verified before anything is
installed; a mismatch is refused.

The one thing that has to be set up once, by hand, is the account CI registers
releases as:

1. In the console, add a user dedicated to this — e.g. `ci-releases@sundryfoods.com`
   — with **only the "screens" module**, no others. It doesn't need real-name
   access to anything else; if this credential ever leaked, "publish a player
   release" is all it could do.
2. Complete that account's invite (console sends a set-password email) so it has
   a real password.
3. In this repo's GitHub Actions secrets, add `PLAYER_RELEASE_API_EMAIL` and
   `PLAYER_RELEASE_API_PASSWORD` for that account.

Until those secrets exist, the register-with-console step in CI just skips —
the build itself still succeeds, it just doesn't reach any box automatically,
same as before this was wired up.

To bump the version for a release, edit `playerVersionCode` and
`playerVersionName` at the top of `app/build.gradle.kts` — CI reads both
straight from there.

To do it by hand instead (e.g. a release build, signed with the real keystore
rather than CI's debug one):

```bash
curl -X POST https://api.areafiftysix.com/player/releases \
  -H "authorization: Bearer <console token>" \
  -H "content-type: application/json" \
  -d '{"versionCode":5,"versionName":"1.2.0",
       "apkUrl":"https://cdn.example.com/player/1.2.0.apk",
       "sha256":"<sha256sum of the apk>","notes":"Faster video start"}'
```

Publishing a release is recorded in the console's audit log.
