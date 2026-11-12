import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t, type Lang } from '../shared';
import type { MoveSelection } from '../game/useGameController';
import { colors, fonts } from '../theme';

/** Turn / connection status, replaced by the move confirmation bar while a pit is selected. */
export function TurnStatus({ text, highlight }: { text: string; highlight: boolean }) {
  return (
    <View style={[styles.pill, highlight && styles.pillMine]} accessibilityLiveRegion="polite">
      <Text style={[styles.text, highlight && styles.textMine]} numberOfLines={2}>{text}</Text>
    </View>
  );
}

interface ConfirmBarProps {
  selection: MoveSelection;
  lang: Lang;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmBar({ selection, lang, onConfirm, onCancel }: ConfirmBarProps) {
  const pitNumber = selection.idx <= 8 ? selection.idx + 1 : selection.idx - 8;
  return (
    <View style={styles.bar}>
      <View style={styles.info}>
        <Text style={styles.infoTitle}>{t(lang, 'pitNumber')}{pitNumber}</Text>
        {selection.gain > 0 ? (
          <Text style={styles.infoGain}>
            {t(lang, 'previewCapture')} +{selection.gain}{selection.tuzduk ? ` · ${t(lang, 'previewTuzduk')}` : ''}
          </Text>
        ) : (
          <Text style={styles.infoMuted} numberOfLines={1}>{t(lang, 'previewTapAgain')}</Text>
        )}
      </View>
      <Pressable style={({ pressed }) => [styles.cancel, pressed && styles.pressed]} onPress={onCancel} accessibilityRole="button">
        <Text style={styles.cancelText}>{t(lang, 'cancelMove')}</Text>
      </Pressable>
      <Pressable style={({ pressed }) => [styles.confirm, pressed && styles.pressed]} onPress={onConfirm} accessibilityRole="button">
        <Text style={styles.confirmText}>{t(lang, 'confirmMove')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 44,
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(87,194,184,0.35)',
    backgroundColor: 'rgba(20,16,14,0.9)',
  },
  pillMine: { borderColor: colors.tealLight },
  text: { fontFamily: fonts.medium, fontSize: 14, color: colors.cream, textAlign: 'center' },
  textMine: { fontFamily: fonts.bold, color: '#fff8e8' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    maxWidth: '100%',
    paddingVertical: 6,
    paddingLeft: 16,
    paddingRight: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.55)',
    backgroundColor: 'rgba(20,16,14,0.96)',
  },
  info: { flexShrink: 1, marginRight: 2 },
  infoTitle: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.cream },
  infoGain: { fontFamily: fonts.bold, fontSize: 12, color: colors.goldBright },
  infoMuted: { fontFamily: fonts.medium, fontSize: 11, color: colors.creamDim },
  cancel: {
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(242,230,204,0.25)',
  },
  cancelText: { fontFamily: fonts.bold, fontSize: 14, color: colors.cream },
  confirm: { minHeight: 44, paddingHorizontal: 22, justifyContent: 'center', borderRadius: 999, backgroundColor: '#d9b33a' },
  confirmText: { fontFamily: fonts.extrabold, fontSize: 14, color: '#1d1505' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
});
