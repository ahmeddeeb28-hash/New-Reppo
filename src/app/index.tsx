import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip, IconButton, Title } from '@/components/ui';
import { useStore } from '@/lib/store';
import { formatDuration, newScript, preview, scriptWords, type Mode, type Script } from '@/lib/story';
import { C } from '@/lib/theme';

type Filter = 'all' | Mode;

export default function Home() {
  const { scripts, saveScript, deleteScript } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...scripts]
      .filter((s) => filter === 'all' || s.mode === filter)
      .filter((s) => !q || s.title.toLowerCase().includes(q) || s.sections.some((x) => x.body.toLowerCase().includes(q)))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [scripts, filter, query]);

  const create = (mode: Mode) => {
    const s = newScript(mode);
    saveScript(s);
    router.push({ pathname: '/script/[id]', params: { id: s.id } });
  };

  const askCreate = () =>
    Alert.alert('New script', 'Pick a structure. You can change sections later.', [
      { text: 'Reel · Hook, Setup, Value, CTA', onPress: () => create('reel') },
      { text: 'Talk · 6 story sections', onPress: () => create('talk') },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const askDelete = (s: Script) =>
    Alert.alert('Delete script?', `"${s.title}" will be removed from this phone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteScript(s.id) },
    ]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}>
        <Title>Glance</Title>
        <IconButton icon="text" label="Text and prompter settings" tone="solid" size={44} onPress={() => router.push('/style')} />
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={C.fog} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search scripts"
          placeholderTextColor={C.fog}
          accessibilityLabel="Search scripts"
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      <View style={styles.filters}>
        <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="Reels" selected={filter === 'reel'} onPress={() => setFilter('reel')} />
        <Chip label="Talks" selected={filter === 'talk'} onPress={() => setFilter('talk')} />
      </View>

      <FlatList
        data={list}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 20, paddingBottom: 140 }}
        ListEmptyComponent={
          <Text style={styles.empty}>No scripts yet. Tap the + button to write your first one.</Text>
        }
        renderItem={({ item }) => {
          const words = scriptWords(item);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Opens the script. Long press to delete."
              onPress={() => router.push({ pathname: '/script/[id]', params: { id: item.id } })}
              onLongPress={() => askDelete(item)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.8 }]}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.badge, item.mode === 'reel' ? styles.badgeReel : styles.badgeTalk]}>
                  {item.mode === 'reel' ? 'REEL' : 'TALK'}
                </Text>
              </View>
              <Text style={styles.cardBody} numberOfLines={2}>
                {preview(item)}
              </Text>
              <Text style={styles.meta}>
                ≈ {formatDuration(words, item.mode)} · {words} words · {item.sections.length} sections
              </Text>
            </Pressable>
          );
        }}
      />

      <View style={styles.fabRow} pointerEvents="box-none">
        <IconButton icon="add" label="New script" tone="accent" size={64} onPress={askCreate} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.ink },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  search: {
    marginHorizontal: 20,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: C.graphite,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: { flex: 1, color: C.paper, fontSize: 16, paddingVertical: 10 },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 16 },
  card: { padding: 16, borderRadius: 18, backgroundColor: C.graphite, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardTitle: { flex: 1, color: C.paper, fontSize: 17, fontWeight: '600' },
  badge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
  badgeReel: { backgroundColor: C.tally, color: C.ink },
  badgeTalk: { borderWidth: 1, borderColor: C.line, color: C.paper },
  cardBody: { color: C.fog, fontSize: 15, lineHeight: 21 },
  meta: { color: C.fog, fontSize: 13 },
  empty: { color: C.fog, fontSize: 15, textAlign: 'center', marginTop: 40, lineHeight: 22 },
  fabRow: { position: 'absolute', left: 0, right: 0, bottom: 40, alignItems: 'center' },
});
