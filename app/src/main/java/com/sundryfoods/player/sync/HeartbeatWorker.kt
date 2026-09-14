package com.sundryfoods.player.sync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.sundryfoods.player.BuildConfig
import com.sundryfoods.player.PlayerApp

/**
 * Backstop only: PlaybackScreen already heartbeats every 60 seconds with
 * the actual now-playing label while the player is running normally. This
 * exists purely for the case the UI isn't up at all (crashed, killed) —
 * so a box that's up but stuck still reports *something* every 15 minutes,
 * which is the shortest interval WorkManager's periodic work supports.
 */
class HeartbeatWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val app = PlayerApp.instance
        val code = app.prefs.screenCode ?: return Result.success()
        app.api.heartbeat(code, null, BuildConfig.VERSION_NAME)
        return Result.success()
    }
}
