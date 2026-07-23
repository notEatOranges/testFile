package com.anonymous.myApp

import android.content.Context
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.igexin.sdk.*

class GetuiModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val TAG = "GetuiModule"
    private val EVENT_NAME = "GetuiMessage"

    override fun getName(): String {
        return "GetuiModule"
    }

    @ReactMethod
    fun initPush(promise: Promise) {
        try {
            Log.d(TAG, "初始化个推SDK")
            
            // 注册推送服务
            PushManager.getInstance().registerPushIntentService(reactApplicationContext, GetuiIntentService::class.java)
            
            Log.d(TAG, "个推SDK初始化完成")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "个推SDK初始化失败", e)
            promise.reject("INIT_ERROR", "个推SDK初始化失败", e)
        }
    }

    @ReactMethod
    fun getClientId(promise: Promise) {
        try {
            val clientId = PushManager.getInstance().clientid
            Log.d(TAG, "获取CID: $clientId")
            
            if (clientId.isNullOrEmpty()) {
                Log.w(TAG, "CID为空，可能还在初始化中")
                promise.resolve(null)
            } else {
                promise.resolve(clientId)
            }
        } catch (e: Exception) {
            Log.e(TAG, "获取CID失败", e)
            promise.reject("GET_CID_ERROR", "获取CID失败", e)
        }
    }

    @ReactMethod
    fun bindAlias(alias: String, sn: String?, promise: Promise) {
        try {
            Log.d(TAG, "绑定别名: $alias")
            PushManager.getInstance().bindAlias(reactApplicationContext, alias, sn ?: "")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "绑定别名失败", e)
            promise.reject("BIND_ALIAS_ERROR", "绑定别名失败", e)
        }
    }

    @ReactMethod
    fun unbindAlias(alias: String, sn: String?, promise: Promise) {
        try {
            Log.d(TAG, "解绑别名: $alias")
            PushManager.getInstance().unBindAlias(reactApplicationContext, alias, sn ?: "")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "解绑别名失败", e)
            promise.reject("UNBIND_ALIAS_ERROR", "解绑别名失败", e)
        }
    }

    @ReactMethod
    fun setTag(tags: ReadableArray, promise: Promise) {
        try {
            val tagList = tags.toArrayList().map { it.toString() }
            Log.d(TAG, "设置标签: $tagList")
            PushManager.getInstance().setTag(reactApplicationContext, tagList)
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "设置标签失败", e)
            promise.reject("SET_TAG_ERROR", "设置标签失败", e)
        }
    }

    @ReactMethod
    fun turnOnPush(promise: Promise) {
        try {
            Log.d(TAG, "开启推送")
            PushManager.getInstance().turnOnPush(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "开启推送失败", e)
            promise.reject("TURN_ON_ERROR", "开启推送失败", e)
        }
    }

    @ReactMethod
    fun turnOffPush(promise: Promise) {
        try {
            Log.d(TAG, "关闭推送")
            PushManager.getInstance().turnOffPush(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "关闭推送失败", e)
            promise.reject("TURN_OFF_ERROR", "关闭推送失败", e)
        }
    }

    @ReactMethod
    fun getStatus(promise: Promise) {
        try {
            val status = PushManager.getInstance().isPushTurnedOn(reactApplicationContext)
            val statusText = if (status) "已开启" else "已关闭"
            Log.d(TAG, "推送状态: $statusText")
            promise.resolve(statusText)
        } catch (e: Exception) {
            Log.e(TAG, "获取状态失败", e)
            promise.reject("GET_STATUS_ERROR", "获取状态失败", e)
        }
    }

    @ReactMethod
    fun getVersion(promise: Promise) {
        try {
            val version = PushManager.getInstance().version
            Log.d(TAG, "SDK版本: $version")
            promise.resolve(version)
        } catch (e: Exception) {
            Log.e(TAG, "获取版本失败", e)
            promise.reject("GET_VERSION_ERROR", "获取版本失败", e)
        }
    }

    @ReactMethod
    fun clearAllNotifications(promise: Promise) {
        try {
            Log.d(TAG, "清除所有通知")
            PushManager.getInstance().clearAllNotificationForNotificationBar(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "清除通知失败", e)
            promise.reject("CLEAR_NOTIFICATION_ERROR", "清除通知失败", e)
        }
    }

    // 发送事件到JavaScript
    fun sendEvent(eventName: String, params: WritableMap?) {
        try {
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        } catch (e: Exception) {
            Log.e(TAG, "发送事件失败", e)
        }
    }

    // 发送消息事件
    fun sendMessageEvent(type: String, data: String) {
        try {
            val params = Arguments.createMap().apply {
                putString("type", type)
                putString("data", data)
                putDouble("timestamp", System.currentTimeMillis().toDouble())
            }
            sendEvent(EVENT_NAME, params)
        } catch (e: Exception) {
            Log.e(TAG, "发送消息事件失败", e)
        }
    }
} 