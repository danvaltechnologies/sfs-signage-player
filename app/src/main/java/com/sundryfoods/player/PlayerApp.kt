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
