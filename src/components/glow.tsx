import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { C } from '@/lib/theme';

/**
 * A soft violet glow around the edge of the screen while recording, so you can
 * feel that the take is live without looking away from the lens. It breathes
 * slowly; `level` (0–1) can push it brighter, e.g. from a voice meter.
 */
export function RecordingGlow({ active, level = 0, radius = 48 }: { active: boolean; level?: number; radius?: number }) {
  const [breath] = useState(() => new Animated.Value(0));
  const [shown] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(shown, { toValue: active ? 1 : 0, duration: 400, useNativeDriver: true }).start();
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, breath, shown]);

  const boost = Math.min(1, Math.max(0, level));
  const outer = Animated.multiply(shown, breath.interpolate({ inputRange: [0, 1], outputRange: [0.45 + boost * 0.4, 0.85 + boost * 0.15] }));
  const inner = Animated.multiply(shown, breath.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.5] }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.edge,
          { borderRadius: radius, opacity: outer, borderWidth: 3, shadowRadius: 22 + boost * 18 },
        ]}
      />
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.edge, { borderRadius: radius, opacity: inner, borderWidth: 14, borderColor: 'rgba(155,107,255,0.35)' }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  edge: {
    borderColor: C.accent,
    shadowColor: C.accent,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 0 },
  },
});

/**
 * A violet glow around the camera cut-out (Dynamic Island / notch), right
 * above the script. It pulses while you record, so you can feel the take is
 * live while your eyes stay on the lens.
 */
export function IslandGlow({ active, x, y, landscape }: { active: boolean; x: number; y: number; landscape: boolean }) {
  const [pulse] = useState(() => new Animated.Value(0));
  const [shown] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(shown, { toValue: active ? 1 : 0, duration: 350, useNativeDriver: true }).start();
    if (!active) return;
    // Uneven rhythm, like speech: quick swells with short rests.
    const beat = (to: number, ms: number) =>
      Animated.timing(pulse, { toValue: to, duration: ms, easing: Easing.inOut(Easing.quad), useNativeDriver: true });
    const loop = Animated.loop(
      Animated.sequence([beat(1, 180), beat(0.45, 160), beat(0.9, 200), beat(0.3, 240), beat(0.75, 170), beat(0.1, 420)]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, pulse, shown]);

  const w = landscape ? 110 : 240;
  const h = landscape ? 240 : 110;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        glowStyles.island,
        {
          left: x - w / 2,
          top: y - h / 2,
          width: w,
          height: h,
          borderRadius: Math.max(w, h) / 2,
          opacity: Animated.multiply(shown, pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] })),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.15] }) }],
        },
      ]}
    />
  );
}

const glowStyles = StyleSheet.create({
  island: {
    position: 'absolute',
    backgroundColor: 'rgba(155,107,255,0.55)',
    shadowColor: '#B07BFF',
    shadowOpacity: 1,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 50,
  },
});
