import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { Resvg } from "@resvg/resvg-js";
import { PNG } from "pngjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(SCRIPT_DIR, "..", "assets", "images");

const COLORS = {
  canvas: "#faf8f5",
  canvasDark: "#0e0e0d",
  ink: "#1a1a1a",
  inkDark: "#f5f3ef",
  neon: "#FF1466",
  white: "#ffffff",
} as const;

type SvgOptions = {
  size: number;
  background: string | null;
  bodyColor: string;
  accentColor: string;
  scale?: number;
};

const buildSvg = (options: SvgOptions): string => {
  const { size, background, bodyColor, accentColor, scale = 1 } = options;
  const offset = (1024 * (1 - scale)) / 2;
  const transform = scale === 1 ? "" : `transform="translate(${offset} ${offset}) scale(${scale})"`;
  const bgRect = background ? `<rect width="1024" height="1024" fill="${background}"/>` : "";
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="${size}" height="${size}">`,
    bgRect,
    `<g ${transform}>`,
    `  <path d="M 828 329 A 365 365 0 1 0 828 695"`,
    `        stroke="${bodyColor}" stroke-width="135"`,
    `        stroke-linecap="round" fill="none"/>`,
    `  <circle cx="760" cy="512" r="30" fill="${accentColor}"/>`,
    `</g>`,
    `</svg>`,
  ].join("\n");
};

type Variant = {
  filename: string;
  options: SvgOptions;
  flattenAlpha?: boolean;
};

const VARIANTS: Variant[] = [
  {
    filename: "icon.png",
    options: {
      size: 1024,
      background: COLORS.canvas,
      bodyColor: COLORS.ink,
      accentColor: COLORS.neon,
    },
    flattenAlpha: true,
  },
  {
    filename: "ios-icon-dark.png",
    options: {
      size: 1024,
      background: COLORS.canvasDark,
      bodyColor: COLORS.inkDark,
      accentColor: COLORS.neon,
    },
  },
  {
    filename: "ios-icon-tinted.png",
    options: {
      size: 1024,
      background: null,
      bodyColor: COLORS.white,
      accentColor: COLORS.white,
    },
  },
  {
    filename: "splash-icon.png",
    options: {
      size: 600,
      background: null,
      bodyColor: COLORS.ink,
      accentColor: COLORS.neon,
    },
  },
  {
    filename: "splash-icon-dark.png",
    options: {
      size: 600,
      background: null,
      bodyColor: COLORS.inkDark,
      accentColor: COLORS.neon,
    },
  },
  {
    filename: "favicon.png",
    options: {
      size: 512,
      background: COLORS.canvas,
      bodyColor: COLORS.ink,
      accentColor: COLORS.neon,
    },
  },
];

const renderVariant = (variant: Variant) => {
  const svg = buildSvg(variant.options);
  const rendered = new Resvg(svg).render();
  const outputPath = join(ASSETS_DIR, variant.filename);
  if (variant.flattenAlpha) {
    writeFileSync(outputPath, encodeRgbPng(rendered.pixels, rendered.width, rendered.height));
  } else {
    writeFileSync(outputPath, rendered.asPng());
  }
  console.log(`✓ ${variant.filename} (${variant.options.size}×${variant.options.size})`);
};

// Re-encode RGBA pixel buffer as RGB so the App Store Connect 1024 icon upload
// passes Apple's "no alpha channel" check. The source SVG fills the whole frame
// so every pixel is already opaque — we just discard the alpha byte.
const encodeRgbPng = (rgba: Buffer | Uint8Array, width: number, height: number): Buffer => {
  const rgbaBytes = rgba instanceof Buffer ? rgba : Buffer.from(rgba);
  const rgbBuffer = Buffer.alloc(width * height * 3);
  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex++) {
    const rgbaOffset = pixelIndex * 4;
    const rgbOffset = pixelIndex * 3;
    rgbBuffer[rgbOffset] = rgbaBytes[rgbaOffset];
    rgbBuffer[rgbOffset + 1] = rgbaBytes[rgbaOffset + 1];
    rgbBuffer[rgbOffset + 2] = rgbaBytes[rgbaOffset + 2];
  }
  const png = new PNG({ width, height });
  png.data = rgbBuffer;
  return PNG.sync.write(png, { colorType: 2, inputColorType: 2, inputHasAlpha: false });
};

const main = () => {
  for (const variant of VARIANTS) {
    renderVariant(variant);
  }
};

main();
