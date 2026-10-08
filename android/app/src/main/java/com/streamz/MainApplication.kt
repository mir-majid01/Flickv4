package com.streamz

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
// import com.eko.RNBackgroundDownloaderTurboPackage;

/**
 * StreamZ host.
 *
 * Dev support and packager-server access are driven by BuildConfig flags set
 * per build type in android/app/build.gradle:
 *
 *   debug              -> ENABLE_DEV_SUPPORT=true  (Metro dev menu + packager)
 *   release           -> ENABLE_DEV_SUPPORT=false (standalone, bundled JS)
 *   standaloneDebug    -> ENABLE_DEV_SUPPORT=false (standalone, debuggable)
 *
 * useDevSupport is the authoritative gate for the RN dev menu, "Reload",
 * "Reloading", Fast Refresh, and the packager/Metro connection. Setting it to
 * false guarantees a standalone APK can NEVER fall back to a Metro dev server
 * or show dev UI — regardless of the build's debuggability.
 */
class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
          // add(RNBackgroundDownloaderTurboPackage())
          add(ApkInstallerPackage())
        },
      useDevSupport = BuildConfig.ENABLE_DEV_SUPPORT,
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
