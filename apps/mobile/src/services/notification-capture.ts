import { Platform } from 'react-native'
import type { PaymentCapture } from '../types/payment-capture'

let nativeModule: PaymentCapture | null = null

if (Platform.OS === 'android') {
  try {
    const mod = require('../../modules/notification-listener/src/NotificationListener')
    nativeModule = mod
  } catch {
    console.warn('Notification listener native module not available')
  }
}

export async function startListening(): Promise<boolean> {
  if (!nativeModule) {
    if (Platform.OS === 'ios') {
      console.log('Notification capture not available on iOS')
    }
    return false
  }
  return nativeModule.startListening()
}

export async function stopListening(): Promise<void> {
  if (!nativeModule) return
  return nativeModule.stopListening()
}

export async function hasPermission(): Promise<boolean> {
  if (!nativeModule) return false
  return nativeModule.hasPermission()
}

export async function openSettings(): Promise<void> {
  if (!nativeModule) return
  return nativeModule.openSettings()
}

export function addPaymentListener(callback: (event: { amount: number; note?: string; merchant?: string }) => void) {
  if (!nativeModule) {
    return () => {}
  }
  const listener = nativeModule.addListener('onPaymentReceived', callback)
  return () => listener.remove()
}
