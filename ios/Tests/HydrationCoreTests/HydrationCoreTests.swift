import XCTest
@testable import HydrationCore

final class HydrationCoreTests: XCTestCase {
    func testLegacySettingsRetainValuesAndDefaultGlassSize() throws {
        let bytes = Data(#"{"bottleMl":750,"goalLiters":3,"language":"es","theme":"dark","reminders":true,"minutes":60,"sound":false}"#.utf8)
        let settings = try JSONDecoder().decode(WaterSettings.self, from: bytes)
        XCTAssertEqual(settings.glassMl, 250)
        XCTAssertEqual(settings.bottleMl, 750)
        XCTAssertEqual(settings.goalLiters, 3)
        XCTAssertEqual(settings.language, "es")
        XCTAssertTrue(settings.reminders)
    }
    func testInvalidVolumesCannotMutateProgress() {
        var day = WaterDay()
        for amount in [0, -1, 0.001, .infinity, .nan, 1_000_001] { day.add(amount, container: .bottle) }
        XCTAssertEqual(day.totalMl, 0)
        XCTAssertTrue(day.entries.isEmpty)
    }
    func testUndoUsesRecordedSizeAndContainerAfterReload() throws {
        var day = WaterDay()
        day.add(500, container: .bottle)
        day.add(250, container: .glass)
        day = try JSONDecoder().decode(WaterDay.self, from: JSONEncoder().encode(day))
        day.undo()
        XCTAssertEqual(day.totalMl, 500)
        XCTAssertEqual(day.count(.glass), 0)
        XCTAssertEqual(day.count(.bottle), 1)
    }
    func testDecimalEntriesRemainExact() {
        var day = WaterDay()
        day.add(0.1, container: .glass)
        day.add(0.2, container: .glass)
        XCTAssertEqual(day.totalMl, 0.3)
        day.undo()
        XCTAssertEqual(day.totalMl, 0.1)
    }
    func testLegacyTotalIsNotInventedAsUndoableEntries() throws {
        struct LegacyDay: Encodable { var date = Date(); var bottles = 3; var totalMl = 1250.0 }
        var day = try JSONDecoder().decode(WaterDay.self, from: JSONEncoder().encode(LegacyDay()))
        day.undo()
        XCTAssertEqual(day.totalMl, 1250)
        XCTAssertEqual(day.count(.bottle), 3)
        day.add(250, container: .glass)
        day.undo()
        XCTAssertEqual(day.totalMl, 1250)
    }
    func testKnownZeroAndUnknownDaysRemainDifferent() {
        var history = WaterHistory()
        history.record(WaterDay(), on: "2026-10-26", goalLiters: 2)
        XCTAssertEqual(history.days["2026-10-26"]?.totalMl, 0)
        XCTAssertNil(history.days["2026-10-25"])
    }
    func testResetAndRaisedGoalPreserveCompletedDates() {
        var history = WaterHistory()
        var day = WaterDay()
        day.add(2000, container: .bottle)
        history.record(day, on: "2026-10-26", goalLiters: 2)
        history.record(WaterDay(), on: "2026-10-26", goalLiters: 3)
        XCTAssertTrue(history.completedDays.contains("2026-10-26"))
        XCTAssertEqual(history.streak(on: "2026-10-26"), 1)
    }
    func testStreakCrossesYearAndKeepsYesterdayUntilTodayEnds() {
        var history = WaterHistory()
        history.completedDays = ["2025-12-30", "2025-12-31", "2026-01-01"]
        XCTAssertEqual(history.streak(on: "2026-01-01"), 3)
        XCTAssertEqual(history.streak(on: "2026-01-02"), 3)
        XCTAssertEqual(history.streak(on: "2026-01-03"), 0)
    }
    func testFutureSnapshotsAndEntriesSurviveHistoryReload() throws {
        var history = WaterHistory()
        var day = WaterDay()
        day.add(750, container: .bottle)
        history.record(day, on: "2027-01-01", goalLiters: 2)
        history = try JSONDecoder().decode(WaterHistory.self, from: JSONEncoder().encode(history))
        XCTAssertEqual(history.days["2027-01-01"]?.entries.first?.amountMl, 750)
    }
    func testDayKeysFollowLocalCalendarAcrossTimeZones() {
        let instant = Date(timeIntervalSince1970: 1_792_021_800)
        var west = Calendar(identifier: .gregorian)
        west.timeZone = TimeZone(secondsFromGMT: -10 * 3600)!
        var east = west
        east.timeZone = TimeZone(secondsFromGMT: 14 * 3600)!
        XCTAssertNotEqual(LocalDay.key(instant, calendar: west), LocalDay.key(instant, calendar: east))
        let key = LocalDay.key(instant, calendar: east)
        XCTAssertEqual(LocalDay.key(LocalDay.date(key, calendar: east)!, calendar: east), key)
    }
}
