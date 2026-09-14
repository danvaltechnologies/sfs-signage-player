package com.sundryfoods.player

import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.sundryfoods.player.ui.PairingScreen
import com.sundryfoods.player.ui.PlaybackScreen
import com.sundryfoods.player.update.UpdateWorker

/**
 * The whole player is one full-screen activity: pair the box once, then play
 * whatever the console has approved and published for that screen.
 */
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        goImmersive()

        // Check for a newer build every time the screen comes up.
        WorkManager.getInstance(this).enqueue(OneTimeWorkRequestBuilder<UpdateWorker>().build())

        setContent {
            val app = PlayerApp.instance
            var paired by remember { mutableStateOf(app.prefs.isPaired) }

            Box(Modifier.fillMaxSize().background(Color.Black)) {
                if (paired) {
                    PlaybackScreen(onUnpair = {
                        app.prefs.forget()
                        paired = false
                    })
                } else {
                    PairingScreen(onPaired = { paired = true })
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        goImmersive()
    }

    private fun goImmersive() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.attributes.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
    }
}
