import SwiftUI
import UserNotifications
import AVFoundation

struct WaterSettings: Codable {
    var bottleMl = 500.0
    var goalLiters = 2.0
    var language = "pt-BR"
    var theme = "system"
    var reminders = false
    var minutes = 30
    var sound = true
}

struct WaterDay: Codable {
    var date = Calendar.current.startOfDay(for: Date())
    var bottles = 0
    var totalMl = 0.0
}

@MainActor
final class WaterStore: NSObject, ObservableObject, UNUserNotificationCenterDelegate {
    @Published var settings: WaterSettings
    @Published private(set) var day: WaterDay
    @Published var reminderVisible = false
    @Published var notificationError = false
    private var player: AVAudioPlayer?

    override init() {
        let defaults = UserDefaults.standard
        var preferences = defaults.data(forKey: "water.settings")
            .flatMap { try? JSONDecoder().decode(WaterSettings.self, from: $0) } ?? WaterSettings()
        if !preferences.bottleMl.isFinite || preferences.bottleMl <= 0 { preferences.bottleMl = 500 }
        if !preferences.goalLiters.isFinite || preferences.goalLiters <= 0 { preferences.goalLiters = 2 }
        if ![15, 30, 60, 120].contains(preferences.minutes) { preferences.minutes = 30 }
        if !["pt-BR", "en", "es"].contains(preferences.language) { preferences.language = "pt-BR" }
        if !["system", "light", "dark"].contains(preferences.theme) { preferences.theme = "system" }
        settings = preferences
        var saved = defaults.data(forKey: "water.day")
            .flatMap { try? JSONDecoder().decode(WaterDay.self, from: $0) } ?? WaterDay()
        if saved.bottles < 0 || !saved.totalMl.isFinite || saved.totalMl < 0 { saved = WaterDay() }
        day = saved
        super.init()
        UNUserNotificationCenter.current().delegate = self
        checkDay()
    }

    var progress: Double { min(day.totalMl / (settings.goalLiters * 1000), 1) }
    func text(_ key: String) -> String { Copy.text(key, language: settings.language) }
    func number(_ value: Double) -> String {
        value.formatted(.number.locale(Locale(identifier: settings.language)).precision(.fractionLength(0...2)))
    }
    func checkDay() {
        if !Calendar.current.isDateInToday(day.date) { day = WaterDay(); persist() }
    }
    func addBottle() {
        checkDay()
        day.bottles += 1
        day.totalMl += settings.bottleMl
        reminderVisible = false
        stopSound()
        persist()
        Task { await scheduleReminders(requestPermission: false) }
    }
    func resetDay() { day = WaterDay(); persist() }
    func save(_ value: WaterSettings) async {
        settings = value
        reminderVisible = false
        persist()
        await scheduleReminders(requestPermission: true)
    }
    func dismissReminder() {
        reminderVisible = false
        stopSound()
        Task { await scheduleReminders(requestPermission: false) }
    }
    func persist() {
        let defaults = UserDefaults.standard
        if let data = try? JSONEncoder().encode(settings) { defaults.set(data, forKey: "water.settings") }
        if let data = try? JSONEncoder().encode(day) { defaults.set(data, forKey: "water.day") }
    }
    func playSound(enabled: Bool) {
        stopSound()
        guard enabled, let url = Bundle.main.url(forResource: "water-pour", withExtension: "mp3") else { return }
        do {
            try AVAudioSession.sharedInstance().setCategory(.ambient)
            player = try AVAudioPlayer(contentsOf: url)
            player?.play()
        } catch { /* The visible reminder remains available. */ }
    }
    func stopSound() { player?.stop(); player = nil }

    func scheduleReminders(requestPermission: Bool) async {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ["water-reminder"])
        center.removeDeliveredNotifications(withIdentifiers: ["water-reminder"])
        notificationError = false
        guard settings.reminders else { return }
        do {
            var status = await center.notificationSettings()
            if requestPermission && status.authorizationStatus == .notDetermined {
                _ = try await center.requestAuthorization(options: [.alert, .sound])
                status = await center.notificationSettings()
            }
            guard status.authorizationStatus == .authorized || status.authorizationStatus == .provisional else {
                notificationError = true
                return
            }
            let content = UNMutableNotificationContent()
            content.title = text("reminderTitle")
            content.body = text("reminderBody")
            if settings.sound { content.sound = UNNotificationSound(named: UNNotificationSoundName("water-pour.wav")) }
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: Double(settings.minutes) * 60, repeats: true)
            try await center.add(UNNotificationRequest(identifier: "water-reminder", content: content, trigger: trigger))
        } catch { notificationError = true }
    }
    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([])
        Task { @MainActor in
            self.reminderVisible = true
            self.playSound(enabled: self.settings.sound)
        }
    }
}
