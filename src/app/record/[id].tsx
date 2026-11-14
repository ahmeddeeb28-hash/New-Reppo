import { CameraView, useCameraPermissions, useMicrophonePermissions, type CameraType } from 'expo-camera';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, PanResponder, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Reader } from '@/components/reader';
import { Button, IconButton } from '@/components/ui';
import { feel } from '@/lib/haptics';
import { useStore } from '@/lib/store';
import { C, DisplayFont, DisplayFontMedium } from '@/lib/theme';

type Phase = 'idle' | 'countdown' | 'recording' | 'saving';

const MIN_RATIO = 0.18;
const MAX_RATIO = 0.7;
const SNAPS = [0.25, 0.38, 0.52];
const SNAP_RANGE = 0.02;

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function Record() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getScript, settings, updateSettings } = useStore();
  const script = getScript(id);
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();

  const [camPerm, requestCam] = useCameraPermissions();
  const [micPerm, requestMic] = useMicrophonePermissions();

  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [facing, setFacing] = useState<CameraType>('front');
  const [phase, setPhase] = useState<Phase>('idle');
  const [count, setCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [restartKey, setRestartKey] = useState(0);

  // Divider between reader and camera. Only changes what you SEE:
  // the camera keeps recording its full frame whatever the preview size.
  const [ratio, setRatio] = useState(settings.readerRatio);
  const ratioRef = useRef(ratio);
  const startRatio = useRef(ratio);
  const snapped = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const level = settings.haptics;
  // The pan responder is created once, so it reads these through refs.
  const levelRef = useRef(level);
  const screenHRef = useRef(screenH);
  useEffect(() => {
    levelRef.current = level;
    screenHRef.current = screenH;
  }, [level, screenH]);

  // Refs are only read inside the gesture callbacks, never while rendering.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startRatio.current = ratioRef.current;
        setDragging(true);
      },
      onPanResponderMove: (_, g) => {
        let r = Math.min(MAX_RATIO, Math.max(MIN_RATIO, startRatio.current + g.dy / screenHRef.current));
        const snap = SNAPS.find((s) => Math.abs(s - r) < SNAP_RANGE) ?? null;
        if (snap !== null) r = snap;
        if (snap !== snapped.current) {
          snapped.current = snap;
          if (snap !== null) feel('snap', levelRef.current);
        }
        ratioRef.current = r;
        setRatio(r);
      },
      onPanResponderRelease: () => {
        setDragging(false);
        updateSettings({ readerRatio: ratioRef.current });
      },
      onPanResponderTerminate: () => setDragging(false),
    }),
  );

  const setRatioStep = (dir: 1 | -1) => {
    const r = Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratioRef.current + dir * 0.05));
    ratioRef.current = r;
    setRatio(r);
    updateSettings({ readerRatio: r });
    feel('step', level);
  };

  // Recording timer.
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

  const changeSpeed = (d: number) => {
    const s = Math.round(Math.min(3, Math.max(0.5, settings.speed + d)) * 10) / 10;
    updateSettings({ speed: s });
    feel('step', level);
  };

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

  const readerH = Math.round(screenH * ratio);
  const recording = phase === 'recording' || phase === 'saving';
  const pct = Math.round(ratio * 100);

  return (
    <View style={styles.screen}>
      {/* Script, hugging the front camera at the top of the screen. */}
      <View style={{ height: readerH, overflow: 'hidden' }}>
        <Reader
          script={script}
          settings={settings}
          playing={playing}
          height={readerH}
          topInset={insets.top}
          restartKey={restartKey}
          onTogglePlay={togglePlay}
          onSectionReached={() => feel('sectionReached', level)}
          onEndingSoon={() => feel('endingSoon', level)}
          onFinished={() => setPlaying(false)}
        />
      </View>

      {/* Divider: drag to trade script space for camera space. */}
      <View
        {...pan.panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Script and camera divider"
        accessibilityValue={{ text: `Script ${pct} percent of the screen` }}
        onAccessibilityAction={(e) => setRatioStep(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        style={styles.handleZone}>
        <View style={[styles.handle, dragging && { backgroundColor: C.tally }]}>
          <Text style={[styles.handleText, dragging && { color: C.ink }]}>
            {dragging ? `Script ${pct}% · Camera ${100 - pct}%` : '⇅'}
          </Text>
        </View>
      </View>

      {/* Camera preview. Resizing this box never changes the recorded frame. */}
      <View style={styles.cameraBox}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          mode="video"
          videoQuality="1080p"
          mute={!micPerm?.granted}
          onCameraReady={() => setCameraReady(true)}
          onMountError={(e) => Alert.alert('Camera error', e.message)}
        />

        <View style={styles.camTop} pointerEvents="box-none">
          <View style={styles.timer} accessibilityLabel={recording ? `Recording, ${elapsed} seconds` : 'Ready to record'}>
            <View style={[styles.dot, { backgroundColor: recording ? C.rec : C.fog }]} />
            <Text style={styles.timerText}>{fmt(elapsed)}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconButton
              icon="camera-reverse-outline"
              label="Flip camera"
              size={44}
              disabled={recording}
              onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}
            />
            <IconButton icon="close" label="Close recorder" size={44} disabled={recording} onPress={() => router.back()} />
          </View>
        </View>

        {phase === 'countdown' ? (
          <View style={styles.countWrap} pointerEvents="none">
            <Text style={styles.count} accessibilityLiveRegion="assertive">
              {count}
            </Text>
          </View>
        ) : null}

        <View style={[styles.controls, { bottom: Math.max(insets.bottom, 12) + 8 }]}>
          <View style={styles.speedRow}>
            <IconButton icon="remove" label="Slower" size={40} onPress={() => changeSpeed(-0.1)} />
            <Text style={styles.speed} accessibilityLabel={`Speed ${settings.speed} times`}>
              {settings.speed.toFixed(1)}×
            </Text>
            <IconButton icon="add" label="Faster" size={40} onPress={() => changeSpeed(0.1)} />
          </View>
          <View style={styles.bar}>
            <IconButton
              icon="play-skip-back"
              label="Back to the start of the script"
              onPress={() => {
                setRestartKey((k) => k + 1);
                feel('step', level);
              }}
            />
            <IconButton icon={playing ? 'pause' : 'play'} label={playing ? 'Pause script' : 'Play script'} onPress={togglePlay} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={recording ? 'Stop recording' : 'Start recording'}
              onPress={onRecordPress}
              disabled={phase === 'saving' || phase === 'countdown'}
              style={styles.recOuter}>
              <View style={recording ? styles.recStop : styles.recDot} />
            </Pressable>
            <IconButton icon="text" label="Text style" disabled={recording} onPress={() => router.push('/style')} />
            <IconButton
              icon="create-outline"
              label="Edit script"
              disabled={recording}
              onPress={() => router.push({ pathname: '/script/[id]', params: { id: script.id } })}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.black },
  center: { flex: 1, backgroundColor: C.ink, alignItems: 'stretch', justifyContent: 'center', padding: 24, gap: 14 },
  permTitle: { fontFamily: DisplayFont, color: C.paper, fontSize: 28, textAlign: 'center' },
  msg: { color: C.fog, fontSize: 16, lineHeight: 23, textAlign: 'center', marginBottom: 8 },
  handleZone: { height: 28, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  handle: {
    minWidth: 56,
    height: 22,
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: C.graphite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleText: { color: C.paper, fontSize: 12, fontFamily: DisplayFontMedium },
  cameraBox: {
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 6,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#111',
    borderWidth: 1.5,
    borderColor: 'rgba(255,176,32,0.5)',
  },
  camTop: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(11,11,12,0.6)',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  timerText: { color: C.paper, fontFamily: DisplayFontMedium, fontSize: 15 },
  countWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  count: { color: C.paper, fontFamily: DisplayFont, fontSize: 120, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 20 },
  controls: { position: 'absolute', left: 12, right: 12, alignItems: 'center', gap: 10 },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    borderRadius: 24,
    backgroundColor: 'rgba(11,11,12,0.6)',
  },
  speed: { color: C.paper, fontFamily: DisplayFontMedium, fontSize: 15, minWidth: 44, textAlign: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingHorizontal: 12,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(11,11,12,0.66)',
  },
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
});
