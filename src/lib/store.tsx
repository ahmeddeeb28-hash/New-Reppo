import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { exampleScript, type Script } from './story';
import { ReaderThemes, type LineSpacingKey, type ReaderThemeKey, type ScriptFontKey } from './theme';

export type HapticsLevel = 'off' | 'subtle' | 'normal' | 'strong';

/** Where the floating script card sits. Docks keep it clear of the notch and home bar. */
export type Dock = 'top' | 'bottom' | 'left' | 'right' | 'free';

/** Card frame as fractions of the safe area, so it fits any phone. */
export type CardFrame = { dock: Dock; x: number; y: number; w: number; h: number };

export type PrompterSettings = {
  font: ScriptFontKey;
  fontSize: number;
  spacing: LineSpacingKey;
  theme: ReaderThemeKey;
  align: 'left' | 'center';
  guide: boolean;
  showHeadlines: boolean;
  mirror: boolean;
  /** Scroll speed multiplier, 0.5–3. */
  speed: number;
  /** 'top': script on black right under the camera, camera view below. 'float': camera fills the screen, script floats. */
  scriptLayout: 'top' | 'float';
  /** Share of the screen the script takes in 'top' layout. */
  splitPortrait: number;
  splitLandscape: number;
  /** Front light: 0 off, 1 soft, 2 bright (screen brightness + warm ring around the camera view). */
  light: 0 | 1 | 2;
  /** Floating script card, remembered separately for each orientation. */
  cardPortrait: CardFrame;
  cardLandscape: CardFrame;
  /** How see-through the script card is, 0.35–0.95. */
  cardOpacity: number;
  /** Glow around the screen while recording. */
  glow: boolean;
  countdown: 0 | 3 | 5 | 10;
  haptics: HapticsLevel;
  /** Set after the first-run "Get Started". */
  onboarded: boolean;
};

export const defaultSettings: PrompterSettings = {
  font: 'typewriter',
  fontSize: 22,
  spacing: 'normal',
  theme: 'night',
  align: 'center',
  guide: true,
  showHeadlines: true,
  mirror: false,
  speed: 1,
  scriptLayout: 'top',
  splitPortrait: 0.3,
  splitLandscape: 0.42,
  light: 0,
  cardPortrait: { dock: 'top', x: 0, y: 0, w: 1, h: 0.3 },
  cardLandscape: { dock: 'left', x: 0, y: 0, w: 0.42, h: 1 },
  cardOpacity: 0.72,
  glow: true,
  countdown: 3,
  haptics: 'normal',
  onboarded: false,
};

type Store = {
  ready: boolean;
  scripts: Script[];
  settings: PrompterSettings;
  getScript: (id: string) => Script | undefined;
  saveScript: (s: Script) => void;
  deleteScript: (id: string) => void;
  updateSettings: (patch: Partial<PrompterSettings>) => void;
};

const Ctx = createContext<Store | null>(null);
const SCRIPTS_KEY = 'glance.scripts.v1';
const SETTINGS_KEY = 'glance.settings.v1';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [settings, setSettings] = useState<PrompterSettings>(defaultSettings);
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, p] = await Promise.all([
          AsyncStorage.getItem(SCRIPTS_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ]);
        setScripts(s ? (JSON.parse(s) as Script[]) : [exampleScript]);
        if (p) {
          const saved = { ...defaultSettings, ...(JSON.parse(p) as Partial<PrompterSettings>) };
          // Themes were renamed in the purple redesign.
          if (!(saved.theme in ReaderThemes)) saved.theme = 'night';
          setSettings(saved);
        }
      } catch {
        setScripts([exampleScript]);
      } finally {
        loaded.current = true;
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (loaded.current) AsyncStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts)).catch(() => {});
  }, [scripts]);

  useEffect(() => {
    if (loaded.current) AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings]);

  const getScript = useCallback((id: string) => scripts.find((s) => s.id === id), [scripts]);

  const saveScript = useCallback((script: Script) => {
    setScripts((list) => {
      const next = { ...script, updatedAt: Date.now() };
      const i = list.findIndex((s) => s.id === script.id);
      if (i === -1) return [next, ...list];
      const copy = list.slice();
      copy[i] = next;
      return copy;
    });
  }, []);

  const deleteScript = useCallback((id: string) => {
    setScripts((list) => list.filter((s) => s.id !== id));
  }, []);

  const updateSettings = useCallback((patch: Partial<PrompterSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  const value = useMemo(
    () => ({ ready, scripts, settings, getScript, saveScript, deleteScript, updateSettings }),
    [ready, scripts, settings, getScript, saveScript, deleteScript, updateSettings],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
