import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button } from '@/src/design-system/components/Button';
import { Text } from '@/src/design-system/components/Text';
import { WildmarkTarget } from '@/src/design-system/icons/WildmarkTarget';
import { useTheme } from '@/src/design-system/theme';
import { useWildmark } from '@/src/app-state/WildmarkProvider';
import { analytics } from '@/src/services/analytics/service';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ScanScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { selectedFixture } = useWildmark();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const camera = useRef<CameraView | null>(null);

  const openIdentifying = (uri: string) => {
    analytics.track('scan_opened');
    router.push({
      pathname: '/identify',
      params: { uri, fixture: selectedFixture },
    });
  };

  const takeSample = () => {
    openIdentifying(`fixture://${selectedFixture}`);
  };

  const importPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    const asset = result.assets?.[0];
    if (!asset) return;
    openIdentifying(asset.uri);
  };

  const capture = async () => {
    const instance = camera.current;
    if (!instance) {
      takeSample();
      return;
    }
    const photo = await instance.takePictureAsync({ quality: 0.9 });
    if (photo?.uri) {
      openIdentifying(photo.uri);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.background.inverse }}>
      {permission?.granted ? (
        <CameraView
          ref={(value) => {
            camera.current = value;
          }}
          style={{ position: 'absolute', inset: 0 }}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
        />
      ) : (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: theme.color.background.inverse }} />
      )}
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ paddingHorizontal: theme.space[24], paddingTop: theme.space[16] }}>
          <Text variant="kicker" color="inverse">
            Look closely
          </Text>
          <Text variant="title" color="inverse" style={{ marginTop: theme.space[8] }}>
            Hold still. Let the subject fill the mark.
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <WildmarkTarget state={cameraReady ? 'subjectDetected' : 'idle'} />
        </View>
        <View style={{ paddingHorizontal: theme.space[24], gap: theme.space[12], paddingBottom: theme.space[24] }}>
          {!permission?.granted ? (
            <Button label="Allow camera" onPress={() => void requestPermission()} />
          ) : (
            <Button label="Look" onPress={() => void capture()} />
          )}
          <Pressable onPress={() => void importPhoto()} accessibilityRole="button" accessibilityLabel="Import a photograph">
            <Text variant="kicker" color="inverse" style={{ textAlign: 'center', paddingVertical: theme.space[12] }}>
              Import a photograph
            </Text>
          </Pressable>
          <Pressable onPress={takeSample} accessibilityRole="button" accessibilityLabel="Use a field sample">
            <Text variant="bodySmall" color="inverse" style={{ textAlign: 'center', opacity: 0.72 }}>
              Use a field sample
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
