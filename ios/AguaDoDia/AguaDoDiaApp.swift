import SwiftUI

@main
struct AguaDoDiaApp: App {
    @StateObject private var store = WaterStore()
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
                .tint(NativePalette.blue)
                .environment(\.locale, Locale(identifier: store.settings.language))
                .preferredColorScheme(store.settings.theme == "system" ? nil :
                    (store.settings.theme == "dark" ? .dark : .light))
        }
    }
}
