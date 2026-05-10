# Branding Spec — Closetly

Spec for the visual assets needed before App Store / Play Store submission. **Current `assets/images/icon.png`, `splash-icon.png`, and `android-icon-foreground.png` are Expo template placeholders and must be replaced.** Stores will reject submissions that ship the template artwork.

---

## Brand tokens

These are pulled from `tailwind.config.js` and `app.json`. Use them as the basis for icon and splash design so the launch experience matches the app.

| Token | Light | Dark |
|---|---|---|
| Canvas (background) | `#faf8f5` | `#0e0e0d` |
| Ink (primary text) | `#1a1a1a` | `#f5f3ef` |
| Muted (secondary text) | `#78716c` | `#a8a29e` |
| Line (borders) | `#e7e2da` | `#1f1d1a` |
| Accent (terracotta) | `#a85a3b` | `#d18a6c` |
| Sage | `#7d8a6a` | — |
| Clay | `#c8a78a` | — |

Display font: **Playfair Display** (serif).
Body font: **Inter** (sans).

Suggested motif: a single hanger silhouette, a stylized "C" in Playfair, or a folded-garment glyph — anything calm, mark-shaped, recognizable at 16px. Avoid photorealism, gradients, or text-heavy logos at icon size.

---

## iOS — App Icon

| Asset | Size | Format | Notes |
|---|---|---|---|
| `assets/images/icon.png` (light, default) | **1024 × 1024** | PNG, RGB (no alpha) | Current path in `app.json` |
| `assets/images/ios-icon-dark.png` (optional, iOS 18+) | 1024 × 1024 | PNG, alpha allowed | For Dark mode home screen |
| `assets/images/ios-icon-tinted.png` (optional, iOS 18+) | 1024 × 1024 | PNG, alpha required, **monochrome** | Single-color shape on transparent bg; iOS tints it system-wide |

iOS 18 introduced Light / Dark / Tinted home-screen icon modes. Providing all three is best practice; iOS falls back to `light` if the others are missing.

When the dark and tinted variants exist, update `app.json` from:

```json
"ios": {
  "supportsTablet": false,
  "bundleIdentifier": "com.gvagdas.closetly",
  "infoPlist": { "ITSAppUsesNonExemptEncryption": false }
}
```

to:

```json
"ios": {
  "supportsTablet": false,
  "bundleIdentifier": "com.gvagdas.closetly",
  "infoPlist": { "ITSAppUsesNonExemptEncryption": false },
  "icon": {
    "light": "./assets/images/icon.png",
    "dark": "./assets/images/ios-icon-dark.png",
    "tinted": "./assets/images/ios-icon-tinted.png"
  }
}
```

> When providing `ios.icon` as an object, you can drop the top-level `"icon": "./assets/images/icon.png"` for iOS — but keep it for Android adaptive icon fallback and web favicon resolution.

### iOS icon design rules
- **No alpha channel** for the light variant. Save flat over a solid color.
- **No rounded corners.** iOS rounds them automatically.
- Keep the mark inside an **80% safe area** (~820 × 820 inside the 1024 frame). Don't put critical detail in the outer 102px on each side.
- Don't put text in the icon. The app name appears under the icon on the home screen.
- Test legibility at 60 × 60 (home screen) and 29 × 29 (Settings list).

---

## Android — Adaptive Icon

Android uses three layers that the OS composes. The launcher applies a mask (circle, rounded square, etc.) chosen by the user.

| Layer | Path | Size | Format | Notes |
|---|---|---|---|---|
| Foreground | `assets/images/android-icon-foreground.png` | **512 × 512** (currently correct) | PNG with alpha | The mark. Keep critical detail inside the **center 432 × 432** safe area; outer 40px on each side gets clipped by some launcher masks. |
| Background | `assets/images/android-icon-background.png` | 512 × 512 | PNG (alpha optional) | Solid color or simple pattern. Currently uses `#faf8f5`. |
| Monochrome | `assets/images/android-icon-monochrome.png` | 432 × 432 | PNG with alpha, **single color** | Used by Android 13+ "themed icons" feature. Should be the foreground silhouette in pure white on transparent. |

`app.json` already wires all three — no config change needed once the new assets land.

### Android icon design rules
- The **foreground must have transparency** outside the mark. Don't fill the whole frame.
- The 432 × 432 monochrome PNG should be a flat silhouette of the foreground (white on transparent). Android applies the user's wallpaper-derived tint.
- The legacy `adaptiveIcon.backgroundColor` (`#faf8f5`) is a fallback for very old launchers; keep it in sync with the actual background image.

---

## Splash screen

Configured in `app.json` under the `expo-splash-screen` plugin:

```json
{
  "image": "./assets/images/splash-icon.png",
  "imageWidth": 200,
  "resizeMode": "contain",
  "backgroundColor": "#faf8f5",
  "dark": { "backgroundColor": "#0e0e0d" }
}
```

### What needs to change

1. **Replace `splash-icon.png`** — currently the Expo grid placeholder. Should be the same mark as the app icon, simplified for white-on-canvas display.
2. **Provide a dark variant** — add `dark.image` so the mark is readable on the dark canvas. If the icon is tonal (uses ink color), the white version is for dark mode.

After designing, update to:

```json
{
  "image": "./assets/images/splash-icon.png",
  "imageWidth": 200,
  "resizeMode": "contain",
  "backgroundColor": "#faf8f5",
  "dark": {
    "image": "./assets/images/splash-icon-dark.png",
    "backgroundColor": "#0e0e0d"
  }
}
```

### Splash design rules
- **Single image, centered, 200pt wide** (Expo handles scaling). Design at **600 × 600 PNG** to give 3× retina headroom.
- **Transparent background** — the `backgroundColor` shows through.
- **Match the app icon mark** — same silhouette, no extra wordmark. Reviewers and users associate the splash with the icon.
- Keep the mark calm and static. No gradients or animation; the splash is replaced by the first JS frame within ~300ms.

---

## Web favicon

`assets/images/favicon.png` is currently 48 × 48 — fine for browser tabs but undersized for retina bookmarks.

Recommended replacement: **512 × 512 PNG** of the same mark over canvas. Web bookmarks and PWA installs use it.

---

## App Store listing icon

Separate asset, **not bundled** in the app — it goes into App Store Connect → Media Manager:

- **1024 × 1024 PNG, no alpha, no rounded corners**.
- Same artwork as the iOS `icon.png` light variant. Same file is fine.

---

## Asset checklist

Before the next production build:

- [ ] `assets/images/icon.png` — replace with final 1024 × 1024 (no alpha)
- [ ] `assets/images/ios-icon-dark.png` — new file, 1024 × 1024 (alpha ok)
- [ ] `assets/images/ios-icon-tinted.png` — new file, 1024 × 1024 monochrome on transparent
- [ ] `assets/images/android-icon-foreground.png` — replace with 512 × 512 mark on transparent
- [ ] `assets/images/android-icon-background.png` — replace with 512 × 512 solid or simple
- [ ] `assets/images/android-icon-monochrome.png` — replace with 432 × 432 white silhouette
- [ ] `assets/images/splash-icon.png` — replace with 600 × 600 mark on transparent
- [ ] `assets/images/splash-icon-dark.png` — new file, 600 × 600 inverse
- [ ] `assets/images/favicon.png` — replace with 512 × 512 mark on canvas
- [ ] Update `app.json` to wire `ios.icon` object and `splash.dark.image` (see snippets above)
- [ ] Re-run `bunx expo prebuild --clean` (regenerates iOS/Android projects with the new assets)

---

## Tools

- **Figma** is the easiest way to design and export at all required sizes. Set up a single 1024 × 1024 frame, swap variants, and use Frame → Export.
- **Bakery** (https://usebakery.com) — paid, generates all icon sizes from a single 1024 source.
- **Icon Set Creator** (Mac App Store, free) — generates all iOS sizes from one 1024 master, but doesn't handle Android adaptive layers.
- **Android Asset Studio** (https://romannurik.github.io/AndroidAssetStudio/) — free, browser-based, generates the three adaptive layers from one source.
