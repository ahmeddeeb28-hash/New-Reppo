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

import { RecordingGlow } from '@/components/glow';
import { Reader } from '@/components/reader';
import { Button, IconButton } from '@/components/ui';
import { clampRect, dockFor, frameToRect, MIN_H, MIN_W, rectToFrame, safeArea, type Rect } from '@/lib/card';
import { feel } from '@/lib/haptics';
import { useStore, type Dock } from '@/lib/store';
import { C, DisplayFont, DisplayFontMedium } from '@/lib/theme';

type Phase = 'idle' | 'countdown' | 'recording' | 'saving';
type Gesture = 'move' | 'resize';

const SPEEDS = [0.6, 0.8, 1, 1.2, 1.5, 2, 2.5];
/** Space the controls take: a bottom bar in portrait, a side column in landscape. */
const CONTROLS_PORTRAIT = 140;
const CONTROLS_LANDSCAPE = 92;

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function Record() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getScript, settings, updateSettings } = useStore();
  const script = getScript(id);
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const landscape = W > H;

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
  const level = settings.haptics;

  // ---- Floating script card ------------------------------------------------
  // The camera always fills the screen and records its full frame. The card
  // floats on top; moving or resizing it never changes what is recorded.
  const area = safeArea(W, H, insets, landscape, landscape ? CONTROLS_LANDSCAPE + insets.right : CONTROLS_PORTRAIT);
  const frame = landscape ? settings.cardLandscape : settings.cardPortrait;
  type Drag = { rect: Rect; dock: Dock; kind: Gesture } | null;
  const [drag, setDragState] = useState<Drag>(null);
  const dragRef = useRef<Drag>(null);
  const setDrag = (d: Drag) => {
    dragRef.current = d;
    setDragState(d);
  };
  const rect = drag ? drag.rect : frameToRect(frame, area);
  const dock = drag ? drag.dock : frame.dock;
  // The resize bar is the edge that faces the middle of the screen.
  const resizeEdge: 'top' | 'bottom' = dock === 'bottom' ? 'top' : 'bottom';

  // Gesture callbacks are created once, so they read live values through refs.
  const live = useRef({ rect, area, dock, frame, landscape, level, resizeEdge });
  useEffect(() => {
    live.current = { rect, area, dock, frame, landscape, level, resizeEdge };
  });
  const start = useRef<Rect>(rect);
  const lastDock = useRef<Dock>(dock);
  const hitLimit = useRef(false);

  const save = (r: Rect, d: Dock) => {
    const f = rectToFrame(r, live.current.area, d);
    updateSettings(live.current.landscape ? { cardLandscape: f } : { cardPortrait: f });
  };

  const onMove = (_: GestureResponderEvent, g: PanResponderGestureState) => {
    const { area: a } = live.current;
    const s = start.current;
    const r = clampRect({ ...s, x: s.x + g.dx, y: s.y + g.dy }, a);
    const d = dockFor(r, a);
    if (d !== lastDock.current) {
      lastDock.current = d;
      if (d !== 'free') feel('snap', live.current.level);
    }
    setDrag({ rect: r, dock: d, kind: 'move' });
  };

  const onResize = (_: GestureResponderEvent, g: PanResponderGestureState) => {
    const { area: a, dock: d, resizeEdge: edge } = live.current;
    const s = start.current;
    const centred = d === 'top' || d === 'bottom';
    let w = s.w + (centred ? g.dx * 2 : d === 'right' ? -g.dx : g.dx);
    let h = edge === 'bottom' ? s.h + g.dy : s.h - g.dy;
    const atLimit = w <= MIN_W || h <= MIN_H || w >= a.w || h >= a.h * 0.85;
    w = Math.min(a.w, Math.max(Math.min(MIN_W, a.w), w));
    h = Math.min(a.h * 0.85, Math.max(MIN_H, h));
    if (atLimit && !hitLimit.current) feel('step', live.current.level);
    hitLimit.current = atLimit;
    let x = s.x;
    let y = s.y;
    if (centred) x = a.x + (a.w - w) / 2;
    else if (d === 'right') x = s.x + s.w - w;
    if (edge === 'top') y = s.y + s.h - h;
    setDrag({ rect: clampRect({ x, y, w, h }, a), dock: d, kind: 'resize' });
  };

  const makePan = (kind: Gesture) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        start.current = live.current.rect;
        lastDock.current = live.current.dock;
        hitLimit.current = false;
        setDrag({ rect: live.current.rect, dock: live.current.dock, kind });
        feel('step', live.current.level);
      },
      onPanResponderMove: kind === 'move' ? onMove : onResize,
      onPanResponderRelease: () => {
        const cur = dragRef.current;
        if (cur) save(cur.rect, cur.dock);
        setDrag(null);
      },
      onPanResponderTerminate: () => setDrag(null),
    });
  // Refs are only read inside the gesture callbacks, never while rendering.
  // eslint-disable-next-line react-hooks/refs
  const [movePan] = useState(() => makePan('move'));
  // eslint-disable-next-line react-hooks/refs
  const [resizePan] = useState(() => makePan('resize'));

  const nudgeCard = (dir: 1 | -1) => {
    const r = clampRect({ ...rect, h: rect.h + dir * 40 }, area);
    save(r, dock);
    feel('step', level);
  };

  // ---- Pinch to zoom the camera ---------------------------------------------
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);
  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  const touchDist = (e: GestureResponderEvent) => {
    const t = e.nativeEvent.touches;
    if (t.length < 2) return 0;
    return Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
  };
  // eslint-disable-next-line react-hooks/refs
  const [pinch] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 2,
      onMoveShouldSetPanResponder: (e) => e.nativeEvent.touches.length === 2,
      onPanResponderMove: (e) => {
        const d = touchDist(e);
        if (!d) return;
        if (!pinchStart.current) pinchStart.current = { dist: d, zoom: zoomRef.current };
        const z = Math.min(1, Math.max(0, pinchStart.current.zoom + (d - pinchStart.current.dist) / 600));
        setZoom(z);
      },
      onPanResponderRelease: () => (pinchStart.current = null),
      onPanResponderTerminate: () => (pinchStart.current = null),
    }),
  );

  // ---- Recording -------------------------------------------------------------
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
    const cam = cameraRef.current;
    if (!cam) return;
    setElapsed(0);
    setRestartKey((k) => k + 1);
    setPhase('recording');
    feel('recordStart', level);
    setPlaying(true);
    try {
      const result = await cam.recordAsync();
      setPlaying(false);
      if (result?.uri) {
        feel('takeSaved', level);
        router.replace({ pathname: '/review', params: { uri: result.uri, id: script?.id ?? '' } });
      } else {
        setPhase('idle');
      }
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

  const cycleSpeed = () => {
    const i = SPEEDS.findIndex((s) => s >= settings.speed - 0.001);
    const next = SPEEDS[(i + 1) % SPEEDS.length];
    updateSettings({ speed: next });
    feel('step', level);
  };

  // ---- Screens before the camera ---------------------------------------------
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
  const ghost = drag?.kind === 'move' && drag.dock !== 'free' ? frameToRect(rectToFrame(drag.rect, area, drag.dock), area) : null;

  const moveBar = (
    <View
      {...movePan.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Move script"
      accessibilityHint="Drag to place the script anywhere. It snaps to the top, bottom, left or right."
      style={styles.barZone}>
      <View style={[styles.bar, drag?.kind === 'move' && styles.barActive]} />
    </View>
  );
  const resizeBar = (
    <View
      {...resizePan.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Resize script"
      accessibilityValue={{ text: `${Math.round((rect.h / area.h) * 100)} percent of the screen height` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => nudgeCard(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
      style={styles.barZone}>
      <View style={[styles.bar, styles.barWide, drag?.kind === 'resize' && styles.barActive]} />
    </View>
  );

  const controls = (
    <>
      <IconButton icon="close" label="Close recorder" size={44} disabled={busy} onPress={() => router.back()} />
      <IconButton
        icon="camera-reverse-outline"
        label="Flip camera"
        size={44}
        disabled={busy}
        onPress={() => {
          setFacing((f) => (f === 'front' ? 'back' : 'front'));
          feel('step', level);
        }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Scroll speed ${settings.speed} times. Tap to change`}
        onPress={cycleSpeed}
        style={styles.speed}>
        <Text style={styles.speedText}>{settings.speed.toFixed(1)}×</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
        onPress={onRecordPress}
        disabled={phase === 'saving' || phase === 'countdown'}
        style={[styles.recOuter, recording && { borderColor: C.accent }]}>
        <View style={recording ? styles.recStop : styles.recDot} />
      </Pressable>
      <IconButton icon={playing ? 'pause' : 'play'} label={playing ? 'Pause script' : 'Play script'} size={44} onPress={togglePlay} />
      <IconButton icon="text" label="Text and prompter settings" size={44} disabled={busy} onPress={() => router.push('/style')} />
    </>
  );

  const timer = (
    <View style={[styles.timer, recording && styles.timerLive]} accessibilityLabel={recording ? `Recording, ${elapsed} seconds` : 'Ready to record'}>
      <View style={[styles.dot, { backgroundColor: recording ? '#FFFFFF' : C.fog }]} />
      <Text style={styles.timerText}>{fmt(elapsed)}</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* Full-frame camera. Pinch to zoom. */}
      <View style={StyleSheet.absoluteFill} {...pinch.panHandlers}>
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
      </View>

      {settings.glow ? <RecordingGlow active={recording} radius={landscape ? 36 : 52} /> : null}

      {/* Where the card will snap while you drag it. */}
      {ghost ? <View pointerEvents="none" style={[styles.ghost, { left: ghost.x, top: ghost.y, width: ghost.w, height: ghost.h }]} /> : null}

      {/* Floating script card. */}
      <View style={[styles.card, { left: rect.x, top: rect.y, width: rect.w, height: rect.h }, drag && styles.cardActive]}>
        <View style={StyleSheet.absoluteFill}>
          <Reader
            script={script}
            settings={settings}
            playing={playing}
            height={rect.h}
            topInset={22}
            opacity={settings.cardOpacity}
            restartKey={restartKey}
            onTogglePlay={togglePlay}
            onSectionReached={() => feel('sectionReached', level)}
            onEndingSoon={() => feel('endingSoon', level)}
            onFinished={() => setPlaying(false)}
          />
        </View>
        <View style={styles.barTop}>{resizeEdge === 'top' ? resizeBar : moveBar}</View>
        <View style={styles.barBottom}>{resizeEdge === 'bottom' ? resizeBar : moveBar}</View>
      </View>

      {zoom > 0.01 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset zoom"
          onPress={() => setZoom(0)}
          style={[styles.zoomChip, landscape ? { right: CONTROLS_LANDSCAPE + insets.right + 12, bottom: insets.bottom + 16 } : { right: 16, bottom: CONTROLS_PORTRAIT + 8 }]}>
          <Text style={styles.zoomText}>{(1 + zoom * 4).toFixed(1)}×</Text>
        </Pressable>
      ) : null}

      {phase === 'countdown' ? (
        <View style={styles.countWrap} pointerEvents="none">
          <View style={styles.countRing}>
            <Text style={styles.count} accessibilityLiveRegion="assertive">
              {count}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Controls: bottom bar in portrait, side column in landscape. */}
      {landscape ? (
        <View style={[styles.column, { right: insets.right + 6, top: insets.top + 8, bottom: insets.bottom + 8 }]}>
          {timer}
          {controls}
        </View>
      ) : (
        <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          {timer}
          <View style={styles.row}>{controls}</View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.black },
  center: { flex: 1, backgroundColor: C.ink, alignItems: 'stretch', justifyContent: 'center', padding: 24, gap: 14 },
  permTitle: { fontFamily: DisplayFont, color: C.paper, fontSize: 28, textAlign: 'center' },
  msg: { color: C.fog, fontSize: 16, lineHeight: 23, textAlign: 'center', marginBottom: 8 },
  card: {
    position: 'absolute',
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  cardActive: { borderColor: C.accent, borderWidth: 1.5 },
  ghost: {
    position: 'absolute',
    borderRadius: 26,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: C.accentPale,
    backgroundColor: 'rgba(155,107,255,0.12)',
  },
  barTop: { position: 'absolute', top: 0, left: 0, right: 0 },
  barBottom: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  barZone: { height: 26, alignItems: 'center', justifyContent: 'center' },
  bar: { width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(246,241,255,0.55)' },
  barWide: { width: 64 },
  barActive: { backgroundColor: C.accentPale, width: 72 },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingHorizontal: 10,
    height: 84,
    borderRadius: 42,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  column: {
    position: 'absolute',
    width: CONTROLS_LANDSCAPE - 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderRadius: 42,
    backgroundColor: C.glass,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: C.glass,
  },
  timerLive: { backgroundColor: C.rec },
  dot: { width: 7, height: 7, borderRadius: 4 },
  timerText: { color: C.paper, fontFamily: DisplayFontMedium, fontSize: 13 },
  speed: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedText: { color: C.paper, fontFamily: DisplayFontMedium, fontSize: 13 },
  recOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 4,
    borderColor: C.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recDot: { width: 50, height: 50, borderRadius: 25, backgroundColor: C.rec },
  recStop: { width: 26, height: 26, borderRadius: 7, backgroundColor: C.rec },
  zoomChip: {
    position: 'absolute',
    height: 34,
    minWidth: 52,
    paddingHorizontal: 10,
    borderRadius: 17,
    backgroundColor: C.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: { color: C.paper, fontFamily: DisplayFontMedium, fontSize: 13 },
  countWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
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
