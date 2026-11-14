import { useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { C, DisplayFont } from '@/lib/theme';

const STEP_PX = 18;

/**
 * Vertical script-settings dial that hugs the right edge of the camera view.
 * Drag up or down to step through values (one haptic tick per step).
 * The top button switches what the dial controls.
 */
export function SideDial({
  modeLabel,
  modeA11y,
  onToggleMode,
  values,
  index,
  format,
  label,
  onStep,
  style,
}: {
  modeLabel: string;
  modeA11y: string;
  onToggleMode: () => void;
  values: number[];
  index: number;
  format: (v: number) => string;
  label: string;
  /** +1 = next value (up), -1 = previous (down). */
  onStep: (dir: 1 | -1) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const stepRef = useRef(onStep);
  useEffect(() => {
    stepRef.current = onStep;
  }, [onStep]);
  const lastY = useRef(0);
  // Refs are only read inside the gesture callbacks, never while rendering.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastY.current = 0;
      },
      onPanResponderMove: (_, g) => {
        const d = g.dy - lastY.current;
        if (Math.abs(d) >= STEP_PX) {
          stepRef.current(d < 0 ? 1 : -1);
          lastY.current = g.dy;
        }
      },
    }),
  );

  const next = index < values.length - 1 ? format(values[index + 1]) : '';
  const prev = index > 0 ? format(values[index - 1]) : '';

  return (
    <View style={[styles.rail, style]}>
      <Pressable accessibilityRole="button" accessibilityLabel={modeA11y} onPress={onToggleMode} style={styles.mode}>
        <Text style={styles.modeText}>{modeLabel}</Text>
      </Pressable>
      <View
        {...pan.panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ text: format(values[index]) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => onStep(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
        style={styles.dial}>
        <Text style={styles.side}>{next}</Text>
        <Text style={styles.now}>{format(values[index])}</Text>
        <Text style={styles.side}>{prev}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: 48,
    alignItems: 'center',
    paddingVertical: 6,
    gap: 4,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    backgroundColor: 'rgba(20,14,40,0.6)',
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mode: { width: 38, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  modeText: { color: C.paper, fontSize: 13, fontWeight: '700' },
  dial: { width: 48, height: 100, alignItems: 'center', justifyContent: 'center', gap: 2 },
  side: { color: 'rgba(246,241,255,0.45)', fontSize: 12, fontWeight: '600', lineHeight: 18 },
  now: { color: C.accentPale, fontSize: 16, fontFamily: DisplayFont, lineHeight: 24 },
});
