import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { colors, fonts } from '../theme';

interface SheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
}

/** Bottom sheet used for every window (settings, rules, online, game over). */
export default function Sheet({ visible, title, onClose, closeLabel, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={closeLabel} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 4, maxHeight: '88%' }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">{title}</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={closeLabel} style={styles.close}>
              <Icon name="close" color={colors.creamDim} size={22} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const sheetStyles = StyleSheet.create({
  label: {
    marginTop: 16,
    marginBottom: 8,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  text: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.cream },
  muted: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.creamDim },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(242,230,204,0.2)',
  },
  pillActive: { backgroundColor: colors.teal, borderColor: colors.tealLight },
  pillText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.cream },
  pillTextActive: { color: '#06201e', fontFamily: fonts.bold },
  primary: { minHeight: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.teal, paddingHorizontal: 18 },
  primaryText: { fontFamily: fonts.bold, fontSize: 15, color: '#06201e' },
  secondary: {
    minHeight: 50,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(242,230,204,0.3)',
    paddingHorizontal: 18,
  },
  secondaryText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.cream },
  danger: { borderColor: 'rgba(181,41,47,0.5)' },
  dangerText: { color: colors.redSoft },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },
});

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(6,5,4,0.6)' },
  sheet: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    borderColor: 'rgba(87,194,184,0.5)',
    paddingHorizontal: 18,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(242,230,204,0.25)', marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.tealLight },
  close: { padding: 6 },
  content: { paddingBottom: 8 },
});
