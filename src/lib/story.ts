/**
 * Storytelling structure: every script is a list of sections, each with a
 * headline (shown small above the text in the reader) and the words to say.
 */

export type Mode = 'reel' | 'talk';

export type SectionKind = 'hook' | 'setup' | 'story' | 'value' | 'proof' | 'cta' | 'custom';

export type Section = {
  id: string;
  kind: SectionKind;
  headline: string;
  body: string;
};

export type Script = {
  id: string;
  title: string;
  mode: Mode;
  sections: Section[];
  updatedAt: number;
};

export const SectionGuide: Record<SectionKind, { label: string; tip: string }> = {
  hook: { label: 'Hook', tip: 'First 3 seconds. A question, a bold claim or a surprise.' },
  setup: { label: 'Setup', tip: 'Who is this for and what problem are we talking about?' },
  story: { label: 'Story', tip: 'A moment from real life. Keep it short and specific.' },
  value: { label: 'Value', tip: 'The tips, steps or answer. One idea per line.' },
  proof: { label: 'Proof', tip: 'A result, an example or why it works.' },
  cta: { label: 'Call to action', tip: 'One clear next step: follow, comment, visit.' },
  custom: { label: 'Section', tip: 'Anything else you want to say.' },
};

export const Templates: Record<Mode, SectionKind[]> = {
  reel: ['hook', 'setup', 'value', 'cta'],
  talk: ['hook', 'setup', 'story', 'value', 'proof', 'cta'],
};

/** Speaking pace used for time estimates (words per minute). */
export const WPM: Record<Mode, number> = { reel: 160, talk: 140 };

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function newSection(kind: SectionKind): Section {
  return { id: uid(), kind, headline: SectionGuide[kind].label, body: '' };
}

export function newScript(mode: Mode): Script {
  return {
    id: uid(),
    title: mode === 'reel' ? 'New reel' : 'New talk',
    mode,
    sections: Templates[mode].map(newSection),
    updatedAt: Date.now(),
  };
}

export function wordCount(text: string) {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function scriptWords(s: Script) {
  return s.sections.reduce((n, sec) => n + wordCount(sec.body), 0);
}

export function formatDuration(words: number, mode: Mode) {
  const secs = Math.round((words / WPM[mode]) * 60);
  const m = Math.floor(secs / 60);
  const r = secs % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function seconds(words: number, mode: Mode) {
  return Math.round((words / WPM[mode]) * 60);
}

export function preview(s: Script) {
  const first = s.sections.find((x) => x.body.trim());
  return first ? first.body.trim().replace(/\s+/g, ' ') : 'Empty script';
}

export const exampleScript: Script = {
  id: 'welcome',
  title: 'Welcome to Glance',
  mode: 'reel',
  updatedAt: Date.now(),
  sections: [
    {
      id: 'w1',
      kind: 'hook',
      headline: 'Hook',
      body: 'Ever forgot your lines halfway through a video?',
    },
    {
      id: 'w2',
      kind: 'setup',
      headline: 'Setup',
      body: 'Glance keeps your script right under the camera, so your eyes stay on the lens and nobody can tell you are reading.',
    },
    {
      id: 'w3',
      kind: 'value',
      headline: 'How it works',
      body: 'Drag the divider to see more script or more of yourself. Tap the text to pause. Change the font, size and colours any time.',
    },
    {
      id: 'w4',
      kind: 'cta',
      headline: 'Call to action',
      body: 'Now write your own script and hit record.',
    },
  ],
};
