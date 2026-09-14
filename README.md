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
| Playback        | Polls `GET /api/screens/:code/playback` every minute; images and video, in order     |
| Offline         | Every asset is cached on the box, so a dropped line keeps the last rotation playing  |
| Ticker          | The live approved announcement is overlaid across the bottom                         |
| Queue board     | Screens of type QMS show `GET /api/public/queue/board/:code`, refreshed every 5s     |
| Health          | Heartbeat every minute plus a background heartbeat every 15 minutes                  |
| Kiosk           | Full-screen, landscape, screen kept awake, restarts after a power cut, can be HOME   |
| Self-update     | Checks `GET /api/public/player/update` on launch, on boot and every 6 hours          |

## Build

Requires JDK 17 and the Android SDK (or Android Studio).

The Gradle wrapper binary is not committed; generate it once with a local Gradle
8.7 (`gradle wrapper`) or just open the folder in Android Studio, which does it
for you.

```bash
cd player
# point the build at your console
./gradlew assembleRelease -PapiBaseUrl=https://console.sundryfoods.com
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

1. Bump `playerVersionCode` and `playerVersionName` in `app/build.gradle.kts`.
2. Build and sign the APK, then upload it somewhere the boxes can reach over
   https (Azure Blob Storage with public read works well).
3. Tell the console about it:

```bash
curl -X POST https://console.sundryfoods.com/api/player/releases \
  -H "authorization: Bearer <console token>" \
  -H "content-type: application/json" \
  -d '{"versionCode":2,"versionName":"1.1.0",
       "apkUrl":"https://cdn.sundryfoods.com/player/1.1.0.apk",
       "sha256":"<sha256sum of the apk>","notes":"Faster video start"}'
```

Every box picks it up within six hours, or immediately on its next restart. The
checksum is verified before anything is installed, and a mismatch is refused.

Publishing a release is recorded in the console's audit log.
