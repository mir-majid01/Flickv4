# StreamZ Android Build Profiles (M1)

Application identity:
  - applicationId: `stream.z`
  - namespace: `com.streamz`
  - RN component name: `StreamZ`
  - Kotlin package: `com.streamz` (sources under `android/app/src/main/java/com/streamz/`)

The `google-services.json` at `android/app/google-services.json` is the single
source of truth for Firebase client config. It is supplied by the project owner
and must never be regenerated or hand-edited. It is git-ignored because it
contains API keys and OAuth client secrets.

## Workflow A — Development (Metro)

Metro is the JS bundler + dev server. The APK is built in debug mode and loads
JS from `http://localhost:8081/index.bundle` at runtime. This requires a
computer, Metro running, and (on physical devices) `adb reverse tcp:8081 tcp:8081`.

```bash
# 1. Start Metro (in one terminal)
cd android && ./gradlew installDebug        # builds + installs debug APK
#    ^-- this triggers the RN Gradle plugin to create a debug APK that
#        connects to Metro at localhost:8081. JS is NOT bundled into the APK.

# Alternative (standard RN CLI flow):
npm start                                    # starts Metro
npx react-native run-android                 # builds debug + installs + launches
```

Characteristics:
- APK contains NO `index.android.bundle`
- App shows Metro dev menu: "Reload", "Reloading", "Debug", "localhost:8081"
- Requires computer + Metro + adb reverse on physical devices
- Intended for active development only

## Workflow B — Standalone (Release / Preview APK)

The RN Gradle plugin runs `react-native bundle` automatically during
`assembleRelease` (via the `react { ... }` block in `android/app/build.gradle`).
This produces `assets/index.android.bundle` (Hermes bytecode) and packages it
into the APK. No Metro, no computer, no localhost.

```bash
# One-shot standalone build (no Metro required at any point after this):
cd android && ./gradlew clean assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

To produce a debuggable standalone APK (same bundle, debug symbols, no signing
constraints) use a dedicated build type instead of the Metro debug build:

```bash
cd android && ./gradlew clean assembleStandaloneDebug
# Output: android/app/build/outputs/apk/standaloneDebug/app-standaloneDebug.apk
```

Characteristics:
- APK contains `assets/index.android.bundle` (~5 MB Hermes bytecode)
- APK contains `assets/app.config`
- App launches with NO Metro, NO computer, NO adb reverse
- App shows NO dev menu, NO "Reload", NO "Reloading", NO "localhost"
- Hermes is enabled (`hermesEnabled=true` in `gradle.properties`)

## Standalone Verification Checklist

After building, inspect the APK (it is a ZIP):

```bash
unzip -l app-release.apk | grep -E "index.android.bundle|app.config"
```

Expected: `assets/index.android.bundle` and `assets/app.config` present.

Then test on a physical device with:
1. Metro STOPPED
2. Computer disconnected (if practical)
3. No `adb reverse`
4. Launch from Android home screen (not via ADB)
5. App starts, RN JS executes, existing UI renders
6. No red Metro error screen, no "Unable to load script", no localhost

### Why standaloneDebug bundles JS (critical)

The React Native Gradle Plugin only runs JS/Hermes bundling for variants that are
**NOT** in `debuggableVariants`. By default only `debug` is listed there, so the
plugin skips bundling for `debug` and loads JS from Metro at runtime.

`standaloneDebug` is `debuggable = true`, so it would be treated as debuggable by
AGP and the plugin would skip bundling — producing a Metro-dependent APK despite
its name. Two fixes prevent this:

1. `debuggableVariants = ["debug"]` — explicitly lists ONLY the Metro `debug`
   build type. `standaloneDebug` is excluded, so the plugin bundles its JS.
2. `BuildConfig.ENABLE_DEV_SUPPORT = false` in `standaloneDebug` — disables the
   RN dev menu, "Reload", "Reloading", Fast Refresh, and packager connection in
   `MainApplication.kt`, so the APK cannot show dev UI even though it is
   debuggable.

The definitive artifact remains `assembleRelease` — it is non-debuggable, bundles
JS, and has dev support off. `standaloneDebug` is a convenience variant for
physical-device iteration only.

## Build Type Definitions

| Build type | JS source | Dev menu | Metro | Use |
|---|---|---|---|---|
| `debug` | localhost:8081 | yes | required | active development |
| `release` | bundled `index.android.bundle` | no | none | standalone APK |
| `standaloneDebug` | bundled `index.android.bundle` | no | none | standalone debug/test |

See `android/app/build.gradle` for the `standaloneDebug` build type definition.
