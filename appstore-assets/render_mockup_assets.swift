import AppKit
import Foundation

struct Spec {
  let input: String
  let output: String
  let headline: String
  let subhead: String
}

let root = "/Users/jeanpouabou/Epistle/appstore-assets/iphone-6_5-mockups"
let specs: [Spec] = [
  .init(
    input: "/Users/jeanpouabou/Downloads/apple-iphone-15-yellow-mockup-2/4C47E7CD-C82D-4E8D-8ADD-23432272FB86-portrait.png",
    output: "\(root)/01-receive-one-word-each-day-mockup.png",
    headline: "Receive One Word Each Day",
    subhead: "A daily encounter, given once at your appointed hour."
  ),
  .init(
    input: "/Users/jeanpouabou/Downloads/apple-iphone-15-yellow-mockup/A92D825D-A2E5-4E41-A5E5-377E923BFAE5-portrait.png",
    output: "\(root)/02-biblical-witnesses-speak-mockup.png",
    headline: "Biblical Witnesses Speak",
    subhead: "David, Paul, and John offer devotional exhortation before scripture is revealed."
  ),
  .init(
    input: "/Users/jeanpouabou/Downloads/apple-iphone-15-yellow-mockup-3/15B62CED-6E5B-4F6B-8E5B-22C5D7C16D41-portrait.png",
    output: "\(root)/03-choose-your-appointed-time-mockup.png",
    headline: "Choose Your Appointed Time",
    subhead: "Set the hour your daily word will be received."
  ),
  .init(
    input: "/Users/jeanpouabou/Downloads/apple-iphone-15-yellow-mockup-4/Screenshot 2026-04-06 at 11.22.22 AM-portrait.png",
    output: "\(root)/04-scripture-revealed-after-each-encounter-mockup.png",
    headline: "Scripture Revealed After Each Encounter",
    subhead: "Each visitation ends in the living word."
  ),
]

let canvasSize = NSSize(width: 1242, height: 2688)
let background = NSColor(calibratedRed: 247/255, green: 239/255, blue: 226/255, alpha: 1)
let titleColor = NSColor(calibratedRed: 35/255, green: 20/255, blue: 9/255, alpha: 1)
let subColor = NSColor(calibratedRed: 115/255, green: 85/255, blue: 57/255, alpha: 1)

let titleFont = NSFont(name: "NewYorkLarge-Bold", size: 76) ?? NSFont.boldSystemFont(ofSize: 76)
let subFont = NSFont(name: "Avenir Next Regular", size: 38) ?? NSFont.systemFont(ofSize: 38)

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

func pngData(from image: NSImage) -> Data? {
  guard let tiff = image.tiffRepresentation,
        let rep = NSBitmapImageRep(data: tiff) else { return nil }
  return rep.representation(using: .png, properties: [:])
}

for spec in specs {
  guard let mockup = NSImage(contentsOfFile: spec.input) else {
    fputs("Failed to load \(spec.input)\n", stderr)
    continue
  }

  let canvas = NSImage(size: canvasSize)
  canvas.lockFocus()

  background.setFill()
  NSRect(origin: .zero, size: canvasSize).fill()

  let titleRect = NSRect(x: 90, y: canvasSize.height - 480, width: canvasSize.width - 180, height: 220)
  let subRect = NSRect(x: 135, y: canvasSize.height - 640, width: canvasSize.width - 270, height: 150)
  drawCenteredText(spec.headline, in: titleRect, font: titleFont, color: titleColor, lineSpacing: 2)
  drawCenteredText(spec.subhead, in: subRect, font: subFont, color: subColor, lineSpacing: 8)

  let maxMockupWidth: CGFloat = 860
  let scale = maxMockupWidth / mockup.size.width
  let mockupSize = NSSize(width: mockup.size.width * scale, height: mockup.size.height * scale)
  let mockupRect = NSRect(
    x: (canvasSize.width - mockupSize.width) / 2,
    y: 150,
    width: mockupSize.width,
    height: mockupSize.height
  )

  NSGraphicsContext.saveGraphicsState()
  let shadow = NSShadow()
  shadow.shadowColor = NSColor(calibratedWhite: 0, alpha: 0.16)
  shadow.shadowBlurRadius = 34
  shadow.shadowOffset = NSSize(width: 0, height: -10)
  shadow.set()
  NSGraphicsContext.current?.imageInterpolation = .high
  mockup.draw(in: mockupRect)
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
