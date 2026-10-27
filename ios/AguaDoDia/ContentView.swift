import SwiftUI
import Combine
import UIKit

enum NativePalette {
    static let blue = Color(red: 37 / 255, green: 99 / 255, blue: 235 / 255)
    static let page = Color(uiColor: UIColor { $0.userInterfaceStyle == .dark
        ? UIColor(red: 16 / 255, green: 17 / 255, blue: 20 / 255, alpha: 1)
        : UIColor(white: 0.98, alpha: 1) })
    static let surface = Color(uiColor: UIColor { $0.userInterfaceStyle == .dark
        ? UIColor(red: 25 / 255, green: 27 / 255, blue: 32 / 255, alpha: 1) : .white })
    static let border = Color.primary.opacity(0.09)
}

private extension View {
    func waterPanel() -> some View {
        self.padding(22).frame(maxWidth: .infinity, alignment: .leading)
            .background(NativePalette.surface, in: RoundedRectangle(cornerRadius: 18))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(NativePalette.border))
    }
}

private struct PourPresentation: Identifiable {
    let id = UUID()
    let amount: Double
    let container: WaterContainer
}

struct ContentView: View {
    @EnvironmentObject private var store: WaterStore
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var benefits = false
    @State private var remindersOpen = false
    @State private var settingsOpen = false
    @State private var resetOpen = false
    @State private var pourEntry: PourPresentation?
    @State private var lastContainer: WaterContainer = .bottle
    @AccessibilityFocusState private var focusedContainer: WaterContainer?
    private let clock = Timer.publish(every: 30, on: .main, in: .common).autoconnect()

    var body: some View {
        NavigationStack {
            GeometryReader { geometry in
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        if store.reminderVisible {
                            ReminderCard(language: store.settings.language,
                                onAdd: { addWater(.bottle) }, onDismiss: store.dismissReminder)
                        }
                        if benefits {
                            NativeBenefitsView().transition(pageTransition)
                        } else {
                            dashboard(wide: geometry.size.width >= 800).transition(pageTransition)
                        }
                        if store.notificationError {
                            Text(store.text("notificationError")).font(.footnote).foregroundStyle(.secondary)
                        }
                    }
                    .padding(20).frame(maxWidth: 1100).frame(maxWidth: .infinity)
                }
                .background(NativePalette.page)
            }
            .navigationTitle("Sip by Sip")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 8) {
                        Text("Sip by Sip").font(.headline).lineLimit(1).minimumScaleFactor(0.8)
                        streak
                    }
                }
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button { remindersOpen = true } label: { Image(systemName: "bell") }
                        .accessibilityLabel(store.text("reminders"))
                    Button { settingsOpen = true } label: { Image(systemName: "gearshape") }
                        .accessibilityLabel(store.text("settings"))
                }
            }
            .safeAreaInset(edge: .bottom, spacing: 0) { navigationBar }
            .sheet(isPresented: $remindersOpen) { RemindersView(initial: store.settings) }
            .sheet(isPresented: $settingsOpen) { SettingsView(initial: store.settings) }
            .sheet(item: $pourEntry, onDismiss: { focusedContainer = lastContainer }) { entry in
                PourPopup(amount: entry.amount, container: entry.container, onClose: { pourEntry = nil })
                    .presentationDetents([.height(470)])
            }
            .alert(store.text("resetTitle"), isPresented: $resetOpen) {
                Button(store.text("cancel"), role: .cancel) { }
                Button(store.text("reset"), role: .destructive) { store.resetDay() }
            } message: { Text(store.text("resetHelp")) }
            .animation(reduceMotion ? nil : .easeInOut(duration: 0.32), value: benefits)
            .animation(reduceMotion ? nil : .easeInOut(duration: 0.32), value: store.day.totalMl)
            .animation(reduceMotion ? nil : .easeInOut(duration: 0.24), value: store.reminderVisible)
            .onReceive(clock) { _ in store.checkDay() }
            .onChange(of: scenePhase) { _, phase in if phase == .active { store.checkDay() } }
        }.tint(NativePalette.blue)
    }

    private var pageTransition: AnyTransition {
        reduceMotion ? .identity : .opacity.combined(with: .offset(y: 12))
    }
    private var navigationBar: some View {
        HStack(spacing: 6) {
            destination("home", icon: "house", selected: !benefits) { benefits = false }
            destination("benefits", icon: "heart", selected: benefits) { benefits = true }
        }
        .padding(6).frame(maxWidth: 340)
        .background(NativePalette.surface, in: RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(NativePalette.border))
        .padding(.horizontal, 20).padding(.vertical, 8).frame(maxWidth: .infinity)
        .background(NativePalette.page.opacity(0.95))
    }
    private func destination(_ key: String, icon: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 5) {
                Image(systemName: icon).font(.title3)
                Text(store.text(key)).font(.caption.weight(.semibold))
            }.frame(maxWidth: .infinity, minHeight: 50)
                .foregroundStyle(selected ? NativePalette.blue : .secondary)
                .background(selected ? NativePalette.blue.opacity(0.09) : .clear,
                    in: RoundedRectangle(cornerRadius: 13))
        }.buttonStyle(.plain).accessibilityAddTraits(selected ? [.isSelected] : [])
    }
    private func dashboard(wide: Bool) -> some View {
        VStack(alignment: .leading, spacing: 28) {
            VStack(alignment: .leading, spacing: 12) {
                Text(store.text("dailyOverview")).font(.caption2.bold()).tracking(2).foregroundStyle(NativePalette.blue)
                Text(store.text("dashboardTitle")).font(.system(.largeTitle, design: .default, weight: .semibold))
                    .accessibilityAddTraits(.isHeader)
                dateLabel
            }
            VStack(spacing: 22) {
                HStack(alignment: .top) {
                    Label(store.text("consumption"), systemImage: "drop").font(.subheadline.bold())
                    Spacer()
                    Text(store.text(store.progress >= 1 ? "buddyComplete" : "buddyStart"))
                        .font(.caption).foregroundStyle(.secondary).multilineTextAlignment(.trailing)
                }
                Divider()
                if wide {
                    HStack(spacing: 40) { progress.frame(maxWidth: .infinity); actions.frame(maxWidth: .infinity) }
                } else {
                    progress
                    Divider()
                    actions
                }
            }.waterPanel()
            Text(store.text("history")).font(.title2.weight(.semibold)).accessibilityAddTraits(.isHeader)
            if wide {
                Grid(alignment: .topLeading, horizontalSpacing: 20) {
                    GridRow {
                        NativeCalendarView().frame(maxHeight: .infinity, alignment: .top).waterPanel()
                        NativeWaterMetrics().frame(maxHeight: .infinity, alignment: .top).waterPanel()
                    }
                }
            } else {
                NativeCalendarView().waterPanel()
                NativeWaterMetrics().waterPanel()
            }
            HStack {
                Spacer()
                Button(store.text("reset")) { resetOpen = true }
                    .font(.footnote).foregroundStyle(.secondary).frame(minHeight: 44)
                    .disabled(store.day.totalMl == 0 && store.day.bottles == 0)
            }
        }
    }
    private var streak: some View {
        HStack(spacing: 5) {
            Image(systemName: "flame")
            Text("\(store.streak) \(store.text(store.streak == 1 ? "day" : "days"))")
                .lineLimit(1).fixedSize()
        }.font(.caption.weight(.semibold)).foregroundStyle(NativePalette.blue)
            .padding(.horizontal, 8).padding(.vertical, 6)
            .background(NativePalette.blue.opacity(0.08), in: RoundedRectangle(cornerRadius: 9))
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("\(store.text("streak")): \(store.streak) \(store.text(store.streak == 1 ? "day" : "days"))")
    }
    private var dateLabel: some View {
        HStack(spacing: 7) {
            Circle().fill(NativePalette.blue).frame(width: 5, height: 5).accessibilityHidden(true)
            Text(Date().formatted(.dateTime.weekday(.wide).day().month(.wide)
                .locale(Locale(identifier: store.settings.language))))
                .font(.caption).foregroundStyle(.secondary)
        }
    }
    private var progress: some View {
        VStack(spacing: 20) {
            ZStack {
                Circle().stroke(NativePalette.border, lineWidth: 5)
                Circle().trim(from: 0, to: store.progress)
                    .stroke(NativePalette.blue, style: StrokeStyle(lineWidth: 5, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                VStack(spacing: 9) {
                    Text(store.volume(store.day.totalMl)).font(.system(size: 40, weight: .semibold))
                        .minimumScaleFactor(0.6).lineLimit(1).contentTransition(.numericText())
                    Text("\(store.text("of")) \(store.number(store.settings.goalLiters)) L \(store.text("today"))")
                        .font(.caption).foregroundStyle(.secondary)
                    Text("\(Int(store.progress * 100))%").font(.caption.bold()).foregroundStyle(NativePalette.blue)
                }.padding(22)
            }.frame(width: 200, height: 200)
                .accessibilityElement(children: .combine).accessibilityLabel(store.text("progress"))
            Text(store.progress >= 1 ? store.text("success") : "\(store.text("remainingToday")) \(store.volume(store.remainingMl))")
                .font(.caption).foregroundStyle(store.progress >= 1 ? NativePalette.blue : .secondary)
        }.frame(maxWidth: .infinity).padding(.vertical, 8)
    }
    private var actions: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(store.text("addDrink")).font(.title3.weight(.semibold))
            Text(store.text("chooseContainer")).font(.caption).foregroundStyle(.secondary)
            HStack(spacing: 10) {
                waterButton(.bottle)
                waterButton(.glass)
            }
            Button { store.undoWater() } label: {
                Label(store.text("undo"), systemImage: "arrow.uturn.backward")
                    .font(.caption).frame(maxWidth: .infinity, minHeight: 44)
            }.foregroundStyle(.secondary).disabled(store.day.entries.isEmpty)
        }
    }
    private func waterButton(_ container: WaterContainer) -> some View {
        Button { addWater(container) } label: {
            VStack(spacing: 5) {
                Image(systemName: container.symbol).font(.title2)
                Text(store.text(container.rawValue + "Choice")).font(.subheadline.bold())
                Text("\(store.number(store.size(container))) ml").font(.caption)
            }.frame(maxWidth: .infinity, minHeight: 94)
                .foregroundStyle(container == .bottle ? .white : NativePalette.blue)
                .background(container == .bottle ? NativePalette.blue : NativePalette.blue.opacity(0.08),
                    in: RoundedRectangle(cornerRadius: 12))
        }.buttonStyle(.plain).accessibilityFocused($focusedContainer, equals: container)
            .accessibilityLabel("\(store.text(container == .bottle ? "add" : "addGlass")), \(store.number(store.size(container))) ml")
    }
    private func addWater(_ container: WaterContainer) {
        store.checkDay()
        let amount = store.size(container)
        store.addWater(container)
        lastContainer = container
        pourEntry = PourPresentation(amount: amount, container: container)
    }
}

private struct NativeWaterMetrics: View {
    @EnvironmentObject private var store: WaterStore
    @State private var editing = false
    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Text(store.text("bottleLog")).font(.headline)
            HStack {
                metric(.bottle)
                Divider()
                metric(.glass)
            }.padding(14).background(NativePalette.blue.opacity(0.04), in: RoundedRectangle(cornerRadius: 12))
            Button { editing = true } label: { Label(store.text("changeSize"), systemImage: "drop").font(.footnote).padding(5) }
                .buttonStyle(.bordered).frame(maxWidth: .infinity)
            Text("\(store.day.count(.bottle)) \(store.text("bottlesShort")) · \(store.day.count(.glass)) \(store.text("glassesShort"))")
                .font(.caption).foregroundStyle(.secondary)
            if !store.day.entries.isEmpty {
                HStack(spacing: 6) {
                    ForEach(Array(store.day.entries.suffix(12).enumerated()), id: \.offset) { _, entry in
                        Image(systemName: entry.container.symbol).foregroundStyle(NativePalette.blue)
                    }
                }.accessibilityHidden(true)
            }
            Divider()
            HStack {
                Text(store.text("remaining")).font(.caption).foregroundStyle(.secondary)
                Spacer()
                Text(store.volume(store.remainingMl)).font(.title3.bold())
            }
            if store.remainingMl > 0 {
                VStack(spacing: 12) {
                    Text(store.text("remainingOptionsHelp")).font(.caption).foregroundStyle(.secondary)
                    HStack(alignment: .center, spacing: 12) {
                        remaining(.bottle)
                        Text(store.text("or")).font(.caption).foregroundStyle(.secondary)
                        remaining(.glass)
                    }.padding(16).background(NativePalette.blue.opacity(0.04), in: RoundedRectangle(cornerRadius: 12))
                }.frame(maxWidth: .infinity)
            }
        }.sheet(isPresented: $editing) { SettingsView(initial: store.settings) }
    }
    private func metric(_ container: WaterContainer) -> some View {
        VStack(spacing: 8) {
            Label(store.text(container.rawValue + "Choice"), systemImage: container.symbol).font(.caption).foregroundStyle(.secondary)
            Text("\(store.number(store.size(container))) ml").font(.title3.bold())
        }.frame(maxWidth: .infinity)
    }
    private func remaining(_ container: WaterContainer) -> some View {
        VStack(spacing: 7) {
            Text("\(store.needed(container)) \(store.text(container == .bottle ? "bottlesShort" : "glassesShort"))")
                .font(.caption.bold()).foregroundStyle(NativePalette.blue)
            Text("\(store.number(store.size(container))) ml").font(.caption2).foregroundStyle(.secondary)
            Image(systemName: container.symbol).font(.title2).foregroundStyle(.secondary.opacity(0.5))
        }.frame(maxWidth: .infinity).multilineTextAlignment(.center)
    }
}

private struct NativeCalendarView: View {
    @EnvironmentObject private var store: WaterStore
    @State private var selectedMonth = Date()
    private var calendar: Calendar { Calendar.current }
    private var current: String { LocalDay.key() }
    private var currentMonth: Date { monthStart(Date()) }
    private var firstMonth: Date { min(monthStart(LocalDay.date(store.history.startedOn) ?? Date()), currentMonth) }
    private var visibleMonth: Date { min(max(monthStart(selectedMonth), firstMonth), currentMonth) }
    private func monthStart(_ date: Date) -> Date { calendar.dateInterval(of: .month, for: date)!.start }

    var body: some View {
        let first = visibleMonth
        let count = calendar.range(of: .day, in: .month, for: first)!.count
        let offset = (calendar.component(.weekday, from: first) - calendar.firstWeekday + 7) % 7
        let locale = Locale(identifier: store.settings.language)
        VStack(alignment: .leading, spacing: 18) {
            Text(store.text("calendarEyebrow")).font(.caption2.bold()).tracking(1.5).foregroundStyle(NativePalette.blue)
            Text(store.text("calendarTitle")).font(.title2.weight(.semibold))
            Text(store.text("calendarHelp")).font(.caption).foregroundStyle(.secondary)
            HStack {
                monthButton(-1, key: "previousMonth", disabled: first <= firstMonth)
                Spacer()
                Text(first.formatted(.dateTime.month(.wide).year().locale(locale))).font(.subheadline.bold())
                Spacer()
                monthButton(1, key: "nextMonth", disabled: first >= currentMonth)
            }
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 4), count: 7), spacing: 5) {
                ForEach(0..<7, id: \.self) { index in
                    let weekday = (calendar.firstWeekday - 1 + index) % 7
                    Text(weekdayLabel(weekday, locale: locale)).font(.caption2).foregroundStyle(.secondary)
                }
                ForEach(0..<offset, id: \.self) { _ in Color.clear.frame(height: 64).accessibilityHidden(true) }
                ForEach(1...count, id: \.self) { day in
                    let date = calendar.date(byAdding: .day, value: day - 1, to: first)!
                    dayCell(day, date: date, locale: locale)
                }
            }
            DisclosureGroup(store.text("calendarLegend")) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("✓ \(store.text("calendarCompleted"))")
                    Text("× \(store.text("calendarMissed"))")
                    Text("· \(store.text("calendarPending"))")
                    Text("— \(store.text("calendarNoData"))")
                }.font(.caption).foregroundStyle(.secondary).padding(.top, 8)
            }.font(.caption)
        }
    }
    private func weekdayLabel(_ index: Int, locale: Locale) -> String {
        let formatter = DateFormatter()
        formatter.locale = locale
        return formatter.veryShortWeekdaySymbols[index]
    }
    private func monthButton(_ delta: Int, key: String, disabled: Bool) -> some View {
        Button {
            selectedMonth = calendar.date(byAdding: .month, value: delta, to: visibleMonth) ?? Date()
        } label: { Image(systemName: delta < 0 ? "chevron.left" : "chevron.right").frame(width: 44, height: 44) }
            .buttonStyle(.bordered).disabled(disabled).accessibilityLabel(store.text(key))
    }
    private func dayCell(_ day: Int, date: Date, locale: Locale) -> some View {
        let key = LocalDay.key(date)
        let future = key > current
        let completed = !future && store.history.completedDays.contains(key)
        let known = key == current ? store.day.totalMl : store.history.days[key]?.totalMl
        let tracked = key >= store.history.startedOn
        let status = future ? "calendarFuture" : completed ? "calendarCompleted" : !tracked ? "calendarNoData"
            : key == current ? "calendarPending" : "calendarMissed"
        let symbol = future || !tracked ? "—" : completed ? "✓" : key == current ? "·" : "×"
        let volume = future ? "" : known.map { store.volume($0) } ?? store.text("calendarNoData")
        return VStack(spacing: 4) {
            Text("\(day)").font(.caption.bold())
            Text(symbol).font(.caption2)
            Text(volume).font(.system(size: 9)).multilineTextAlignment(.center).minimumScaleFactor(0.7)
        }.frame(maxWidth: .infinity, minHeight: 64).padding(.horizontal, 1)
            .foregroundStyle(completed || key == current ? NativePalette.blue : .secondary)
            .background(NativePalette.blue.opacity(completed || key == current ? 0.08 : 0.025), in: RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).stroke(key == current ? NativePalette.blue : .clear, lineWidth: 1.5))
            .opacity(future ? 0.45 : 1)
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("\(date.formatted(.dateTime.day().month(.wide).year().locale(locale))): \(store.text(status)), \(volume)")
    }
}

private struct NativeBenefitsView: View {
    @EnvironmentObject private var store: WaterStore
    var body: some View {
        VStack(alignment: .leading, spacing: 22) {
            Text(store.text("benefits")).font(.caption.bold()).foregroundStyle(NativePalette.blue)
            Text(store.text("benefitsTitle")).font(.largeTitle.weight(.semibold))
            Text(store.text("benefitsIntro")).foregroundStyle(.secondary)
            ForEach(0..<4, id: \.self) { index in
                DisclosureGroup(store.text("benefitTitle\(index)")) {
                    Text(store.text("benefitBody\(index)")).font(.subheadline).foregroundStyle(.secondary).padding(.top, 10)
                }.font(.headline).waterPanel()
            }
            Link(store.text("benefitsSource"), destination: URL(string: "https://www.cdc.gov/healthy-weight-growth/water-healthy-drinks/")!)
                .font(.footnote).frame(minHeight: 44)
        }
    }
}

struct ReminderCard: View {
    let language: String
    var onAdd: () -> Void
    var onDismiss: () -> Void
    private func t(_ key: String) -> String { Copy.text(key, language: language) }
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(t("reminderTitle")).font(.headline)
            Text(t("reminderBody")).font(.subheadline).foregroundStyle(.secondary)
            HStack {
                Button(t("add"), action: onAdd).buttonStyle(.borderedProminent)
                Button(t("dismiss"), action: onDismiss).buttonStyle(.bordered)
            }
        }.waterPanel().accessibilityElement(children: .contain)
    }
}
