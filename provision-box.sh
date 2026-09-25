#!/usr/bin/env bash
# Provision one signage box over the network. Usage: ./provision-box.sh <box-ip> [apk]
# Needs: adb on PATH, the box on the same Wi-Fi with USB/network debugging on.
# Works on boxes that can't be device owner (no android.software.device_admin) by
# installing the player as its own installer-of-record (silent self-updates on
# Android 12+), making it the Home app, and keeping the screen awake.
set -euo pipefail
IP="${1:?box ip}"; APK="${2:-sundry-player.apk}"; P=com.sundryfoods.player.debug
[ -f "$APK" ] || curl -sL -o "$APK" https://tinyurl.com/sundryplayer
adb connect "$IP:5555" >/dev/null
D=(-s "$IP:5555")
adb "${D[@]}" root >/dev/null 2>&1 || true; sleep 2; adb connect "$IP:5555" >/dev/null
adb "${D[@]}" install -r -i "$P" "$APK"
# Disable the stock TV launchers so the player is the only Home app. The Home preference is
# wiped on every self-update, but with nothing else to pick, boot and Home always land on us.
for L in com.google.android.tvlauncher com.google.android.leanbacklauncher com.android.launcher3; do
  adb "${D[@]}" shell pm disable-user --user 0 "$L" >/dev/null 2>&1 || true
done
adb "${D[@]}" shell cmd package set-home-activity "$P/com.sundryfoods.player.MainActivity" || true
adb "${D[@]}" shell "settings put global stay_on_while_plugged_in 7; settings put system screen_off_timeout 2147483647; settings put secure screensaver_enabled 0; svc power stayon true" || true
# Let the player tap the system "Install" prompt for its own updates (no device owner needed).
adb "${D[@]}" shell "settings put secure enabled_accessibility_services $P/com.sundryfoods.player.update.AutoInstallService; settings put secure accessibility_enabled 1" || true
adb "${D[@]}" shell am start -n "$P/com.sundryfoods.player.MainActivity" >/dev/null
echo "Provisioned $IP — pair it with a PIN from the console."
