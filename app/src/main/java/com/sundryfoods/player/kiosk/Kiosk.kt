package com.sundryfoods.player.kiosk

import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import android.provider.Settings
import android.util.Log
import com.sundryfoods.player.MainActivity

/**
 * True kiosk mode, only when this app is the device owner (provisioned once on a
 * factory-reset box with `dpm set-device-owner`). On any other device — a phone,
 * an unprovisioned box — every function here is a no-op, so nothing gets locked.
 */
object Kiosk {
    private const val TAG = "SundryKiosk"

    private fun dpm(c: Context) = c.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    private fun admin(c: Context) = ComponentName(c, SundryDeviceAdmin::class.java)

    fun isOwner(c: Context) = dpm(c).isDeviceOwnerApp(c.packageName)

    /** Locks the screen to the player. Safe to call on every launch. */
    fun enter(activity: Activity) {
        if (!isOwner(activity)) return
        val d = dpm(activity)
        val a = admin(activity)
        runCatching {
            d.setLockTaskPackages(a, arrayOf(activity.packageName))
            // Stay awake on power, no lock screen, and come back to us as Home after a crash.
            d.setGlobalSetting(a, Settings.Global.STAY_ON_WHILE_PLUGGED_IN,
                (BatteryManager.BATTERY_PLUGGED_AC or BatteryManager.BATTERY_PLUGGED_USB or BatteryManager.BATTERY_PLUGGED_WIRELESS).toString())
            d.setKeyguardDisabled(a, true)
            d.addPersistentPreferredActivity(
                a,
                IntentFilter(Intent.ACTION_MAIN).apply {
                    addCategory(Intent.CATEGORY_HOME)
                    addCategory(Intent.CATEGORY_DEFAULT)
                },
                ComponentName(activity, MainActivity::class.java),
            )
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                d.setLockTaskFeatures(a, DevicePolicyManager.LOCK_TASK_FEATURE_NONE)
            }
            activity.startLockTask()
        }.onFailure { Log.w(TAG, "Couldn't enter kiosk", it) }
    }

    /** Technician escape hatch — lasts until the app is next launched. */
    fun exit(activity: Activity) {
        runCatching { activity.stopLockTask() }
    }
}
