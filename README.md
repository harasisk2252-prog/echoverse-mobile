# ✦ EchoVerse — Your Memories, Your Universe

A React Native + Expo mobile app prototype with an immersive cosmic aesthetic, interactive memory stars, gesture-driven galaxy, photo and voice memories, timeline, and local persistence.

## Start

For beginner-friendly Android testing, APK builds, and store preparation, read [ANDROID_GUIDE.md](ANDROID_GUIDE.md).

Requirements: Node.js 20+, npm, Android phone with Expo Go or an emulator.

```bash
npm ci
npx expo start --clear
```

Scan the QR code using an SDK 54-compatible Expo Go on Android (available at https://expo.dev/go). Keep your phone and computer on the same Wi-Fi. If LAN discovery fails, try `npx expo start --tunnel`. Use `npm run web` for the browser preview.

To check TypeScript:

```bash
npm run typecheck
```

## Features

- Cinematic welcome and onboarding explainer
- My Universe and Our Universe modes
- Galaxy with interactive stars, constellation lines, pan and pinch-to-zoom gestures
- Tap stars to open memory details
- Create a memory with title, story, date, mood, optional photo and voice recording
- Photo selection and voice playback
- Timeline sorted by year
- Local persistence with AsyncStorage and persistent media files
- Delete memories

## Important limitations

**This is a working local-first MVP, not a finished cloud-backed social app.** "Our Universe" is a separate category of memories on the same device. It does **not** invite other people, synchronize data, or provide access control. The local records are **not encrypted**. Do not treat this as secure private cloud storage. Authentication, Supabase database/storage, RLS, invitations, encrypted backups, media sharing, time capsules and AI storytelling are future work.

The galaxy uses layered 2D rendering and animated star effects for better mobile performance. Full 3D navigation and animated portals are a later phase. The project has not been tested on a physical device in this environment.

Audio recording uses Expo Audio. The first use prompts for microphone access. Native media are copied into app documents storage; deletion attempts to reclaim the attached files after the record is removed. The browser preview persists media as data URLs, subject to browser storage limits. Failed writes are reported and existing records are preserved.

## Suggested next phase

1. Add real animated transitions with Reanimated and Skia/Three.js.
2. Build Supabase authentication, database schema, private storage and RLS policies.
3. Implement secure invitations and collaborative universes.
4. Add edit memory, search, export and backup.
5. Test thoroughly on Android and iOS and create an EAS build.

## Project structure

- `app/index.tsx` — Welcome
- `app/universe.tsx` — Galaxy explorer
- `app/create.tsx` — Memory creation, photo and voice
- `app/memory/[id].tsx` — Memory detail and playback
- `app/timeline.tsx` — Timeline
- `app/about.tsx` — Experience explainer
- `src/store.tsx` — Local state and persistence
- `src/ui.tsx` — Cosmic design components
- `src/theme.ts` — Color system and moods
