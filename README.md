# Closetly

A React Native closet & outfit app built with Expo SDK 55, Supabase, and NativeWind.

## Stack

- **Expo** SDK 55 with **expo-router** (file-based routing)
- **React Native** 0.83 / **React** 19.2
- **Reanimated** 4 + **react-native-worklets**
- **NativeWind** 4 (Tailwind for RN)
- **Supabase** for auth, database, and storage
- **TanStack Query** for server state, **Zustand** for client state
- **FlashList** v2, **expo-image**, **expo-glass-effect**, **expo-symbols**, **@gorhom/bottom-sheet**
- **bun** as the package manager

> The app uses native modules that **are not available in Expo Go**. You must run a development build (`expo run:ios` / `expo run:android`).

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
app/             expo-router routes
  (auth)/        sign-in / sign-up
  (app)/         main tabs (closet, trips, profile, …)
  items/         item detail & creation
  outfits/       outfit detail & creation
src/
  components/   shared UI (Screen, Text, Pill, GlassSurface, …)
  features/     feature modules (auth, closet, outfits, trips, weather)
  hooks/        shared hooks
  lib/          utilities (color, supabase client, …)
  providers/    React context providers
  store/        Zustand stores
  types/        shared TS types
supabase/
  migrations/   SQL migrations
```

## Scripts

- `bun run ios` / `bun run android` — build & run native dev client
- `bun start` — start Metro
- `bun run web` — run on web (limited; native modules won't work)
- `bun run lint` — run `expo lint`
