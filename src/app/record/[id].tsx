import { Ionicons } from '@expo/vector-icons';
import * as Brightness from 'expo-brightness';
import { CameraView, useCameraPermissions, useMicrophonePermissions, type CameraType } from 'expo-camera';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SideDial } from '@/components/dial';
import { IslandGlow, RecordingGlow } from '@/components/glow';
import { Reader } from '@/components/reader';
import { Button, type IconName } from '@/components/ui';
import { clampRect, dockFor, frameToRect, rectToFrame, type Rect } from '@/lib/card';
import { feel } from '@/lib/haptics';
import { useStore, type Dock, type PrompterSettings } from '@/lib/store';
import { C, DisplayFont, DisplayFontMedium } from '@/lib/theme';

type Phase = 'idle' | 'countdown' | 'recording' | 'saving';

const SIZES = [16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40];
const SPEEDS = [0.6, 0.8, 1, 1.2, 1.5, 2, 2.5];
const ZOOMS: { label: string; value: number }[] = [
  { label: '1×', value: 0 },
  { label: '1.5×', value: 0.06 },
  { label: '2×', value: 0.12 },
];
const LIGHT_LABELS = ['off', 'soft', 'bright'] as const;
/** Split between script and camera, as a share of the screen. */
const SPLIT = { portrait: { min: 0.14, max: 0.62, snaps: [0.24, 0.3, 0.4] }, landscape: { min: 0.24, max: 0.62, snaps: [0.34, 0.42, 0.52] } };
const GAP = 6;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
const indexOf = (list: number[], v: number) => {
  const i = list.findIndex((x) => x >= v - 0.001);
  return i < 0 ? list.length - 1 : i;
};

export default function Record() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getScript, settings, updateSettings } = useStore();
  const script = getScript(id);
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const landscape = W > H;
  const level = settings.haptics;
  const floating = settings.scriptLayout === 'float';

  const [camPerm, requestCam] = useCameraPermissions();
  const [micPerm, requestMic] = useMicrophonePermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [facing, setFacing] = useState<CameraType>('front');
  const [zoom, setZoom] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [count, setCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [restartKey, setRestartKey] = useState(0);
  const [dialMode, setDialMode] = useState<'size' | 'speed'>('size');

  // ---- Live values for gesture callbacks (created once) ----------------------
  const lensLeft = insets.left >= insets.right;
  const live = useRef({ W, H, landscape, level, settings, floating, lensLeft });
  useEffect(() => {
    live.current = { W, H, landscape, level, settings, floating, lensLeft };
  });

  // ---- Front light: full screen brightness + warm ring round the camera ------
  const savedBrightness = useRef<number | null>(null);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      try {
        if (settings.light > 0) {
          if (savedBrightness.current === null) savedBrightness.current = await Brightness.getBrightnessAsync();
          await Brightness.setBrightnessAsync(settings.light === 2 ? 1 : 0.85);
        } else if (savedBrightness.current !== null) {
          await Brightness.setBrightnessAsync(savedBrightness.current);
          savedBrightness.current = null;
        }
      } catch {
        // Brightness is a comfort feature; ignore failures.
      }
    })();
  }, [settings.light]);
  useEffect(
    () => () => {
      if (savedBrightness.current !== null) Brightness.setBrightnessAsync(savedBrightness.current).catch(() => {});
    },
    [],
  );

  // ---- Layout ----------------------------------------------------------------
  // The lens is on the side with the bigger inset in landscape.
  const lensOnLeft = lensLeft;
  const split = landscape ? settings.splitLandscape : settings.splitPortrait;
  const [dragSplit, setDragSplit] = useState<number | null>(null);
  const s = dragSplit ?? split;

  let pane: Rect;
  let cam: Rect;
  if (floating) {
    cam = { x: 0, y: 0, w: W, h: H };
    pane = { x: 0, y: 0, w: 0, h: 0 }; // set below from the floating frame
  } else if (!landscape) {
    const sp = Math.round(s * H);
    pane = { x: 0, y: 0, w: W, h: sp };
    cam = { x: GAP, y: sp + 4, w: W - GAP * 2, h: H - sp - 4 - GAP };
  } else {
    const sp = Math.round(s * W);
    pane = lensOnLeft ? { x: 0, y: 0, w: sp, h: H } : { x: W - sp, y: 0, w: sp, h: H };
    cam = lensOnLeft ? { x: sp + 4, y: GAP, w: W - sp - 4 - GAP, h: H - GAP * 2 } : { x: GAP, y: GAP, w: W - sp - 4 - GAP, h: H - GAP * 2 };
  }

  // Floating card lives between the corner buttons and above the controls, inside the safe area.
  const floatArea: Rect = {
    x: insets.left + 64,
    y: insets.top + 8,
    w: Math.max(0, W - insets.left - insets.right - 128),
    h: Math.max(0, H - insets.top - insets.bottom - 16 - 150),
  };
  const frame = landscape ? settings.cardLandscape : settings.cardPortrait;
  type Drag = { rect: Rect; dock: Dock; kind: 'move' | 'resize' } | null;
  const [drag, setDragState] = useState<Drag>(null);
  const dragRef = useRef<Drag>(null);
  const setDrag = (d: Drag) => {
    dragRef.current = d;
    setDragState(d);
  };
  if (floating) pane = drag ? drag.rect : frameToRect(frame, floatArea);
  const liveFloat = useRef({ floatArea, pane, frame });
  useEffect(() => {
    liveFloat.current = { floatArea, pane, frame };
  });

  // ---- One bar: resize script vs camera --------------------------------------
  const splitStart = useRef(0);
  const splitLimit = useRef(false);
  const splitSnap = useRef<number | null>(null);
  const splitValue = useRef(split);
  const applySplit = (raw: number) => {
    const { landscape: ls, level: lv } = live.current;
    const cfg = ls ? SPLIT.landscape : SPLIT.portrait;
    let v = clamp(raw, cfg.min, cfg.max);
    const snap = cfg.snaps.find((x) => Math.abs(x - v) < 0.018) ?? null;
    if (snap !== null) v = snap;
    if (snap !== splitSnap.current) {
      splitSnap.current = snap;
      if (snap !== null) feel('snap', lv);
    }
    const atLimit = raw <= cfg.min || raw >= cfg.max;
    if (atLimit && !splitLimit.current) feel('step', lv);
    splitLimit.current = atLimit;
    splitValue.current = v;
    setDragSplit(v);
  };
  // Refs are only read inside the gesture callbacks, never while rendering.
  // eslint-disable-next-line react-hooks/refs
  const [splitPan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const { landscape: ls, settings: st } = live.current;
        splitStart.current = ls ? st.splitLandscape : st.splitPortrait;
        splitValue.current = splitStart.current;
        splitLimit.current = false;
        feel('step', live.current.level);
      },
      onPanResponderMove: (_, g) => {
        const { landscape: ls, W: w, H: h, lensLeft: ll } = live.current;
        // In landscape the script is on the lens side; dragging away from it grows the script.
        const dir = ls && !ll ? -1 : 1;
        applySplit(splitStart.current + (ls ? (dir * g.dx) / w : g.dy / h));
      },
      onPanResponderRelease: () => {
        const v = splitValue.current;
        updateSettings(live.current.landscape ? { splitLandscape: v } : { splitPortrait: v });
        setDragSplit(null);
      },
      onPanResponderTerminate: () => setDragSplit(null),
    }),
  );
  const nudgeSplit = (dir: 1 | -1) => {
    const cfg = landscape ? SPLIT.landscape : SPLIT.portrait;
    const v = clamp(split + dir * 0.04, cfg.min, cfg.max);
    updateSettings(landscape ? { splitLandscape: v } : { splitPortrait: v });
    feel('step', level);
  };

  // ---- Floating card bars ------------------------------------------------------
  const fStart = useRef<Rect>(pane);
  const fDock = useRef<Dock>(frame.dock);
  const saveFloat = (r: Rect, d: Dock) => {
    const f = rectToFrame(r, liveFloat.current.floatArea, d);
    updateSettings(live.current.landscape ? { cardLandscape: f } : { cardPortrait: f });
  };
  const makeFloatPan = (kind: 'move' | 'resize') =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        fStart.current = liveFloat.current.pane;
        fDock.current = liveFloat.current.frame.dock;
        setDrag({ rect: fStart.current, dock: fDock.current, kind });
        feel('step', live.current.level);
      },
      onPanResponderMove: (_: GestureResponderEvent, g: PanResponderGestureState) => {
        const a = liveFloat.current.floatArea;
        const st = fStart.current;
        if (kind === 'move') {
          const r = clampRect({ ...st, x: st.x + g.dx, y: st.y + g.dy }, a);
          const d = dockFor(r, a);
          if (d !== fDock.current && d !== 'free') feel('snap', live.current.level);
          fDock.current = d;
          setDrag({ rect: r, dock: d, kind });
        } else {
          const r = clampRect({ ...st, w: st.w + g.dx, h: st.h + g.dy }, a);
          setDrag({ rect: r, dock: 'free', kind });
        }
      },
      onPanResponderRelease: () => {
        const cur = dragRef.current;
        if (cur) saveFloat(cur.rect, cur.kind === 'move' ? cur.dock : 'free');
        setDrag(null);
      },
      onPanResponderTerminate: () => setDrag(null),
    });
  // eslint-disable-next-line react-hooks/refs
  const [movePan] = useState(() => makeFloatPan('move'));
  // eslint-disable-next-line react-hooks/refs
  const [resizePan] = useState(() => makeFloatPan('resize'));

  // ---- Recording --------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'recording') return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const togglePlay = () => {
    setPlaying((p) => !p);
    feel('pauseResume', level);
  };

  const startRecording = async () => {
    const camera = cameraRef.current;
    if (!camera) return;
    setElapsed(0);
    setRestartKey((k) => k + 1);
    setPhase('recording');
    feel('recordStart', level);
    setPlaying(true);
    try {
      const result = await camera.recordAsync();
      setPlaying(false);
      if (result?.uri) {
        feel('takeSaved', level);
        router.replace({ pathname: '/review', params: { uri: result.uri, id: script?.id ?? '' } });
      } else setPhase('idle');
    } catch (e) {
      setPlaying(false);
      setPhase('idle');
      feel('error', level);
      Alert.alert('Recording stopped', e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    }
  };

  const onRecordPress = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Recording', 'Recording works in the iPhone and Android app.');
      return;
    }
    if (phase === 'recording') {
      setPhase('saving');
      cameraRef.current?.stopRecording();
      return;
    }
    if (phase !== 'idle' || !cameraReady) return;
    if (!micPerm?.granted) {
      const res = await requestMic();
      if (!res.granted) {
        Alert.alert('Microphone needed', 'Glance needs the microphone to record your voice. You can allow it in Settings.');
        return;
      }
    }
    const secs = settings.countdown;
    if (secs === 0) return startRecording();
    setPhase('countdown');
    setCount(secs);
    feel('countdownTick', level);
    let n = secs;
    const t = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(t);
        startRecording();
      } else {
        setCount(n);
        feel('countdownTick', level);
      }
    }, 1000);
  };

  // ---- Dial (text size / speed) -----------------------------------------------
  const dialValues = dialMode === 'size' ? SIZES : SPEEDS;
  const dialIndex = indexOf(dialValues, dialMode === 'size' ? settings.fontSize : settings.speed);
  const stepDial = (dir: 1 | -1) => {
    const n = clamp(dialIndex + dir, 0, dialValues.length - 1);
    if (n === dialIndex) {
      feel('step', level);
      return;
    }
    const patch: Partial<PrompterSettings> = dialMode === 'size' ? { fontSize: dialValues[n] } : { speed: dialValues[n] };
    updateSettings(patch);
    feel('step', level);
  };

  // ---- Screens before the camera ------------------------------------------------
  if (!script) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>This script no longer exists.</Text>
        <Button title="Back" tone="solid" onPress={() => router.back()} />
      </View>
    );
  }
  if (!camPerm) return <View style={styles.screen} />;
  if (!camPerm.granted) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.permTitle}>Camera access</Text>
        <Text style={styles.msg}>
          Glance shows your script next to the camera. Your video stays on your phone until you choose to share it.
        </Text>
        <Button title="Allow camera" icon="camera" onPress={requestCam} />
        <Button title="Not now" tone="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  const recording = phase === 'recording' || phase === 'saving';
  const busy = recording || phase === 'countdown';
  const screenRadius = Platform.OS === 'ios' ? 48 : 28;
  const inner = screenRadius - GAP;
  const camRadius = floating
    ? { borderRadius: 0 }
    : landscape
      ? lensOnLeft
        ? { borderTopLeftRadius: 30, borderBottomLeftRadius: 30, borderTopRightRadius: inner, borderBottomRightRadius: inner }
        : { borderTopRightRadius: 30, borderBottomRightRadius: 30, borderTopLeftRadius: inner, borderBottomLeftRadius: inner }
      : { borderTopLeftRadius: 30, borderTopRightRadius: 30, borderBottomLeftRadius: inner, borderBottomRightRadius: inner };
  // Inside the camera view: keep controls clear of the island in floating mode.
  const topPad = floating && !landscape ? insets.top + 6 : 14;
  const leftPad = floating && landscape ? insets.left + 8 : 12;
  const rightPad = floating && landscape ? insets.right + 8 : 12;
  const botPad = floating ? Math.max(insets.bottom, 12) + 8 : 18;
  // Island centre (for the talking glow): top centre in portrait, lens edge in landscape.
  const islandX = landscape ? (lensOnLeft ? 30 : W - 30) : W / 2;
  const islandY = landscape ? H / 2 : Math.max(24, insets.top / 2);
  const ring = settings.light === 0 ? 0 : settings.light === 1 ? 8 : 16;
  const pct = Math.round(s * 100);

  const corner = (icon: IconName, label: string, onPress: () => void, on?: boolean, disabled?: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on, disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.cb, on && styles.cbOn, { opacity: disabled ? 0.35 : pressed ? 0.7 : 1 }]}>
      <Ionicons name={icon} size={20} color={C.paper} />
      {on ? <View style={styles.dot} /> : null}
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      {/* Script, on black, right under the camera. */}
      {!floating ? (
        <View style={{ position: 'absolute', left: pane.x, top: pane.y, width: pane.w, height: pane.h, overflow: 'hidden' }}>
          <Reader
            script={script}
            settings={settings}
            playing={playing}
            height={pane.h}
            topInset={landscape ? 10 : insets.top + 2}
            restartKey={restartKey}
            onTogglePlay={togglePlay}
            onSectionReached={() => feel('sectionReached', level)}
            onEndingSoon={() => feel('endingSoon', level)}
            onFinished={() => setPlaying(false)}
          />
        </View>
      ) : null}

      {/* Camera view. Its size only changes what you see; the recording is always the full frame. */}
      <View style={[styles.camCard, { left: cam.x, top: cam.y, width: cam.w, height: cam.h }, camRadius]}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          mode="video"
          videoQuality="1080p"
          zoom={zoom}
          mute={!micPerm?.granted}
          onCameraReady={() => setCameraReady(true)}
          onMountError={(e) => Alert.alert('Camera error', e.message)}
        />
        {ring > 0 ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, camRadius, { borderWidth: ring, borderColor: '#FFF4E0' }]} /> : null}
        {settings.glow ? <RecordingGlow active={recording} radius={floating ? screenRadius : 30} /> : null}

        {!floating ? (
          <View
            {...splitPan.panHandlers}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="Script and camera size"
            accessibilityValue={{ text: `Script ${pct} percent` }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(e) => nudgeSplit(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
            style={[
              styles.splitZone,
              landscape
                ? { top: 0, bottom: 0, width: 28, ...(lensOnLeft ? { left: 0 } : { right: 0 }) }
                : { left: 0, right: 0, top: 0, height: 28 },
            ]}>
            <View style={[landscape ? styles.barV : styles.barH, dragSplit !== null && styles.barOn]} />
          </View>
        ) : null}

        {/* Corners: light + settings (left), float + flip (right). */}
        <View style={[styles.corner, { left: leftPad + (landscape && lensOnLeft && !floating ? 16 : 0), top: topPad }]}>
          {corner(
            'sunny-outline',
            `Front light ${LIGHT_LABELS[settings.light]}. Tap to change.`,
            () => {
              updateSettings({ light: ((settings.light + 1) % 3) as 0 | 1 | 2 });
              feel('step', level);
            },
            settings.light > 0,
          )}
          {corner('settings-outline', 'Text and prompter settings', () => router.push('/style'), false, busy)}
        </View>
        <View style={[styles.corner, { right: rightPad + (landscape && !lensOnLeft && !floating ? 16 : 0), top: topPad }]}>
          {corner(
            'albums-outline',
            floating ? 'Put the script back under the camera' : 'Float the script over the camera',
            () => {
              updateSettings({ scriptLayout: floating ? 'top' : 'float' });
              feel('step', level);
            },
            floating,
            busy,
          )}
          {corner(
            'camera-reverse-outline',
            'Flip camera',
            () => {
              setFacing((f) => (f === 'front' ? 'back' : 'front'));
              feel('step', level);
            },
            false,
            busy,
          )}
        </View>
        <View style={[styles.timerWrap, { top: topPad + 7 }]} pointerEvents="none">
          <View style={[styles.timer, recording && styles.timerLive]} accessibilityLabel={recording ? `Recording, ${elapsed} seconds` : 'Ready to record'}>
            <View style={[styles.timerDot, { backgroundColor: recording ? '#FFFFFF' : C.fog }]} />
            <Text style={styles.timerText}>{fmtTime(elapsed)}</Text>
          </View>
        </View>

        {/* Script settings, vertically on the right edge. */}
        <SideDial
          style={[styles.dialPos, { right: floating && landscape ? insets.right : 0 }]}
          modeLabel={dialMode === 'size' ? 'Aa' : '»'}
          modeA11y={dialMode === 'size' ? 'Dial sets text size. Tap to switch to scroll speed.' : 'Dial sets scroll speed. Tap to switch to text size.'}
          onToggleMode={() => {
            setDialMode((m) => (m === 'size' ? 'speed' : 'size'));
            feel('step', level);
          }}
          values={dialValues}
          index={dialIndex}
          format={(v) => (dialMode === 'size' ? String(v) : `${v.toFixed(1)}×`)}
          label={dialMode === 'size' ? 'Text size' : 'Scroll speed'}
          onStep={stepDial}
        />

        {/* Zoom + control pill. */}
        <View style={[styles.bottom, { bottom: botPad }]}>
          <View style={styles.zoom} accessibilityRole="radiogroup" accessibilityLabel="Zoom">
            {ZOOMS.map((z) => {
              const on = Math.abs(zoom - z.value) < 0.001;
              return (
                <Pressable
                  key={z.label}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => {
                    setZoom(z.value);
                    feel('step', level);
                  }}
                  style={[styles.zoomBtn, on && styles.zoomOn]}>
                  <Text style={[styles.zoomText, on && { color: '#1A1206' }]}>{z.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.pill}>
            <PillButton
              icon="arrow-up"
              label="Back to the start of the script"
              onPress={() => {
                setRestartKey((k) => k + 1);
                feel('step', level);
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
              onPress={onRecordPress}
              disabled={phase === 'saving' || phase === 'countdown'}
              style={styles.rec}>
              <View style={styles.recInner}>
                <View style={[styles.recCore, recording && styles.recCoreStop]} />
              </View>
            </Pressable>
            <PillButton icon={playing ? 'pause' : 'play'} label={playing ? 'Pause script' : 'Play script'} onPress={togglePlay} />
            <PillButton icon="list" label="Scripts" onPress={() => router.back()} disabled={busy} />
          </View>
        </View>
      </View>

      {/* Floating script card (only in floating mode). */}
      {floating ? (
        <View style={[styles.floatCard, { left: pane.x, top: pane.y, width: pane.w, height: pane.h }, drag && styles.floatActive]}>
          <Reader
            script={script}
            settings={settings}
            playing={playing}
            height={pane.h}
            topInset={22}
            opacity={settings.cardOpacity}
            restartKey={restartKey}
            onTogglePlay={togglePlay}
            onSectionReached={() => feel('sectionReached', level)}
            onEndingSoon={() => feel('endingSoon', level)}
            onFinished={() => setPlaying(false)}
          />
          <View {...movePan.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel="Move script" style={[styles.floatBar, { top: 0 }]}>
            <View style={[styles.barH, drag?.kind === 'move' && styles.barOn]} />
          </View>
          <View {...resizePan.panHandlers} accessible accessibilityRole="adjustable" accessibilityLabel="Resize script" style={[styles.floatBar, { bottom: 0 }]}>
            <View style={[styles.barH, { width: 64 }, drag?.kind === 'resize' && styles.barOn]} />
          </View>
        </View>
      ) : null}

      {/* Violet glow at the island while you talk. */}
      {settings.glow ? <IslandGlow active={recording} x={islandX} y={islandY} landscape={landscape} /> : null}

      {phase === 'countdown' ? (
        <View style={styles.countWrap} pointerEvents="none">
          <View style={styles.countRing}>
            <Text style={styles.count} accessibilityLiveRegion="assertive">
              {count}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function PillButton({ icon, label, onPress, disabled }: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.pb, { opacity: disabled ? 0.35 : pressed ? 0.7 : 1 }]}>
      <Ionicons name={icon} size={20} color={C.paper} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.black },
  center: { flex: 1, backgroundColor: C.ink, alignItems: 'stretch', justifyContent: 'center', padding: 24, gap: 14 },
  permTitle: { fontFamily: DisplayFont, color: C.paper, fontSize: 28, textAlign: 'center' },
  msg: { color: C.fog, fontSize: 16, lineHeight: 23, textAlign: 'center', marginBottom: 8 },
  camCard: { position: 'absolute', overflow: 'hidden', backgroundColor: '#111' },
  splitZone: { position: 'absolute', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  barH: { width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(246,241,255,0.7)' },
  barV: { width: 5, height: 44, borderRadius: 3, backgroundColor: 'rgba(246,241,255,0.7)' },
  barOn: { backgroundColor: C.accentPale },
  corner: { position: 'absolute', gap: 12, zIndex: 6 },
  cb: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(20,14,40,0.45)', alignItems: 'center', justifyContent: 'center' },
  cbOn: { backgroundColor: 'rgba(217,196,255,0.28)' },
  dot: { position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 4, backgroundColor: '#F3E6C8' },
  timerWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 6 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 10, borderRadius: 14, backgroundColor: 'rgba(20,14,40,0.5)' },
  timerLive: { backgroundColor: C.rec },
  timerDot: { width: 7, height: 7, borderRadius: 4 },
  timerText: { color: C.paper, fontFamily: DisplayFontMedium, fontSize: 13 },
  dialPos: { position: 'absolute', top: '38%', zIndex: 6 },
  bottom: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 12, zIndex: 6 },
  zoom: { flexDirection: 'row', gap: 2, padding: 3, borderRadius: 18, backgroundColor: 'rgba(20,14,40,0.45)' },
  zoomBtn: { minWidth: 40, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  zoomOn: { backgroundColor: '#F3E6C8' },
  zoomText: { color: C.paper, fontSize: 12, fontWeight: '600' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 40,
    backgroundColor: 'rgba(28,20,52,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pb: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  rec: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: C.accentStrong,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.accent,
    shadowOpacity: 0.8,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  recInner: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#B794FF', alignItems: 'center', justifyContent: 'center' },
  recCore: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#F3E6C8' },
  recCoreStop: { borderRadius: 7 },
  floatCard: { position: 'absolute', borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: C.glassBorder, zIndex: 20 },
  floatActive: { borderColor: C.accent, borderWidth: 1.5 },
  floatBar: { position: 'absolute', left: 0, right: 0, height: 26, alignItems: 'center', justifyContent: 'center' },
  countWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', zIndex: 60 },
  countRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: C.accent,
    backgroundColor: 'rgba(13,8,32,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: { color: C.paper, fontFamily: DisplayFont, fontSize: 84 },
});
