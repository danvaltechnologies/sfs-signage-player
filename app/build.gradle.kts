import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.serialization")
}

/**
 * versionCode is the number the console compares against when it decides whether
 * a box needs to update itself. Bump it on every release you publish.
 */
val playerVersionCode = 11
val playerVersionName = "1.1.9"

android {
    namespace = "com.sundryfoods.player"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.sundryfoods.player"
        minSdk = 21
        targetSdk = 34
        versionCode = playerVersionCode
        versionName = playerVersionName
        // The real, permanent backend, live as of 2026-09-19 — unlike a dev
        // tunnel this doesn't rotate, so once builds go out on this default,
        // pairing a box never again means typing this address on a remote.
        // API paths in Api.kt have no /api prefix of their own, so whatever
        // address ends up here (this default, apiBaseUrl below, or one typed
        // by hand on the pairing screen) must already include any prefix
        // the target backend needs — this one needs none.
        buildConfigField(
            "String",
            "DEFAULT_API_BASE_URL",
            "\"${project.findProperty("apiBaseUrl") ?: "https://api.areafiftysix.com"}\"",
        )
    }

    signingConfigs {
        // Auto-updates only install over the old build when both are signed with
        // the same key, so release signing is mandatory for the fleet.
        create("release") {
            val props = Properties()
            val file = rootProject.file("keystore.properties")
            if (file.exists()) {
                file.inputStream().use(props::load)
                storeFile = rootProject.file(props.getProperty("storeFile"))
                storePassword = props.getProperty("storePassword")
                keyAlias = props.getProperty("keyAlias")
                keyPassword = props.getProperty("keyPassword")
            }
        }
        // Debug builds need this too: the default (unset) debug signing
        // config is whatever AGP auto-generates at ~/.android/debug.keystore
        // on the machine that happens to run the build — a fresh CI runner
        // gets a fresh one every time, so every build has a different
        // signature. That breaks both self-update AND installing a newer
        // debug build over an older one (Android refuses a signature
        // mismatch either way, forcing an uninstall first). Pointing every
        // build at this one, checked-in keystore keeps the signature
        // constant across CI runs.
        //
        // AGP already auto-registers a SigningConfig named "debug" for every
        // project (that's what silently signed builds before this file
        // existed), so this has to reconfigure that existing one — calling
        // create("debug") tries to register a second config with the same
        // name and Gradle refuses it.
        getByName("debug") {
            // file(), not rootProject.file(): the keystore lives at
            // app/debug.keystore (see the CI workflow's "Ensure a stable
            // debug keystore exists" step and the .gitignore exception for
            // it), and this block's project is already the app module — the
            // rootProject-relative form was pointing one directory too high,
            // at the repo root.
            storeFile = file("debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
        debug {
            applicationIdSuffix = ".debug"
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    composeOptions { kotlinCompilerExtensionVersion = "1.5.14" }
    packaging { resources.excludes += "/META-INF/{AL2.0,LGPL2.1}" }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-compose:1.9.2")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.6")

    implementation(platform("androidx.compose:compose-bom:2024.09.02"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.material3:material3")

    implementation("io.coil-kt:coil-compose:2.7.0")

    implementation("androidx.media3:media3-exoplayer:1.4.1")
    implementation("androidx.media3:media3-ui:1.4.1")

    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    // 1.7.x requires Kotlin 2.0+; the project is pinned to Kotlin 1.9.24
    // (see the root build.gradle.kts), so this needs a version built for
    // that — 1.6.3 is the last line compatible with Kotlin 1.9.x.
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

    implementation("androidx.work:work-runtime-ktx:2.9.1")
}
