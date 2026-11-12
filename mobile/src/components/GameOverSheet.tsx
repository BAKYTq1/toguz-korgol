import { Pressable, StyleSheet, Text, View } from 'react-native';
import Sheet, { sheetStyles } from './Sheet';
import { t, type Lang } from '../shared';
import { colors, fonts } from '../theme';

interface GameOverSheetProps {
  visible: boolean;
  lang: Lang;
  winner: 0 | 1 | 'draw' | null;
  kazan: [number, number];
  names: [string, string];
  /** The viewer's seat in AI/online games, null for two players on one phone. */
  me: 0 | 1 | null;
  onRestart: () => void;
  onClose: () => void;
}

export default function GameOverSheet({ visible, lang, winner, kazan, names, me, onRestart, onClose }: GameOverSheetProps) {
  if (winner === null) return null;
  const mood = winner === 'draw' ? 'draw' : me === null || winner === me ? 'win' : 'lose';
  const title = winner === 'draw'
    ? t(lang, 'draw')
    : me !== null
      ? t(lang, mood === 'win' ? 'youWin' : 'youLose')
      : t(lang, winner === 0 ? 'player1wins' : 'player2wins');
  const order: (0 | 1)[] = winner === 1 ? [1, 0] : [0, 1];

  return (
    <Sheet visible={visible} title={t(lang, 'gameOver')} onClose={onClose} closeLabel={t(lang, 'rulesClose')}>
      <Text style={[styles.emblem, mood === 'win' && styles.win, mood === 'lose' && styles.lose]}>
        {mood === 'win' ? '✦' : mood === 'draw' ? '◈' : '◇'}
      </Text>
      <Text style={[styles.title, mood === 'win' && styles.win]} accessibilityRole="header">{title}</Text>
      <View style={styles.scores}>
        {order.map(player => (
          <View key={player} style={[styles.row, winner === player && styles.winnerRow]}>
            <Text style={styles.name} numberOfLines={1}>{names[player]}</Text>
            <Text style={styles.value}>{kazan[player]}</Text>
          </View>
        ))}
      </View>
      <Pressable style={({ pressed }) => [sheetStyles.primary, styles.button, pressed && sheetStyles.pressed]} onPress={onRestart} accessibilityRole="button">
        <Text style={sheetStyles.primaryText}>{t(lang, 'restart')}</Text>
      </Pressable>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  emblem: { textAlign: 'center', fontSize: 38, color: colors.tealLight, marginTop: 8 },
  title: { textAlign: 'center', fontFamily: fonts.display, fontSize: 34, color: colors.cream, marginTop: 4 },
  win: { color: colors.goldBright },
  lose: { color: colors.creamFaint },
  scores: { gap: 6, marginTop: 18 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.25)' },
  winnerRow: { backgroundColor: 'rgba(212,175,55,0.14)' },
  name: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.cream },
  value: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.cream, fontVariant: ['tabular-nums'] },
  button: { marginTop: 20 },
});
