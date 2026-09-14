package com.sundryfoods.player.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.sundryfoods.player.PlayerApp
import com.sundryfoods.player.data.QueueBoard
import com.sundryfoods.player.data.QueueTicket
import kotlinx.coroutines.delay

/** Counter board for screens registered as the queue (QMS) type. */
@Composable
fun QueueBoardScreen(code: String) {
    val app = PlayerApp.instance
    var board by remember { mutableStateOf(QueueBoard()) }

    LaunchedEffect(code) {
        while (true) {
            app.api.queueBoard(code)?.let { board = it }
            delay(5_000)
        }
    }

    val preparing = board.tickets.filter { it.stage == "PLACED" || it.stage == "PREPARING" }
    val ready = board.tickets.filter { it.stage == "READY" }

    Row(Modifier.fillMaxSize().background(Color(0xFF0E1013)).padding(32.dp)) {
        Column(Modifier.weight(1f).fillMaxHeight()) {
            Text("PREPARING", color = Color(0xFF9AA1AC), fontSize = 22.sp, fontWeight = FontWeight.SemiBold)
            TicketList(preparing, Color(0xFF23262C), Color.White)
        }
        Column(Modifier.weight(1f).fillMaxHeight().padding(start = 24.dp)) {
            Text("READY TO COLLECT", color = Color(0xFFF05A22), fontSize = 22.sp, fontWeight = FontWeight.SemiBold)
            TicketList(ready, Color(0xFFF05A22), Color.White)
        }
    }
}

@Composable
private fun TicketList(tickets: List<QueueTicket>, background: Color, textColor: Color) {
    if (tickets.isEmpty()) {
        Text(
            "No orders",
            color = Color(0xFF5A626E),
            fontSize = 18.sp,
            modifier = Modifier.padding(top = 20.dp),
        )
        return
    }
    LazyColumn(
        Modifier.fillMaxWidth().padding(top = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        items(tickets) { ticket ->
            Column(
                Modifier
                    .fillMaxWidth()
                    .background(background, RoundedCornerShape(10.dp))
                    .padding(horizontal = 22.dp, vertical = 16.dp),
            ) {
                Text(
                    ticket.ticket,
                    color = textColor,
                    fontSize = 42.sp,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                )
                ticket.customer?.let { Text(it, color = textColor.copy(alpha = 0.8f), fontSize = 16.sp) }
            }
        }
    }
}

@Composable
private fun Text(text: String, color: Color, fontSize: androidx.compose.ui.unit.TextUnit, fontWeight: FontWeight? = null, fontFamily: FontFamily? = null, modifier: Modifier = Modifier) =
    androidx.compose.material3.Text(
        text = text,
        color = color,
        fontSize = fontSize,
        fontWeight = fontWeight,
        fontFamily = fontFamily,
        modifier = modifier,
    )
