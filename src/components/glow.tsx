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
