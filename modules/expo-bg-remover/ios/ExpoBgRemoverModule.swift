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

          promise.resolve([
            "uri": outputURL.absoluteString,
            "width": outputCG.width,
            "height": outputCG.height
          ])
        } catch {
          promise.reject("ERR_VISION", error.localizedDescription)
        }
      }
    }
  }
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
