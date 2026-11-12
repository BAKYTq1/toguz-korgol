import { Pressable, StyleSheet, Text, View } from 'react-native';
import Sheet, { sheetStyles } from './Sheet';
import { t, type AIDifficulty, type Lang, type TranslationKey } from '../shared';
import type { GameMode, Settings, Stats } from '../state/useSettings';
import { colors, fonts } from '../theme';

interface SettingsSheetProps {
  visible: boolean;
  settings: Settings;
  stats: Stats;
  onChange: (partial: Partial<Settings>) => void;
  onResetStats: () => void;
  onClose: () => void;
}

const LANGS: { code: Lang; label: string }[] = [
  { code: 'ky', label: 'Кыргызча' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
];
const MODES: { code: GameMode; key: TranslationKey }[] = [
  { code: 'ai', key: 'modeAI' },
  { code: 'local', key: 'modeLocal' },
  { code: 'online', key: 'modeOnline' },
];
const LEVELS: { code: AIDifficulty; key: TranslationKey }[] = [
  { code: 'easy', key: 'aiEasy' },
  { code: 'medium', key: 'aiMedium' },
  { code: 'hard', key: 'aiHard' },
];

function Pills<T extends string | boolean>({ options, value, onSelect }: {
  options: { value: T; label: string }[];
  value: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={sheetStyles.pills} accessibilityRole="radiogroup">
      {options.map(option => {
        const active = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onSelect(option.value)}
            style={({ pressed }) => [sheetStyles.pill, active && sheetStyles.pillActive, pressed && sheetStyles.pressed]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            <Text style={[sheetStyles.pillText, active && sheetStyles.pillTextActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsSheet({ visible, settings, stats, onChange, onResetStats, onClose }: SettingsSheetProps) {
  const { lang } = settings;
  const onOff = [
    { value: true, label: t(lang, 'settingOn') },
    { value: false, label: t(lang, 'settingOff') },
  ];
  return (
    <Sheet visible={visible} title={t(lang, 'settingsTitle')} onClose={onClose} closeLabel={t(lang, 'rulesClose')}>
      <Text style={sheetStyles.label}>{t(lang, 'langLabel')}</Text>
      <Pills options={LANGS.map(l => ({ value: l.code, label: l.label }))} value={lang} onSelect={code => onChange({ lang: code })} />

      <Text style={sheetStyles.label}>{t(lang, 'modeLabel')}</Text>
      <Pills options={MODES.map(m => ({ value: m.code, label: t(lang, m.key) }))} value={settings.gameMode} onSelect={code => onChange({ gameMode: code })} />

      {settings.gameMode === 'ai' && (
        <>
          <Text style={sheetStyles.label}>{t(lang, 'aiLabel')}</Text>
          <Pills options={LEVELS.map(l => ({ value: l.code, label: t(lang, l.key) }))} value={settings.aiDifficulty} onSelect={code => onChange({ aiDifficulty: code })} />
        </>
      )}

      <Text style={sheetStyles.label}>{t(lang, 'confirmMoveLabel')}</Text>
      <Pills options={onOff} value={settings.confirmMoves} onSelect={value => onChange({ confirmMoves: value })} />
      <Text style={[sheetStyles.muted, styles.note]}>{t(lang, 'confirmMoveHint')}</Text>

      <Text style={sheetStyles.label}>{t(lang, 'hapticsLabel')}</Text>
      <Pills options={onOff} value={settings.haptics} onSelect={value => onChange({ haptics: value })} />

      <Text style={sheetStyles.label}>{t(lang, 'statsTitle')}</Text>
      <View style={styles.stats}>
        {([['wins', 'statsWins'], ['losses', 'statsLosses'], ['draws', 'statsDraws']] as const).map(([key, label]) => (
          <View key={key} style={styles.stat}>
            <Text style={styles.statValue}>{stats[key]}</Text>
            <Text style={styles.statLabel}>{t(lang, label)}</Text>
          </View>
        ))}
      </View>
      <Pressable onPress={onResetStats} style={({ pressed }) => [sheetStyles.secondary, sheetStyles.danger, styles.reset, pressed && sheetStyles.pressed]} accessibilityRole="button">
        <Text style={[sheetStyles.secondaryText, sheetStyles.dangerText]}>{t(lang, 'statsReset')}</Text>
      </Pressable>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  note: { marginTop: 8 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.25)' },
  statValue: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.tealLight },
  statLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.creamDim, marginTop: 2 },
  reset: { marginTop: 12 },
});
