import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { IconButton, SectionLabel, Segmented } from '@/components/ui';
import { feel } from '@/lib/haptics';
import { useStore, type HapticsLevel, type PrompterSettings } from '@/lib/store';
import { C, DisplayFont, LineSpacing, ReaderThemes, ScriptFonts, type ReaderThemeKey, type ScriptFontKey } from '@/lib/theme';

export default function StyleSheetScreen() {
  const { settings, updateSettings } = useStore();
  const set = (p: Partial<PrompterSettings>) => {
    updateSettings(p);
    feel('step', settings.haptics);
  };
  const font = ScriptFonts[settings.font];
  const theme = ReaderThemes[settings.theme];

  return (
    <ScrollView style={{ backgroundColor: C.graphite }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Text & prompter
        </Text>
        <IconButton icon="checkmark" label="Done" tone="accent" size={44} onPress={() => router.back()} />
      </View>

      {/* Live preview */}
      <View style={[styles.preview, { backgroundColor: theme.bg }]} accessibilityLabel="Preview of your script style">
        {settings.showHeadlines ? (
          <Text style={[styles.previewHead, { color: theme.guide, textAlign: settings.align }]}>HOOK</Text>
        ) : null}
        <Text
          style={{
            color: theme.fg,
            fontFamily: font.family,
            fontWeight: font.weight,
            fontSize: settings.fontSize,
            lineHeight: Math.round(settings.fontSize * LineSpacing[settings.spacing]),
            textAlign: settings.align,
            transform: settings.mirror ? [{ scaleX: -1 }] : undefined,
          }}>
          Ever forgot your lines halfway through a video?
        </Text>
      </View>

      <View style={styles.row}>
        <SectionLabel>Text size</SectionLabel>
        <View style={styles.stepper}>
          <IconButton icon="remove" label="Smaller text" size={40} onPress={() => set({ fontSize: Math.max(16, settings.fontSize - 2) })} />
          <Text style={styles.stepValue}>{settings.fontSize}</Text>
          <IconButton icon="add" label="Larger text" size={40} onPress={() => set({ fontSize: Math.min(56, settings.fontSize + 2) })} />
        </View>
      </View>

      <SectionLabel>Font</SectionLabel>
      <View style={styles.grid}>
        {(Object.keys(ScriptFonts) as ScriptFontKey[]).map((k) => {
          const f = ScriptFonts[k];
          const on = settings.font === k;
          return (
            <Pressable
              key={k}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${f.label} font`}
              onPress={() => set({ font: k })}
              style={[styles.card, on && styles.cardOn]}>
              <Text style={{ color: C.paper, fontFamily: f.family, fontWeight: f.weight, fontSize: 22 }}>Aa</Text>
              <Text style={styles.cardLabel}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionLabel>Colours</SectionLabel>
      <View style={styles.grid}>
        {(Object.keys(ReaderThemes) as ReaderThemeKey[]).map((k) => {
          const t = ReaderThemes[k];
          const on = settings.theme === k;
          return (
            <Pressable
              key={k}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${t.label} colours`}
              onPress={() => set({ theme: k })}
              style={[styles.card, on && styles.cardOn]}>
              <View style={[styles.swatch, { backgroundColor: t.bg }]}>
                <Text style={{ color: t.fg, fontWeight: '700' }}>Aa</Text>
              </View>
              <Text style={styles.cardLabel}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionLabel>Line spacing</SectionLabel>
      <Segmented
        label="Line spacing"
        value={settings.spacing}
        onChange={(spacing) => set({ spacing })}
        options={[
          { value: 'tight', label: 'Tight' },
          { value: 'normal', label: 'Normal' },
          { value: 'airy', label: 'Airy' },
        ]}
      />

      <SectionLabel>Align</SectionLabel>
      <Segmented
        label="Text alignment"
        value={settings.align}
        onChange={(align) => set({ align })}
        options={[
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
        ]}
      />

      <SectionLabel>Countdown before recording</SectionLabel>
      <Segmented<PrompterSettings['countdown']>
        label="Countdown"
        value={settings.countdown}
        onChange={(countdown) => set({ countdown })}
        options={[
          { value: 0, label: 'Off' },
          { value: 3, label: '3 s' },
          { value: 5, label: '5 s' },
          { value: 10, label: '10 s' },
        ]}
      />

      <SectionLabel>Haptics</SectionLabel>
      <Segmented<HapticsLevel>
        label="Haptics strength"
        value={settings.haptics}
        onChange={(haptics) => {
          updateSettings({ haptics });
          feel('pauseResume', haptics);
        }}
        options={[
          { value: 'off', label: 'Off' },
          { value: 'subtle', label: 'Subtle' },
          { value: 'normal', label: 'Normal' },
          { value: 'strong', label: 'Strong' },
        ]}
      />

      <View style={styles.toggles}>
        <ToggleRow
          label="Section headlines"
          hint="Show each section's headline above its text"
          value={settings.showHeadlines}
          onChange={(showHeadlines) => set({ showHeadlines })}
        />
        <ToggleRow label="Reading line" hint="Amber marker for the line to read" value={settings.guide} onChange={(guide) => set({ guide })} />
        <ToggleRow
          label="Mirror text"
          hint="For teleprompter glass that flips the text"
          value={settings.mirror}
          onChange={(mirror) => set({ mirror })}
          last
        />
      </View>
    </ScrollView>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
  last,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.toggle, !last && { borderBottomWidth: 1, borderBottomColor: C.graphite }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleHint}>{hint}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: C.tally, false: C.line }}
        thumbColor={C.paper}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 60, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontFamily: DisplayFont, fontSize: 26, color: C.paper },
  preview: { borderRadius: 18, padding: 18, minHeight: 120, justifyContent: 'center', marginBottom: 6 },
  previewHead: { fontSize: 12, fontWeight: '800', letterSpacing: 1.4, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.ink, borderRadius: 24, padding: 3 },
  stepValue: { color: C.paper, fontFamily: DisplayFont, fontSize: 16, minWidth: 36, textAlign: 'center' },
  grid: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  card: {
    flex: 1,
    minHeight: 72,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.line,
    backgroundColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cardOn: { borderColor: C.tally },
  cardLabel: { color: C.paper, fontSize: 12, fontWeight: '500' },
  swatch: {
    width: 44,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.line,
  },
  toggles: { borderRadius: 16, backgroundColor: C.ink, marginTop: 8 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 60, paddingVertical: 8 },
  toggleLabel: { color: C.paper, fontSize: 16, fontWeight: '600' },
  toggleHint: { color: C.fog, fontSize: 13 },
});
