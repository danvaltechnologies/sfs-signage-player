package com.sundryfoods.player.data

import android.content.Context
import com.sundryfoods.player.BuildConfig

/** The little bit of state a box keeps: which console, which screen. */
class Prefs(context: Context) {
    private val sp = context.getSharedPreferences("sundry-player", Context.MODE_PRIVATE)

    var baseUrl: String
        get() = sp.getString("baseUrl", null) ?: BuildConfig.DEFAULT_API_BASE_URL
        set(value) = sp.edit().putString("baseUrl", value.trim().trimEnd('/')).apply()

    var screenCode: String?
        get() = sp.getString("screenCode", null)
        set(value) = sp.edit().putString("screenCode", value).apply()

    var screenType: String?
        get() = sp.getString("screenType", null)
        set(value) = sp.edit().putString("screenType", value).apply()

    var screenLabel: String?
        get() = sp.getString("screenLabel", null)
        set(value) = sp.edit().putString("screenLabel", value).apply()

    /** Last playback payload, replayed verbatim when the box boots offline. */
    var cachedPlayback: String?
        get() = sp.getString("cachedPlayback", null)
        set(value) = sp.edit().putString("cachedPlayback", value).apply()

    val isPaired: Boolean get() = !screenCode.isNullOrBlank()

    fun forget() = sp.edit().remove("screenCode").remove("screenType").remove("screenLabel").apply()
}
