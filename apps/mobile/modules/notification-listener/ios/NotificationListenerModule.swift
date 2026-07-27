import ExpoModulesCore

public class NotificationListenerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NotificationListener")

    Events("onPaymentReceived")

    Function("startListening") {
      // iOS does not allow reading other apps' notifications
      return false
    }

    Function("stopListening") {}

    Function("hasPermission") {
      return false
    }

    Function("openSettings") {}
  }
}
