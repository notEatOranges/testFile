package com.anonymous.myApp
import expo.modules.splashscreen.SplashScreenManager

import android.os.Build
import android.os.Bundle
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.util.Log

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  private val TAG = "MainActivity"
  private var getuiMessageReceiver: BroadcastReceiver? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    // setTheme(R.style.AppTheme);
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    
    // 注册个推消息接收器
    registerGetuiMessageReceiver()
    
    super.onCreate(null)
  }

  private fun registerGetuiMessageReceiver() {
    try {
      getuiMessageReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
          try {
            if (intent?.action == "com.getui.message") {
              val type = intent.getStringExtra("type") ?: ""
              val data = intent.getStringExtra("data") ?: ""
              
              Log.d(TAG, "收到个推消息: $type - $data")
              
              // 这里可以转发给JavaScript层
              // 由于React Native的事件机制，我们需要通过原生模块发送
            }
          } catch (e: Exception) {
            Log.e(TAG, "处理个推消息失败", e)
          }
        }
      }
      
      val filter = IntentFilter("com.getui.message")
      registerReceiver(getuiMessageReceiver, filter)
      Log.d(TAG, "个推消息接收器注册成功")
    } catch (e: Exception) {
      Log.e(TAG, "注册个推消息接收器失败", e)
    }
  }

  override fun onDestroy() {
    super.onDestroy()
    
    // 注销个推消息接收器
    try {
      getuiMessageReceiver?.let {
        unregisterReceiver(it)
        getuiMessageReceiver = null
      }
    } catch (e: Exception) {
      Log.e(TAG, "注销个推消息接收器失败", e)
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
