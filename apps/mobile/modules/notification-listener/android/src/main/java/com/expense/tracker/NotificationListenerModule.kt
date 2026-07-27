package com.expense.tracker

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.service.notification.NotificationListenerService
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NotificationListenerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("NotificationListener")

    Events("onPaymentReceived")

    AsyncFunction("startListening") {
      val ctx = appContext.reactContext ?: return@AsyncFunction false
      val componentName = ComponentName(ctx, PaymentNotificationService::class.java)
      val enabled = try {
        val listeners = Settings.Secure.getString(
          ctx.contentResolver,
          "enabled_notification_listeners"
        )
        listeners?.contains(componentName.flattenToString()) == true
      } catch (e: Exception) {
        false
      }

      if (!enabled) {
        openNotificationAccessSettings(ctx)
        return@AsyncFunction false
      }

      val intent = Intent(ctx, PaymentNotificationService::class.java)
      ctx.startService(intent)
      return@AsyncFunction true
    }

    AsyncFunction("stopListening") {
      val ctx = appContext.reactContext ?: return@AsyncFunction
      val intent = Intent(ctx, PaymentNotificationService::class.java)
      ctx.stopService(intent)
    }

    AsyncFunction("hasPermission") {
      val ctx = appContext.reactContext ?: return@AsyncFunction false
      val componentName = ComponentName(ctx, PaymentNotificationService::class.java)
      return@AsyncFunction try {
        val listeners = Settings.Secure.getString(
          ctx.contentResolver,
          "enabled_notification_listeners"
        )
        listeners?.contains(componentName.flattenToString()) == true
      } catch (e: Exception) {
        false
      }
    }

    AsyncFunction("openSettings") {
      val ctx = appContext.reactContext ?: return@AsyncFunction
      openNotificationAccessSettings(ctx)
    }

    OnCreate {
      PaymentNotificationService.eventEmitter = this@NotificationListenerModule
    }
  }

  private fun openNotificationAccessSettings(ctx: Context) {
    val intent = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP_MR1) {
      Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
    } else {
      Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
    }
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    ctx.startActivity(intent)
  }
}
