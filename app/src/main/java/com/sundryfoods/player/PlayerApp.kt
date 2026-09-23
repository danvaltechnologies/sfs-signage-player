package com.sundryfoods.player

import android.app.Application
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.sundryfoods.player.data.Api
import com.sundryfoods.player.data.MediaCache
import com.sundryfoods.player.data.Prefs
import com.sundryfoods.player.update.UpdateWorker
import com.sundryfoods.player.sync.HeartbeatWorker
import io.sentry.android.core.SentryAndroid
import java.util.concurrent.TimeUnit

class PlayerApp : Application() {

    lateinit var prefs: Prefs
    lateinit var api: Api
    lateinit var mediaCache: MediaCache

    override fun onCreate() {
        super.onCreate()
        instance = this
        prefs = Prefs(this)
        api = Api { prefs.baseUrl }
        mediaCache = MediaCache(this, api.client)
        scheduleBackgroundWork(this)
        initSentry()
    }

    /** A box this can't sideload-and-plug-in-a-laptop-to is otherwise a black
     * box the moment something goes wrong — this is the only way anyone
     * finds out what actually happened. Blank DSN (no build-time value
     * configured) just skips init rather than crashing on startup. */
    private fun initSentry() {
        if (BuildConfig.SENTRY_DSN.isBlank()) return
        SentryAndroid.init(this) { options ->
            options.dsn = BuildConfig.SENTRY_DSN
            options.environment = if (BuildConfig.DEBUG) "debug" else "release"
            options.release = "${BuildConfig.APPLICATION_ID}@${BuildConfig.VERSION_NAME}+${BuildConfig.VERSION_CODE}"
        }
        if (prefs.isPaired) io.sentry.Sentry.setTag("screen_code", prefs.screenCode ?: "unknown")
    }

    companion object {
        lateinit var instance: PlayerApp
            private set

        /**
         * Two repeating jobs run whether or not the screen activity is up:
         * the heartbeat that keeps the console's health board honest, and the
         * update check that keeps the fleet on the latest build.
         */
        fun scheduleBackgroundWork(app: Application) {
            val online = Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()
            val work = WorkManager.getInstance(app)

            work.enqueueUniquePeriodicWork(
                "heartbeat",
                ExistingPeriodicWorkPolicy.UPDATE,
                PeriodicWorkRequestBuilder<HeartbeatWorker>(15, TimeUnit.MINUTES)
                    .setConstraints(online)
                    .build(),
            )

            work.enqueueUniquePeriodicWork(
                "self-update",
                ExistingPeriodicWorkPolicy.UPDATE,
                PeriodicWorkRequestBuilder<UpdateWorker>(6, TimeUnit.HOURS)
                    .setConstraints(online)
                    .build(),
            )
        }
    }
}
