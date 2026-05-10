import ExpoModulesCore
import Vision
import UIKit
import CoreImage

public class ExpoBgRemoverModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBgRemover")

    Function("isAvailable") { () -> Bool in
      if #available(iOS 17.0, *) { return true }
      return false
    }

    AsyncFunction("removeBackground") { (uri: String, promise: Promise) in
      guard #available(iOS 17.0, *) else {
        promise.reject("ERR_UNAVAILABLE", "Subject lifting requires iOS 17 or later")
        return
      }

      guard let url = URL(string: uri) else {
        promise.reject("ERR_INVALID_URI", "Invalid URI: \(uri)")
        return
      }

      DispatchQueue.global(qos: .userInitiated).async {
        do {
          let imageData = try Data(contentsOf: url)
          guard let inputImage = UIImage(data: imageData),
                let cgImage = inputImage.cgImage else {
            promise.reject("ERR_DECODE", "Could not decode image at \(uri)")
            return
          }

          let orientation = cgOrientation(from: inputImage.imageOrientation)
          let request = VNGenerateForegroundInstanceMaskRequest()
          let handler = VNImageRequestHandler(cgImage: cgImage, orientation: orientation, options: [:])

          try handler.perform([request])

          guard let result = request.results?.first else {
            promise.reject("ERR_NO_SUBJECT", "No foreground subject detected")
            return
          }

          let maskedBuffer = try result.generateMaskedImage(
            ofInstances: result.allInstances,
            from: handler,
            croppedToInstancesExtent: false
          )

          let ciImage = CIImage(cvPixelBuffer: maskedBuffer)
          let context = CIContext(options: nil)
          guard let outputCG = context.createCGImage(ciImage, from: ciImage.extent) else {
            promise.reject("ERR_RENDER", "Could not render masked image")
            return
          }

          let outputImage = UIImage(cgImage: outputCG)
          guard let pngData = outputImage.pngData() else {
            promise.reject("ERR_PNG", "Could not encode PNG")
            return
          }

          let outputURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("bg-removed-\(UUID().uuidString).png")
          try pngData.write(to: outputURL)

          var resolved: [String: Any] = [
            "uri": outputURL.absoluteString,
            "width": outputCG.width,
            "height": outputCG.height
          ]
          if let analysis = analyzeForeground(cgImage: outputCG) {
            resolved["mask"] = analysis.maskStats
            if !analysis.colors.isEmpty {
              resolved["colors"] = analysis.colors
            }
          }
          promise.resolve(resolved)
        } catch {
          promise.reject("ERR_VISION", error.localizedDescription)
        }
      }
    }
  }
}

private struct ForegroundAnalysis {
  let maskStats: [String: Any]
  let colors: [String]
}

private func downsampledSize(width: Int, height: Int, maxDim: Int) -> (width: Int, height: Int)? {
  if width == 0 || height == 0 { return nil }
  let scale = min(1.0, Double(maxDim) / Double(max(width, height)))
  let w = max(1, Int(Double(width) * scale))
  let h = max(1, Int(Double(height) * scale))
  return (w, h)
}

private func hexFromBucket(_ bucket: Int) -> String {
  // Recover an 8-bit channel value from the 4-bit bucket index by
  // padding with 0x8 so each channel sits in the middle of its bucket.
  let r = ((bucket >> 8) & 0xF) << 4 | 0x8
  let g = ((bucket >> 4) & 0xF) << 4 | 0x8
  let b = (bucket & 0xF) << 4 | 0x8
  return String(format: "#%02x%02x%02x", r, g, b)
}

private func analyzeForeground(cgImage: CGImage) -> ForegroundAnalysis? {
  // Downsample so this stays cheap regardless of source resolution.
  guard let size = downsampledSize(width: cgImage.width, height: cgImage.height, maxDim: 256) else {
    return nil
  }
  let w = size.width
  let h = size.height

  let bytesPerPixel = 4
  let bytesPerRow = bytesPerPixel * w
  var pixels = [UInt8](repeating: 0, count: bytesPerRow * h)
  guard let space = cgImage.colorSpace ?? CGColorSpace(name: CGColorSpace.sRGB) else { return nil }
  guard let ctx = CGContext(
    data: &pixels,
    width: w,
    height: h,
    bitsPerComponent: 8,
    bytesPerRow: bytesPerRow,
    space: space,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
  ) else { return nil }
  ctx.clear(CGRect(x: 0, y: 0, width: w, height: h))
  ctx.draw(cgImage, in: CGRect(x: 0, y: 0, width: w, height: h))

  // Bbox/coverage uses a low alpha threshold to capture the full subject.
  // Color sampling uses a stricter threshold so soft mask edges (where
  // premultiplication mixes background into the channel values) don't
  // contaminate the histogram.
  let bboxThreshold: UInt8 = 64
  let colorThreshold: UInt8 = 224
  var minX = w, minY = h, maxX = -1, maxY = -1
  var opaqueCount = 0

  // 4 bits per channel = 4096 buckets — coarse enough to be stable across
  // shadows/highlights of the same garment color, fine enough for the
  // preset palette to snap correctly afterwards.
  var histogram = [Int](repeating: 0, count: 4096)

  for y in 0..<h {
    let row = y * bytesPerRow
    for x in 0..<w {
      let idx = row + x * bytesPerPixel
      let alpha = pixels[idx + 3]
      if alpha >= bboxThreshold {
        opaqueCount += 1
        if x < minX { minX = x }
        if x > maxX { maxX = x }
        if y < minY { minY = y }
        if y > maxY { maxY = y }
      }
      if alpha >= colorThreshold {
        let r = Int(pixels[idx])
        let g = Int(pixels[idx + 1])
        let b = Int(pixels[idx + 2])
        let bucket = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
        histogram[bucket] += 1
      }
    }
  }
  if maxX < 0 || maxY < 0 { return nil }

  let bboxW = maxX - minX + 1
  let bboxH = maxY - minY + 1
  let bboxArea = bboxW * bboxH
  if bboxArea <= 0 { return nil }
  let coverage = Double(opaqueCount) / Double(bboxArea)
  let aspect = Double(bboxH) / Double(bboxW)

  let topBuckets = histogram
    .enumerated()
    .filter { $0.element > 0 }
    .sorted { $0.element > $1.element }
    .prefix(6)

  let colors: [String] = topBuckets.map { (bucket, _) in hexFromBucket(bucket) }

  let maskStats: [String: Any] = [
    "coverage": coverage,
    "aspect": aspect,
    "bboxW": bboxW,
    "bboxH": bboxH,
    "sampleW": w,
    "sampleH": h
  ]

  return ForegroundAnalysis(maskStats: maskStats, colors: colors)
}

private func cgOrientation(from ui: UIImage.Orientation) -> CGImagePropertyOrientation {
  switch ui {
  case .up: return .up
  case .down: return .down
  case .left: return .left
  case .right: return .right
  case .upMirrored: return .upMirrored
  case .downMirrored: return .downMirrored
  case .leftMirrored: return .leftMirrored
  case .rightMirrored: return .rightMirrored
  @unknown default: return .up
  }
}
