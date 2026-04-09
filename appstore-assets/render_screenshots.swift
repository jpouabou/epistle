import AppKit
import Foundation

struct Spec {
  let input: String
  let output: String
  let headline: String
  let subhead: String
}

let root = "/Users/jeanpouabou/Epistle/appstore-assets/iphone-6_5"
let specs: [Spec] = [
  .init(
    input: "/Users/jeanpouabou/Downloads/4C47E7CD-C82D-4E8D-8ADD-23432272FB86.JPG",
    output: "\(root)/01-receive-one-word-each-day.png",
    headline: "Receive One Word Each Day",
    subhead: "A daily encounter, given once at your appointed hour."
  ),
  .init(
    input: "/Users/jeanpouabou/Downloads/A92D825D-A2E5-4E41-A5E5-377E923BFAE5.JPG",
    output: "\(root)/02-biblical-witnesses-speak.png",
    headline: "Biblical Witnesses Speak",
    subhead: "David, Paul, and John offer devotional exhortation before scripture is revealed."
  ),
  .init(
    input: "/Users/jeanpouabou/Downloads/15B62CED-6E5B-4F6B-8E5B-22C5D7C16D41.PNG",
    output: "\(root)/03-choose-your-appointed-time.png",
    headline: "Choose Your Appointed Time",
    subhead: "Set the hour your daily word will be received."
  ),
  .init(
    input: "/Users/jeanpouabou/Downloads/Screenshot 2026-04-06 at 11.22.22 AM.png",
    output: "\(root)/04-scripture-revealed-after-each-encounter.png",
    headline: "Scripture Revealed After Each Encounter",
    subhead: "Each visitation ends in the living word."
  ),
]

let canvasSize = NSSize(width: 1242, height: 2688)
let background = NSColor(calibratedRed: 246/255, green: 238/255, blue: 223/255, alpha: 1)
let titleColor = NSColor(calibratedRed: 29/255, green: 24/255, blue: 20/255, alpha: 1)
let subColor = NSColor(calibratedRed: 111/255, green: 98/255, blue: 87/255, alpha: 1)

let titleFont = NSFont(name: "NewYorkLarge-Bold", size: 78) ?? NSFont.boldSystemFont(ofSize: 78)
let subFont = NSFont(name: "Avenir Next Regular", size: 39) ?? NSFont.systemFont(ofSize: 39, weight: .regular)

func paragraphStyle(alignment: NSTextAlignment, lineSpacing: CGFloat = 0) -> NSMutableParagraphStyle {
  let style = NSMutableParagraphStyle()
  style.alignment = alignment
  style.lineBreakMode = .byWordWrapping
  style.lineSpacing = lineSpacing
  return style
}

func drawCenteredText(
  _ text: String,
  in rect: NSRect,
  font: NSFont,
  color: NSColor,
  lineSpacing: CGFloat = 0
) {
  let attrs: [NSAttributedString.Key: Any] = [
    .font: font,
    .foregroundColor: color,
    .paragraphStyle: paragraphStyle(alignment: .center, lineSpacing: lineSpacing),
  ]
  let attributed = NSAttributedString(string: text, attributes: attrs)
  let bounds = attributed.boundingRect(with: rect.size, options: [.usesLineFragmentOrigin, .usesFontLeading])
  let drawRect = NSRect(
    x: rect.minX,
    y: rect.minY + (rect.height - bounds.height) / 2,
    width: rect.width,
    height: bounds.height
  )
  attributed.draw(with: drawRect, options: [.usesLineFragmentOrigin, .usesFontLeading])
}

func roundedRectPath(_ rect: NSRect, radius: CGFloat) -> NSBezierPath {
  NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
}

func pngData(from image: NSImage) -> Data? {
  guard let tiff = image.tiffRepresentation,
        let rep = NSBitmapImageRep(data: tiff) else { return nil }
  return rep.representation(using: .png, properties: [:])
}

for spec in specs {
  guard let screenshot = NSImage(contentsOfFile: spec.input) else {
    fputs("Failed to load \(spec.input)\n", stderr)
    continue
  }

  let canvas = NSImage(size: canvasSize)
  canvas.lockFocus()

  background.setFill()
  NSRect(origin: .zero, size: canvasSize).fill()

  let titleRect = NSRect(x: 90, y: canvasSize.height - 470, width: canvasSize.width - 180, height: 220)
  let subRect = NSRect(x: 130, y: canvasSize.height - 620, width: canvasSize.width - 260, height: 150)
  drawCenteredText(spec.headline, in: titleRect, font: titleFont, color: titleColor, lineSpacing: 2)
  drawCenteredText(spec.subhead, in: subRect, font: subFont, color: subColor, lineSpacing: 8)

  let maxShotWidth: CGFloat = 760
  let scale = maxShotWidth / screenshot.size.width
  let shotSize = NSSize(width: screenshot.size.width * scale, height: screenshot.size.height * scale)
  let shotRect = NSRect(x: (canvasSize.width - shotSize.width) / 2, y: 190, width: shotSize.width, height: shotSize.height)

  NSGraphicsContext.current?.imageInterpolation = .high

  NSGraphicsContext.saveGraphicsState()
  let shadow = NSShadow()
  shadow.shadowColor = NSColor(calibratedWhite: 0, alpha: 0.14)
  shadow.shadowBlurRadius = 32
  shadow.shadowOffset = NSSize(width: 0, height: -8)
  shadow.set()

  let clipPath = roundedRectPath(shotRect, radius: 46)
  clipPath.addClip()
  screenshot.draw(in: shotRect)

  NSGraphicsContext.restoreGraphicsState()

  canvas.unlockFocus()

  if let data = pngData(from: canvas) {
    try? FileManager.default.createDirectory(
      at: URL(fileURLWithPath: root),
      withIntermediateDirectories: true
    )
    try? data.write(to: URL(fileURLWithPath: spec.output))
    print("Wrote \(spec.output)")
  } else {
    fputs("Failed to encode \(spec.output)\n", stderr)
  }
}
