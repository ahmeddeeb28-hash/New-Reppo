# Scopeline launch film

- `scopeline-launch.mp4`: 45 s, 1920×1080, 30 fps, with music and sound effects
- `scopeline-launch-sfx-only.mp4`: the same cut with sound effects only, so you can add your own music

`project/` is the Remotion source. Run `npm ci`, then render:

```
npx remotion render src/index.ts ScopelineLaunch out/scopeline-launch.mp4
npx remotion render src/index.ts ScopelineLaunch out/scopeline-launch-sfx-only.mp4 --props=props-nobgm.json
```

`SPEC.md` holds the storyboard. The timeline is written in beats in `src/Main.tsx` (`SHOTS`), and every sound effect is pinned relative to a shot in the `SFX` table. The screens in `public/tex` were captured from the prototype by `capture/capture.js` and `capture/capture2.js` (at 4x).

Audio: the music and sound effects are Mixkit (free licence). The music track's exact Mixkit source couldn't be traced, so re-check it before commercial use. Rendering uses Remotion, which has its own licence: free for individuals and small teams, but companies may need a paid licence.
