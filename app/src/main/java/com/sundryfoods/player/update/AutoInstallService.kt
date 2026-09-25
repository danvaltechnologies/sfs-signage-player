package com.sundryfoods.player.update

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * On boxes that can't be device owner, Android still shows its "Install / Update"
 * confirmation for our self-updates. This taps that button so updates stay hands-off.
 * It only ever acts inside the system package-installer UI, and is switched on by the
 * provisioning script — it does nothing on a device where it hasn't been enabled.
 */
class AutoInstallService : AccessibilityService() {
    private val installerPackages = setOf(
        "com.android.packageinstaller",
        "com.google.android.packageinstaller",
    )
    private val labels = listOf("install", "update")

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event?.packageName?.toString() !in installerPackages) return
        val root = rootInActiveWindow ?: return
        val target = labels.firstNotNullOfOrNull { label -> findButton(root, label) } ?: return
        target.performAction(AccessibilityNodeInfo.ACTION_CLICK)
    }

    private fun findButton(node: AccessibilityNodeInfo, label: String): AccessibilityNodeInfo? {
        if (node.isClickable && node.isEnabled &&
            (node.text?.toString()?.trim()?.equals(label, ignoreCase = true) == true)
        ) return node
        for (i in 0 until node.childCount) {
            val hit = node.getChild(i)?.let { findButton(it, label) }
            if (hit != null) return hit
        }
        return null
    }

    override fun onInterrupt() = Unit
}
