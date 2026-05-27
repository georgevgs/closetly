# Closetly

A React Native closet & outfit app built with Expo SDK 56, Supabase, and NativeWind.

## Stack

- **Expo** SDK 56 with **expo-router** (file-based routing)
- **React Native** 0.85 / **React** 19.2
- **Reanimated** 4 + **react-native-worklets**
- **NativeWind** 4 (Tailwind for React Native)
- **Supabase** for auth, database, and storage
- **TanStack Query** for server state, **Zustand** for cross-screen client state
- **FlashList** v2, **expo-image**, **expo-glass-effect**, **expo-symbols**, **@gorhom/bottom-sheet**
- A custom native **expo-bg-remover** module (under `modules/`) for on-device background removal
- **bun** as the package manager

> The app uses native modules that **are not available in Expo Go**. You must run a development build (`expo run:ios` / `expo run:android`).

## Features

- **Closet** — photograph items, auto-detect dominant colors and silhouette, tag by style/season/pattern/occasion. Filter, search, and sort.
- **Outfits** — generated suggestions scored by weather, color harmony, style match, formality, and wear-affinity. Build outfits manually with a slot picker.
- **Trips** — pack-list generator that builds a capsule based on destination, dates, expected weather, and the user's wardrobe.
- **Wear tracking** — log what's worn, view item-level wear counts, undo recent logs.
- **Weather-aware** — coarse location + forecast fetch drives outfit suggestions and trip planning.
- **Onboarding & profile** — first-run flow with style "vibes", category visibility prefs, preferred-style boosts, light/dark theme.

## Prerequisites

- [Bun](https://bun.sh)
- Xcode (for iOS) and/or Android Studio (for Android)
- CocoaPods (`sudo gem install cocoapods`) — needed for iOS
- A Supabase project ([create one](https://supabase.com))

## Setup

1. **Install dependencies**

   ```bash
   bun install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Fill in:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   ```

3. **Apply Supabase migrations**

   With the [Supabase CLI](https://supabase.com/docs/guides/local-development) linked to your project:

   ```bash
   supabase db push
   ```

   Migrations live in `supabase/migrations/`.

4. **Install iOS pods** (first run only, or after native deps change)

   ```bash
   cd ios && pod install && cd -
   ```

   If you need to regenerate native projects from scratch: `bun expo prebuild --clean`.

## Run

```bash
bun run ios       # build & launch the iOS dev client
bun run android   # build & launch the Android dev client
bun start         # start the Metro bundler (for an already-installed dev build)
```

## Project layout

```
app/                 expo-router routes
  _layout.tsx        root layout (providers, theme, auth gate)
  (auth)/            sign-in
  (app)/             main tabs: home, closet, trips, profile
  items/             item detail, creation, edit
  outfits/           outfit builder & today's suggestions
  trips/             trip detail & edit
  legal/             terms, privacy
  onboarding/        first-run welcome & style vibes
src/
  components/ui/     shared UI primitives (Screen, Text, Pill, GlassSurface, BottomBar, ...)
  features/          feature modules — each owns its components, hooks, and logic
    auth/            session context
    closet/          item CRUD, filters, vision/color extraction, image upload
    outfits/         suggestion engine helpers, slot picker, save & dismiss flows
    trips/           planner, packing list, capsule generator
    wear/            wear logging, history, stats
    weather/         location permission & forecast
    profile/         style preferences
    legal/           terms/privacy content + renderer
    onboarding/      welcome content & state
  hooks/             generic hooks (e.g. useDebouncedValue)
  lib/               pure utilities — color/HSL/harmony, outfit scoring & combinator,
                     dates, permissions, design tokens, supabase client
  providers/         React context providers (Theme, Query, CategoryPrefs)
  store/             reserved for cross-screen Zustand stores
  types/             shared TS types (items, generated Supabase types)
modules/
  expo-bg-remover/   custom native module: on-device background removal + masked color sampling
supabase/
  migrations/        SQL migrations
__tests__/           bun:test suites for color, outfit, capsule, and filter logic
```

## Scripts

- `bun run ios` / `bun run android` — build & run native dev client
- `bun start` — start Metro
- `bun run web` — run on web (limited; native modules won't work)
- `bun run lint` — run `expo lint`
- `bun run test` — run the `bun:test` suite in `__tests__/`
- `bun run icons` — regenerate app icons from the SVG source

## EAS build / submit

```bash
bun run build:dev:ios            # development build for iOS simulator
bun run build:dev:device:ios     # development build for a connected iOS device
bun run build:dev:android        # development build for Android
bun run build:preview:ios        # internal preview build for TestFlight-style sharing
bun run build:preview:android
bun run build:production         # production build for App Store / Play Store

bun run submit:ios               # submit production iOS build to App Store
bun run submit:android           # submit production Android build to Play Store
```

## Code style

See [`CLAUDE.md`](./CLAUDE.md) for the project's code style rules — full noun names, no ternaries, no `||` defaulting, render branches lifted into named components, small focused files.
