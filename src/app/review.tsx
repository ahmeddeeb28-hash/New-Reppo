import * as MediaLibrary from 'expo-media-library';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { feel } from '@/lib/haptics';
import { useStore } from '@/lib/store';
import { C, DisplayFontMedium } from '@/lib/theme';

export default function Review() {
  const { uri, id } = useLocalSearchParams<{ uri: string; id: string }>();
  const { settings } = useStore();
  const [saved, setSaved] = useState(false);
  const player = useVideoPlayer(uri ?? null, (p) => {
    p.loop = true;
    p.play();
  });

  const save = async () => {
    try {
      const perm = await MediaLibrary.requestPermissionsAsync(true);
      if (!perm.granted) {
        Alert.alert('Photos access needed', 'Allow Glance to add videos to Photos in Settings.');
        return;
      }
      await MediaLibrary.Asset.create(uri);
      setSaved(true);
      feel('takeSaved', settings.haptics);
    } catch (e) {
      feel('error', settings.haptics);
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  const share = async () => {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Sharing is not available on this device.');
      return;
    }
    await Sharing.shareAsync(uri, { mimeType: 'video/mp4', dialogTitle: 'Share your video' });
  };

  const retake = () => {
    player.pause();
    if (id) router.replace({ pathname: '/record/[id]', params: { id } });
    else router.back();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <Button title="Retake" tone="solid" icon="refresh" onPress={retake} style={{ minHeight: 44 }} />
        <Button title="Done" tone="ghost" onPress={() => router.dismissTo('/')} style={{ minHeight: 44 }} />
      </View>

      <View style={styles.videoWrap}>
        <VideoView player={player} style={styles.video} contentFit="contain" nativeControls />
      </View>

      <Text style={styles.note}>Your video is only on this phone until you save or share it.</Text>

      <View style={styles.actions}>
        <Button title="Share" icon="share-outline" onPress={share} />
        <Button
          title={saved ? 'Saved to Photos' : 'Save to Photos'}
          tone="solid"
          icon={saved ? 'checkmark' : 'download-outline'}
          onPress={saved ? () => {} : save}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.ink, paddingHorizontal: 20 },
  top: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  videoWrap: { flex: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: C.black, marginVertical: 12 },
  video: { flex: 1 },
  note: { color: C.fog, fontSize: 13, textAlign: 'center', fontFamily: DisplayFontMedium, marginBottom: 12 },
  actions: { gap: 10, paddingBottom: 12 },
});
