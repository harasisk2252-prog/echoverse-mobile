# EchoVerse: from website developer to Android developer

EchoVerse is a React Native app using Expo SDK 54 and Expo Router. You already have the app source. Screens use `View`, `Text`, and `Pressable` instead of HTML elements. Expo builds those components into an Android application; its web target also lets you preview the same screens in a browser.

## 1. Run the project on your computer

Open PowerShell in this folder (the one containing package.json):

```powershell
npm ci
npm run web
```

Use the localhost URL printed by Expo. Keep the terminal running. Browser memories belong to that browser and origin, so the hosted preview and localhost do not share memories.

## 2. Try it on an Android phone

This project uses **SDK 54**. The current Play Store Expo Go may support a newer SDK. Download the Android Expo Go version compatible with SDK 54 from https://expo.dev/go, or use the standalone APK route below.

```powershell
npm start
```

Keep your phone and computer on the same Wi-Fi. Open Expo Go and scan the terminal QR code. If your network blocks LAN access, try `npx expo start --tunnel` and follow Expo's tunnel dependency prompt. This is a temporary development session; your computer must remain on.

Test creating a memory, selecting a photo, allowing/denying the microphone, recording/stopping/replaying voice, switching universes, dragging/pinching the galaxy, deleting a test memory, and closing/reopening the app. Android behavior still needs this physical-device test.

## 3. Build an APK you can install without the computer

Create an Expo account at https://expo.dev if needed. From this project folder:

```powershell
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

If EAS asks to initialize Git, accept and make an initial commit. Let EAS create/link your project, and let it generate an Android signing keystore if you do not already have one. Keep ownership of your Expo account and signing credentials. The `preview` profile in `eas.json` generates an **APK**. Build availability/queues depend on your Expo plan; review any paid offer before accepting it.

When the build finishes, EAS gives you a download/install URL. Open it on your Android phone, download the APK, and follow Android's installation prompt for that source. The APK runs independently of the development server. A website preview URL does not install a native Android app.

## 4. Prepare for Google Play

Before store release, test on physical phones, create your app icon and splash artwork, confirm the permanent Android application ID (`com.echoverse.memories` currently), and upgrade the SDK/dependencies with a fresh regression test. Resolve remaining npm audit advisories as part of that upgrade.

```powershell
npx eas-cli@latest build --platform android --profile production
```

The production profile generates an **AAB** for Play Console, not a directly installable APK. Create a Google Play developer account, complete the current identity/testing requirements, prepare screenshots and a privacy policy/data-safety disclosure that accurately describes the final app, then upload through Play Console. Check the current Play Console requirements when you reach this step.

## What is implemented and what comes next

- Working local memory categories, stories, moods, dates, optional photo/voice, galaxy and timeline.
- Records are stored locally, without encryption or cloud backup. Clearing browser/app data or uninstalling can remove memories.
- “Our Universe” is a local demo category; it does not invite, synchronize, or authenticate other people.
- Browser media is stored as data URLs and shares the browser's limited local-storage quota. Large attachments can fail; the app reports the failure instead of pretending it saved. Native media is copied to the app's documents folder.
- Next product work: edit/search/export/backup, then accounts and a database with private media storage and access-control policies if you want real sharing.

## Useful checks

```powershell
npm run typecheck
node --test tests/date.test.cjs
npx expo-doctor
npm run export:web
```

Official guides: [Expo environment setup](https://docs.expo.dev/get-started/set-up-your-environment/), [APK builds](https://docs.expo.dev/build-reference/apk/), [first cloud build](https://docs.expo.dev/build/setup/).
