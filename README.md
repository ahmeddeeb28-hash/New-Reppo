# Glance

A free teleprompter for recording videos on your phone. Your script sits right under the front camera, so your eyes stay on the lens. The script is never in the recording.

Glance is free, with no ads, no subscriptions and no in-app purchases.

## What's in this build

- **Story sections.** Each script is a list of sections (Hook, Setup, Story, Value, Proof, Call to action, or your own). Each section has a headline and the words to say, with a word count and time estimate. Reel and Talk templates come pre-filled.
- **Record screen.** The script sits on black right under the camera, with your camera view below it. One bar on the camera view sets how much of each you see (it clicks into place at three sizes). Corner buttons: front light and settings top left, float and flip top right. A dial on the right edge sets text size or speed. Zoom (1×, 1.5×, 2×) and a control pill sit at the bottom. Switch to a floating script card you can drag anywhere; it always stays clear of the notch, Dynamic Island and home bar. Works in portrait and landscape.
- **Glow while you talk.** A violet glow pulses at the camera cut-out, right above the script, and around the camera view while you record.
- **Text styles.** Four fonts (Clean, Readable, Typewriter, Rounded), four colour themes, size, line spacing, alignment, section headlines on or off, reading line, and mirrored text.
- **Haptics.** Countdown ticks, record start, take saved, pause and resume, divider snaps, speed steps, section reached, the last 5 seconds and errors. Strength can be set to Off, Subtle, Normal or Strong.
- **Review.** Play back the take, then save it to Photos or share it. Nothing leaves the phone unless you share it.

## Run it on your iPhone (free, with Expo Go)

```bash
npm install
npx expo login
npm run go
```

Scan the QR code with the iPhone Camera app. Step-by-step setup, troubleshooting and a usability and accessibility checklist are in [TESTING.md](TESTING.md).

Before pushing changes, run `npm run check` (typecheck, lint and Expo doctor).

## Test on your iPhone with TestFlight

TestFlight needs an **Apple Developer Program** membership ($99/year, required by Apple even for free apps) and a free **Expo** account at expo.dev.

Run these on your own computer, in this folder.

1. Install the packages and sign in to Expo:
   ```bash
   npm install
   npx eas-cli@latest login
   ```
2. Link the project to your Expo account. This adds a `projectId` to `app.json`; commit that change.
   ```bash
   npx eas-cli@latest init
   ```
3. Build for iOS and send the build to TestFlight. EAS asks you to sign in with your Apple ID the first time, and it creates the certificates and the App Store Connect app for you.
   ```bash
   npx eas-cli@latest build --platform ios --profile staging --auto-submit
   ```
4. When the build finishes (about 15–25 minutes), open App Store Connect → your app → TestFlight. Add yourself as an internal tester, then install the **TestFlight** app on your iPhone and accept the invite.

Each new staging build increases the build number automatically.

### Before the first build

- The bundle ID is `com.glanceprompter.app`. If Apple says it's taken, change `ios.bundleIdentifier` (and `android.package`) in `app.json`.
- The app icon is a placeholder made from the Glance mark. Replace `assets/images/icon.png` (1024×1024, no transparency) when the final icon is ready.

## Build profiles (`eas.json`)

| Profile | Use |
| --- | --- |
| `development` | Dev client for day-to-day work |
| `staging` | TestFlight builds for testing usability and accessibility |
| `production` | App Store release |

## Project layout

```
src/app/            Screens (Expo Router)
  index.tsx         Script library
  script/[id].tsx   Story-section editor
  record/[id].tsx   Reader + camera + recording
  style.tsx         Text and prompter settings
  review.tsx        Play back, save, share
src/components/     Reader and shared UI
src/lib/            Story model, storage, haptics, theme tokens
```
