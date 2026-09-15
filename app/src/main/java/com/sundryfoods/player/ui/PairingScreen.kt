package com.sundryfoods.player.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sundryfoods.player.BuildConfig
import com.sundryfoods.player.PlayerApp
import kotlinx.coroutines.launch

private val Orange = Color(0xFFF05A22)
private val Ink = Color(0xFF14161A)

/**
 * Setup screen a technician sees once: point the box at the console and type the
 * pairing PIN the console shows for that screen. An on-screen keypad keeps it
 * usable with only a TV remote.
 */
@Composable
fun PairingScreen(onPaired: () -> Unit) {
    val app = PlayerApp.instance
    val scope = rememberCoroutineScope()
    var baseUrl by remember { mutableStateOf(app.prefs.baseUrl) }
    var pin by remember { mutableStateOf("") }
    var status by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }

    fun submit() {
        if (busy || pin.length < 4) return
        busy = true
        status = "Pairing…"
        app.prefs.baseUrl = baseUrl
        scope.launch {
            val result = app.api.pair(pin)
            busy = false
            if (result?.paired == true && result.code != null) {
                app.prefs.screenCode = result.code
                app.prefs.screenType = result.type
                app.prefs.screenLabel = listOfNotNull(result.location, result.city).joinToString(", ")
                onPaired()
            } else {
                status = "That PIN was not recognised. Check the console and try again."
                pin = ""
            }
        }
    }

    Column(
        Modifier.fillMaxSize().background(Ink).padding(48.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("Sundry Foods Player", color = Color.White, fontSize = 34.sp, fontWeight = FontWeight.SemiBold)
        Text(
            "Pair this screen with the signage console",
            color = Color(0xFF9AA1AC),
            fontSize = 16.sp,
            modifier = Modifier.padding(top = 8.dp),
        )

        Spacer(Modifier.height(32.dp))

        OutlinedTextField(
            value = baseUrl,
            onValueChange = { baseUrl = it },
            label = { Text("Console address") },
            singleLine = true,
            modifier = Modifier.width(560.dp),
            // The screen behind this field is a hardcoded dark background,
            // not the app's Material theme, so the default OutlinedTextField
            // colors (assuming a light surface) render the typed text and
            // label almost invisibly dark-on-dark. Set every color it needs
            // explicitly instead of relying on theme defaults.
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                focusedLabelColor = Orange,
                unfocusedLabelColor = Color(0xFF9AA1AC),
                focusedBorderColor = Orange,
                unfocusedBorderColor = Color(0xFF5A626E),
                cursorColor = Orange,
            ),
        )

        Spacer(Modifier.height(20.dp))

        Text(
            if (pin.isEmpty()) "— — — — — —" else pin,
            color = Orange,
            fontSize = 44.sp,
            fontFamily = FontFamily.Monospace,
            fontWeight = FontWeight.Bold,
        )

        Spacer(Modifier.height(20.dp))

        listOf("123", "456", "789").forEach { row ->
            Row(Modifier.padding(vertical = 4.dp)) {
                row.forEach { digit ->
                    Key(digit.toString()) { if (pin.length < 6) pin += digit }
                }
            }
        }
        Row(Modifier.padding(vertical = 4.dp)) {
            Key("⌫") { pin = pin.dropLast(1) }
            Key("0") { if (pin.length < 6) pin += "0" }
            Key("✓", highlight = true) { submit() }
        }

        Spacer(Modifier.height(20.dp))

        Button(
            onClick = { submit() },
            enabled = !busy && pin.length >= 4,
            colors = ButtonDefaults.buttonColors(containerColor = Orange),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.width(280.dp).height(52.dp),
        ) { Text("Pair screen", fontSize = 17.sp) }

        status?.let {
            Text(it, color = Color(0xFFB9C0CA), fontSize = 15.sp, modifier = Modifier.padding(top = 16.dp))
        }

        TextButton(onClick = { pin = "" }, modifier = Modifier.padding(top = 8.dp)) {
            Text("Clear", color = Color(0xFF7C8593))
        }

        Text(
            "Player ${BuildConfig.VERSION_NAME} (build ${BuildConfig.VERSION_CODE})",
            color = Color(0xFF5A626E),
            fontSize = 12.sp,
            modifier = Modifier.padding(top = 12.dp),
        )
    }
}

@Composable
private fun Key(label: String, highlight: Boolean = false, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(
            containerColor = if (highlight) Orange else Color(0xFF23262C),
        ),
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier.padding(horizontal = 6.dp).size(84.dp, 60.dp),
    ) { Text(label, color = Color.White, fontSize = 22.sp) }
}
