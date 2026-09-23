package com.sundryfoods.player.data

import android.content.Context
import android.net.Uri
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.security.MessageDigest

/**
 * Keeps every slide on local storage so a store with a flaky line keeps playing
 * the last approved rotation instead of a black screen.
 */
class MediaCache(context: Context, private val http: OkHttpClient) {

    private val dir = File(context.filesDir, "media").apply { mkdirs() }

    private fun fileFor(url: String) = File(dir, url.hashCode().toString().replace("-", "0") + extensionOf(url))

    private fun extensionOf(url: String): String {
        val clean = url.substringBefore('?').substringAfterLast('/')
        val dot = clean.lastIndexOf('.')
        return if (dot in 1..clean.length - 2) clean.substring(dot) else ""
    }

    /** Local path if the asset is already on the box, otherwise null. A proper
     * file:// URI, not a bare filesystem path — ExoPlayer's scheme-based
     * source resolution shouldn't have to guess. */
    fun localPath(url: String): String? =
        fileFor(url).takeIf { it.exists() && it.length() > 0 }?.let { Uri.fromFile(it).toString() }

    /**
     * Downloads anything missing; returns the path to play (local, else the
     * URL). When the manifest supplies [expectedSha256], a freshly
     * downloaded file is verified before it's trusted — a mismatch deletes
     * it and falls back to the URL rather than playing a corrupt or wrong
     * download. A file that was already cached (e.g. before this check
     * existed) is trusted as-is, same as before.
     */
    suspend fun ensure(url: String, expectedSha256: String? = null): String = withContext(Dispatchers.IO) {
        localPath(url)?.let { return@withContext it }
        val target = fileFor(url)
        val temp = File(target.absolutePath + ".part")
        runCatching {
            http.newCall(Request.Builder().url(url).build()).execute().use { res ->
                if (!res.isSuccessful) return@withContext url
                temp.outputStream().use { out -> res.body?.byteStream()?.copyTo(out) }
            }
            if (!expectedSha256.isNullOrBlank() && !sha256(temp).equals(expectedSha256, ignoreCase = true)) {
                Log.w(TAG, "Hash mismatch for $url — discarding download")
                temp.delete()
                return@withContext url
            }
            temp.renameTo(target)
        }
        localPath(url) ?: url
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

    /** Drops assets that are no longer in the rotation. */
    fun prune(keep: List<String>) {
        val wanted = keep.map { fileFor(it).name }.toSet()
        dir.listFiles()?.forEach { if (it.name !in wanted) it.delete() }
    }

    companion object {
        private const val TAG = "SundryMediaCache"
    }
}
