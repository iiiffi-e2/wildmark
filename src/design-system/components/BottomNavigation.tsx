import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { Text } from './Text';
import { WildmarkSymbol } from '../icons/WildmarkSymbol';

const LABELS: Record<string, string> = {
  index: 'Discover',
  collection: 'Collection',
  scan: 'Scan',
  explore: 'Explore',
  journal: 'Journal',
};

type TabRoute = { key: string; name: string };
type TabBarProps = {
  state: { index: number; routes: TabRoute[] };
  navigation: { navigate: (name: string) => void };
};

export function BottomNavigation({ state, navigation }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.color.background.primary,
        borderTopWidth: 1,
        borderTopColor: theme.color.border.subtle,
        paddingBottom: Math.max(insets.bottom, 10),
        paddingTop: 8,
        paddingHorizontal: 8,
      }}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = LABELS[route.name] ?? route.name;
        const isScan = route.name === 'scan';
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={() => navigation.navigate(route.name)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 52,
            }}>
            {isScan ? (
              <View
                style={{
                  width: 52,
                  height: 52,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.color.action.primary,
                  marginTop: -18,
                }}>
                <WildmarkSymbol size={22} color={theme.color.action.onPrimary} accent={theme.color.action.onPrimary} />
              </View>
            ) : (
              <Text variant="kicker" color={focused ? 'primary' : 'tertiary'}>
                {label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
