import type { CardFrame, Dock } from './store';

export type Rect = { x: number; y: number; w: number; h: number };
export type Insets = { top: number; bottom: number; left: number; right: number };

/** Gap kept between the card and the notch, screen edges and controls. */
export const GAP = 8;
/** Distance from an edge at which the card snaps to it. */
export const SNAP = 36;
export const MIN_W = 150;
export const MIN_H = 96;

/**
 * The box the script card may live in. It never covers the notch / Dynamic
 * Island (top inset), the camera cut-out in landscape (side insets), the home
 * indicator (bottom inset) or the recording controls.
 */
export function safeArea(W: number, H: number, insets: Insets, landscape: boolean, controls: number): Rect {
  const left = insets.left + GAP;
  const top = insets.top + GAP;
  const right = W - insets.right - GAP - (landscape ? controls : 0);
  const bottom = H - insets.bottom - GAP - (landscape ? 0 : controls);
  return { x: left, y: top, w: Math.max(0, right - left), h: Math.max(0, bottom - top) };
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Turn a stored frame (fractions) into a pixel rect inside the safe area. */
export function frameToRect(f: CardFrame, area: Rect): Rect {
  const w = clamp(f.w * area.w, Math.min(MIN_W, area.w), area.w);
  const h = clamp(f.h * area.h, Math.min(MIN_H, area.h), area.h);
  switch (f.dock) {
    case 'top':
      return { x: area.x + (area.w - w) / 2, y: area.y, w, h };
    case 'bottom':
      return { x: area.x + (area.w - w) / 2, y: area.y + area.h - h, w, h };
    case 'left':
      return { x: area.x, y: area.y + clamp(f.y, 0, 1) * (area.h - h), w, h };
    case 'right':
      return { x: area.x + area.w - w, y: area.y + clamp(f.y, 0, 1) * (area.h - h), w, h };
    default:
      return {
        x: area.x + clamp(f.x, 0, 1) * (area.w - w),
        y: area.y + clamp(f.y, 0, 1) * (area.h - h),
        w,
        h,
      };
  }
}

/** Keep a rect fully inside the area. */
export function clampRect(r: Rect, area: Rect): Rect {
  const w = clamp(r.w, Math.min(MIN_W, area.w), area.w);
  const h = clamp(r.h, Math.min(MIN_H, area.h), area.h);
  return {
    w,
    h,
    x: clamp(r.x, area.x, area.x + area.w - w),
    y: clamp(r.y, area.y, area.y + area.h - h),
  };
}

/** Which dock (if any) a rect is close enough to snap to. Top wins: it's nearest the lens. */
export function dockFor(r: Rect, area: Rect): Dock {
  if (r.y - area.y < SNAP) return 'top';
  if (area.y + area.h - (r.y + r.h) < SNAP) return 'bottom';
  if (r.x - area.x < SNAP) return 'left';
  if (area.x + area.w - (r.x + r.w) < SNAP) return 'right';
  return 'free';
}

/** Store a rect back as fractions, so it survives rotation and other screen sizes. */
export function rectToFrame(r: Rect, area: Rect, dock: Dock): CardFrame {
  const fx = area.w - r.w > 0 ? (r.x - area.x) / (area.w - r.w) : 0;
  const fy = area.h - r.h > 0 ? (r.y - area.y) / (area.h - r.h) : 0;
  return { dock, x: clamp(fx, 0, 1), y: clamp(fy, 0, 1), w: r.w / area.w, h: r.h / area.h };
}
