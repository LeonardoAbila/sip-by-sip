import SwiftUI

struct PourPopup: View {
    @EnvironmentObject private var store: WaterStore
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let amount: Double
    var onClose: () -> Void
    @State private var pouring = false
    @State private var filled = false

    var body: some View {
        VStack(spacing: 12) {
            HStack { Spacer(); Button(action: onClose) { Image(systemName: "xmark.circle.fill").font(.title2) }.accessibilityLabel(store.text("close")) }
            Text(store.text("added")).font(.title2.bold())
            Text("+\(store.number(amount)) ml").font(.title.bold()).foregroundStyle(.blue)
            ZStack {
                // The open spout sits directly above the falling stream.
                ZStack {
                    RoundedRectangle(cornerRadius: 16).stroke(.blue, lineWidth: 7)
                        .frame(width: 36, height: 54).offset(x: -46, y: 0)
                    JugShape().fill(.cyan.opacity(0.4))
                    JugShape().stroke(.blue, lineWidth: 3)
                    Capsule().fill(.white.opacity(0.6)).frame(width: 5, height: 48).offset(x: -20, y: 10)
                }.frame(width: 126, height: 110)
                    .rotationEffect(.degrees(pouring ? 30 : 0), anchor: UnitPoint(x: 1, y: 0.2))
                    .offset(x: -45, y: -75)
                Capsule().fill(.cyan.opacity(0.8)).frame(width: 8, height: 72)
                    .opacity(pouring && !reduceMotion ? 1 : 0).offset(x: 18, y: -12)
                ZStack(alignment: .bottom) {
                    RoundedRectangle(cornerRadius: 18).fill(.cyan.opacity(0.12))
                    RoundedRectangle(cornerRadius: 14).fill(.blue.opacity(0.7))
                        .frame(height: filled ? 102 : 0).padding(5)
                    RoundedRectangle(cornerRadius: 18).stroke(.blue, lineWidth: 3)
                    Image(systemName: "drop.fill").font(.title).foregroundStyle(.white)
                }.frame(width: 72, height: 125).offset(x: 18, y: 82)
            }.frame(height: 290).accessibilityHidden(true)
        }.padding(20).frame(maxWidth: 360)
            .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 28))
            .shadow(radius: 24)
            .accessibilityAddTraits(.isModal)
            .task {
                if reduceMotion { filled = true }
                else {
                    withAnimation(.easeInOut(duration: 0.5)) { pouring = true }
                    do { try await Task.sleep(for: .milliseconds(400)) } catch { return }
                    withAnimation(.easeInOut(duration: 1.8)) { filled = true }
                    do { try await Task.sleep(for: .milliseconds(1900)) } catch { return }
                    withAnimation(.easeInOut(duration: 0.4)) { pouring = false }
                }
                do { try await Task.sleep(for: .milliseconds(reduceMotion ? 2000 : 800)) } catch { return }
                onClose()
            }
    }
}

private struct JugShape: Shape {
    func path(in rect: CGRect) -> Path {
        let w = rect.width, h = rect.height
        var path = Path()
        path.move(to: CGPoint(x: w * 0.18, y: h * 0.12))
        path.addLine(to: CGPoint(x: w * 0.62, y: h * 0.12))
        path.addLine(to: CGPoint(x: w, y: h * 0.2))
        path.addLine(to: CGPoint(x: w * 0.76, y: h * 0.38))
        path.addLine(to: CGPoint(x: w * 0.7, y: h * 0.86))
        path.addQuadCurve(to: CGPoint(x: w * 0.58, y: h * 0.96), control: CGPoint(x: w * 0.69, y: h * 0.96))
        path.addLine(to: CGPoint(x: w * 0.28, y: h * 0.96))
        path.addQuadCurve(to: CGPoint(x: w * 0.18, y: h * 0.84), control: CGPoint(x: w * 0.18, y: h * 0.96))
        path.closeSubpath()
        return path
    }
}
