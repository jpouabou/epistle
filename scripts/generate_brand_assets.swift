import AppKit
import Foundation

struct Palette {
  static let paper = NSColor(calibratedRed: 0.969, green: 0.937, blue: 0.886, alpha: 1)
  static let paperSoft = NSColor(calibratedRed: 0.992, green: 0.972, blue: 0.929, alpha: 1)
  static let sand = NSColor(calibratedRed: 0.875, green: 0.784, blue: 0.655, alpha: 1)
  static let umber = NSColor(calibratedRed: 0.435, green: 0.247, blue: 0.090, alpha: 1)
  static let umberDark = NSColor(calibratedRed: 0.333, green: 0.180, blue: 0.063, alpha: 1)
  static let border = NSColor(calibratedRed: 0.345, green: 0.224, blue: 0.094, alpha: 0.16)
}

let repoRoot = URL(fileURLWithPath: "/Users/jeanpouabou/Epistle")
let sourceLogoURL = URL(fileURLWithPath: "/Users/jeanpouabou/epistle-landing/src/assets/epistle-logo.png")

guard
  let sourceImage = NSImage(contentsOf: sourceLogoURL),
  let sourceCG = sourceImage.cgImage(forProposedRect: nil, context: nil, hints: nil)
else {
  fatalError("Unable to load source logo image.")
}

func ensureDirectory(_ url: URL) throws {
  try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
}

func pngData(from image: NSImage) -> Data? {
  guard
    let tiff = image.tiffRepresentation,
    let rep = NSBitmapImageRep(data: tiff)
  else {
    return nil
  }

  return rep.representation(using: .png, properties: [:])
}

func writePNG(_ image: NSImage, to url: URL) throws {
  guard let data = pngData(from: image) else {
    throw NSError(domain: "BrandAssets", code: 1, userInfo: [NSLocalizedDescriptionKey: "Could not encode PNG"])
  }
  try data.write(to: url)
}

func cropSourceLogo() -> CGImage {
  let width = sourceCG.width
  let height = sourceCG.height
  let cropSize = min(width, height) * 58 / 100
  let cropRect = CGRect(
    x: (width - cropSize) / 2,
    y: (height - cropSize) / 2,
    width: cropSize,
    height: cropSize
  )

  guard let cropped = sourceCG.cropping(to: cropRect) else {
    fatalError("Unable to crop source logo.")
  }

  return cropped
}

let croppedLogo = cropSourceLogo()

func drawRoundedBackground(in rect: CGRect) {
  let path = NSBezierPath(roundedRect: rect, xRadius: rect.width * 0.22, yRadius: rect.height * 0.22)
  path.addClip()

  let gradient = NSGradient(colors: [Palette.paperSoft, Palette.paper, Palette.sand])!
  gradient.draw(in: path, angle: 135)

  let glowRect = rect.insetBy(dx: rect.width * 0.12, dy: rect.height * 0.12)
  let glow = NSGradient(colors: [
    Palette.paperSoft.withAlphaComponent(0.92),
    Palette.paper.withAlphaComponent(0.05),
  ])!
  glow.draw(in: NSBezierPath(ovalIn: glowRect), relativeCenterPosition: NSZeroPoint)

  Palette.border.setStroke()
  path.lineWidth = max(2, rect.width * 0.012)
  path.stroke()
}

func makeIcon(size: Int) -> NSImage {
  let canvasSize = NSSize(width: size, height: size)
  let image = NSImage(size: canvasSize)

  image.lockFocus()
  guard let ctx = NSGraphicsContext.current?.cgContext else {
    fatalError("Unable to create graphics context.")
  }

  let fullRect = CGRect(origin: .zero, size: canvasSize)
  drawRoundedBackground(in: fullRect)

  ctx.saveGState()
  ctx.setShadow(
    offset: CGSize(width: 0, height: -CGFloat(size) * 0.02),
    blur: CGFloat(size) * 0.08,
    color: Palette.umberDark.withAlphaComponent(0.26).cgColor
  )

  let iconInset = CGFloat(size) * 0.14
  let iconRect = CGRect(
    x: iconInset,
    y: iconInset,
    width: CGFloat(size) - (iconInset * 2),
    height: CGFloat(size) - (iconInset * 2)
  )
  ctx.draw(croppedLogo, in: iconRect)
  ctx.restoreGState()

  image.unlockFocus()
  return image
}

func makeLaunchLogo(size: Int) -> NSImage {
  let canvasSize = NSSize(width: size, height: size)
  let image = NSImage(size: canvasSize)

  image.lockFocus()
  guard let ctx = NSGraphicsContext.current?.cgContext else {
    fatalError("Unable to create graphics context.")
  }

  let iconSize = CGFloat(size) * 0.82
  let iconRect = CGRect(
    x: (CGFloat(size) - iconSize) / 2,
    y: (CGFloat(size) - iconSize) / 2,
    width: iconSize,
    height: iconSize
  )

  ctx.saveGState()
  ctx.setShadow(
    offset: CGSize(width: 0, height: -CGFloat(size) * 0.02),
    blur: CGFloat(size) * 0.06,
    color: Palette.umberDark.withAlphaComponent(0.22).cgColor
  )
  drawRoundedBackground(in: iconRect)

  let logoInset = iconSize * 0.14
  let logoRect = iconRect.insetBy(dx: logoInset, dy: logoInset)
  ctx.draw(croppedLogo, in: logoRect)
  ctx.restoreGState()

  image.unlockFocus()
  return image
}

let iOSIconSetURL = repoRoot.appendingPathComponent("ios/Epistle/Images.xcassets/AppIcon.appiconset")
let iOSLaunchSetURL = repoRoot.appendingPathComponent("ios/Epistle/Images.xcassets/LaunchLogo.imageset")
let androidResURL = repoRoot.appendingPathComponent("android/app/src/main/res")

try ensureDirectory(iOSIconSetURL)
try ensureDirectory(iOSLaunchSetURL)
try ensureDirectory(androidResURL.appendingPathComponent("drawable-nodpi"))

let iOSIcons: [(String, Int)] = [
  ("Icon-App-20x20@2x.png", 40),
  ("Icon-App-20x20@3x.png", 60),
  ("Icon-App-29x29@2x.png", 58),
  ("Icon-App-29x29@3x.png", 87),
  ("Icon-App-40x40@2x.png", 80),
  ("Icon-App-40x40@3x.png", 120),
  ("Icon-App-60x60@2x.png", 120),
  ("Icon-App-60x60@3x.png", 180),
  ("Icon-App-1024x1024@1x.png", 1024),
]

for (filename, size) in iOSIcons {
  let image = makeIcon(size: size)
  try writePNG(image, to: iOSIconSetURL.appendingPathComponent(filename))
}

let launchLogo = makeLaunchLogo(size: 1024)
try writePNG(launchLogo, to: iOSLaunchSetURL.appendingPathComponent("launch-logo.png"))
try writePNG(launchLogo, to: androidResURL.appendingPathComponent("drawable-nodpi/launch_logo.png"))

let androidIcons: [(String, Int)] = [
  ("mipmap-mdpi/ic_launcher.png", 48),
  ("mipmap-mdpi/ic_launcher_round.png", 48),
  ("mipmap-hdpi/ic_launcher.png", 72),
  ("mipmap-hdpi/ic_launcher_round.png", 72),
  ("mipmap-xhdpi/ic_launcher.png", 96),
  ("mipmap-xhdpi/ic_launcher_round.png", 96),
  ("mipmap-xxhdpi/ic_launcher.png", 144),
  ("mipmap-xxhdpi/ic_launcher_round.png", 144),
  ("mipmap-xxxhdpi/ic_launcher.png", 192),
  ("mipmap-xxxhdpi/ic_launcher_round.png", 192),
]

for (path, size) in androidIcons {
  let image = makeIcon(size: size)
  try writePNG(image, to: androidResURL.appendingPathComponent(path))
}

print("Generated brand icons and launch logo.")
