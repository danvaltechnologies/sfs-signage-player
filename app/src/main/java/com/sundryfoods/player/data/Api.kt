package com.sundryfoods.player.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

// ------------------------------------------------------------------ payloads

@Serializable
data class PairResponse(
    val paired: Boolean = false,
    val id: String? = null,
    val code: String? = null,
    val brandId: String? = null,
    val type: String? = null,
    val location: String? = null,
    val city: String? = null,
)

@Serializable
data class Slide(
    val label: String = "",
    val url: String? = null,
    /** "IMAGE" or "VIDEO". */
    val kind: String = "IMAGE",
    /** Seconds on screen; null means a video plays to its end. */
    val duration: Int? = null,
    /** Hex SHA-256, when the server has finished computing it. Null skips verification. */
    val sha256: String? = null,
)

@Serializable
data class HeartbeatResult(
    val ok: Boolean = false,
    val resyncRequested: Boolean = false,
    /** False once the console has unpaired this screen (e.g. its PIN was regenerated). */
    val paired: Boolean = true,
)

@Serializable
data class Campaign(val id: String = "", val name: String = "")

@Serializable
data class Ticker(val title: String = "", val body: String = "")

@Serializable
data class Playback(
    val campaign: Campaign? = null,
    val slides: List<Slide> = emptyList(),
    val ticker: Ticker? = null,
)

@Serializable
data class UpdateManifest(
    val versionCode: Int = 0,
    val versionName: String = "",
    val apkUrl: String = "",
    val sha256: String? = null,
    val mandatory: Boolean = false,
    val notes: String? = null,
)

@Serializable
data class QueueTicket(
    val ticket: String = "",
    val stage: String = "PLACED",
    val customer: String? = null,
    val waitingMinutes: Int? = null,
)

@Serializable
data class QueueBoard(
    val tickets: List<QueueTicket> = emptyList(),
    val averageWaitMinutes: Int? = null,
)

// ------------------------------------------------------------------ client

/**
 * Every call the box makes to the console. All player endpoints are open
 * (no console session) and identify the device by its screen code.
 */
class Api(private val baseUrlProvider: () -> String) {

    private val json = Json { ignoreUnknownKeys = true; explicitNulls = false }

    private val http = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .callTimeout(120, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    val client: OkHttpClient get() = http

    /** Set when the console says this screen is no longer paired (HTTP 410, or heartbeat `paired:false`). */
    @Volatile var unpaired = false

    private fun url(path: String) = baseUrlProvider().trimEnd('/') + path

    private suspend fun get(path: String): String? = withContext(Dispatchers.IO) {
        runCatching {
            http.newCall(Request.Builder().url(url(path)).build()).execute().use { res ->
                if (res.code == 410) unpaired = true
                if (!res.isSuccessful) null else res.body?.string()
            }
        }.getOrNull()
    }

    private suspend fun post(path: String, body: String): String? = withContext(Dispatchers.IO) {
        runCatching {
            val request = Request.Builder()
                .url(url(path))
                .post(body.toRequestBody("application/json".toMediaType()))
                .build()
            http.newCall(request).execute().use { res ->
                if (res.code == 410) unpaired = true
                if (!res.isSuccessful) null else res.body?.string()
            }
        }.getOrNull()
    }

    /** Trades the PIN shown on the box for the screen's identity. */
    suspend fun pair(pin: String): PairResponse? =
        post("/screens/pair", """{"pairingCode":"${pin.trim()}"}""")
            ?.let { runCatching { json.decodeFromString<PairResponse>(it) }.getOrNull() }

    /**
     * Keeps the screen green on the console's health board. Returns whether
     * the console flagged this screen for a resync since the last beat, so
     * the caller can refetch the rotation immediately instead of waiting on
     * its own poll timer.
     */
    suspend fun heartbeat(code: String, playing: String?, firmware: String, status: String = "ONLINE"): HeartbeatResult? {
        val nowPlaying = playing?.replace("\"", "'")
        return post(
            "/screens/heartbeat",
            buildString {
                append("""{"code":"$code","firmware":"$firmware","status":"$status"""")
                if (nowPlaying != null) append(""","playing":"$nowPlaying"""")
                append("}")
            },
        )?.let { runCatching { json.decodeFromString<HeartbeatResult>(it) }.getOrNull() }
            ?.also { if (!it.paired) unpaired = true }
    }

    /** The approved, published campaign and announcement for this screen. */
    suspend fun playback(code: String): Playback? =
        get("/screens/$code/playback")
            ?.let { runCatching { json.decodeFromString<Playback>(it) }.getOrNull() }

    /** Counter board for queue screens. */
    suspend fun queueBoard(code: String): QueueBoard? =
        get("/public/queue/board/$code")
            ?.let { runCatching { json.decodeFromString<QueueBoard>(it) }.getOrNull() }

    /** Latest player release the fleet should be on. */
    suspend fun updateManifest(versionCode: Int): UpdateManifest? =
        get("/public/player/update?versionCode=$versionCode")
            ?.let { runCatching { json.decodeFromString<UpdateManifest>(it) }.getOrNull() }
            ?.takeIf { it.versionCode > 0 && it.apkUrl.isNotBlank() }
}
