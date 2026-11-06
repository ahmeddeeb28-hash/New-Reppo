// Shared tokens, helpers and small components for the Scopeline launch film.
// Tokens come straight from the product's :root (scopeline.html).
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import '@fontsource/newsreader/400.css';
import '@fontsource/newsreader/500.css';
import '@fontsource/newsreader/400-italic.css';
import '@fontsource/newsreader/500-italic.css';
import '@fontsource/public-sans/400.css';
import '@fontsource/public-sans/600.css';
import '@fontsource/public-sans/700.css';
import '@fontsource/jetbrains-mono/500.css';

export const T = {
  bg: '#fbfaf7', tint: '#f4f1ea', surface: '#ffffff', ink: '#15130f', muted: '#625d55', line: '#e6e1d8',
  ev: '#11805a', evBg: '#e3f4ec', as: '#a35a00', asBg: '#fdf0da', qu: '#3a4fc6', bad: '#c2382c', badBg: '#fde6e3',
  red: '#ff6a55', green: '#45d39b',
  serif: '"Newsreader", Georgia, serif',
  sans: '"Public Sans", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
  mark: ['#3ccf91', '#f5b748', '#7d8cff', '#ffffff'],
};

// 123.05 BPM tech-house bed; the track is started so its beat 0 lands on frame 0.
export const FPS = 30;
export const BEAT = (60 / 123.046875) * FPS; // 14.628 f
export const beatF = (n: number) => Math.round(n * BEAT);
export const BGM_OFFSET_S = 1.486 + 12 * (60 / 123.046875); // drums enter on video beat 20

// Motion voice ("calm product confidence"): professional base + one real overshoot for landings.
export const E = {
  out: Easing.bezier(0, 0, 0.2, 1),
  inOut: Easing.bezier(0.65, 0, 0.25, 1),
  push: Easing.bezier(0.35, 0, 0.2, 1),
  pop: Easing.bezier(0.2, 1.25, 0.3, 1), // y1 > 1: real overshoot on landings
  fly: Easing.bezier(0.34, 1.4, 0.44, 1),
  word: Easing.bezier(0.2, 0.75, 0.3, 1),
};

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const ip = (f: number, a: number[], b: number[], easing?: (t: number) => number) =>
  interpolate(f, a, b, { ...clamp, easing });

export const mulberry32 = (a: number) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const Tex: React.FC<{ name: string; w: number; h?: number; style?: React.CSSProperties }> = ({ name, w, h, style }) => (
  <Img src={staticFile(`tex/${name}.png`)} style={{ width: w, height: h, display: 'block', ...style }} />
);

/** The product's logo mark: dark rounded tile with four squares. */
export const Mark: React.FC<{ size: number; frame?: number; start?: number }> = ({ size, frame = 999, start = 0 }) => {
  const pad = size * 0.14, gap = size * 0.09, cell = (size - pad * 2 - gap) / 2;
  const tileT = ip(frame, [start, start + 10], [0, 1], E.pop);
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.3, background: T.ink, position: 'relative', transform: `scale(${0.6 + 0.4 * tileT})`, opacity: Math.min(1, tileT * 1.5) }}>
      {T.mark.map((c, i) => {
        const d = start + 6 + i * 4;
        const t = ip(frame, [d, d + 9], [0, 1], E.pop);
        return (
          <div key={i} style={{
            position: 'absolute', left: pad + (i % 2) * (cell + gap), top: pad + Math.floor(i / 2) * (cell + gap),
            width: cell, height: cell, borderRadius: cell * 0.18, background: c,
            transform: `translateY(${(1 - t) * -size * 0.5}px) scale(${t})`, opacity: Math.min(1, t * 2),
          }} />
        );
      })}
    </div>
  );
};

/** Paper field with the landing page's soft lavender / green / blue glows. */
export const Paper: React.FC<{ children?: React.ReactNode; glow?: number }> = ({ children, glow = 1 }) => {
  const f = useCurrentFrame();
  const drift = Math.sin(f / 50) * 30;
  return (
    <AbsoluteFill style={{ background: T.bg }}>
      <AbsoluteFill style={{ opacity: glow, background: `radial-gradient(900px 600px at ${12 + drift / 40}% 10%, rgba(196,181,253,.42), transparent 78%), radial-gradient(1000px 520px at 50% ${108 - drift / 30}%, rgba(110,231,183,.30), transparent 78%), radial-gradient(800px 600px at 96% 18%, rgba(147,197,253,.38), transparent 78%)` }} />
      {children}
    </AbsoluteFill>
  );
};

/** Dark "board" stage with a coloured backlight that breathes — the product's own psboard look. */
export const Board: React.FC<{ tone: 'red' | 'green'; mix?: number; children?: React.ReactNode }> = ({ tone, mix, children }) => {
  const f = useCurrentFrame();
  const br = 1 + Math.sin(f / 22) * 0.06;
  const m = mix ?? (tone === 'green' ? 1 : 0);
  return (
    <AbsoluteFill style={{ background: '#15130f', overflow: 'hidden' }}>
      <AbsoluteFill style={{ opacity: 1 - m, transform: `scale(${br})`, background: 'radial-gradient(38% 48% at 50% 46%, rgba(255,92,72,.55), transparent 78%), radial-gradient(30% 35% at 18% 28%, rgba(255,160,80,.22), transparent 78%)' }} />
      <AbsoluteFill style={{ opacity: m, transform: `scale(${br})`, background: 'radial-gradient(38% 48% at 50% 40%, rgba(69,211,155,.55), transparent 78%), radial-gradient(30% 35% at 82% 72%, rgba(92,196,255,.28), transparent 78%)' }} />
      {children}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,.45))', pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};

/** Narration caption: readable (≥56px), product sans, a small brand square leading. */
export const Caption: React.FC<{ text: React.ReactNode; from: number; to: number; dark?: boolean; bottom?: number }> = ({ text, from, to, dark, bottom = 64 }) => {
  const f = useCurrentFrame();
  const inT = ip(f, [from, from + 9], [0, 1], E.out);
  const outT = ip(f, [to - 8, to], [1, 0]);
  if (f < from || f > to) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom, display: 'flex', justifyContent: 'center', opacity: inT * outT, transform: `translateY(${(1 - inT) * 14}px)` }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20, padding: '14px 30px', borderRadius: 999,
        background: dark ? 'rgba(21,19,15,.86)' : '#ffffff', border: `1px solid ${dark ? 'rgba(255,255,255,.18)' : T.line}`,
        boxShadow: dark ? 'none' : '0 10px 40px rgba(21,19,15,.10)',
        color: dark ? '#fff' : T.ink, fontFamily: T.sans, fontWeight: 600, fontSize: 60, letterSpacing: '-0.01em', lineHeight: 1.15,
      }}>
        <span style={{ width: 14, height: 14, borderRadius: 4, background: dark ? T.green : T.ev, flexShrink: 0 }} />
        <span>{text}</span>
      </div>
    </div>
  );
};

/** Breathing title card: serif words letterpress in, one green italic accent, a rule grows. */
export const TitleCard: React.FC<{ words: { t: string; a?: boolean }[]; dur: number; size?: number }> = ({ words, dur, size = 128 }) => {
  const f = useCurrentFrame();
  const out = ip(f, [dur - 7, dur], [1, 0]);
  const rule = ip(f, [16, 34], [0, 1], E.push);
  return (
    <Paper glow={0.7}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: out }}>
        <div style={{ maxWidth: 1560, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: '0.24em', fontFamily: T.serif, fontWeight: 500, fontSize: size, lineHeight: 1.08, letterSpacing: '-0.025em', color: T.ink, textAlign: 'center' }}>
          {words.map((w, i) => {
            const d = 3 + i * 4;
            const t = ip(f, [d, d + 9], [0, 1], E.word);
            return (
              <span key={i} style={{ display: 'inline-block', opacity: t, transform: `scale(${1.12 - 0.12 * t})`, filter: `blur(${(1 - t) * 7}px)`, fontStyle: w.a ? 'italic' : 'normal', color: w.a ? T.ev : undefined }}>{w.t}</span>
            );
          })}
        </div>
        <div style={{ marginTop: 44, width: 220, height: 6, borderRadius: 3, background: T.ev, transform: `scaleX(${rule})` }} />
      </AbsoluteFill>
    </Paper>
  );
};
