import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, interpolate, useVideoConfig } from 'remotion';
import { beatF, BGM_OFFSET_S, FPS, TitleCard } from './kit';
import { SceneOpen, SceneProblem, SceneChat, SceneDefine, SceneForecast, SceneSolution, SceneOutro, SEND_AT, SWAP_AT, STAMP } from './Scenes';

// Single source of truth for the timeline, written in beats (123 BPM, 1 bar = 4 beats).
const span = (a: number, b: number) => ({ from: beatF(a), dur: beatF(b) - beatF(a) });
export const SHOTS = {
  open: span(0, 8),
  problem: span(8, 20),
  title1: span(20, 24),
  chat: span(24, 42),
  define: span(42, 52),
  title2: span(52, 56),
  forecast: span(56, 66),
  solution: span(66, 78),
  outro: span(78, 92),
};
export const TOTAL = beatF(92);
// Measured: rendered SFX land ~1.3f late (AAC priming), so every pin is pulled 1 frame earlier.
const AUDIO_LAG = 1;

// SFX pin table. `from` is always relative to a shot (never a bare frame).
const S = SHOTS;
export const SFX: { from: number; src: string; volume: number; dur?: number; note: string }[] = [
  { from: S.open.from + 4, src: 'transition-soft', volume: 0.7, note: 'logo tile appears' },
  { from: S.open.from + 20, src: 'typewriter-hit-soft', volume: 0.8, note: 'wordmark letters press' },
  { from: S.open.from + 98, src: 'whoosh-big', volume: 0.7, note: 'push through into the board' },
  { from: S.problem.from + 5, src: 'paper-slide', volume: 0.99, note: 'card 1 dealt' },
  { from: S.problem.from + 17, src: 'paper-slide', volume: 0.84, note: 'card 2 dealt' },
  { from: S.problem.from + 26, src: 'paper-slide', volume: 0.7, note: 'card 3 dealt' },
  { from: S.problem.from + 32, src: 'paper-slide', volume: 0.59, note: 'card 4 dealt' },
  { from: S.problem.from + 44, src: 'pop', volume: 0.77, note: '"4 versions?" node pops' },
  { from: S.problem.from + 58, src: 'swoosh-quick', volume: 0.66, note: 'camera to card 1' },
  { from: S.problem.from + 76, src: 'swoosh-quick', volume: 0.57, note: 'camera to card 2' },
  { from: S.problem.from + 94, src: 'swoosh-quick', volume: 0.51, note: 'camera to card 3' },
  { from: S.problem.from + 112, src: 'swoosh-quick', volume: 0.44, note: 'camera to card 4' },
  { from: S.problem.from + 146, src: 'hit-weak', volume: 0.8, note: 'verdict lands + shake' },
  { from: S.title1.from, src: 'impact-cine-big', volume: 1.0, dur: 45, note: 'drums drop: "Start with one conversation" (slam 1)' },
  { from: S.chat.from + 12, src: 'keyboard', volume: 0.9, dur: 140, note: 'typing the request' },
  { from: S.chat.from + SEND_AT - 1, src: 'switch-click-quick', volume: 0.8, note: 'send pressed' },
  { from: S.chat.from + SWAP_AT - 4, src: 'whoosh-fast', volume: 0.75, note: 'cut to labelled claims' },
  { from: S.chat.from + 206, src: 'camera-autofocus', volume: 1.0, dur: 20, note: 'spotlight push onto the assumption' },
  { from: S.chat.from + 222, src: 'marker-pen-line', volume: 1.0, note: 'ring traces the assumption card' },
  { from: S.define.from + 0, src: 'whoosh-big', volume: 0.55, note: 'pull back from the close-up' },
  { from: S.define.from + 26, src: 'whoosh-fast', volume: 0.75, note: 'evidence card lifts' },
  { from: S.define.from + 38, src: 'whoosh-fast', volume: 0.75, note: 'assumption card lifts' },
  { from: S.define.from + 68, src: 'pop', volume: 0.88, note: 'cards land in the definition' },
  { from: S.title2.from, src: 'transition-soft', volume: 0.7, note: 'title card 2' },
  { from: S.forecast.from + 0, src: 'air-woosh-deep', volume: 0.7, note: 'chart embeds' },
  { from: S.forecast.from + 20, src: 'shimmer-sparkle-sweep', volume: 0.6, dur: 46, note: 'lines draw in' },
  { from: S.forecast.from + 76, src: 'marker-pen-line', volume: 1.0, note: 'underline "Placeholders"' },
  { from: S.solution.from + 0, src: 'bass-hit-short', volume: 0.8, note: 'root pill drops (green burst)' },
  { from: S.solution.from + 67, src: 'pop', volume: 0.79, note: 'sign-off 1 lands' },
  { from: S.solution.from + 75, src: 'pop', volume: 0.7, note: 'sign-off 2 lands' },
  { from: S.solution.from + 81, src: 'pop', volume: 0.62, note: 'sign-off 3 lands' },
  { from: S.solution.from + 85, src: 'pop', volume: 0.55, note: 'sign-off 4 lands' },
  { from: S.outro.from - 40, src: 'riser-cine', volume: 0.6, note: 'riser into the group photo' },
  { from: S.outro.from + STAMP - 3, src: 'impact-deep-whoosh', volume: 0.9, note: 'wordmark stamp (peak, slam 2)' },
  { from: S.outro.from + STAMP + 4, src: 'sparkle', volume: 0.9, dur: 60, note: 'rule + dust sparkle' },
];

export const Main: React.FC<{ bgm?: boolean }> = ({ bgm = true }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: '#fbfaf7' }}>
      <Sequence from={S.open.from} durationInFrames={S.open.dur}><SceneOpen /></Sequence>
      <Sequence from={S.problem.from} durationInFrames={S.problem.dur}><SceneProblem /></Sequence>
      <Sequence from={S.title1.from} durationInFrames={S.title1.dur}><TitleCard dur={S.title1.dur} words={[{ t: 'Start' }, { t: 'with' }, { t: 'one' }, { t: 'conversation.', a: true }]} /></Sequence>
      <Sequence from={S.chat.from} durationInFrames={S.chat.dur}><SceneChat /></Sequence>
      <Sequence from={S.define.from} durationInFrames={S.define.dur}><SceneDefine /></Sequence>
      <Sequence from={S.title2.from} durationInFrames={S.title2.dur}><TitleCard dur={S.title2.dur} size={112} words={[{ t: 'Numbers' }, { t: 'stay' }, { t: 'blank', a: true }, { t: 'until' }, { t: 'someone' }, { t: 'sources' }, { t: 'them.' }]} /></Sequence>
      <Sequence from={S.forecast.from} durationInFrames={S.forecast.dur}><SceneForecast /></Sequence>
      <Sequence from={S.solution.from} durationInFrames={S.solution.dur}><SceneSolution /></Sequence>
      <Sequence from={S.outro.from} durationInFrames={S.outro.dur}><SceneOutro /></Sequence>
      {bgm ? (
        <Audio src={staticFile('audio/bgm-tech-house.mp3')} startFrom={Math.round(BGM_OFFSET_S * FPS)}
          volume={(f) => interpolate(f, [0, 20, S.title1.from - 4, S.title1.from + 2, S.title1.from + 34, durationInFrames - 40, durationInFrames], [0, 0.3, 0.3, 0.17, 0.3, 0.3, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
      ) : null}
      {SFX.map((s, i) => (
        <Sequence key={i} from={Math.max(0, s.from - AUDIO_LAG)} durationInFrames={s.dur ?? 150}>
          <Audio src={staticFile(`audio/${s.src}.mp3`)} volume={s.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
