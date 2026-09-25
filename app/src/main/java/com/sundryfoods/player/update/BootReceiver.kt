package com.sundryfoods.player.update

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.sundryfoods.player.MainActivity

/** Brings the screen back up by itself after a power cut or a self-update, then checks for updates. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED &&
            intent.action != Intent.ACTION_MY_PACKAGE_REPLACED
        ) return
        runCatching {
            context.startActivity(
                Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            )
        }
        WorkManager.getInstance(context)
            .enqueue(OneTimeWorkRequestBuilder<UpdateWorker>().build())
    }
}
