# Scopeline launch film

- `scopeline-launch.mp4`: 45 s, 1920×1080, 30 fps, with voiceover, music and sound effects
- `scopeline-launch-sfx-only.mp4`: voiceover and sound effects, no music, so you can add your own
- `scopeline-launch-no-voice.mp4`: music and sound effects, no voiceover

`project/` is the Remotion source. Run `npm ci`, then render:

```
npx remotion render src/index.ts ScopelineLaunch out/scopeline-launch.mp4
npx remotion render src/index.ts ScopelineLaunch out/scopeline-launch-sfx-only.mp4 --props=props-nobgm.json
```

`SPEC.md` holds the storyboard. The timeline is written in beats in `src/Main.tsx` (`SHOTS`), and every sound effect is pinned relative to a shot in the `SFX` table. The screens in `public/tex` were captured from the prototype by `capture/capture.js` and `capture/capture2.js` (at 4x).

Voiceover: Piper neural TTS, voice "lessac" (en_US, high). The script is in `project/voice/lines.json`, and `project/voice/make-voice.sh` regenerates the lines. Each line is pinned to its shot in the `VO` table in `src/Main.tsx`, which also ducks the music (to 40%) and the sound effects (to 70%) while the voice speaks. To render without the voice, pass `--props='{"voice":false}'`.

Audio: the music and sound effects are Mixkit (free licence). The music track's exact Mixkit source couldn't be traced, so re-check it before commercial use. Rendering uses Remotion, which has its own licence: free for individuals and small teams, but companies may need a paid licence.
