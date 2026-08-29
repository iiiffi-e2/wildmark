import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/src/design-system/components/Button';
import { Screen } from '@/src/design-system/components/Screen';
import { Text } from '@/src/design-system/components/Text';
import { useTheme } from '@/src/design-system/theme';
import { useWildmark } from '@/src/app-state/WildmarkProvider';
import { isDevToolsEnabled } from '@/src/config/flags';
import { identificationSafetyDisclaimer } from '@/src/domain/safety/copy';

export function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, updateUser, persistenceKind, offline } = useWildmark();

  return (
    <Screen>
      <Text variant="kicker" color="secondary">
        Settings
      </Text>
      <Text variant="display" style={{ marginTop: theme.space[8] }}>
        Field instrument
      </Text>
      <Text variant="body" color="secondary" style={{ marginTop: theme.space[16] }}>
        Exploration works before an account. Local notes stay on this device until you choose to keep them safe.
      </Text>
      <View style={{ marginTop: theme.space[32], gap: theme.space[16] }}>
        <Button
          variant="secondary"
          label={user.experienceMode === 'explorer' ? 'Experience: Explorer' : 'Experience: Standard'}
          onPress={() =>
            void updateUser({
              experienceMode: user.experienceMode === 'explorer' ? 'standard' : 'explorer',
            })
          }
        />
        <Button
          variant="secondary"
          label={`Location: ${user.locationMode}`}
          onPress={() => {
            const next = user.locationMode === 'none' ? 'approximate' : user.locationMode === 'approximate' ? 'precise' : 'none';
            void updateUser({ locationMode: next });
          }}
        />
        <Button
          variant="secondary"
          label={`Appearance: ${user.appearance}`}
          onPress={() => {
            const next = user.appearance === 'system' ? 'light' : user.appearance === 'light' ? 'dark' : 'system';
            void updateUser({ appearance: next });
          }}
        />
      </View>
      <Text variant="title" style={{ marginTop: theme.space[40] }}>
        Keep your Wildmarks safe
      </Text>
      <Text variant="body" color="secondary" style={{ marginTop: theme.space[12] }}>
        Create an account later to back up your collection. Anonymous local data will merge into that account. Nothing leaves this device yet.
      </Text>
      <Text variant="bodySmall" color="tertiary" style={{ marginTop: theme.space[24] }}>
        {identificationSafetyDisclaimer()}
      </Text>
      <Text variant="bodySmall" color="tertiary" style={{ marginTop: theme.space[8] }}>
        Journal storage: {persistenceKind}
        {offline ? ' · offline' : ''}
      </Text>
      {isDevToolsEnabled ? (
        <View style={{ marginTop: theme.space[32] }}>
          <Button variant="ghost" label="Development panel" onPress={() => router.push('/debug')} />
        </View>
      ) : null}
    </Screen>
  );
}
