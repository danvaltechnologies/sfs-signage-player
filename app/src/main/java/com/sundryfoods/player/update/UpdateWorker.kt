package com.sundryfoods.player.update

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

/** Periodic self-update check; also fires once on boot. */
class UpdateWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        runCatching { UpdateInstaller.checkAndInstall(applicationContext) }
        return Result.success()
    }
}
