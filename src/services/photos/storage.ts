import { Platform } from 'react-native';
import { createId } from '@/src/lib/ids';
import type { CapturedImage } from '@/src/domain/discovery/types';

export type StoredPhotoVariants = CapturedImage;

export function variantsFromUri(
  localUri: string,
  size: { width: number; height: number },
  capturedAt: string,
): StoredPhotoVariants {
  return {
    localUri,
    displayUri: localUri,
    thumbnailUri: localUri,
    width: size.width,
    height: size.height,
    capturedAt,
  };
}

export async function persistCapturedPhoto(input: {
  localUri: string;
  width?: number;
  height?: number;
  capturedAt?: string;
}): Promise<StoredPhotoVariants> {
  const capturedAt = input.capturedAt ?? new Date().toISOString();
  const width = input.width ?? 1200;
  const height = input.height ?? 1600;

  if (input.localUri.startsWith('fixture://') || Platform.OS === 'web') {
    return variantsFromUri(input.localUri, { width, height }, capturedAt);
  }

  try {
    const FileSystem = await import('expo-file-system/legacy');
    const Manipulator = await import('expo-image-manipulator');
    const directory = `${FileSystem.documentDirectory ?? ''}wildmark/photos/${createId()}`;
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    const original = `${directory}/original.jpg`;
    await FileSystem.copyAsync({ from: input.localUri, to: original });
    const display = await Manipulator.manipulateAsync(original, [{ resize: { width: Math.min(width, 1600) } }], {
      compress: 0.86,
    });
    const thumbnail = await Manipulator.manipulateAsync(original, [{ resize: { width: 320 } }], {
      compress: 0.7,
    });
    return {
      localUri: original,
      displayUri: display.uri,
      thumbnailUri: thumbnail.uri,
      width: display.width || width,
      height: display.height || height,
      capturedAt,
    };
  } catch {
    return variantsFromUri(input.localUri, { width, height }, capturedAt);
  }
}
