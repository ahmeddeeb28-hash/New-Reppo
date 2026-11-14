import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton, Segmented } from '@/components/ui';
import { useStore } from '@/lib/store';
import {
  formatDuration,
  newSection,
  scriptWords,
  seconds,
  SectionGuide,
  wordCount,
  type Mode,
  type Script,
  type Section,
  type SectionKind,
} from '@/lib/story';
import { C, DisplayFont } from '@/lib/theme';

const KINDS: SectionKind[] = ['hook', 'setup', 'story', 'value', 'proof', 'cta', 'custom'];

export default function Editor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getScript, saveScript } = useStore();
  const [draft, setDraft] = useState<Script | undefined>(() => getScript(id));

  // Autosave every change.
  useEffect(() => {
    if (draft) saveScript(draft);
  }, [draft, saveScript]);

  if (!draft) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.missing}>This script no longer exists.</Text>
      </SafeAreaView>
    );
  }

  const words = scriptWords(draft);
  const secs = seconds(words, draft.mode);
  const fit =
    draft.mode === 'reel'
      ? secs <= 60
        ? { text: 'Fits a Reel', color: C.tally }
        : secs <= 90
          ? { text: 'Long for a Reel', color: C.fog }
          : { text: 'Too long for a Reel — trim or switch to Talk', color: C.rec }
      : { text: `${draft.sections.length} sections`, color: C.fog };

  const patch = (p: Partial<Script>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const patchSection = (sid: string, p: Partial<Section>) =>
    setDraft((d) => (d ? { ...d, sections: d.sections.map((s) => (s.id === sid ? { ...s, ...p } : s)) } : d));
  const move = (index: number, dir: -1 | 1) =>
    setDraft((d) => {
      if (!d) return d;
      const j = index + dir;
      if (j < 0 || j >= d.sections.length) return d;
      const list = d.sections.slice();
      [list[index], list[j]] = [list[j], list[index]];
      return { ...d, sections: list };
    });
  const remove = (sec: Section) =>
    Alert.alert('Remove section?', `"${sec.headline || SectionGuide[sec.kind].label}" and its text will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setDraft((d) => (d ? { ...d, sections: d.sections.filter((s) => s.id !== sec.id) } : d)),
      },
    ]);
  const pickKind = (onPick: (k: SectionKind) => void, title: string) =>
    Alert.alert(title, undefined, [
      ...KINDS.map((k) => ({ text: SectionGuide[k].label, onPress: () => onPick(k) })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  const addSection = () =>
    pickKind((k) => setDraft((d) => (d ? { ...d, sections: [...d.sections, newSection(k)] } : d)), 'Add a section');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.topBar}>
        <IconButton icon="chevron-back" label="Back to scripts" tone="solid" size={44} onPress={() => router.back()} />
        <View style={{ width: 150 }}>
          <Segmented<Mode>
            label="Mode"
            value={draft.mode}
            onChange={(mode) => patch({ mode })}
            options={[
              { value: 'reel', label: 'Reel' },
              { value: 'talk', label: 'Talk' },
            ]}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start recording with this script"
          onPress={() => router.push({ pathname: '/record/[id]', params: { id: draft.id } })}
          style={({ pressed }) => [styles.go, pressed && { opacity: 0.8 }]}>
          <Text style={styles.goText}>Record</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TextInput
            value={draft.title}
            onChangeText={(title) => patch({ title })}
            accessibilityLabel="Script title"
            placeholder="Script title"
            placeholderTextColor={C.fog}
            style={styles.title}
          />
          <View style={styles.summary}>
            <Text style={styles.summaryText}>{words} words</Text>
            <Text style={styles.summaryText}>≈ {formatDuration(words, draft.mode)}</Text>
            <Text style={[styles.summaryText, { color: fit.color }]}>{fit.text}</Text>
          </View>

          {/* Story outline: the whole arc at a glance, with time per section. */}
          <View accessibilityLabel="Story outline" style={styles.outline}>
            {draft.sections.map((s, i) => (
              <View key={s.id} style={styles.outlineItem}>
                <Text style={styles.outlineNum}>{i + 1}</Text>
                <Text style={styles.outlineText} numberOfLines={1}>
                  {s.headline || SectionGuide[s.kind].label}
                </Text>
                <Text style={styles.outlineTime}>{seconds(wordCount(s.body), draft.mode)}s</Text>
              </View>
            ))}
          </View>

          {draft.sections.map((sec, i) => {
            const w = wordCount(sec.body);
            return (
              <View key={sec.id} style={styles.section}>
                <View style={styles.sectionHead}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Section type: ${SectionGuide[sec.kind].label}. Change type`}
                    onPress={() =>
                      pickKind(
                        (k) =>
                          patchSection(sec.id, {
                            kind: k,
                            headline:
                              sec.headline === SectionGuide[sec.kind].label || !sec.headline
                                ? SectionGuide[k].label
                                : sec.headline,
                          }),
                        'Section type',
                      )
                    }
                    style={styles.kind}>
                    <Text style={styles.kindText}>
                      {i + 1} · {SectionGuide[sec.kind].label.toUpperCase()}
                    </Text>
                  </Pressable>
                  <View style={styles.sectionActions}>
                    <IconButton icon="arrow-up" label="Move section up" size={36} disabled={i === 0} onPress={() => move(i, -1)} />
                    <IconButton
                      icon="arrow-down"
                      label="Move section down"
                      size={36}
                      disabled={i === draft.sections.length - 1}
                      onPress={() => move(i, 1)}
                    />
                    <IconButton icon="trash-outline" label="Remove section" size={36} onPress={() => remove(sec)} />
                  </View>
                </View>
                <TextInput
                  value={sec.headline}
                  onChangeText={(headline) => patchSection(sec.id, { headline })}
                  accessibilityLabel={`Headline for section ${i + 1}`}
                  placeholder="Headline"
                  placeholderTextColor={C.fog}
                  style={styles.headline}
                />
                <TextInput
                  value={sec.body}
                  onChangeText={(body) => patchSection(sec.id, { body })}
                  accessibilityLabel={`What to say in section ${i + 1}`}
                  placeholder={SectionGuide[sec.kind].tip}
                  placeholderTextColor="#6E6E76"
                  multiline
                  scrollEnabled={false}
                  style={styles.body}
                />
                <Text style={styles.sectionMeta}>
                  {w} words · ≈ {seconds(w, draft.mode)}s
                </Text>
              </View>
            );
          })}

          <Pressable accessibilityRole="button" onPress={addSection} style={styles.add}>
            <Text style={styles.addText}>+ Add section</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.ink },
  missing: { color: C.fog, textAlign: 'center', marginTop: 80, fontSize: 16 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  go: { minHeight: 44, paddingHorizontal: 18, borderRadius: 22, backgroundColor: C.tally, justifyContent: 'center' },
  goText: { color: C.ink, fontWeight: '700', fontSize: 16 },
  content: { paddingHorizontal: 20, paddingBottom: 80, gap: 14 },
  title: { color: C.paper, fontFamily: DisplayFont, fontSize: 28, paddingVertical: 6 },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  summaryText: { color: C.fog, fontSize: 14 },
  outline: { borderRadius: 16, backgroundColor: C.graphite, paddingVertical: 6 },
  outlineItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, minHeight: 34 },
  outlineNum: { color: C.tally, fontWeight: '700', width: 18 },
  outlineText: { flex: 1, color: C.paper, fontSize: 15, fontWeight: '600' },
  outlineTime: { color: C.fog, fontSize: 13 },
  section: { borderRadius: 18, borderWidth: 1, borderColor: C.graphite, padding: 14, gap: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kind: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 10, backgroundColor: C.tallySoft },
  kindText: { color: C.tally, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  sectionActions: { flexDirection: 'row', gap: 6 },
  headline: { color: C.paper, fontSize: 18, fontWeight: '700', paddingVertical: 4 },
  body: { color: C.paper, fontSize: 17, lineHeight: 25, minHeight: 72, textAlignVertical: 'top' },
  sectionMeta: { color: C.fog, fontSize: 12 },
  add: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { color: C.paper, fontSize: 16, fontWeight: '600' },
});
