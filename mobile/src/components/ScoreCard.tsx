import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { WIN_THRESHOLD } from '../shared';
import { colors, fonts } from '../theme';

interface ScoreCardProps {
  player: 0 | 1;
  name: string;
  score: number;
  tuzdukText: string;
  active: boolean;
  /** Latest gain to flash as "+N" (key changes for every new gain). */
  gain?: { amount: number; key: number };
}

export default function ScoreCard({ player, name, score, tuzdukText, active, gain }: ScoreCardProps) {
  const dark = player === 0;
  const [pop] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!gain) return;
    pop.setValue(0);
    Animated.timing(pop, { toValue: 1, duration: 1300, useNativeDriver: true }).start();
  }, [gain, pop]);

  const progress = Math.min(1, score / WIN_THRESHOLD);

  return (
    <View
      style={[styles.card, dark ? styles.dark : styles.light, active && styles.active]}
      accessible
      accessibilityLabel={`${name}: ${score} / ${WIN_THRESHOLD}`}
    >
      <View style={styles.nameRow}>
        <View style={[styles.chip, active && styles.chipActive, { borderColor: dark ? colors.tealLight : '#2f6862' }]} />
        <Text numberOfLines={1} style={[styles.name, { color: dark ? colors.tealLight : '#2f6862' }]}>{name}</Text>
      </View>
      <Text style={[styles.score, { color: dark ? colors.cream : '#221c12' }]}>
        {score}
        <Text style={styles.scoreMax}>/{WIN_THRESHOLD}</Text>
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
      {tuzdukText ? <Text style={[styles.tuzduk, { color: dark ? colors.gold : '#8a6a12' }]}>{tuzdukText}</Text> : null}
      {gain && (
        <Animated.Text
          style={[
            styles.gain,
            {
              opacity: pop.interpolate({ inputRange: [0, 0.1, 0.6, 1], outputRange: [0, 1, 1, 0] }),
              transform: [{ translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [4, -6] }) }],
            },
          ]}
        >
          +{gain.amount}
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dark: { backgroundColor: '#1d1813' },
  light: { backgroundColor: '#e3dabd' },
  active: {
    borderColor: colors.tealLight,
    shadowColor: colors.tealLight,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  chip: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, opacity: 0.6 },
  chipActive: { backgroundColor: colors.tealLight, borderColor: colors.tealLight, opacity: 1 },
  name: { flex: 1, fontFamily: fonts.bold, fontSize: 12 },
  score: { fontFamily: fonts.extrabold, fontSize: 24, fontVariant: ['tabular-nums'] },
  scoreMax: { fontFamily: fonts.medium, fontSize: 12, opacity: 0.5 },
  track: { height: 3, borderRadius: 2, marginTop: 5, backgroundColor: 'rgba(128,128,128,0.25)', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.tealLight },
  tuzduk: { fontFamily: fonts.semibold, fontSize: 10.5, marginTop: 4 },
  gain: {
    position: 'absolute',
    right: 8,
    top: 8,
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 10,
    overflow: 'hidden',
    // Dark pill so the gold number reads on the light card too.
    backgroundColor: 'rgba(10,8,6,0.85)',
    fontFamily: fonts.extrabold,
    fontSize: 18,
    color: colors.goldBright,
  },
});
