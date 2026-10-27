import Foundation

enum WaterContainer: String, Codable {
    case bottle, glass
    var symbol: String { self == .bottle ? "waterbottle" : "cup.and.saucer" }
}

struct WaterEntry: Codable, Equatable {
    var amountMl: Double
    var container: WaterContainer
}

struct WaterSettings: Codable {
    var bottleMl = 500.0
    var glassMl = 250.0
    var goalLiters = 2.0
    var language = "pt-BR"
    var theme = "system"
    var reminders = false
    var minutes = 30
    var sound = true

    init() {}
    enum CodingKeys: String, CodingKey {
        case bottleMl, glassMl, goalLiters, language, theme, reminders, minutes, sound
    }
    // Existing installations have no glass size; keep their other preferences.
    init(from decoder: Decoder) throws {
        let values = try decoder.container(keyedBy: CodingKeys.self)
        bottleMl = try values.decodeIfPresent(Double.self, forKey: .bottleMl) ?? 500
        glassMl = try values.decodeIfPresent(Double.self, forKey: .glassMl) ?? 250
        goalLiters = try values.decodeIfPresent(Double.self, forKey: .goalLiters) ?? 2
        language = try values.decodeIfPresent(String.self, forKey: .language) ?? "pt-BR"
        theme = try values.decodeIfPresent(String.self, forKey: .theme) ?? "system"
        reminders = try values.decodeIfPresent(Bool.self, forKey: .reminders) ?? false
        minutes = try values.decodeIfPresent(Int.self, forKey: .minutes) ?? 30
        sound = try values.decodeIfPresent(Bool.self, forKey: .sound) ?? true
    }
    mutating func validate() {
        if !validWaterVolume(bottleMl) { bottleMl = 500 }
        if !validWaterVolume(glassMl) { glassMl = 250 }
        if !goalLiters.isFinite || goalLiters <= 0 || goalLiters > 1_000_000 { goalLiters = 2 }
        if ![15, 30, 60, 120].contains(minutes) { minutes = 30 }
        if !["pt-BR", "en", "es"].contains(language) { language = "pt-BR" }
        if !["system", "light", "dark"].contains(theme) { theme = "system" }
    }
}

func validWaterVolume(_ amount: Double) -> Bool {
    amount.isFinite && amount >= 0.01 && amount <= 1_000_000
        && abs(amount * 100 - (amount * 100).rounded()) < 0.000001
}

struct WaterDay: Codable {
    var date: Date
    var bottles: Int
    var totalMl: Double
    var entries: [WaterEntry]

    init(date: Date = Date(), bottles: Int = 0, totalMl: Double = 0, entries: [WaterEntry] = []) {
        self.date = date
        self.bottles = bottles
        self.totalMl = totalMl
        self.entries = entries
    }
    enum CodingKeys: String, CodingKey { case date, bottles, totalMl, entries }
    init(from decoder: Decoder) throws {
        let values = try decoder.container(keyedBy: CodingKeys.self)
        date = try values.decode(Date.self, forKey: .date)
        bottles = max(try values.decode(Int.self, forKey: .bottles), 0)
        totalMl = try values.decode(Double.self, forKey: .totalMl)
        if !totalMl.isFinite || totalMl < 0 || totalMl * 100 > 9_007_199_254_740_991 { totalMl = 0 }
        entries = try values.decodeIfPresent([WaterEntry].self, forKey: .entries) ?? []
        if entries.contains(where: { !validWaterVolume($0.amountMl) }) || entries.count > bottles
            || entries.reduce(0, { $0 + ($1.amountMl * 100).rounded() }) > (totalMl * 100).rounded() {
            entries = []
        }
    }
    mutating func add(_ amount: Double, container: WaterContainer) {
        guard validWaterVolume(amount) else { return }
        let units = (totalMl * 100).rounded() + (amount * 100).rounded()
        guard units <= 9_007_199_254_740_991, bottles < Int.max else { return }
        totalMl = units / 100
        bottles += 1
        entries.append(WaterEntry(amountMl: amount, container: container))
    }
    mutating func undo() {
        guard let entry = entries.popLast() else { return }
        totalMl = max(0, ((totalMl * 100).rounded() - (entry.amountMl * 100).rounded()) / 100)
        bottles = max(0, bottles - 1)
    }
    func count(_ container: WaterContainer) -> Int {
        let recorded = entries.filter { $0.container == container }.count
        // The old native app only recorded bottles; preserve their count.
        return recorded + (container == .bottle ? max(0, bottles - entries.count) : 0)
    }
}

enum LocalDay {
    static func key(_ date: Date = Date(), calendar: Calendar = .current) -> String {
        let parts = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year!, parts.month!, parts.day!)
    }
    static func date(_ key: String, calendar: Calendar = .current) -> Date? {
        let parts = key.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return nil }
        let components = DateComponents(year: parts[0], month: parts[1], day: parts[2], hour: 12)
        guard let date = calendar.date(from: components), Self.key(date, calendar: calendar) == key else { return nil }
        return date
    }
}

struct WaterHistory: Codable {
    var days: [String: WaterDay] = [:]
    var completedDays: Set<String> = []
    var startedOn: String = LocalDay.key()

    mutating func record(_ day: WaterDay, on key: String, goalLiters: Double) {
        days[key] = day
        startedOn = min(startedOn, key)
        if day.totalMl >= goalLiters * 1000 { completedDays.insert(key) }
    }
    func streak(on key: String = LocalDay.key(), calendar: Calendar = .current) -> Int {
        guard var date = LocalDay.date(key, calendar: calendar) else { return 0 }
        if !completedDays.contains(key) {
            guard let previous = calendar.date(byAdding: .day, value: -1, to: date) else { return 0 }
            date = previous
        }
        var count = 0
        while completedDays.contains(LocalDay.key(date, calendar: calendar)) {
            count += 1
            guard let previous = calendar.date(byAdding: .day, value: -1, to: date) else { break }
            date = previous
        }
        return count
    }
}
