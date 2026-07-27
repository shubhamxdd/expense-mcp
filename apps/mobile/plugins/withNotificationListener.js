const { withAndroidManifest } = require('expo/config-plugins')

function withNotificationListener(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application?.[0]
    if (!mainApplication) return config

    const existingServices = mainApplication.service || []
    const serviceExists = existingServices.some(
      (s) => s.$['android:name'] === 'com.expense.tracker.PaymentNotificationService',
    )

    if (!serviceExists) {
      mainApplication.service = [
        ...existingServices,
        {
          $: {
            'android:name': 'com.expense.tracker.PaymentNotificationService',
            'android:permission': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
            'android:exported': 'true',
            'android:label': 'Payment Notification Listener',
          },
        },
      ]
    }

    return config
  })
}

module.exports = withNotificationListener
