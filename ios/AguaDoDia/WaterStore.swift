import SwiftUI
import UserNotifications
import AVFoundation

@MainActor
final class WaterStore: NSObject, ObservableObject, UNUserNotificationCenterDelegate {
    @Published var settings: WaterSettings
    @Published private(set) var day: WaterDay
    @Published private(set) var history: WaterHistory
    private var activeDateKey: String
    @Published var reminderVisible = false
    @Published var notificationError = false
    private var player: AVAudioPlayer?

    override init() {
        let defaults = UserDefaults.standard
        var preferences = defaults.data(forKey: "water.settings")
            .flatMap { try? JSONDecoder().decode(WaterSettings.self, from: $0) } ?? WaterSettings()
        preferences.validate()
        settings = preferences
        var saved = defaults.data(forKey: "water.day")
            .flatMap { try? JSONDecoder().decode(WaterDay.self, from: $0) } ?? WaterDay()
        if saved.bottles < 0 || !saved.totalMl.isFinite || saved.totalMl < 0 { saved = WaterDay() }
        day = saved
        history = defaults.data(forKey: "water.history.v1")
            .flatMap { try? JSONDecoder().decode(WaterHistory.self, from: $0) } ?? WaterHistory()
        activeDateKey = defaults.string(forKey: "water.activeDateKey") ?? LocalDay.key(saved.date)
        if LocalDay.date(activeDateKey) == nil { activeDateKey = LocalDay.key(saved.date) }
        super.init()
        UNUserNotificationCenter.current().delegate = self
        checkDay()
        persist()
    }

    var progress: Double { min(day.totalMl / (settings.goalLiters * 1000), 1) }
    func text(_ key: String) -> String { Copy.text(key, language: settings.language) }
    func number(_ value: Double) -> String {
        value.formatted(.number.locale(Locale(identifier: settings.language)).precision(.fractionLength(0...2)))
    }
    func checkDay() {
        let current = LocalDay.key()
        guard activeDateKey != current else { return }
        history.record(day, on: activeDateKey, goalLiters: settings.goalLiters)
        activeDateKey = current
        day = history.days[current] ?? WaterDay()
        persist()
    }
    var streak: Int { history.streak() }
    var remainingMl: Double { max(0, (settings.goalLiters * 100_000 - day.totalMl * 100).rounded()) / 100 }
    func volume(_ amount: Double) -> String {
        amount >= 1000 ? "\(number(amount / 1000)) L" : "\(number(amount)) ml"
    }
    func size(_ container: WaterContainer) -> Double { container == .bottle ? settings.bottleMl : settings.glassMl }
    func needed(_ container: WaterContainer) -> Int { Int(ceil(remainingMl / size(container))) }
    func addBottle() { addWater(.bottle) }
    func addWater(_ container: WaterContainer) {
        checkDay()
        day.add(size(container), container: container)
        reminderVisible = false
        stopSound()
        persist()
        Task { await scheduleReminders(requestPermission: false) }
    }
    func undoWater() {
        checkDay()
        day.undo()
        persist()
    }
    func resetDay() {
        checkDay()
        day = WaterDay()
        persist()
    }
    func setTheme(_ theme: String) {
        guard ["system", "light", "dark"].contains(theme) else { return }
        settings.theme = theme
        persist()
    }
    func save(_ value: WaterSettings) async {
        checkDay()
        settings = value
        settings.validate()
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
        history.record(day, on: activeDateKey, goalLiters: settings.goalLiters)
        let defaults = UserDefaults.standard
        defaults.set(activeDateKey, forKey: "water.activeDateKey")
        if let data = try? JSONEncoder().encode(history) { defaults.set(data, forKey: "water.history.v1") }
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
