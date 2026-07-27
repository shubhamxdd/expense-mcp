package com.expense.tracker

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.os.Bundle
import android.util.Log
import java.util.regex.Pattern

class PaymentNotificationService : NotificationListenerService() {
  companion object {
    var eventEmitter: NotificationListenerModule? = null
  }

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    val extras: Bundle = sbn.notification.extras ?: return
    val title = extras.getString("android.title")?.lowercase() ?: ""
    val text = extras.getString("android.text")?.lowercase() ?: ""
    val bigText = extras.getString("android.bigText")?.lowercase() ?: ""
    val combined = "$title $text $bigText"

    if (!isPaymentRelated(combined)) return

    val amount = extractAmount(combined) ?: return

    val event = Bundle().apply {
      putDouble("amount", amount.toDouble())
      putString("note", extractNote(combined))
      putString("merchant", extractMerchant(combined))
    }

    Log.d("PaymentNotification", "Payment detected: $amount from ${event.getString("merchant")}")
    eventEmitter?.sendEvent("onPaymentReceived", event)
  }

  override fun onNotificationRemoved(sbn: StatusBarNotification?) {}

  private fun extractAmount(text: String): Double? {
    val patterns = listOf(
      Regex("rs[.\\s]*(\\d+[.,]?\\d*)"),
      Regex("inr[.\\s]*(\\d+[.,]?\\d*)"),
      Regex("₹\\s*(\\d+[.,]?\\d*)"),
      Regex("(?:paid|debited|sent|spent|credited|received)[.\\s]+(?:rs|inr|₹)?[.\\s]*(\\d+[.,]?\\d*)"),
    )
    for (pattern in patterns) {
      val match = pattern.find(text)
      if (match != null) {
        val raw = match.groupValues[1].replace(",", "")
        return raw.toDoubleOrNull()
      }
    }
    return null
  }

  private fun extractNote(text: String): String? {
    val notePatterns = listOf(
      Regex("(?:for|note|desc|description|purpose|remark)[:.\\s]+([a-z0-9 ]{3,50})"),
    )
    for (pattern in notePatterns) {
      val match = pattern.find(text)
      if (match != null) return match.groupValues[1].trim()
    }
    return null
  }

  private fun extractMerchant(text: String): String? {
    val merchantPatterns = listOf(
      Regex("(?:to|payee|merchant|vendor|paid to)[:.\\s]+([a-z0-9 .]{3,30})"),
      Regex("upi[:.\\s]*([a-z0-9.@]{3,30})"),
    )
    for (pattern in merchantPatterns) {
      val match = pattern.find(text)
      if (match != null) return match.groupValues[1].trim()
    }
    return null
  }
}

private fun isPaymentRelated(text: String): Boolean {
  val paymentKeywords = listOf(
    "paid", "payment", "debited", "sent", "transferred", "spent",
    "upi", "paid rs", "paid inr", "debit", "purchase", "bill",
    "refund", "cashback", "received", "credited",
    "bank", "account", "trf", "neft", "imps", "rtgs",
  )
  val amountPattern = Regex("(?:rs|inr|₹)\\s*\\d+")
  return paymentKeywords.any { text.contains(it) } || amountPattern.containsMatchIn(text)
}
