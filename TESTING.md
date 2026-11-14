# Testing Glance on your iPhone with Expo Go

Expo Go is free and needs no Apple Developer account. Your computer runs the app and your iPhone loads it over Wi-Fi.

## First time

1. On your iPhone, install **Expo Go** from the App Store and sign in with your Expo account.
2. On your Mac, install Node.js LTS from nodejs.org.
3. In Terminal:
   ```bash
   git clone -b glance https://github.com/ahmeddeeb28-hash/New-Reppo.git ~/glance
   cd ~/glance
   npm install
   npx expo login
   ```
   Sign in with the same account you use in Expo Go.
4. Start Glance:
   ```bash
   npm run go
   ```
5. Scan the QR code with the iPhone Camera app. The first load takes 20–40 seconds.

## Every time after that

```bash
cd ~/glance
git pull
npm install
npm run go
```

In Expo Go, Glance also appears under **Development servers** while your Mac is running it.

## If something goes wrong

| What you see | What to do |
| --- | --- |
| "Signed in to Expo Go but not to Expo CLI" | Run `npx expo login` with the same account, then `npm run go` again. |
| QR code opens but never connects | Make sure the phone and Mac are on the same Wi-Fi, or run `npm run go:tunnel`. |
| "ConfigError: package.json does not exist" | You're in the wrong folder. Run `cd ~/glance` first. |
| Old screens still showing after `git pull` | Run `npm run go:fresh` to clear the cache. |
| "Project is incompatible with this version of Expo Go" | Update Expo Go from the App Store. Glance uses Expo SDK 58. |
| Red error screen on the phone | Take a screenshot of the phone and the Terminal and send both. |

While testing in Expo Go, camera and microphone permission prompts say "Expo Go" instead of "Glance". In a real build they say "Glance".

## What to test

### Record screen
- [ ] The script starts right under the Dynamic Island and never goes behind it.
- [ ] Dragging the bar on the camera view trades script space for camera space and clicks at three sizes.
- [ ] The dial on the right changes text size; tapping **Aa** switches it to speed.
- [ ] Light (sun) brightens the screen and adds a warm ring; brightness returns to normal when you turn it off or leave.
- [ ] Float turns the script into a card you can drag; it snaps to edges and stays clear of the island and home bar.
- [ ] Flip, zoom (1×, 1.5×, 2×) and the control pill are easy to reach with one thumb.
- [ ] Countdown, then recording: the island glows and the camera edge glows.
- [ ] Tap the script to pause and resume. The arrow goes back to the start.
- [ ] Rotate the phone: the script moves to the camera side and everything still fits.

### Haptics
- [ ] Ticks on snaps, dial steps, zoom and speed changes.
- [ ] Firm tap when recording starts, success when the take is saved.
- [ ] Settings → Haptics: Off, Subtle and Strong feel different. (iPhone mutes haptics while the mic is recording, so you won't feel section cues mid-take in Expo Go.)

### Accessibility
- [ ] **VoiceOver** (Settings → Accessibility → VoiceOver): every button says what it does; the bar and the dial can be adjusted by swiping up or down.
- [ ] **Larger Text**: Home and the editor stay readable and nothing is cut off.
- [ ] **Reduce Motion**: the splash appears without the eye animation.
- [ ] **Contrast**: try the Contrast reader theme in a bright room.

### Scripts
- [ ] Create a Reel and a Talk; reorder, add and remove sections.
- [ ] Time estimates make sense for what you say out loud.
- [ ] Save a take to Photos and share one.

Write down anything that feels slow, confusing or hard to reach, with a screenshot if you can.
