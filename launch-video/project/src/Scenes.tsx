import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import L from './layout.json';
import { T, E, ip, Tex, Mark, Paper, Board, Caption, mulberry32 } from './kit';

type Box = { x: number; y: number; width: number; height: number };
const B = L as unknown as Record<string, Box>;

/** Flat page camera: (cx, cy) page point centred, zoom scale. Keys interpolate with one easing. */
type Key = { f: number; cx: number; cy: number; z: number; r?: number };
const cam = (f: number, keys: Key[], ease = E.inOut) => {
  let a = keys[0], b = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) if (f >= keys[i].f && f <= keys[i + 1].f) { a = keys[i]; b = keys[i + 1]; break; }
  const t = a.f === b.f ? 1 : ip(f, [a.f, b.f], [0, 1], ease);
  const l = (p: number, q: number) => p + (q - p) * t;
  const cx = l(a.cx, b.cx), cy = l(a.cy, b.cy), z = l(a.z, b.z), r = l(a.r ?? 0, b.r ?? 0);
  return `translate(${960 - cx * z}px, ${540 - cy * z}px) scale(${z}) rotate(${r}deg)`;
};
const Page: React.FC<{ tf: string; children: React.ReactNode; blur?: number }> = ({ tf, children, blur = 0 }) => (
  <div style={{ position: 'absolute', width: 1920, height: 1080, transformOrigin: '0 0', transform: tf, filter: blur ? `blur(${blur}px)` : undefined }}>{children}</div>
);

// ───────────────────────── 1. OPEN (0–117) ─────────────────────────
export const SceneOpen: React.FC = () => {
  const f = useCurrentFrame();
  const word = 'Scopeline';
  const sub1 = 'Agree what to build';
  const sub2 = 'before anyone builds it.';
  const exit = ip(f, [100, 117], [0, 1], E.push); // push through into the problem board
  return (
    <Paper>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', transform: `scale(${1 + exit * 0.5})`, opacity: 1 - exit, filter: `blur(${exit * 10}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 34 }}>
          <Mark size={132} frame={f} start={2} />
          <div style={{ display: 'flex', fontFamily: T.serif, fontWeight: 500, fontSize: 168, letterSpacing: '-0.035em', color: T.ink }}>
            {word.split('').map((c, i) => {
              const d = 20 + i * 1.8;
              const t = ip(f, [d, d + 8], [0, 1], E.word);
              return <span key={i} style={{ display: 'inline-block', opacity: t, transform: `translateY(${(1 - t) * 28}px) scale(${1.2 - 0.2 * t})`, filter: `blur(${(1 - t) * 8}px)` }}>{c}</span>;
            })}
          </div>
        </div>
        <div style={{ marginTop: 40, fontFamily: T.serif, fontSize: 64, letterSpacing: '-0.02em', color: T.ink, textAlign: 'center', lineHeight: 1.1 }}>
          <span style={{ opacity: ip(f, [42, 52], [0, 1]), display: 'inline-block', marginRight: '0.26em', transform: `translateY(${ip(f, [42, 52], [16, 0], E.out)}px)` }}>{sub1}</span>
          <span style={{ fontStyle: 'italic', color: T.ev, opacity: ip(f, [50, 60], [0, 1]), display: 'inline-block', transform: `translateY(${ip(f, [50, 60], [16, 0], E.out)}px)` }}>{sub2}</span>
        </div>
      </AbsoluteFill>
    </Paper>
  );
};

// ───────────────────────── 2. PROBLEM (176f) ─────────────────────────
// Four tool cards deal in, red threads converge, camera spotlights each conflict, verdict lands.
const SC = [1, 2, 3, 4].map((i) => B['scard' + i]);
const SCALE_P = 1.75;
const SLOTS = [
  { x: 150, y: 250, r: -4 }, { x: 560, y: 300, r: 3 }, { x: 980, y: 260, r: -2 }, { x: 1390, y: 300, r: 4 },
];
export const SceneProblem: React.FC = () => {
  const f = useCurrentFrame();
  const cues = [6, 18, 27, 33]; // dealt faster and faster
  const focusAt = [62, 80, 98, 116];
  // camera keys over the stage
  const keys: Key[] = [{ f: 0, cx: 960, cy: 540, z: 1.12 }, { f: 40, cx: 960, cy: 520, z: 1 }];
  focusAt.forEach((t, i) => {
    const s = SLOTS[i], c = SC[i];
    const cx = s.x + (c.width * SCALE_P) / 2, cy = s.y + (c.height * SCALE_P) / 2;
    keys.push({ f: t, cx, cy, z: 1.55, r: -s.r * 0.4 }, { f: t + 12, cx, cy, z: 1.6, r: -s.r * 0.4 });
  });
  keys.push({ f: 142, cx: 960, cy: 540, z: 1 }, { f: 176, cx: 960, cy: 540, z: 0.96 });
  const tf = cam(f, keys, E.push);
  const focusIdx = focusAt.findIndex((t) => f >= t - 4 && f < t + 18);
  const q = { x: 960, y: 640 };
  const linesOn = ip(f, [40, 52], [0, 1]);
  const vT = ip(f, [146, 156], [0, 1], E.pop);
  const shake = f >= 156 && f < 168 ? Math.sin((f - 156) * 2.2) * 9 * (1 - (f - 156) / 12) : 0;
  return (
    <Board tone="red">
      <Page tf={tf}>
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: linesOn }}>
          {SLOTS.map((s, i) => {
            const c = SC[i];
            const x = s.x + (c.width * SCALE_P) / 2, y = s.y + c.height * SCALE_P;
            return <path key={i} d={`M${x} ${y} Q ${(x + q.x) / 2} ${y + 140} ${q.x} ${q.y}`} fill="none" stroke={T.red} strokeWidth={3} strokeDasharray="10 10" strokeDashoffset={-f * 1.5} />;
          })}
        </svg>
        <div style={{ position: 'absolute', left: q.x, top: q.y, transform: `translate(-50%,-50%) scale(${ip(f, [44, 54], [0.5, 1], E.pop)})`, opacity: linesOn, background: T.red, color: '#fff', fontFamily: T.sans, fontWeight: 700, fontSize: 34, padding: '10px 26px', borderRadius: 999, boxShadow: '0 0 50px rgba(255,92,72,.75)', whiteSpace: 'nowrap' }}>Which one is v1?</div>
        {SLOTS.map((s, i) => {
          const c = SC[i];
          const t = ip(f, [cues[i], cues[i] + 12], [0, 1], E.fly);
          const rnd = mulberry32(i * 97 + 3);
          const ox = (rnd() - 0.5) * 900, oy = -700 - rnd() * 300;
          const hot = focusIdx === i;
          const dim = focusIdx >= 0 && !hot;
          return (
            <div key={i} style={{
              position: 'absolute', left: s.x, top: s.y, transformOrigin: '0 0',
              transform: `translate(${(1 - t) * ox}px, ${(1 - t) * oy}px) rotate(${s.r + (1 - t) * (rnd() * 60 - 30)}deg) scale(${SCALE_P})`,
              opacity: Math.min(1, t * 3),
              filter: dim ? 'blur(3px) brightness(.7)' : 'none', transition: 'none',
            }}>
              <div style={{ transformOrigin: '0 0', borderRadius: 12, boxShadow: hot ? `0 0 0 2px ${T.red}, 0 0 46px 8px rgba(255,92,72,.6)` : '0 20px 40px rgba(0,0,0,.35)' }}><div style={{ borderRadius: 12, overflow: 'hidden' }}>
                <Tex name={'scard' + (i + 1)} w={c.width} h={c.height} />
              </div></div>
            </div>
          );
        })}
        <div style={{ position: 'absolute', left: 960, top: 820, transform: `translate(calc(-50% + ${shake}px), -50%) scale(${(0.8 + 0.2 * vT) * 1.9})`, opacity: vT }}>
          <div style={{ borderRadius: 999, overflow: 'hidden' }}><Tex name="verdict" w={B.verdict.width} h={B.verdict.height} /></div>
        </div>
      </Page>
      <Caption dark from={14} to={140} text="Nobody agrees on what's being built." />
    </Board>
  );
};

// ───────────────────────── 4. CHAT (234f) ─────────────────────────
// Describe it in plain words → Scopeline splits it into labelled claims → spotlight on the assumption.
const REQ1 = 'We want one-tap reorder to increase repeat purchases by 40%. Support tickets show';
const REQ2 = 'customers rebuild baskets by hand.';
export const TYPE_END = 150;
export const SEND_AT = 158;
export const SWAP_AT = 168;
export const CHAT_END = 263;
export const SceneChat: React.FC = () => {
  const f = useCurrentFrame();
  const typed = Math.floor(ip(f, [12, TYPE_END], [0, REQ1.length + REQ2.length]));
  const l1 = Math.min(typed, REQ1.length), l2 = Math.max(0, typed - REQ1.length);
  const ta = { x: 617, y: 548.5 };
  const p1 = B.pcard1;
  // phase A camera (typing) then phase B (proposals) with spotlight push onto the assumption card
  const tfA = cam(f, [{ f: 0, cx: 960, cy: 520, z: 1.0 }, { f: 34, cx: 945, cy: 585, z: 2.0 }, { f: SWAP_AT, cx: 950, cy: 590, z: 2.05 }], E.inOut);
  const tfB = cam(f, [
    { f: SWAP_AT, cx: 860, cy: 330, z: 1.25 }, { f: 196, cx: 860, cy: 330, z: 1.3 },
    { f: 218, cx: p1.x + p1.width / 2, cy: p1.y + p1.height / 2, z: 2.25 }, { f: CHAT_END, cx: p1.x + p1.width / 2 + 10, cy: p1.y + p1.height / 2, z: 2.35 },
  ], E.push);
  const press = ip(f, [SEND_AT - 3, SEND_AT, SEND_AT + 4], [1, 0.82, 1]);
  const spot = ip(f, [206, 222], [0, 1], E.out);
  const ring = ip(f, [222, 242], [0, 1], E.inOut);
  const pulse = 0.5 + 0.5 * Math.sin((f - 226) / 5);
  const caret = Math.floor(f / 8) % 2 === 0 && f < SEND_AT;
  const lineW = (s: string) => s.length * 8.2; // approx 16.8px Public Sans
  return (
    <AbsoluteFill style={{ background: T.bg }}>
      {f < SWAP_AT ? (
        <Page tf={tfA}>
          <Tex name="chat-empty" w={1920} h={1080} />
          <div style={{ position: 'absolute', left: ta.x - 4, top: ta.y - 2, width: 650, height: 56, background: '#fff' }} />
          <div style={{ position: 'absolute', left: ta.x, top: ta.y, fontFamily: T.sans, fontSize: 16.8, lineHeight: '25.2px', color: T.ink, whiteSpace: 'pre' }}>
            <div>{REQ1.slice(0, l1)}{l2 === 0 && caret ? <span style={{ borderLeft: `2px solid ${T.ink}`, marginLeft: 1 }} /> : null}</div>
            <div>{REQ2.slice(0, l2)}{l2 > 0 && caret ? <span style={{ borderLeft: `2px solid ${T.ink}`, marginLeft: 1 }} /> : null}</div>
          </div>
          <div style={{ position: 'absolute', left: 1265, top: 636, width: 40, height: 40, borderRadius: 20, transform: `scale(${press})`, boxShadow: f > SEND_AT - 3 && f < SEND_AT + 8 ? '0 0 0 8px rgba(17,128,90,.25)' : 'none' }} />
        </Page>
      ) : (
        <Page tf={tfB}>
          <Tex name="chat-proposals" w={1920} h={1080} />
          {/* spotlight: dim everything but the assumption card */}
          <div style={{ position: 'absolute', inset: -400, opacity: spot * 0.5, background: `radial-gradient(${p1.width * 0.62}px ${p1.height * 1.15}px at ${p1.x + 400 + p1.width / 2}px ${p1.y + 400 + p1.height / 2}px, transparent 88%, rgba(21,19,15,.75) 112%)` }} />
          <svg style={{ position: 'absolute', left: p1.x - 6, top: p1.y - 6, overflow: 'visible' }} width={p1.width + 12} height={p1.height + 12}>
            <rect x={1} y={1} width={p1.width + 10} height={p1.height + 10} rx={14} fill="none" stroke={T.as} strokeWidth={2.4}
              pathLength={1} strokeDasharray={`${ring} 1`} opacity={ring > 0 ? 0.9 : 0} />
          </svg>
          {/* "40%" sourced? pulse */}
          <div style={{ position: 'absolute', left: 918, top: 311, width: 44, height: 22, borderRadius: 6, boxShadow: `0 0 0 ${2 + pulse * 4}px rgba(194,56,44,${0.35 * ip(f, [232, 242], [0, 1])})` }} />
        </Page>
      )}
      <AbsoluteFill style={{ background: '#fff', opacity: ip(f, [SWAP_AT - 4, SWAP_AT, SWAP_AT + 6], [0, 0.85, 0]), pointerEvents: 'none' }} />
      <Caption from={8} to={SWAP_AT - 2} text="Describe the feature in plain words." />
      <Caption from={SWAP_AT + 14} to={CHAT_END} text={<>Every claim labelled: <span style={{ color: T.ev }}>evidence</span> or <span style={{ color: T.as }}>assumption</span>.</>} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 5. DEFINE (146f) ─────────────────────────
// Accepted claims lift out of the chat and land in the definition panel (panel-to-canvas).
export const SceneDefine: React.FC = () => {
  const f = useCurrentFrame();
  const p1 = B.pcard1;
  // carries on from the chat shot's close-up, then pulls back so both panes are in view
  const tf = cam(f, [
    { f: 0, cx: p1.x + p1.width / 2 + 10, cy: p1.y + p1.height / 2, z: 2.35 }, { f: 22, cx: 1060, cy: 420, z: 1.18 },
    { f: 82, cx: 1060, cy: 420, z: 1.2 }, { f: 118, cx: 1350, cy: 430, z: 1.6 }, { f: 146, cx: 1355, cy: 430, z: 1.62 },
  ], E.inOut);
  const flights = [
    { src: B.pcard2, n1: 'pcard2', dst: B.doc_ev, n2: 'doc_ev', cue: 30 },
    { src: B.pcard1, n1: 'pcard1', dst: B.doc_as, n2: 'doc_as', cue: 42 },
  ];
  const landAll = flights[1].cue + 26;
  const added = ip(f, [24, 32], [0, 1]); // chat cards turn to their "Added" state as they lift
  const panel = ip(f, [landAll, landAll + 4], [0, 1]);
  return (
    <AbsoluteFill style={{ background: T.bg }}>
      <Page tf={tf} blur={ip(f, [0, 8, 18], [0, 3, 0])}>
        <Tex name="chat-proposals" w={1920} h={1080} style={{ position: 'absolute' }} />
        <Tex name="chat-accepted" w={1920} h={1080} style={{ position: 'absolute', opacity: added, clipPath: 'inset(268px 720px 610px 500px)' }} />
        <Tex name="chat-accepted" w={1920} h={1080} style={{ position: 'absolute', opacity: panel, clipPath: 'inset(0 0 0 1290px)' }} />
        {flights.map((fl, i) => {
          const t = ip(f, [fl.cue, fl.cue + 26], [0, 1], E.fly);
          const lift = ip(f, [fl.cue - 8, fl.cue], [0, 1], E.out);
          const tt = Math.min(1, Math.max(0, t));
          const x = fl.src.x + (fl.dst.x - fl.src.x) * t;
          const y = fl.src.y + (fl.dst.y - fl.src.y) * t - Math.sin(tt * Math.PI) * 120;
          const w = fl.src.width + (fl.dst.width - fl.src.width) * tt;
          const h = fl.src.height + (fl.dst.height - fl.src.height) * tt;
          const morph = ip(f, [fl.cue + 8, fl.cue + 18], [0, 1]);
          const vis = f >= fl.cue - 8 && panel < 1;
          return vis ? (
            <div key={i} style={{ position: 'absolute', left: x, top: y, width: w, height: h, transform: `rotate(${Math.sin(tt * Math.PI) * (i ? 3 : -3)}deg) scale(${1 + lift * 0.04 * (1 - tt)})`, boxShadow: `0 ${20 * lift}px ${50 * lift}px rgba(21,19,15,${0.18 * lift * (1 - tt * 0.7)})`, borderRadius: 10, overflow: 'hidden' }}>
              <Tex name={fl.n1} w={w} h={h} style={{ position: 'absolute', opacity: 1 - morph }} />
              <Tex name={fl.n2} w={w} h={h} style={{ position: 'absolute', opacity: morph }} />
            </div>
          ) : null;
        })}
        <div style={{ position: 'absolute', left: 1304, top: 53, width: 420, height: 1010, borderRadius: 12, boxShadow: `inset 0 0 0 2px rgba(17,128,90,${ip(f, [landAll, landAll + 4, landAll + 22], [0, 0.6, 0])})` }} />
      </Page>
      <Caption from={14} to={146} text="Agreed claims build one shared definition." />
    </AbsoluteFill>
  );
};

// ───────────────────────── 7. FORECAST (146f) ─────────────────────────
// A suggested chart embeds, the lines draw in, and the placeholder badge is underlined: nothing invented.
export const SceneForecast: React.FC = () => {
  const f = useCurrentFrame();
  const v = B.vcard1;
  const S = 1.55;
  const land = ip(f, [0, 20], [0, 1], E.pop);
  const draw = ip(f, [20, 66], [0, 1], E.inOut);
  const mark = ip(f, [78, 92], [0, 1], E.push);
  const push = ip(f, [70, 146], [0, 1], E.inOut);
  return (
    <Paper glow={0.8}>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', perspective: 1600 }}>
        <div style={{ position: 'relative', width: v.width * S, height: v.height * S, marginTop: -60, transform: `translateY(${(1 - land) * 220}px) rotateX(${(1 - land) * 28}deg) scale(${1 + push * 0.08}) translate(${-push * 60}px, ${push * 30}px)`, opacity: Math.min(1, 0.25 + land * 2), transformOrigin: '50% 100%' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 16, boxShadow: '0 40px 90px rgba(21,19,15,.16)' }} />
          {/* static chrome (title, legend, buttons) */}
          <Tex name="vcard1" w={v.width * S} h={v.height * S} style={{ position: 'absolute', clipPath: `polygon(0 0,100% 0,100% 11%,0 11%,0 63%,100% 63%,100% 100%,0 100%)` }} />
          {/* plot area draws left → right */}
          <Tex name="vcard1" w={v.width * S} h={v.height * S} style={{ position: 'absolute', clipPath: `inset(11% ${100 - (4 + draw * 96)}% 37% 0)` }} />
          {/* marker underline on "Placeholders · add numbers" */}
          <div style={{ position: 'absolute', left: v.width * S * 0.735, top: v.height * S * 0.075, width: v.width * S * 0.245 * mark, height: 5, borderRadius: 3, background: T.as, opacity: 0.9 }} />
          <div style={{ position: 'absolute', left: v.width * S * 0.72, top: v.height * S * 0.005, width: v.width * S * 0.275, height: v.height * S * 0.07, borderRadius: 999, boxShadow: `0 0 0 ${3 + 3 * Math.sin(f / 5)}px rgba(163,90,0,${0.3 * mark})` }} />
        </div>
      </AbsoluteFill>
      <Caption from={8} to={146} text="Charts suggested. Numbers never invented." />
    </Paper>
  );
};

// ───────────────────────── 8. SOLUTION (176f) ─────────────────────────
// Four role sign-offs converge along curves into one agreed definition; backlight turns green.
const BC = [1, 2, 3, 4].map((i) => B['bcard' + i]);
export const SceneSolution: React.FC = () => {
  const f = useCurrentFrame();
  const S = 1.65;
  const root = { x: 960, y: 300 };
  const slots = [0, 1, 2, 3].map((i) => ({ x: 960 + (i - 1.5) * 430, y: 600 }));
  const starts = [{ x: -200, y: 120 }, { x: 420, y: 1300 }, { x: 1500, y: 1300 }, { x: 2150, y: 140 }];
  const pillT = ip(f, [0, 12], [0, 1], E.pop);
  const burst = ip(f, [10, 16, 40], [0, 1, 0]);
  const tf = cam(f, [{ f: 0, cx: 960, cy: 520, z: 0.94 }, { f: 120, cx: 960, cy: 500, z: 1.04 }, { f: 176, cx: 960, cy: 500, z: 1.06 }], E.inOut);
  const mix = 1;
  return (
    <Board tone="green" mix={mix}>
      <Page tf={tf}>
        <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {slots.map((s, i) => {
            const d = `M${root.x} ${root.y + 40} C ${root.x} ${root.y + 160}, ${s.x} ${s.y - 200}, ${s.x} ${s.y - 80}`;
            const t = ip(f, [20 + i * 6, 44 + i * 6], [0, 1], E.inOut);
            return <path key={i} d={d} fill="none" stroke="rgba(255,255,255,.4)" strokeWidth={3} pathLength={1} strokeDasharray={`${t} 1`} />;
          })}
        </svg>
        <div style={{ position: 'absolute', left: root.x, top: root.y, transform: `translate(-50%,-50%) translateY(${(1 - pillT) * -120}px) scale(${S * (0.7 + 0.3 * pillT)})`, opacity: pillT, borderRadius: 999, boxShadow: `0 0 0 ${10 * burst}px rgba(69,211,155,.3), 0 0 ${60 * burst + 20}px ${10 * burst}px rgba(69,211,155,${0.3 + 0.4 * burst})` }}>
          <div style={{ borderRadius: 999, overflow: 'hidden' }}><Tex name="rootpill" w={B.rootpill.width} h={B.rootpill.height} /></div>
        </div>
        {slots.map((s, i) => {
          const c = BC[i];
          const cue = 46 + i * 9 - i * i; // accelerating
          const t = ip(f, [cue, cue + 22], [0, 1], E.fly);
          const st = starts[i];
          // quadratic path from start → slot, bowing toward the centre
          const mx = (st.x + s.x) / 2, my = Math.min(st.y, s.y) - 120;
          const x = (1 - t) * (1 - t) * st.x + 2 * (1 - t) * t * mx + t * t * s.x;
          const y = (1 - t) * (1 - t) * st.y + 2 * (1 - t) * t * my + t * t * s.y;
          const glow = ip(f, [cue + 18, cue + 22, cue + 40], [0, 1, 0]);
          return (
            <div key={i} style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) rotate(${(1 - t) * (i % 2 ? 18 : -18)}deg) scale(${S * (1 + (1 - t) * 0.12)})`, opacity: Math.min(1, t * 3), borderRadius: 12, boxShadow: `0 0 0 ${2 * glow}px ${T.green}, 0 0 ${40 * glow}px ${8 * glow}px rgba(69,211,155,.5), 0 18px 40px rgba(0,0,0,.35)` }}>
              <Tex name={'bcard' + (i + 1)} w={c.width} h={c.height} style={{ borderRadius: 10 }} />
            </div>
          );
        })}
      </Page>
      <Caption dark from={14} to={176} text="PM, design, growth and engineering sign off." />
    </Board>
  );
};

// ───────────────────────── 9. OUTRO (205f) ─────────────────────────
// Launch "group photo": one element from every scene flies back around the wordmark, which stamps on the beat.
export const STAMP = 58;
export const SceneOutro: React.FC = () => {
  const f = useCurrentFrame();
  const crane = ip(f, [0, 40], [0, 1], E.out);
  const items = [
    { n: 'scard1', b: B.scard1, x: 250, y: 190, r: -5, s: 1.25 },
    { n: 'pcard1', b: B.pcard1, x: 1500, y: 240, r: 3, s: 0.72, back: true },
    { n: 'bcard2', b: B.bcard2, x: 1560, y: 820, r: 4, s: 1.35 },
    { n: 'vcard1', b: B.vcard1, x: 300, y: 790, r: -3, s: 0.52, back: true },
    { n: 'rootpill', b: B.rootpill, x: 860, y: 150, r: -2, s: 1.5 },
    { n: 'scard3', b: B.scard3, x: 1640, y: 470, r: 5, s: 1.0 },
    { n: 'bcard4', b: B.bcard4, x: 230, y: 500, r: -4, s: 1.05 },
  ];
  const backRow = ip(f, [STAMP - 16, STAMP - 6], [0, 1]);
  const stampT = ip(f, [STAMP - 4, STAMP], [0, 1], E.out);
  const stageLight = ip(f, [STAMP - 16, STAMP - 8, STAMP + 10], [0, 0.55, 0.3]);
  const ctaT = ip(f, [STAMP + 16, STAMP + 28], [0, 1], E.pop);
  const word = 'Scopeline';
  const dust = Array.from({ length: 22 }, (_, i) => { const r = mulberry32(i * 31 + 7); return { x: r() * 1920, y: 1080 - ((f * (0.6 + r() * 1.2) + r() * 1080) % 1180), s: 2 + r() * 3, o: 0.15 + r() * 0.25, c: T.mark[i % 3] }; });
  return (
    <Paper>
      <AbsoluteFill style={{ perspective: 1400 }}>
        <AbsoluteFill style={{ transform: `rotateX(${4 * (1 - crane)}deg) scale(${1.06 - 0.06 * crane + ip(f, [40, 205], [0, 0.035])})` }}>
          {/* stage light behind the wordmark */}
          <AbsoluteFill style={{ opacity: stageLight, background: 'radial-gradient(700px 360px at 50% 50%, rgba(17,128,90,.28), rgba(196,181,253,.18) 45%, transparent 75%)' }} />
          {items.map((it, i) => {
            const cue = i * 3 - 6;
            const t = ip(f, [cue, cue + 12], [0, 1], E.fly);
            const rnd = mulberry32(i * 13 + 5);
            const ox = (it.x < 960 ? -1 : 1) * (360 + rnd() * 140), oy = (it.y < 540 ? -1 : 1) * (360 + rnd() * 140);
            const glow = ip(f, [cue + 11, cue + 12, cue + 18], [0, 0.35, 0]);
            return (
              <div key={i} style={{ position: 'absolute', left: it.x, top: it.y, transform: `translate(-50%,-50%) translate(${(1 - t) * ox}px, ${(1 - t) * oy}px) rotate(${it.r * (1 + (1 - t) * 2)}deg) scale(${it.s * (1.12 - 0.12 * t)})`, opacity: Math.min(1, t * 3) * (1 - backRow * 0.14) * ((it as { back?: boolean }).back ? 0.6 : 1), filter: `saturate(${1 - backRow * 0.1}) blur(${(it as { back?: boolean }).back ? 2.5 : 0}px)` }}>
                <div style={{ borderRadius: 14, boxShadow: `0 24px 50px rgba(21,19,15,.14), 0 0 0 ${3 * glow / 0.35}px rgba(17,128,90,${glow})` }}>
                  <Tex name={it.n} w={it.b.width} h={it.b.height} style={{ borderRadius: 12 }} />
                </div>
              </div>
            );
          })}
          <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 30, transform: `scale(${1.25 - 0.25 * stampT})`, opacity: stampT }}>
              <Mark size={120} frame={f + 30} start={STAMP - 6 + 30 - 20} />
              <div style={{ fontFamily: T.serif, fontWeight: 500, fontSize: 156, letterSpacing: '-0.035em', color: T.ink }}>{word}</div>
            </div>
            <div style={{ marginTop: 34, height: 4, width: 520 * ip(f, [STAMP + 2, STAMP + 14], [0, 1], E.push), background: T.ink, borderRadius: 2, opacity: 0.85 }} />
            <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 26, opacity: Math.min(1, ctaT * 1.5), transform: `translateY(${(1 - ctaT) * 24}px)` }}>
              <div style={{ background: T.ink, color: '#fff', fontFamily: T.sans, fontWeight: 600, fontSize: 46, padding: '20px 44px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 18 }}>
                Start free <span style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(255,255,255,.18)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>›</span>
              </div>
              <div style={{ fontFamily: T.sans, fontSize: 38, color: T.muted }}>Free for product teams · no sign-up</div>
            </div>
          </AbsoluteFill>
          {dust.map((d, i) => <div key={i} style={{ position: 'absolute', left: d.x, top: d.y, width: d.s, height: d.s, borderRadius: d.s, background: d.c, opacity: d.o * ip(f, [STAMP, STAMP + 20], [0, 1]) }} />)}
        </AbsoluteFill>
      </AbsoluteFill>
      {/* light band sweeps across as the group assembles */}
      <AbsoluteFill style={{ pointerEvents: 'none', opacity: ip(f, [2, 8, 14], [0, 0.14, 0]), background: `linear-gradient(100deg, transparent ${ip(f, [2, 14], [-30, 90])}%, #fff ${ip(f, [2, 14], [-15, 105])}%, transparent ${ip(f, [2, 14], [0, 120])}%)` }} />
    </Paper>
  );
};
