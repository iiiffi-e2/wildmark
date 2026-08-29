import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { WildmarkProvider, useWildmarkOptional } from '@/src/app-state/WildmarkProvider';
import { useTheme } from '@/src/design-system/theme';
import { Text } from '@/src/design-system/components/Text';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <WildmarkProvider>
      <RootLayoutNav />
    </WildmarkProvider>
  );
}

function RootLayoutNav() {
  const theme = useTheme();
  const wildmark = useWildmarkOptional();

  if (!wildmark) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.color.background.primary, justifyContent: 'center', padding: 24 }}>
        <Text variant="kicker" color="secondary">
          Wildmark
        </Text>
        <Text variant="title" style={{ marginTop: 12 }}>
          Opening the field journal
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.color.background.primary },
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="identify" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="identify-result" options={{ presentation: 'modal' }} />
        <Stack.Screen name="wildmark" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="settings" />
        <Stack.Screen name="recap" />
        <Stack.Screen name="debug" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}
