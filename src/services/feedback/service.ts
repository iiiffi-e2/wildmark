import { Platform } from 'react-native';
import type { FeedbackLevel } from '@/src/domain/progression/types';

export async function playFeedback(level: FeedbackLevel, soundEnabled: boolean): Promise<void> {
  try {
    const Haptics = await import('expo-haptics');
    if (level === 1) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (level === 2) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (level === 3) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (level === 4) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  } catch {
    // Haptics are optional on web and simulators.
  }

  if (!soundEnabled || Platform.OS !== 'web' || typeof window === 'undefined') {
    return;
  }

  try {
    const AudioContextCtor = (
      window as unknown as { AudioContext?: { new (): AudioContext }; webkitAudioContext?: { new (): AudioContext } }
    ).AudioContext;
    if (!AudioContextCtor) {
      return;
    }
    const context = new AudioContextCtor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = level >= 4 ? 392 : 262;
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + (level >= 5 ? 0.18 : 0.08));
  } catch {
    // Sound remains optional.
  }
}

export function feedbackLevelFor(input: {
  isNewWildmark: boolean;
  collectionCompleted: boolean;
  milestoneUnlocked: boolean;
  questAdvanced: boolean;
}): FeedbackLevel {
  if (input.collectionCompleted) return 5;
  if (input.milestoneUnlocked) return 4;
  if (input.isNewWildmark) return 3;
  if (input.questAdvanced) return 2;
  return 1;
}
