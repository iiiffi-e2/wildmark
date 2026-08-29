import { type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

type Props = {
  children: ReactNode;
  padded?: boolean;
  scroll?: boolean;
};

export function Screen({ children, padded = true, scroll = true }: Props) {
  const theme = useTheme();
  const body = (
    <View style={{ flex: 1, paddingHorizontal: padded ? theme.space[24] : 0, paddingBottom: theme.space[32] }}>
      {children}
    </View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.background.primary }} edges={['top']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}>
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}
