import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import type { HapticsLevel } from './store';

/**
 * Glance haptics map. Each moment maps to one feel; the "subtle" level moves
 * every impact one step lighter. Nothing fires on web.
 */
export type HapticMoment =
  | 'countdownTick'
  | 'recordStart'
  | 'takeSaved'
  | 'pauseResume'
  | 'snap'
  | 'step'
  | 'sectionReached'
  | 'endingSoon'
  | 'error';

const S = Haptics.ImpactFeedbackStyle;
const lighter: Record<string, Haptics.ImpactFeedbackStyle> = {
  [S.Heavy]: S.Medium,
  [S.Medium]: S.Light,
  [S.Rigid]: S.Light,
  [S.Light]: S.Soft,
  [S.Soft]: S.Soft,
};
const stronger: Record<string, Haptics.ImpactFeedbackStyle> = {
  [S.Soft]: S.Light,
  [S.Light]: S.Medium,
  [S.Medium]: S.Heavy,
  [S.Rigid]: S.Heavy,
  [S.Heavy]: S.Heavy,
};

function impact(style: Haptics.ImpactFeedbackStyle, level: HapticsLevel) {
  const s = level === 'subtle' ? lighter[style] : level === 'strong' ? stronger[style] : style;
  return Haptics.impactAsync(s);
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function feel(moment: HapticMoment, level: HapticsLevel) {
  if (level === 'off' || Platform.OS === 'web') return;
  try {
    switch (moment) {
      case 'countdownTick':
        return await impact(S.Light, level);
      case 'recordStart':
        return await impact(S.Heavy, level);
      case 'takeSaved':
        return await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case 'pauseResume':
        return await impact(S.Medium, level);
      case 'snap':
      case 'step':
        return await Haptics.selectionAsync();
      case 'sectionReached':
        await impact(S.Soft, level);
        await wait(90);
        return await impact(S.Soft, level);
      case 'endingSoon':
        return await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      case 'error':
        return await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  } catch {
    // Haptics are a nice-to-have; never let them break recording.
  }
}
