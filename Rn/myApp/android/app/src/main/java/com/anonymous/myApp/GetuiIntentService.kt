package com.anonymous.myApp

import android.content.Intent
import android.util.Log
import com.igexin.sdk.GTIntentService
import com.igexin.sdk.message.GTCmdMessage
import com.igexin.sdk.message.GTNotificationMessage
import com.igexin.sdk.message.GTTransmitMessage

class GetuiIntentService : GTIntentService() {
    private val TAG = "GetuiIntentService"

    override fun onReceiveServicePid(context: android.content.Context?, pid: Int) {
        Log.d(TAG, "onReceiveServicePid: $pid")
    }

    override fun onReceiveMessageData(context: android.content.Context?, msg: GTTransmitMessage?) {
        try {
            Log.d(TAG, "收到透传消息")
            msg?.let { message ->
                val payload = message.payload
                val messageId = message.messageId
                val taskId = message.taskId
                val pkgName = message.pkgName
                val cid = message.clientId

                Log.d(TAG, "透传消息详情:")
                Log.d(TAG, "  messageId: $messageId")
                Log.d(TAG, "  taskId: $taskId")
                Log.d(TAG, "  pkgName: $pkgName")
                Log.d(TAG, "  cid: $cid")
                Log.d(TAG, "  payload: ${String(payload)}")

                // 发送消息到JavaScript
                val messageData = """
                    {
                        "type": "payload",
                        "messageId": "$messageId",
                        "taskId": "$taskId",
                        "pkgName": "$pkgName",
                        "cid": "$cid",
                        "payload": "${String(payload)}"
                    }
                """.trimIndent()

                // 通知JavaScript层
                notifyJavaScript("payload", messageData)
            }
        } catch (e: Exception) {
            Log.e(TAG, "处理透传消息失败", e)
        }
    }

    override fun onReceiveClientId(context: android.content.Context?, clientId: String?) {
        try {
            Log.d(TAG, "收到CID: $clientId")
            clientId?.let { cid ->
                // 发送CID到JavaScript
                notifyJavaScript("cid", cid)
            }
        } catch (e: Exception) {
            Log.e(TAG, "处理CID失败", e)
        }
    }

    override fun onReceiveOnlineState(context: android.content.Context?, online: Boolean) {
        try {
            Log.d(TAG, "在线状态: $online")
            val status = if (online) "online" else "offline"
            notifyJavaScript("connectionStatus", status)
        } catch (e: Exception) {
            Log.e(TAG, "处理在线状态失败", e)
        }
    }

    override fun onReceiveCommandResult(context: android.content.Context?, cmdMessage: GTCmdMessage?) {
        try {
            Log.d(TAG, "收到命令消息")
            cmdMessage?.let { cmd ->
                Log.d(TAG, "命令消息详情:")
                Log.d(TAG, "  action: ${cmd.action}")
                Log.d(TAG, "  result: ${cmd.result}")
                Log.d(TAG, "  messageId: ${cmd.messageId}")
                Log.d(TAG, "  sn: ${cmd.sn}")

                val cmdData = """
                    {
                        "type": "command",
                        "action": "${cmd.action}",
                        "result": "${cmd.result}",
                        "messageId": "${cmd.messageId}",
                        "sn": "${cmd.sn}"
                    }
                """.trimIndent()

                notifyJavaScript("command", cmdData)
            }
        } catch (e: Exception) {
            Log.e(TAG, "处理命令消息失败", e)
        }
    }

    override fun onNotificationMessageArrived(context: android.content.Context?, msg: GTNotificationMessage?) {
        try {
            Log.d(TAG, "通知消息到达")
            msg?.let { notification ->
                Log.d(TAG, "通知消息详情:")
                Log.d(TAG, "  messageId: ${notification.messageId}")
                Log.d(TAG, "  taskId: ${notification.taskId}")
                Log.d(TAG, "  pkgName: ${notification.pkgName}")
                Log.d(TAG, "  title: ${notification.title}")
                Log.d(TAG, "  content: ${notification.content}")

                val notificationData = """
                    {
                        "type": "notification",
                        "messageId": "${notification.messageId}",
                        "taskId": "${notification.taskId}",
                        "pkgName": "${notification.pkgName}",
                        "title": "${notification.title}",
                        "content": "${notification.content}"
                    }
                """.trimIndent()

                notifyJavaScript("notification", notificationData)
            }
        } catch (e: Exception) {
            Log.e(TAG, "处理通知消息失败", e)
        }
    }

    override fun onNotificationMessageClicked(context: android.content.Context?, msg: GTNotificationMessage?) {
        try {
            Log.d(TAG, "通知消息被点击")
            msg?.let { notification ->
                Log.d(TAG, "点击的通知消息详情:")
                Log.d(TAG, "  messageId: ${notification.messageId}")
                Log.d(TAG, "  taskId: ${notification.taskId}")
                Log.d(TAG, "  pkgName: ${notification.pkgName}")
                Log.d(TAG, "  title: ${notification.title}")
                Log.d(TAG, "  content: ${notification.content}")

                val clickData = """
                    {
                        "type": "notificationClick",
                        "messageId": "${notification.messageId}",
                        "taskId": "${notification.taskId}",
                        "pkgName": "${notification.pkgName}",
                        "title": "${notification.title}",
                        "content": "${notification.content}"
                    }
                """.trimIndent()

                notifyJavaScript("notificationClick", clickData)
            }
        } catch (e: Exception) {
            Log.e(TAG, "处理通知点击失败", e)
        }
    }

    private fun notifyJavaScript(type: String, data: String) {
        try {
            // 这里可以通过EventBus或其他方式通知JavaScript层
            // 由于我们使用的是React Native，可以通过原生模块发送事件
            Log.d(TAG, "通知JavaScript: $type - $data")
            
            // 发送广播，让MainActivity接收并转发给JavaScript
            val intent = Intent("com.getui.message")
            intent.putExtra("type", type)
            intent.putExtra("data", data)
            sendBroadcast(intent)
        } catch (e: Exception) {
            Log.e(TAG, "通知JavaScript失败", e)
        }
    }
} 