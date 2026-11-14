import { useCallback, useEffect, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';

import type { PrompterSettings } from '@/lib/store';
import { SectionGuide, type Script } from '@/lib/story';
import { LineSpacing, ReaderThemes, ScriptFonts } from '@/lib/theme';

type Props = {
  script: Script;
  settings: PrompterSettings;
  playing: boolean;
  /** Height of the reader area, so we can pad the end of the script. */
  height: number;
  /** Space reserved at the top (status bar / camera island). */
  topInset: number;
  onTogglePlay: () => void;
  onSectionReached?: (index: number) => void;
  onEndingSoon?: () => void;
  onFinished?: () => void;
  /** Bumped by the parent to jump back to the start. */
  restartKey?: number;
};

/**
 * The prompter. Scrolls on its own while `playing`, can be dragged by hand,
 * and a tap anywhere toggles play/pause.
 */
export function Reader({
  script,
  settings,
  playing,
  height,
  topInset,
  onTogglePlay,
  onSectionReached,
  onEndingSoon,
  onFinished,
  restartKey = 0,
}: Props) {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const offset = useRef(0);
  const contentH = useRef(0);
  const sectionTops = useRef<number[]>([]);
  const lastSection = useRef(-1);
  const warnedEnd = useRef(false);
  const dragging = useRef(false);

  const font = ScriptFonts[settings.font];
  const theme = ReaderThemes[settings.theme];
  const lineH = Math.round(settings.fontSize * LineSpacing[settings.spacing]);
  // Reading line sits one and a half lines below the top of the reader,
  // as close to the lens as we can get while still being comfortable.
  const markerY = topInset + lineH * 1.5;
  // ~0.65 lines per second at 1× matches ~160 words/min in a narrow column.
  const pxPerSec = settings.speed * lineH * 0.65;

  const checkProgress = useCallback(
    (y: number) => {
      const readY = y + markerY;
      let idx = -1;
      sectionTops.current.forEach((top, i) => {
        if (readY >= top) idx = i;
      });
      if (idx !== lastSection.current) {
        if (lastSection.current !== -1 && idx > lastSection.current) onSectionReached?.(idx);
        lastSection.current = idx;
      }
      const maxY = Math.max(0, contentH.current - height);
      const remainingSecs = (maxY - y) / Math.max(pxPerSec, 1);
      if (!warnedEnd.current && maxY > 0 && remainingSecs < 5 && remainingSecs > 0) {
        warnedEnd.current = true;
        onEndingSoon?.();
      }
      return y >= maxY && maxY > 0;
    },
    [height, markerY, onEndingSoon, onSectionReached, pxPerSec],
  );

  // Auto-scroll loop.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      const dt = (now - last) / 1000;
      last = now;
      if (!dragging.current) {
        const maxY = Math.max(0, contentH.current - height);
        offset.current = Math.min(maxY, offset.current + pxPerSec * dt);
        scrollRef.current?.scrollTo({ y: offset.current, animated: false });
        if (checkProgress(offset.current)) {
          onFinished?.();
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, pxPerSec, height, checkProgress, onFinished]);

  // Restart from the top.
  useEffect(() => {
    offset.current = 0;
    lastSection.current = -1;
    warnedEnd.current = false;
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [restartKey]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (dragging.current || !playing) {
      offset.current = e.nativeEvent.contentOffset.y;
      checkProgress(offset.current);
    }
  };

  const onSectionLayout = (i: number) => (e: LayoutChangeEvent) => {
    sectionTops.current[i] = e.nativeEvent.layout.y;
  };

  const textStyle = {
    color: theme.fg,
    fontFamily: font.family,
    fontWeight: font.weight,
    fontSize: settings.fontSize,
    lineHeight: lineH,
    textAlign: settings.align,
  } as const;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg }]}>
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={32}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => (dragging.current = true)}
        onScrollEndDrag={(e) => {
          dragging.current = false;
          offset.current = e.nativeEvent.contentOffset.y;
        }}
        onMomentumScrollEnd={(e) => {
          offset.current = e.nativeEvent.contentOffset.y;
        }}
        onContentSizeChange={(_, h) => (contentH.current = h)}
        contentContainerStyle={{
          paddingTop: markerY,
          paddingBottom: height,
          paddingHorizontal: script.mode === 'reel' ? 28 : 18,
          transform: settings.mirror ? [{ scaleX: -1 }] : undefined,
        }}>
        <Pressable
          onPress={onTogglePlay}
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause script' : 'Play script'}
          accessibilityHint="Tap the script to pause or resume scrolling">
          {script.sections.map((sec, i) => (
            <View key={sec.id} onLayout={onSectionLayout(i)} style={{ marginBottom: lineH * 0.9 }}>
              {settings.showHeadlines ? (
                <Text
                  style={[
                    styles.headline,
                    { color: theme.guide, textAlign: settings.align, fontSize: Math.max(12, settings.fontSize * 0.45) },
                  ]}>
                  {(sec.headline || SectionGuide[sec.kind].label).toUpperCase()}
                </Text>
              ) : null}
              <Text style={textStyle}>{sec.body.trim() || '…'}</Text>
            </View>
          ))}
          <Text style={[textStyle, { opacity: 0.4, fontSize: settings.fontSize * 0.7 }]}>— End —</Text>
        </Pressable>
      </ScrollView>

      {/* Fade the lines you have already read. */}
      <View pointerEvents="none" style={[styles.fadeTop, { height: markerY - 4, backgroundColor: theme.bg }]} />

      {settings.guide ? (
        <View pointerEvents="none" style={[styles.guideWrap, { top: markerY + lineH / 2 - 9 }]}>
          <View style={[styles.guideTab, { backgroundColor: theme.guide }]} />
          <View style={[styles.guideLine, { backgroundColor: theme.guide }]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headline: { fontWeight: '800', letterSpacing: 1.4, marginBottom: 4 },
  fadeTop: { position: 'absolute', left: 0, right: 0, top: 0, opacity: 0.55 },
  guideWrap: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center' },
  guideTab: { width: 14, height: 18, borderTopRightRadius: 9, borderBottomRightRadius: 9 },
  guideLine: { flex: 1, height: 2, opacity: 0.35 },
});
