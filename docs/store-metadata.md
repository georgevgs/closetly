# Store Metadata — Closetly

Draft copy and checklists for App Store Connect and Google Play Console submissions. Edit `[REPLACE: ...]` placeholders before submitting. Character limits noted next to each field.

---

## App Store Connect

### Identity

| Field | Value | Limit |
|---|---|---|
| App name | `Closetly` | 30 |
| Subtitle | `Outfits from your closet` | 30 |
| Bundle ID | `com.gvagdas.closetly` | — |
| SKU | `closetly-ios-001` | — |
| Primary language | English (U.S.) | — |

Subtitle alternatives if you want to A/B later:
- `Style what you already own`
- `Smarter outfits, your closet`
- `Plan outfits in seconds`

### Promotional text (170 chars, editable post-launch)

> Snap your closet, get outfit ideas tuned to today's weather and what you've worn lately. Plan trip capsules from pieces you actually own.

### Description (4000 chars)

```
Closetly helps you dress from the wardrobe you already own. Photograph your clothes once, get outfit suggestions tuned to today's weather, and plan trip capsules from real pieces — not Pinterest fantasies.

WHY CLOSETLY
• Your closet, distilled. Snap each piece once. Closetly auto-detects colors and trims the background so the gallery looks clean.
• Outfits that fit today. Suggestions are weather-aware and learn from what you've actually worn — not what you saved months ago and never touched.
• Pack smarter trips. Build capsules from items already in your closet, with the right warmth and formality for where you're going.

HOW IT WORKS
1. Add your top, bottom, dress, outerwear, shoes, bags, hats, and accessories. One photo per piece is enough.
2. Open the home tab. Closetly proposes complete outfits using your wardrobe, the weather, and your wear history.
3. Save, dismiss, or log what you wore — Closetly learns from each tap and gets sharper over time.
4. Heading out of town? Open Trips, set the dates and weather, and get a packing list of pieces you already own.

PRIVATE BY DEFAULT
Your wardrobe stays yours. Closetly stores your photos in a private cloud bucket scoped to your account, never sells your data, and does not use your closet to train models. Read the full Privacy Policy in-app.

NO ADS. NO TRACKING.

DESIGNED FOR iOS
Closetly is built native for iPhone — Dynamic Island, dark mode, haptics, and the camera all work the way they should.

REQUIREMENTS
• iOS 17 or later
• Camera or photo library access to add items
• Optional: location access for weather-aware suggestions

Have feedback? Email [REPLACE: support@closetly.app]. We read everything.
```

### Keywords (100 chars total, comma-separated, no spaces)

```
wardrobe,closet,outfit,style,fashion,capsule,packing,clothes,planner,weather,minimal
```

(Currently 78 chars — room to add more if needed. Suggestions: `ootd,lookbook,layers,trip`.)

### URLs

| Field | URL |
|---|---|
| Support URL (required) | `[REPLACE: https://closetly.app/support]` |
| Marketing URL (optional) | `[REPLACE: https://closetly.app]` |
| Privacy Policy URL (required) | `[REPLACE: https://closetly.app/privacy]` |

> Both Support and Privacy URLs **must** be live, public, and stable before submission. Easiest path: a single static page on a domain you own, with anchor links to `#privacy`, `#terms`, `#support`.

### Categories

- Primary: **Lifestyle**
- Secondary: **Productivity**

### Age rating

- **4+** — no objectionable content. Run through the App Store Connect questionnaire and answer "None" to all.

### App Privacy declarations

Per the in-app Privacy Policy:

| Data Type | Linked to user | Used for tracking | Purpose |
|---|---|---|---|
| Email Address | ✅ | ❌ | App Functionality (account) |
| Photos | ✅ | ❌ | App Functionality (closet content) |
| Coarse Location | ❌ | ❌ | App Functionality (weather lookup, not stored) |
| Crash Data | ❌ | ❌ | App Functionality (diagnostics) |
| Performance Data | ❌ | ❌ | App Functionality (diagnostics) |

> Once Sentry is wired, also declare **Other Diagnostic Data**, not linked to user, for App Functionality.
> Tracking declaration: **No, this app does not collect data from this app that is used to track the user**.

### What's New (release notes — version 1.0.0)

```
First release.

• Photograph your closet, one piece at a time.
• Get outfit suggestions tuned to the weather and your wear history.
• Plan trip capsules from your real wardrobe.
• Private by default — your data stays in your account.
```

### Screenshots checklist

App Store requires at least one device size; 6.7" or 6.9" is the modern default and Apple stretches it down for smaller phones.

| Device | Resolution | Required? |
|---|---|---|
| 6.9" (iPhone 16 Pro Max) | 1320 × 2868 | Recommended primary |
| 6.7" (iPhone 14 Pro Max / 15 Plus) | 1290 × 2796 | Accepted alternative |
| iPad | — | Not needed (`supportsTablet: false`) |

Suggested screen flow (5 shots):
1. **Today** — outfit suggestions with weather chip visible.
2. **Closet grid** — 6+ items displayed with auto-trimmed photos.
3. **New item** — photo with auto-picked color swatches highlighted.
4. **Outfit detail / suggest** — pieces laid out, save/wear/dismiss buttons.
5. **Trips** — capsule list for a destination.

Add a one-line caption per screen (Apple shows them as overlay banners on listings).

### App icon for the store

- 1024 × 1024 PNG, **no transparency, no rounded corners**. The store rounds it for you.
- Same design as the in-bundle icon at `./assets/images/icon.png`, exported at 1024.

### Copyright

> `© 2026 [REPLACE_WITH_LEGAL_ENTITY_NAME]`

### Version & build numbers

- Marketing version: from `app.json` `version` field (currently `1.0.0`)
- Build number: handled by EAS via `autoIncrement: true` in production profile

---

## Google Play Console

### Identity

| Field | Value | Limit |
|---|---|---|
| App name | `Closetly` | 30 |
| Short description | `Outfits from the closet you already own.` | 80 |
| Default language | en-US | — |
| Application type | App | — |
| Category | Lifestyle | — |

### Full description (4000 chars)

Reuse the App Store description above. Google Play allows simple HTML (`<b>`, `<br>`); avoid heavy formatting.

### Graphics checklist

| Asset | Spec | Status |
|---|---|---|
| App icon (high-res) | 512 × 512 PNG, 32-bit alpha | Need to export |
| Feature graphic | 1024 × 500 PNG/JPG, no transparency | **Need to design** — appears at top of listing |
| Phone screenshots | min 2, max 8, 16:9 ratio, ≥320px on shortest side | Reuse iOS screens at 1080×1920 |
| Promo video (optional) | YouTube URL | Skip for v1 |

### Data safety declarations

Mirror the App Privacy table above. Play uses similar but separate categories — answer for each:

| Data type | Collected? | Shared? | Optional? | Purpose |
|---|---|---|---|---|
| Email address | Yes | No | No (required for account) | Account management |
| Photos | Yes | No | Yes (only items the user adds) | App functionality |
| Approximate location | No (used in-session, not stored) | No | Yes | Weather lookup |
| App crash logs | Yes (after Sentry) | Shared with Sentry processor | No | Diagnostics |

Encryption in transit: **Yes (TLS)**.
Data deletion mechanism: **Email request** to support address.

### Content rating

- IARC questionnaire → answer "No" to every "Does the app contain..." prompt → **PEGI 3 / Everyone**.

### Target audience

- Ages 13+ (matches the privacy policy minimum age).

### Privacy Policy URL

- Same as iOS: `[REPLACE: https://closetly.app/privacy]`

---

## Pre-submission checklist

Before you start a submission flow in either store:

- [ ] Replace all `[REPLACE: ...]` placeholders in Privacy Policy + Terms (`src/features/legal/content/constants.ts`).
- [ ] Host Privacy Policy and Terms at public URLs.
- [ ] Set up a support email or page (`support@…` and a Notion/Linear/static page is fine for v1).
- [ ] Replace placeholder app icons + splash per `docs/branding-spec.md` (current assets are Expo template artwork — store reviewers will reject).
- [ ] Generate 1024×1024 store icon (no alpha) — keep alongside `assets/images/icon.png`.
- [ ] Capture 5 screenshots at 6.9" iPhone size (use Xcode Simulator → Device → iPhone 16 Pro Max → ⌘S).
- [ ] Design the Play Store feature graphic (1024×500).
- [ ] Run the App Privacy questionnaire in ASC and confirm declarations match in-app behavior.
- [ ] Confirm bundle id `com.gvagdas.closetly` is registered as an App ID in your Apple Developer account.
- [ ] Confirm package `com.gvagdas.closetly` is created in Play Console.
- [ ] Decide: launch in all territories, or restricted? (Lifestyle apps usually launch worldwide.)

---

## Notes for review reviewers

If asked for a demo account during review (likely):

```
Email: [REPLACE: review@closetly.app]
Login flow: tap "Continue with email", enter the address, retrieve the OTP from inbox.
```

> Set up a real inbox you control before submission. Apple sometimes requests a 6-digit code be pre-supplied — for OTP flows, give them the inbox credentials so they can fetch it themselves.

If asked about background activity:

> Closetly does not run in the background. Location is requested on demand only when the user taps "Enable" on the home screen weather card. The location is sent to Open-Meteo (https://open-meteo.com) for a single forecast lookup per session and is never stored on our servers.
