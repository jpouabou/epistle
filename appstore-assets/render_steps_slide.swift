import AppKit
import Foundation

let output = "/Users/jeanpouabou/Epistle/appstore-assets/iphone-6_5/05-how-epistle-works.png"
let canvasSize = NSSize(width: 1242, height: 2688)

let background = NSColor(calibratedRed: 247/255, green: 239/255, blue: 226/255, alpha: 1)
let primary = NSColor(calibratedRed: 35/255, green: 20/255, blue: 9/255, alpha: 1)
let secondary = NSColor(calibratedRed: 77/255, green: 51/255, blue: 28/255, alpha: 1)
let accent = NSColor(calibratedRed: 111/255, green: 63/255, blue: 23/255, alpha: 1)
let border = NSColor(calibratedRed: 229/255, green: 214/255, blue: 193/255, alpha: 1)
let card = NSColor(calibratedRed: 255/255, green: 250/255, blue: 243/255, alpha: 1)

let titleFont = NSFont(name: "NewYorkLarge-Bold", size: 78) ?? NSFont.boldSystemFont(ofSize: 78)
let subtitleFont = NSFont(name: "Avenir Next Regular", size: 38) ?? NSFont.systemFont(ofSize: 38)
let stepNumberFont = NSFont(name: "Avenir Next Demi Bold", size: 30) ?? NSFont.boldSystemFont(ofSize: 30)
let stepTitleFont = NSFont(name: "Avenir Next Demi Bold", size: 44) ?? NSFont.boldSystemFont(ofSize: 44)
let stepBodyFont = NSFont(name: "Avenir Next Regular", size: 33) ?? NSFont.systemFont(ofSize: 33)

struct Step {
  let number: String
  let title: String
  let body: String
}

let steps: [Step] = [
  .init(number: "1", title: "Set the appointed hour", body: "Choose when your daily word will arrive."),
  .init(number: "2", title: "Receive an exhortation", body: "A witness such as David, Paul, or John speaks first."),
  .init(number: "3", title: "Read the scripture", body: "Each encounter gives way to the revealed verse."),
  .init(number: "4", title: "Come back tomorrow", body: "One encounter each day. Never rushed. Never repeated."),
]

func paragraphStyle(alignment: NSTextAlignment, lineSpacing: CGFloat = 0) -> NSMutableParagraphStyle {
  let style = NSMutableParagraphStyle()
  style.alignment = alignment
  style.lineBreakMode = .byWordWrapping
  style.lineSpacing = lineSpacing
  return style
}

func drawText(_ text: String, in rect: NSRect, font: NSFont, color: NSColor, alignment: NSTextAlignment = .left, lineSpacing: CGFloat = 0) {
  let attrs: [NSAttributedString.Key: Any] = [
    .font: font,
    .foregroundColor: color,
    .paragraphStyle: paragraphStyle(alignment: alignment, lineSpacing: lineSpacing),
  ]
  let attributed = NSAttributedString(string: text, attributes: attrs)
  attributed.draw(with: rect, options: [.usesLineFragmentOrigin, .usesFontLeading])
}

func roundedRect(_ rect: NSRect, radius: CGFloat) -> NSBezierPath {
  NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
}

func pngData(from image: NSImage) -> Data? {
  guard let tiff = image.tiffRepresentation,
        let rep = NSBitmapImageRep(data: tiff) else { return nil }
  return rep.representation(using: .png, properties: [:])
}

let canvas = NSImage(size: canvasSize)
canvas.lockFocus()

background.setFill()
NSRect(origin: .zero, size: canvasSize).fill()

drawText("How Epistle Works", in: NSRect(x: 100, y: 2310, width: 1042, height: 120), font: titleFont, color: primary, alignment: .center)
drawText("A simple daily rhythm of encounter, scripture, and return.", in: NSRect(x: 120, y: 2200, width: 1002, height: 90), font: subtitleFont, color: secondary, alignment: .center, lineSpacing: 6)

let startY: CGFloat = 1770
let cardHeight: CGFloat = 235
let gap: CGFloat = 72
let cardX: CGFloat = 110
let cardWidth: CGFloat = 1022

for (index, step) in steps.enumerated() {
  let y = startY - CGFloat(index) * (cardHeight + gap)
  let rect = NSRect(x: cardX, y: y, width: cardWidth, height: cardHeight)

  NSGraphicsContext.saveGraphicsState()
  let shadow = NSShadow()
  shadow.shadowColor = NSColor(calibratedWhite: 0, alpha: 0.08)
  shadow.shadowBlurRadius = 20
  shadow.shadowOffset = NSSize(width: 0, height: -4)
  shadow.set()
  card.setFill()
  roundedRect(rect, radius: 34).fill()
  NSGraphicsContext.restoreGraphicsState()

  border.setStroke()
  let outline = roundedRect(rect, radius: 34)
  outline.lineWidth = 2
  outline.stroke()

  let badgeRect = NSRect(x: rect.minX + 28, y: rect.midY - 28, width: 56, height: 56)
  accent.setFill()
  NSBezierPath(ovalIn: badgeRect).fill()
  drawText(step.number, in: NSRect(x: badgeRect.minX, y: badgeRect.minY + 9, width: badgeRect.width, height: 34), font: stepNumberFont, color: .white, alignment: .center)

  drawText(step.title, in: NSRect(x: rect.minX + 110, y: rect.maxY - 78, width: rect.width - 150, height: 52), font: stepTitleFont, color: primary)
  drawText(step.body, in: NSRect(x: rect.minX + 110, y: rect.minY + 42, width: rect.width - 160, height: 90), font: stepBodyFont, color: secondary, lineSpacing: 5)

  if index < steps.count - 1 {
    let lineX = rect.midX
    let lineTop = rect.minY - 18
    let lineBottom = rect.minY - gap + 18
    let path = NSBezierPath()
    path.move(to: NSPoint(x: lineX, y: lineTop))
    path.line(to: NSPoint(x: lineX, y: lineBottom))
    accent.withAlphaComponent(0.24).setStroke()
    path.lineWidth = 5
    path.stroke()
  }
}

drawText("One encounter each day.", in: NSRect(x: 120, y: 120, width: 1002, height: 46), font: subtitleFont, color: accent, alignment: .center)

canvas.unlockFocus()

if let data = pngData(from: canvas) {
  try? FileManager.default.createDirectory(
    at: URL(fileURLWithPath: "/Users/jeanpouabou/Epistle/appstore-assets/iphone-6_5"),
    withIntermediateDirectories: true
  )
  try? data.write(to: URL(fileURLWithPath: output))
  print("Wrote \(output)")
} else {
  fputs("Failed to encode \(output)\n", stderr)
  exit(1)
}
