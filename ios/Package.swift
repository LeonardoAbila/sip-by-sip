// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "HydrationCore",
    products: [.library(name: "HydrationCore", targets: ["HydrationCore"])],
    targets: [
        .target(name: "HydrationCore", path: "AguaDoDia",
            exclude: ["AguaDoDiaApp.swift", "ContentView.swift", "Copy.swift", "PourPopup.swift",
                "SettingsView.swift", "WaterStore.swift", "Resources"], sources: ["HydrationData.swift"]),
        .testTarget(name: "HydrationCoreTests", dependencies: ["HydrationCore"], path: "Tests/HydrationCoreTests")
    ]
)
