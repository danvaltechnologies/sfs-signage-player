package com.sundryfoods.player.ui

import android.util.Log
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
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
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
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import coil.compose.AsyncImage
import com.sundryfoods.player.BuildConfig
import com.sundryfoods.player.PlayerApp
import com.sundryfoods.player.data.Playback
import com.sundryfoods.player.data.Slide
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
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
            // key(source): without it, two VIDEO slides in a row (no image
            // between them, so this `when` branch is taken again rather than
            // leaving composition) are the SAME VideoSlide instance to
            // Compose — its remembered ExoPlayer is reused, not recreated.
            // DisposableEffect(source, loop) below releases that shared
            // player in onDispose the moment `source` changes, then the very
            // next effect run calls setMediaItem/prepare on that
            // already-released instance — an immediate crash the first time
            // any playlist ever had two consecutive videos, which nothing
            // had actually exercised until today. key() forces Compose to
            // treat each video as a genuinely new instance instead: fresh
            // remember, fresh ExoPlayer, every time.
            slide.kind.equals("VIDEO", true) -> key(localPaths[slide.url] ?: slide.url!!) {
                VideoSlide(
                    source = localPaths[slide.url] ?: slide.url!!,
                    // Exactly one thing may ever advance the slide: the fixed
                    // timer above when an admin-set duration caps this video,
                    // or natural end-of-playback when it doesn't. Firing both
                    // meant a video with a duration shorter than its real length
                    // got its ExoPlayer instance torn down mid-decode by the
                    // timer, then recreated for the next slide, then torn down
                    // again 15s later — recycling the hardware decoder that
                    // fast is a real crash risk, and matches exactly what took
                    // the whole app down during testing.
                    onEnded = { if (slides.size > 1 && slide.duration == null) index = (index + 1) % slides.size },
                    // With nothing else to rotate to, the only way to keep the
                    // screen alive is to replay this one; otherwise it plays
                    // once and freezes on its last frame.
                    loop = slides.size == 1,
                )
            }
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

private const val VIDEO_TAG = "SundryPlayback"

// A "full length" video (Slide.duration == null) has no fixed timer covering
// it — see the advance effect above, which deliberately skips scheduling one
// for that case so the timer and end-of-playback can't both fire on the same
// slide. That means end-of-playback (or the fallbacks below) is the ONLY
// thing that can ever move a full-length video along. A hard player error is
// covered by onPlayerError below, but the box also froze on a single frame
// with no error at all — a decoder or network stall that never reaches
// STATE_ENDED and never surfaces as PlaybackException either. A fixed-delay
// failsafe was tried first (10 minutes) and was worthless in practice: it's
// a blanket wait regardless of whether playback is actually stuck, so a
// frozen screen just sits frozen for up to 10 minutes before recovering.
// This instead watches the thing that actually defines a stall — playback
// position not moving while the player believes it's playing — and reacts
// in seconds, not minutes, without ever touching a video that's genuinely
// still playing (its position keeps advancing every check).
private const val STALL_POLL_MS = 3_000L
private const val STALL_THRESHOLD_MS = 15_000L // position stuck this long -> treat as stalled

@Composable
private fun VideoSlide(source: String, onEnded: () -> Unit, loop: Boolean) {
    val context = LocalContext.current
    val exo = remember { ExoPlayer.Builder(context).build() }
    val scope = rememberCoroutineScope()

    DisposableEffect(source, loop) {
        exo.setMediaItem(MediaItem.fromUri(source))
        exo.repeatMode = if (loop) Player.REPEAT_MODE_ONE else Player.REPEAT_MODE_OFF
        exo.playWhenReady = true
        exo.volume = 0f
        exo.prepare()
        val listener = object : Player.Listener {
            override fun onPlaybackStateChanged(state: Int) {
                if (state == Player.STATE_ENDED) onEnded()
            }
            override fun onPlayerError(error: PlaybackException) {
                Log.w(VIDEO_TAG, "Playback error on $source", error)
                // A short pause before reacting either way — an error that
                // fires this fast on every attempt (a codec/network issue
                // specific to this file or this box) would otherwise retry
                // or advance in a tight loop, tearing down and recreating a
                // hardware decoder as fast as the CPU allows. That's the
                // same crash risk the timer/onEnded double-advance already
                // caused once; an unthrottled error path is just another
                // route to it.
                scope.launch {
                    delay(4000)
                    if (loop) {
                        // Only one slide in the whole rotation — there's
                        // nowhere to advance to, so retry this same video.
                        exo.prepare()
                    } else {
                        onEnded()
                    }
                }
            }
        }
        exo.addListener(listener)
        onDispose {
            exo.removeListener(listener)
            exo.release()
        }
    }

    // Polls actual playback progress rather than trusting player state,
    // because the failure seen in the field was neither STATE_ENDED nor an
    // error — just a frame that stopped advancing. This catches that AND a
    // video that never gets past buffering in the first place: either way,
    // "position isn't moving forward while genuinely playing" is false for
    // STALL_THRESHOLD_MS straight, regardless of which of those it is.
    LaunchedEffect(source) {
        var lastPosition = -1L
        var stalledMs = 0L
        while (true) {
            delay(STALL_POLL_MS)
            val position = exo.currentPosition
            val progressing = exo.playbackState == Player.STATE_READY && exo.isPlaying && position > lastPosition
            stalledMs = if (progressing) 0L else stalledMs + STALL_POLL_MS
            lastPosition = position
            if (stalledMs >= STALL_THRESHOLD_MS) {
                Log.w(VIDEO_TAG, "No playback progress for ${stalledMs}ms on $source (state=${exo.playbackState}, position=${position}ms)")
                stalledMs = 0L
                if (loop) {
                    // Nowhere to advance to — nudge it back to the start
                    // rather than leaving a frozen frame up indefinitely.
                    exo.seekTo(0)
                    exo.playWhenReady = true
                } else {
                    onEnded()
                }
            }
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
