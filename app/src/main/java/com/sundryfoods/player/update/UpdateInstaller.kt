package com.sundryfoods.player.update

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.net.Uri
import android.os.Build
import android.util.Log
import androidx.core.content.FileProvider
import com.sundryfoods.player.BuildConfig
import com.sundryfoods.player.PlayerApp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.Request
import java.io.File
import java.security.MessageDigest

/**
 * Self-update. The box asks the console for the latest release, downloads the APK
 * when its versionCode is newer, verifies the checksum and installs it in place.
 *
 * On a box provisioned as device owner (or any build where the app holds
 * INSTALL_PACKAGES) the PackageInstaller session completes silently and the
 * player relaunches itself. Otherwise Android shows the one-tap installer
 * prompt, which a technician can accept once during setup.
 */
object UpdateInstaller {

    private const val TAG = "SundryUpdate"

    suspend fun checkAndInstall(context: Context): String = withContext(Dispatchers.IO) {
        val app = PlayerApp.instance
        val manifest = app.api.updateManifest(BuildConfig.VERSION_CODE)
            ?: return@withContext "No update feed available"
        if (manifest.versionCode <= BuildConfig.VERSION_CODE) return@withContext "Up to date"

        val dir = File(context.filesDir, "updates").apply { mkdirs() }
        val apk = File(dir, "sundry-player-${manifest.versionCode}.apk")
        if (!apk.exists() || apk.length() == 0L) {
            val ok = runCatching {
                app.api.client.newCall(Request.Builder().url(manifest.apkUrl).build()).execute().use { res ->
                    if (!res.isSuccessful) return@runCatching false
                    apk.outputStream().use { out -> res.body?.byteStream()?.copyTo(out) }
                    true
                }
            }.getOrDefault(false)
            if (!ok) {
                apk.delete()
                return@withContext "Download failed"
            }
        }

        val expected = manifest.sha256?.lowercase()
        if (!expected.isNullOrBlank() && sha256(apk) != expected) {
            apk.delete()
            return@withContext "Checksum mismatch — update refused"
        }

        // Keep only the build we are installing.
        dir.listFiles()?.forEach { if (it != apk) it.delete() }

        val installed = runCatching { installSilently(context, apk) }.getOrDefault(false)
        if (!installed) promptInstall(context, apk)
        "Installing ${manifest.versionName}"
    }

    private fun sha256(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { input ->
            val buffer = ByteArray(1 shl 16)
            while (true) {
                val read = input.read(buffer)
                if (read <= 0) break
                digest.update(buffer, 0, read)
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }

    private fun installSilently(context: Context, apk: File): Boolean {
        val installer = context.packageManager.packageInstaller
        val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL)
        val sessionId = installer.createSession(params)
        installer.openSession(sessionId).use { session ->
            session.openWrite("player", 0, apk.length()).use { out ->
                apk.inputStream().use { it.copyTo(out) }
                session.fsync(out)
            }
            val intent = Intent(context, InstallResultReceiver::class.java)
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            session.commit(PendingIntent.getBroadcast(context, sessionId, intent, flags).intentSender)
        }
        Log.i(TAG, "Install session $sessionId committed")
        return true
    }

    private fun promptInstall(context: Context, apk: File) {
        val uri: Uri = FileProvider.getUriForFile(context, "${context.packageName}.files", apk)
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        runCatching { context.startActivity(intent) }
    }
}
