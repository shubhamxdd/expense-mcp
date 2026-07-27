import { requireNativeModule } from 'expo-modules-core'

interface PaymentNotification {
  amount: number
  note?: string
  merchant?: string
}

interface NativeNotificationListenerModule {
  startListening(): Promise<boolean>
  stopListening(): Promise<void>
  hasPermission(): Promise<boolean>
  openSettings(): Promise<void>
  addListener(eventName: 'onPaymentReceived', listener: (event: PaymentNotification) => void): { remove(): void }
}

const module = requireNativeModule<NativeNotificationListenerModule>('NotificationListener')

export async function startListening(): Promise<boolean> {
  return module.startListening()
}

export async function stopListening(): Promise<void> {
  return module.stopListening()
}

export async function hasPermission(): Promise<boolean> {
  return module.hasPermission()
}

export async function openSettings(): Promise<void> {
  return module.openSettings()
}

export function addPaymentListener(callback: (event: PaymentNotification) => void) {
  const listener = module.addListener('onPaymentReceived', callback)
  return () => listener.remove()
}
