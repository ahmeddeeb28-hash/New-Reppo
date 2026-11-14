import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { C, DisplayFont } from '@/lib/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function IconButton({
  icon,
  label,
  onPress,
  size = 48,
  tone = 'glass',
  disabled,
  style,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  size?: number;
  tone?: 'glass' | 'solid' | 'accent';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = tone === 'accent' ? C.tally : tone === 'solid' ? C.graphite : 'rgba(255,255,255,0.12)';
  const fg = tone === 'accent' ? C.ink : C.paper;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
        { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        style,
      ]}>
      <Ionicons name={icon} size={Math.round(size * 0.44)} color={fg} />
    </Pressable>
  );
}

export function Button({
  title,
  onPress,
  tone = 'accent',
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  tone?: 'accent' | 'solid' | 'ghost';
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = tone === 'accent' ? C.tally : tone === 'solid' ? C.graphite : 'transparent';
  const fg = tone === 'accent' ? C.ink : C.paper;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderWidth: tone === 'accent' ? 0 : 1, opacity: pressed ? 0.75 : 1 },
        style,
      ]}>
      {icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
      <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipOn : null, style]}>
      <Text style={[styles.chipText, { color: selected ? C.ink : C.paper }]}>{label}</Text>
    </Pressable>
  );
}

/** Segmented control: a row of equal options. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.segment}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[styles.segmentItem, on ? { backgroundColor: C.paper } : null]}>
            <Text style={[styles.segmentText, { color: on ? C.ink : C.fog }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <Text accessibilityRole="header" style={styles.title}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: 18,
    borderColor: C.line,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: { fontSize: 17, fontWeight: '700' },
  chip: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: C.paper, borderColor: C.paper },
  chipText: { fontSize: 15, fontWeight: '600' },
  segment: { flexDirection: 'row', gap: 4, padding: 3, borderRadius: 12, backgroundColor: C.ink },
  segmentItem: { flex: 1, minHeight: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 14, fontWeight: '600' },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.fog,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: { fontFamily: DisplayFont, fontSize: 34, color: C.paper, letterSpacing: -0.6 },
});
