package com.sundryfoods.player.ui

import android.util.Log
import android.view.LayoutInflater
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
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import coil.compose.AsyncImage
import com.sundryfoods.player.BuildConfig
import com.sundryfoods.player.PlayerApp
import com.sundryfoods.player.R
import com.sundryfoods.player.data.Playback
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json

private val Orange = Color(0xFFF05A22)
private const val DEFAULT_SLIDE_SECONDS = 10
private const val PLAYBACK_POLL_SECONDS = 60L
private const val HEARTBEAT_SECONDS = 60L
private const val VIDEO_TAG = "SundryPlayback"

// A "full length" video (Slide.duration == null) has no fixed timer covering
// it — the advance effect below deliberately skips scheduling one for that
// case. End-of-playback, a player error, or the stall watchdog are the only
// things that can ever move it along.
private const val STALL_POLL_MS = 3_000L
private const val STALL_THRESHOLD_MS = 15_000L // position stuck this long -> treat as stalled
private const val ERROR_REACT_MS = 4_000L // throttle before reacting to a player error

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
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var playback by remember {
        mutableStateOf(
            app.prefs.cachedPlayback
                ?.let { runCatching { json.decodeFromString<Playback>(it) }.getOrNull() }
                ?: Playback(),
        )
    }
    var index by remember { mutableStateOf(0) }
    var online by remember { mutableStateOf(true) }
    // Seeded from what is already on disk so a cold start with no network (power cut,
    // Wi-Fi down) plays the cached files straight away instead of trying remote URLs.
    fun cachedPaths(p: Playback): Map<String, String> =
        p.slides.mapNotNull { s -> s.url?.let { u -> app.mediaCache.localPath(u)?.let { u to it } } }.toMap()
    var localPaths by remember { mutableStateOf(cachedPaths(playback)) }

    // Shared by the poll loop below and the heartbeat loop's resync signal,
    // so a console-requested resync can trigger the same refresh early
    // instead of duplicating this logic in two places.
    suspend fun refreshPlayback() {
        val next = app.api.playback(code)
        if (app.api.unpaired) {
            app.api.unpaired = false
            app.prefs.cachedPlayback = null
            onUnpair()
            return
        }
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
            localPaths = cachedPaths(playback)
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
            if (app.api.unpaired) {
                app.api.unpaired = false
                app.prefs.cachedPlayback = null
                onUnpair()
                return@LaunchedEffect
            }
            if (result?.resyncRequested == true) refreshPlayback()
            delay(HEARTBEAT_SECONDS * 1000)
        }
    }

    val slides = playback.slides.filter { !it.url.isNullOrBlank() }
    val slide = slides.getOrNull(index.coerceAtMost((slides.size - 1).coerceAtLeast(0)))
    val isVideo = slide != null && slide.kind.equals("VIDEO", true)
    val videoSource = if (isVideo) (localPaths[slide!!.url] ?: slide.url!!) else null
    val loopSingleVideo = slides.size == 1

    // Advance images on their configured duration; a full-length video has
    // no timer of its own (see the constant above).
    LaunchedEffect(index, slides.size, slide?.url) {
        if (slides.isEmpty()) return@LaunchedEffect
        val current = slide ?: return@LaunchedEffect
        if (current.kind.equals("VIDEO", true) && current.duration == null) return@LaunchedEffect
        delay(((current.duration ?: DEFAULT_SLIDE_SECONDS).coerceAtLeast(3)) * 1000L)
        index = (index + 1) % slides.size
    }

    // ---- One long-lived player for the whole time this screen is up -----
    //
    // This used to create a brand-new ExoPlayer + PlayerView — and so a
    // brand-new hardware Surface — for every single video slide. That fixed
    // one real crash (reusing an already-released player across two
    // consecutive video slides, from an earlier version), but introduced a
    // different one: tearing down one video's Surface and immediately
    // standing up a fresh one for the next races with the OS actually
    // finishing that teardown. Confirmed live: "works once, blank on the
    // next rotation, works again after minimizing and reopening the app —
    // repeat." The fix is to stop recreating the player and its surface at
    // all. One ExoPlayer, one PlayerView, for as long as this screen is up;
    // released only when the screen itself is (unpaired, or the app closes).
    val exo = remember { ExoPlayer.Builder(context).build() }
    DisposableEffect(Unit) {
        onDispose { exo.release() }
    }

    var playerView by remember { mutableStateOf<PlayerView?>(null) }
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                // A screen lock (phone) or a TV/monitor's own standby tears
                // down PlayerView's underlying Surface; it has to be
                // explicitly reattached on the way back — see Media3's own
                // Activity-integration guidance. Confirmed live: without
                // this, unlocking flashed one frame of whatever was already
                // composited, then stayed blank for good.
                Lifecycle.Event.ON_RESUME -> playerView?.onResume()
                Lifecycle.Event.ON_PAUSE -> playerView?.onPause()
                else -> {}
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    // The listener is added once, for the life of this screen, so it can't
    // close over `slide`/`slides` directly — those are plain locals
    // recomputed fresh every recomposition, and would be frozen at whatever
    // they were the one time this effect ran. rememberUpdatedState keeps it
    // reading the current values instead. (`index` itself is fine to write
    // directly — it's the actual MutableState, not a snapshot of one.)
    val currentSlide by rememberUpdatedState(slide)
    val currentSlideCount by rememberUpdatedState(slides.size)
    val currentLoop by rememberUpdatedState(loopSingleVideo)
    DisposableEffect(exo) {
        val listener = object : Player.Listener {
            override fun onPlaybackStateChanged(state: Int) {
                if (state != Player.STATE_ENDED) return
                val s = currentSlide
                if (s != null && s.kind.equals("VIDEO", true) && s.duration == null && currentSlideCount > 1) {
                    index = (index + 1) % currentSlideCount
                }
            }
            override fun onPlayerError(error: PlaybackException) {
                Log.w(VIDEO_TAG, "Playback error", error)
                // A short pause before reacting either way — an error that
                // fires this fast on every attempt (a codec/network issue
                // specific to this file or this box) would otherwise retry
                // or advance in a tight loop, tearing down and recreating a
                // hardware decoder as fast as the CPU allows — the same
                // crash risk the original timer/onEnded double-advance bug
                // caused, just reached by a different, unthrottled path.
                scope.launch {
                    delay(ERROR_REACT_MS)
                    if (currentLoop) {
                        exo.prepare()
                    } else if (currentSlideCount > 1) {
                        index = (index + 1) % currentSlideCount
                    }
                }
            }
        }
        exo.addListener(listener)
        onDispose { exo.removeListener(listener) }
    }

    // Loads whichever video is actually current. Keyed on `index` as well as
    // the resolved source — not source alone — because a playlist that
    // ping-pongs between one image and one video (exactly the test setup
    // that surfaced this) revisits the SAME source string every other turn;
    // keying only on that would mean this never reruns the second time
    // around, silently leaving the player wherever it was (already ended,
    // or mid-video) instead of actually restarting it. Source is still in
    // the key too, for the case that doesn't change `index`: a video's raw
    // remote URL silently swapping to its newly-cached local file a few
    // seconds after it starts (refreshPlayback() polls independently of
    // which slide is showing). Either way, the same long-lived player just
    // gets told to load something — there's no surface to tear down and
    // rebuild by doing that anymore.
    LaunchedEffect(index, videoSource, loopSingleVideo) {
        if (videoSource == null) {
            // Not this slide's turn — don't let it keep decoding/advancing
            // in the background where a stray STATE_ENDED could fire an
            // advance for a slide that isn't even showing.
            exo.pause()
            return@LaunchedEffect
        }
        exo.setMediaItem(MediaItem.fromUri(videoSource))
        exo.repeatMode = if (loopSingleVideo) Player.REPEAT_MODE_ONE else Player.REPEAT_MODE_OFF
        exo.playWhenReady = true
        exo.volume = 0f
        exo.prepare()
    }

    // Polls actual playback progress rather than trusting player state,
    // because the failure seen in the field was neither STATE_ENDED nor an
    // error surfacing through the listener above — just a frame that
    // stopped advancing, or a stream that never gets past buffering in the
    // first place. "Position isn't moving forward while genuinely playing"
    // is false for STALL_THRESHOLD_MS straight either way.
    LaunchedEffect(videoSource) {
        if (videoSource == null) return@LaunchedEffect
        var lastPosition = -1L
        var stalledMs = 0L
        while (true) {
            delay(STALL_POLL_MS)
            val position = exo.currentPosition
            val progressing = exo.playbackState == Player.STATE_READY && exo.isPlaying && position > lastPosition
            stalledMs = if (progressing) 0L else stalledMs + STALL_POLL_MS
            lastPosition = position
            if (stalledMs >= STALL_THRESHOLD_MS) {
                Log.w(VIDEO_TAG, "No playback progress for ${stalledMs}ms on $videoSource (state=${exo.playbackState}, position=${position}ms)")
                stalledMs = 0L
                if (loopSingleVideo) {
                    // Nowhere to advance to — nudge it back to the start
                    // rather than leaving a frozen frame up indefinitely.
                    exo.seekTo(0)
                    exo.playWhenReady = true
                } else if (slides.size > 1) {
                    index = (index + 1) % slides.size
                }
            }
        }
    }

    Box(Modifier.fillMaxSize().background(Color.Black), contentAlignment = Alignment.Center) {
        // Always mounted for the life of this screen (see above) — sits
        // underneath everything else. Explicitly hidden (alpha 0) rather
        // than relying on whatever's drawn "on top" to fully cover it: an
        // image whose aspect ratio doesn't match the screen (ContentScale.Fit
        // letterboxes rather than cropping) leaves the video's paused last
        // frame visible in the gap either side — confirmed live with a
        // square test image on a widescreen frame. Hiding the surface
        // outright is correct regardless of the covering content's shape or
        // opacity, not just for this one image.
        //
        // Inflated from res/layout/player_view.xml rather than constructed
        // directly (PlayerView(context)) — surface_type is only settable
        // via that XML attribute, and the default SurfaceView it would
        // otherwise use composites on its own hardware layer, which doesn't
        // reliably respect normal view/Compose stacking order. texture_view
        // is an ordinary part of the view hierarchy.
        AndroidView(
            modifier = Modifier.fillMaxSize().alpha(if (isVideo) 1f else 0f),
            factory = { ctx ->
                (LayoutInflater.from(ctx).inflate(R.layout.player_view, null) as PlayerView).apply {
                    player = exo
                    onResume()
                }.also { playerView = it }
            },
        )

        when {
            isQueueScreen -> QueueBoardScreen(code)
            slide == null -> IdleCard(app.prefs.screenLabel, code, online, onUnpair)
            isVideo -> {} // the AndroidView above is already showing it
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
                "Offline",
                color = Color(0x99FFFFFF),
                fontSize = 12.sp,
                modifier = Modifier.align(Alignment.TopEnd).padding(12.dp),
            )
        }
    }
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
