package com.sundryfoods.player.sync

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.sundryfoods.player.BuildConfig
import com.sundryfoods.player.PlayerApp

/** Background heartbeat, so a box that is up but idle still reports online. */
class HeartbeatWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val app = PlayerApp.instance
        val code = app.prefs.screenCode ?: return Result.success()
        app.api.heartbeat(code, null, BuildConfig.VERSION_NAME)
        return Result.success()
    }
}
