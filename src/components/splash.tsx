import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, DisplayFont } from '@/lib/theme';

/**
 * Animated splash: the eye opens, two ripples spread from it, then the
 * wordmark and tagline rise in. On first launch it waits for "Get Started";
 * after that it leaves on its own.
 */
export function AnimatedSplash({ firstRun, onDone }: { firstRun: boolean; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const [v] = useState(() => ({
    eye: new Animated.Value(0),
    ring1: new Animated.Value(0),
    ring2: new Animated.Value(0),
    word: new Animated.Value(0),
    cta: new Animated.Value(0),
    out: new Animated.Value(1),
  }));

  useEffect(() => {
    let cancelled = false;
    const leave = () =>
      Animated.timing(v.out, { toValue: 0, duration: 320, useNativeDriver: true }).start(() => !cancelled && onDone());

    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      const t = (x: Animated.Value, d: number, delay = 0) =>
        Animated.timing(x, { toValue: 1, duration: reduce ? 1 : d, delay: reduce ? 0 : delay, easing: Easing.out(Easing.cubic), useNativeDriver: true });
      Animated.sequence([
        t(v.eye, 520),
        Animated.parallel([t(v.ring1, 900), t(v.ring2, 900, 220), t(v.word, 520, 300)]),
        ...(firstRun ? [t(v.cta, 380)] : []),
      ]).start(() => {
        if (!firstRun && !cancelled) setTimeout(leave, reduce ? 300 : 350);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [firstRun, onDone, v]);

  const ring = (x: Animated.Value) => ({
    opacity: x.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.6, 0] }),
    transform: [{ scale: x.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2.1] }) }],
  });
  const rise = (x: Animated.Value) => ({
    opacity: x,
    transform: [{ translateY: x.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { opacity: v.out }]} accessibilityViewIsModal>
      {/* Violet waves at the bottom of the screen. */}
      <View pointerEvents="none" style={styles.waveA} />
      <View pointerEvents="none" style={styles.waveB} />

      <View style={styles.center}>
        <View style={styles.eyeWrap}>
          <Animated.View style={[styles.ring, ring(v.ring1)]} />
          <Animated.View style={[styles.ring, ring(v.ring2)]} />
          <Animated.View
            style={{
              opacity: v.eye,
              transform: [{ scale: v.eye.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }, { scaleY: v.eye.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.1, 1.08, 1] }) }],
            }}>
            <Image source={require('@/assets/images/eye.png')} style={styles.eye} accessibilityIgnoresInvertColors />
          </Animated.View>
        </View>
        <Animated.Text accessibilityRole="header" style={[styles.word, rise(v.word)]}>
          Glance
        </Animated.Text>
        <Animated.Text style={[styles.tagline, rise(v.word)]}>
          Your teleprompter for recording,{'\n'}presenting and going live.
        </Animated.Text>
      </View>

      {firstRun ? (
        <Animated.View style={[styles.ctaWrap, { bottom: insets.bottom + 40 }, rise(v.cta)]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => Animated.timing(v.out, { toValue: 0, duration: 320, useNativeDriver: true }).start(onDone)}
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}>
            <Text style={styles.ctaText}>Get Started  →</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: C.ink, zIndex: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingBottom: 40 },
  eyeWrap: { width: 160, height: 120, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 150,
    height: 96,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: C.accent,
  },
  eye: { width: 150, height: 150 },
  word: { fontFamily: DisplayFont, fontSize: 52, color: C.paper, letterSpacing: -1.5 },
  tagline: { color: C.fog, fontSize: 17, lineHeight: 25, textAlign: 'center' },
  ctaWrap: { position: 'absolute', left: 32, right: 32 },
  cta: {
    minHeight: 58,
    borderRadius: 29,
    backgroundColor: C.accentPale,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.accent,
    shadowOpacity: 0.7,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  ctaText: { color: C.ink, fontSize: 18, fontFamily: DisplayFont },
  waveA: {
    position: 'absolute',
    left: '-30%',
    right: '-30%',
    bottom: -260,
    height: 420,
    borderTopLeftRadius: 600,
    borderTopRightRadius: 300,
    backgroundColor: 'rgba(109,59,255,0.35)',
    transform: [{ rotate: '-8deg' }],
  },
  waveB: {
    position: 'absolute',
    left: '-20%',
    right: '-40%',
    bottom: -300,
    height: 420,
    borderTopLeftRadius: 300,
    borderTopRightRadius: 600,
    backgroundColor: 'rgba(155,107,255,0.28)',
    transform: [{ rotate: '10deg' }],
  },
});
