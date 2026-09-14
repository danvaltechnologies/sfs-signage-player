package com.sundryfoods.player.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import coil.compose.AsyncImage
import com.sundryfoods.player.BuildConfig
import com.sundryfoods.player.PlayerApp
import com.sundryfoods.player.data.Playback
import com.sundryfoods.player.data.Slide
import kotlinx.coroutines.delay
import kotlinx.serialization.json.Json

private val Orange = Color(0xFFF05A22)
private const val DEFAULT_SLIDE_SECONDS = 10
private const val PLAYBACK_POLL_SECONDS = 60L
private const val HEARTBEAT_SECONDS = 60L

private val json = Json { ignoreUnknownKeys = true; explicitNulls = false }

/**
 * What the customer sees. Pulls the approved rotation from the console every
 * minute, caches each asset on the box, and rotates images and video with the
 * live announcement ticker across the bottom. If the line drops it keeps
 * playing the last rotation it cached.
 */
@Composable
fun PlaybackScreen(onUnpair: () -> Unit) {
    val app = PlayerApp.instance
    val code = app.prefs.screenCode ?: return
    val isQueueScreen = app.prefs.screenType?.contains("QUEUE", ignoreCase = true) == true

    var playback by remember {
        mutableStateOf(
            app.prefs.cachedPlayback
                ?.let { runCatching { json.decodeFromString<Playback>(it) }.getOrNull() }
                ?: Playback(),
        )
    }
    var index by remember { mutableStateOf(0) }
    var online by remember { mutableStateOf(true) }
    var localPaths by remember { mutableStateOf<Map<String, String>>(emptyMap()) }

    // Shared by the poll loop below and the heartbeat loop's resync signal,
    // so a console-requested resync can trigger the same refresh early
    // instead of duplicating this logic in two places.
    suspend fun refreshPlayback() {
        val next = app.api.playback(code)
        if (next != null) {
            online = true
            playback = next
            app.prefs.cachedPlayback = runCatching { json.encodeToString(Playback.serializer(), next) }.getOrNull()
            val slidesByUrl = next.slides.mapNotNull { s -> s.url?.let { it to s } }.toMap()
            val resolved = slidesByUrl.mapValues { (url, slide) -> app.mediaCache.ensure(url, slide.sha256) }
            localPaths = resolved
            app.mediaCache.prune(slidesByUrl.keys.toList())
        } else {
            online = false
        }
    }

    // Fetch the rotation, then cache every asset for offline playback.
    LaunchedEffect(code) {
        while (true) {
            refreshPlayback()
            delay(PLAYBACK_POLL_SECONDS * 1000)
        }
    }

    // Heartbeat with what is actually on screen. A resync requested from the
    // console rides back on this response — refetch right away rather than
    // waiting up to another 60s for the playback loop's own turn.
    LaunchedEffect(code, index, playback) {
        while (true) {
            val nowPlaying = playback.campaign?.name ?: playback.slides.getOrNull(index)?.label
            val result = app.api.heartbeat(code, nowPlaying, BuildConfig.VERSION_NAME)
            if (result?.resyncRequested == true) refreshPlayback()
            delay(HEARTBEAT_SECONDS * 1000)
        }
    }

    val slides = playback.slides.filter { !it.url.isNullOrBlank() }
    val slide = slides.getOrNull(index.coerceAtMost((slides.size - 1).coerceAtLeast(0)))

    // Advance images on their configured duration; video advances when it ends.
    LaunchedEffect(index, slides.size, slide?.url) {
        if (slides.isEmpty()) return@LaunchedEffect
        val current = slide ?: return@LaunchedEffect
        if (current.kind.equals("VIDEO", true) && current.duration == null) return@LaunchedEffect
        delay(((current.duration ?: DEFAULT_SLIDE_SECONDS).coerceAtLeast(3)) * 1000L)
        index = (index + 1) % slides.size
    }

    Box(Modifier.fillMaxSize().background(Color.Black), contentAlignment = Alignment.Center) {
        when {
            isQueueScreen -> QueueBoardScreen(code)
            slide == null -> IdleCard(app.prefs.screenLabel, code, online, onUnpair)
            slide.kind.equals("VIDEO", true) -> VideoSlide(
                source = localPaths[slide.url] ?: slide.url!!,
                onEnded = { if (slides.size > 1) index = (index + 1) % slides.size },
            )
            else -> AsyncImage(
                model = localPaths[slide.url] ?: slide.url,
                contentDescription = slide.label,
                contentScale = ContentScale.Fit,
                modifier = Modifier.fillMaxSize(),
            )
        }

        playback.ticker?.let { ticker ->
            Column(
                Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .background(Orange)
                    .padding(horizontal = 28.dp, vertical = 14.dp),
            ) {
                Text(ticker.title, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.SemiBold)
                if (ticker.body.isNotBlank()) {
                    Text(ticker.body, color = Color(0xFFFFE7DE), fontSize = 17.sp)
                }
            }
        }

        if (!online) {
            Text(
                "Offline — playing the last approved rotation",
                color = Color(0x99FFFFFF),
                fontSize = 12.sp,
                modifier = Modifier.align(Alignment.TopEnd).padding(12.dp),
            )
        }
    }
}

@Composable
private fun VideoSlide(source: String, onEnded: () -> Unit) {
    val context = LocalContext.current
    val exo = remember { ExoPlayer.Builder(context).build() }

    DisposableEffect(source) {
        exo.setMediaItem(MediaItem.fromUri(source))
        exo.repeatMode = Player.REPEAT_MODE_OFF
        exo.playWhenReady = true
        exo.volume = 0f
        exo.prepare()
        val listener = object : Player.Listener {
            override fun onPlaybackStateChanged(state: Int) {
                if (state == Player.STATE_ENDED) onEnded()
            }
        }
        exo.addListener(listener)
        onDispose {
            exo.removeListener(listener)
            exo.release()
        }
    }

    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = {
            PlayerView(it).apply {
                useController = false
                player = exo
            }
        },
    )
}

@Composable
private fun IdleCard(label: String?, code: String, online: Boolean, onUnpair: () -> Unit) {
    Column(
        Modifier.fillMaxSize().background(Color(0xFF14161A)).padding(48.dp),
        verticalArrangement = androidx.compose.foundation.layout.Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("Sundry Foods", color = Orange, fontSize = 30.sp, fontWeight = FontWeight.Bold)
        Text(
            "Waiting for an approved campaign",
            color = Color(0xFF9AA1AC),
            fontSize = 17.sp,
            modifier = Modifier.padding(top = 10.dp),
        )
        Text(
            listOfNotNull(label?.takeIf { it.isNotBlank() }, code).joinToString(" · "),
            color = Color(0xFF5A626E),
            fontSize = 14.sp,
            modifier = Modifier.padding(top = 24.dp),
        )
        Text(
            if (online) "Connected to the console" else "Offline — retrying",
            color = Color(0xFF5A626E),
            fontSize = 12.sp,
            modifier = Modifier.padding(top = 6.dp),
        )
        androidx.compose.material3.TextButton(onClick = onUnpair, modifier = Modifier.padding(top = 24.dp)) {
            Text("Re-pair this screen", color = Color(0xFF7C8593), fontSize = 13.sp)
        }
    }
}
