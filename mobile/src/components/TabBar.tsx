import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon, { type IconName } from './Icon';
import { colors, fonts } from '../theme';

export interface TabItem {
  key: string;
  icon: IconName;
  label: string;
  onPress: () => void;
  highlighted?: boolean;
}

export default function TabBar({ items }: { items: TabItem[] }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {items.map(item => {
        const color = item.highlighted ? colors.gold : 'rgba(242,230,204,0.75)';
        return (
          <Pressable
            key={item.key}
            onPress={item.onPress}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <Icon name={item.icon} color={color} />
            <Text style={[styles.label, { color }]} numberOfLines={1}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 6,
    paddingHorizontal: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(212,175,55,0.25)',
    backgroundColor: '#100c0b',
  },
  tab: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 12 },
  pressed: { backgroundColor: 'rgba(87,194,184,0.12)' },
  label: { fontFamily: fonts.semibold, fontSize: 11 },
});
