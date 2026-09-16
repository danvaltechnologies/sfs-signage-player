package com.sundryfoods.player.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File

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

    /** Local path if the asset is already on the box, otherwise null. */
    fun localPath(url: String): String? = fileFor(url).takeIf { it.exists() && it.length() > 0 }?.absolutePath

    /** Downloads anything missing; returns the path to play (local, else the URL). */
    suspend fun ensure(url: String): String = withContext(Dispatchers.IO) {
        localPath(url)?.let { return@withContext it }
        val target = fileFor(url)
        val temp = File(target.absolutePath + ".part")
        runCatching {
            http.newCall(Request.Builder().url(url).build()).execute().use { res ->
                if (!res.isSuccessful) return@withContext url
                temp.outputStream().use { out -> res.body?.byteStream()?.copyTo(out) }
            }
            temp.renameTo(target)
        }
        localPath(url) ?: url
    }

    /** Drops assets that are no longer in the rotation. */
    fun prune(keep: List<String>) {
        val wanted = keep.map { fileFor(it).name }.toSet()
        dir.listFiles()?.forEach { if (it.name !in wanted) it.delete() }
    }
}
