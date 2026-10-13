import SwiftUI
import Combine

struct ContentView: View {
    @EnvironmentObject private var store: WaterStore
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var remindersOpen = false
    @State private var settingsOpen = false
    @State private var resetOpen = false
    @State private var pourAmount: Double?
    private let clock = Timer.publish(every: 30, on: .main, in: .common).autoconnect()

    var body: some View {
        NavigationStack {
            ZStack {
                Color(.systemGroupedBackground).ignoresSafeArea()
                ScrollView {
                    VStack(spacing: 22) {
                        if store.reminderVisible {
                            ReminderCard(language: store.settings.language, onAdd: addBottle, onDismiss: store.dismissReminder)
                                .transition(.opacity)
                        }
                        Text("💧").font(.system(size: 48))
                        Text(store.text("title")).font(.largeTitle.bold())
                        Text(store.text("subtitle")).foregroundStyle(.secondary)
                        Text("\(store.text("bottle")): \(store.number(store.settings.bottleMl))")
                            .font(.subheadline).foregroundStyle(.secondary)
                        VStack(spacing: 8) {
                            Text(store.day.totalMl >= 1000 ? "\(store.number(store.day.totalMl / 1000)) L" : "\(store.number(store.day.totalMl)) ml")
                                .font(.system(size: 52, weight: .bold)).foregroundStyle(.blue)
                                .contentTransition(.opacity)
                            Text("\(store.text("of")) \(store.number(store.settings.goalLiters)) L \(store.text("today"))")
                            Text("\(store.day.bottles) · \(store.text("bottles"))").font(.subheadline)
                        }
                        VStack(spacing: 8) {
                            HStack { Text(store.text("progress")); Spacer(); Text("\(Int(store.progress * 100))%") }
                            ProgressView(value: store.progress).tint(.blue)
                        }.font(.subheadline)
                        if store.progress >= 1 { Text(store.text("success")).foregroundStyle(.green).transition(.opacity) }
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 8)) {
                            ForEach(0..<min(store.day.bottles, 24), id: \.self) { _ in
                                Image(systemName: "waterbottle.fill").foregroundStyle(.blue).font(.title2).transition(.opacity)
                            }
                        }.accessibilityHidden(true)
                        if store.day.bottles > 24 { Text("+\(store.day.bottles - 24)") }
                        Button(action: addBottle) { Label(store.text("add"), systemImage: "plus").frame(maxWidth: .infinity).padding(8) }
                            .buttonStyle(.borderedProminent)
                        Button(store.text("reset"), role: .destructive) { resetOpen = true }
                            .disabled(store.day.totalMl == 0 && store.day.bottles == 0)
                        Text(store.text("footnote")).font(.footnote).foregroundStyle(.secondary)
                        if store.notificationError { Text(store.text("notificationError")).font(.footnote).foregroundStyle(.orange) }
                    }.padding(24).frame(maxWidth: 500)
                        .frame(maxWidth: .infinity)
                }
                if let amount = pourAmount {
                    Color.black.opacity(0.45).ignoresSafeArea().transition(.opacity)
                    PourPopup(amount: amount, onClose: closePour)
                        .padding(24).transition(.opacity).id(amount)
                }
            }
            .navigationTitle(store.text("title"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { remindersOpen = true } label: { Image(systemName: "bell") }
                        .accessibilityLabel(store.text("reminders"))
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button { settingsOpen = true } label: { Image(systemName: "gearshape") }
                        .accessibilityLabel(store.text("settings"))
                }
            }
            .sheet(isPresented: $remindersOpen) { RemindersView(initial: store.settings) }
            .sheet(isPresented: $settingsOpen) { SettingsView(initial: store.settings) }
            .alert(store.text("resetTitle"), isPresented: $resetOpen) {
                Button(store.text("cancel"), role: .cancel) { }
                Button(store.text("reset"), role: .destructive) { store.resetDay() }
            } message: { Text(store.text("resetHelp")) }
            .animation(reduceMotion ? nil : .easeInOut(duration: 0.24), value: store.reminderVisible)
            .animation(reduceMotion ? nil : .easeInOut(duration: 0.24), value: store.day.bottles)
            .animation(reduceMotion ? nil : .easeInOut(duration: 0.24), value: store.settings.theme)
            .onReceive(clock) { _ in store.checkDay() }
            .onChange(of: scenePhase) { _, phase in if phase == .active { store.checkDay() } }
        }
    }
    private func addBottle() {
        let amount = store.settings.bottleMl
        store.addBottle()
        withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.24)) { pourAmount = amount }
    }
    private func closePour() {
        withAnimation(reduceMotion ? nil : .easeInOut(duration: 0.24)) { pourAmount = nil }
    }
}

struct ReminderCard: View {
    let language: String
    var onAdd: () -> Void
    var onDismiss: () -> Void
    private func t(_ key: String) -> String { Copy.text(key, language: language) }
    var body: some View {
        VStack(spacing: 12) {
            Text(t("reminderTitle")).font(.headline)
            Text(t("reminderBody"))
            HStack {
                Button(t("add"), action: onAdd).buttonStyle(.borderedProminent)
                Button(t("dismiss"), action: onDismiss).buttonStyle(.bordered)
            }
        }.padding().frame(maxWidth: .infinity)
            .background(.blue.opacity(0.12), in: RoundedRectangle(cornerRadius: 18))
            .accessibilityElement(children: .contain)
    }
}
