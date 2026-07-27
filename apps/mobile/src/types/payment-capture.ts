export interface PaymentCapture {
  startListening(): Promise<boolean>
  stopListening(): Promise<void>
  hasPermission(): Promise<boolean>
  openSettings(): Promise<void>
  addListener(eventName: 'onPaymentReceived', listener: (event: { amount: number; note?: string; merchant?: string }) => void): { remove(): void }
}
