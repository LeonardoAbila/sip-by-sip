import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var store: WaterStore
    @Environment(\.dismiss) private var dismiss
    @State private var draft: WaterSettings
    @State private var saving = false
    init(initial: WaterSettings) { _draft = State(initialValue: initial) }
    private func t(_ key: String) -> String { Copy.text(key, language: draft.language) }
    private var valid: Bool { validWaterVolume(draft.bottleMl) && validWaterVolume(draft.glassMl) && draft.goalLiters.isFinite && draft.goalLiters > 0 && draft.goalLiters <= 1_000_000 }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack { Text(t("bottle")); TextField("500", value: $draft.bottleMl, format: .number).keyboardType(.decimalPad).multilineTextAlignment(.trailing) }
                    HStack { Text(t("glass")); TextField("250", value: $draft.glassMl, format: .number).keyboardType(.decimalPad).multilineTextAlignment(.trailing) }
                    HStack { Text(t("goal")); TextField("2", value: $draft.goalLiters, format: .number).keyboardType(.decimalPad).multilineTextAlignment(.trailing) }
                    if !valid { Text(t("invalid")).foregroundStyle(.red) }
                } footer: { Text(t("help")) }
                Section {
                    Picker(t("language"), selection: $draft.language) {
                        Text("Português (BR)").tag("pt-BR")
                        Text("English").tag("en")
                        Text("Español").tag("es")
                    }
                    Picker(t("theme"), selection: $draft.theme) {
                        Text(t("system")).tag("system")
                        Text(t("light")).tag("light")
                        Text(t("dark")).tag("dark")
                    }
                }

            }
            .environment(\.locale, Locale(identifier: draft.language))
            .navigationTitle(t("settings"))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button(t("cancel")) { dismiss() }.disabled(saving) }
                ToolbarItem(placement: .confirmationAction) {
                    Button(t("save")) {
                        saving = true
                        Task { await store.save(draft); dismiss() }
                    }.disabled(!valid || saving)
                }
            }
        }.interactiveDismissDisabled(saving)
    }
}

struct RemindersView: View {
    @EnvironmentObject private var store: WaterStore
    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var draft: WaterSettings
    @State private var preview = false
    @State private var saving = false
    init(initial: WaterSettings) { _draft = State(initialValue: initial) }
    private func t(_ key: String) -> String { Copy.text(key, language: draft.language) }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Toggle(t("enable"), isOn: $draft.reminders)
                    Picker(t("interval"), selection: $draft.minutes) {
                        ForEach([15, 30, 60, 120], id: \.self) { minutes in Text("\(minutes)").tag(minutes) }
                    }.disabled(!draft.reminders)
                    Toggle(t("sound"), isOn: $draft.sound)
                    Button(t("test")) { preview = true; store.playSound(enabled: draft.sound) }
                    if preview {
                        Text(t("preview")).font(.footnote)
                        ReminderCard(language: draft.language, onAdd: closePreview, onDismiss: closePreview).transition(.opacity)
                    }
                } header: { Text(t("reminders")) } footer: { Text(t("reminderHelp")) }
            }
            .navigationTitle(t("reminders"))
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button(t("cancel")) { dismiss() }.disabled(saving) }
                ToolbarItem(placement: .confirmationAction) {
                    Button(t("save")) {
                        saving = true
                        var updated = store.settings
                        updated.reminders = draft.reminders
                        updated.minutes = draft.minutes
                        updated.sound = draft.sound
                        Task { await store.save(updated); dismiss() }
                    }.disabled(saving)
                }
            }
            .animation(reduceMotion ? nil : .easeInOut(duration: 0.24), value: preview)
            .onDisappear { store.stopSound() }
        }.interactiveDismissDisabled(saving)
    }
    private func closePreview() { preview = false; store.stopSound() }
}
