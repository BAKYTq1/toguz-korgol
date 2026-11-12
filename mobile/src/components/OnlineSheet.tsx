import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Sheet, { sheetStyles } from './Sheet';
import { ROOM_CODE_LENGTH, normalizeRoomCode, t, type Lang, type MPState } from '../shared';
import { colors, fonts } from '../theme';

interface OnlineSheetProps {
  visible: boolean;
  lang: Lang;
  mp: MPState;
  onQuickMatch: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onDisconnect: () => void;
  onClose: () => void;
}

export default function OnlineSheet({ visible, lang, mp, onQuickMatch, onCreateRoom, onJoinRoom, onDisconnect, onClose }: OnlineSheetProps) {
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  const searching = mp.status === 'connecting' || mp.status === 'waiting';
  const hosting = mp.status === 'waiting' && mp.isPrivate && mp.myPlayer === 0 && mp.room;

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(true);
  };

  const share = async (roomCode: string) => {
    try {
      await Share.share({ message: `${t(lang, 'inviteText')} ${roomCode}` });
    } catch {
      await copy(roomCode);
    }
  };

  return (
    <Sheet visible={visible} title={t(lang, 'playOnline')} onClose={onClose} closeLabel={t(lang, 'onlineClose')}>
      {hosting ? (
        <>
          <Text style={[sheetStyles.muted, styles.gap]}>{t(lang, 'waitingFriend')}</Text>
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>{t(lang, 'roomCodeTitle')}</Text>
            <Text style={styles.code} selectable accessibilityLabel={mp.room!.split('').join(' ')}>{mp.room}</Text>
            <View style={styles.row}>
              <Pressable style={({ pressed }) => [sheetStyles.secondary, styles.flex, pressed && sheetStyles.pressed]} onPress={() => void copy(mp.room!)} accessibilityRole="button">
                <Text style={sheetStyles.secondaryText}>{copied ? t(lang, 'copied') : t(lang, 'copyCode')}</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [sheetStyles.primary, styles.flex, pressed && sheetStyles.pressed]} onPress={() => void share(mp.room!)} accessibilityRole="button">
                <Text style={sheetStyles.primaryText}>{t(lang, 'shareInvite')}</Text>
              </Pressable>
            </View>
          </View>
          <Waiting text={t(lang, 'waitingOpponent')} />
        </>
      ) : searching || mp.status === 'playing' ? (
        <Waiting text={mp.status === 'playing' ? t(lang, 'onlineConnected') : mp.message || t(lang, 'onlineConnecting')} done={mp.status === 'playing'} />
      ) : (
        <>
          <Text style={sheetStyles.label}>{t(lang, 'quickMatch')}</Text>
          <Text style={sheetStyles.muted}>{t(lang, 'quickMatchHint')}</Text>
          <Pressable style={({ pressed }) => [sheetStyles.primary, styles.gap, pressed && sheetStyles.pressed]} onPress={onQuickMatch} accessibilityRole="button">
            <Text style={sheetStyles.primaryText}>{t(lang, 'findOpponent')}</Text>
          </Pressable>

          <View style={styles.or}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>{t(lang, 'orLabel')}</Text>
            <View style={styles.orLine} />
          </View>

          <Text style={[sheetStyles.label, styles.noTop]}>{t(lang, 'friendRoom')}</Text>
          <Text style={sheetStyles.muted}>{t(lang, 'friendRoomHint')}</Text>
          <Pressable style={({ pressed }) => [sheetStyles.secondary, styles.gap, pressed && sheetStyles.pressed]} onPress={onCreateRoom} accessibilityRole="button">
            <Text style={sheetStyles.secondaryText}>{t(lang, 'createFriendRoom')}</Text>
          </Pressable>
          <View style={[styles.row, styles.gap]}>
            <TextInput
              value={code}
              onChangeText={value => setCode(normalizeRoomCode(value))}
              placeholder="ABC23"
              placeholderTextColor="rgba(242,230,204,0.2)"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={ROOM_CODE_LENGTH}
              style={styles.input}
              accessibilityLabel={t(lang, 'roomLabel')}
              returnKeyType="go"
              onSubmitEditing={() => code.length === ROOM_CODE_LENGTH && onJoinRoom(code)}
            />
            <Pressable
              disabled={code.length !== ROOM_CODE_LENGTH}
              style={({ pressed }) => [sheetStyles.primary, code.length !== ROOM_CODE_LENGTH && sheetStyles.disabled, pressed && sheetStyles.pressed]}
              onPress={() => onJoinRoom(code)}
              accessibilityRole="button"
            >
              <Text style={sheetStyles.primaryText}>{t(lang, 'joinByCode')}</Text>
            </Pressable>
          </View>
          {(mp.status === 'error' || mp.status === 'disconnected') && mp.message ? (
            <Text style={styles.error} accessibilityLiveRegion="assertive">{mp.message}</Text>
          ) : null}
        </>
      )}

      {(searching || mp.status === 'playing') && (
        <Pressable style={({ pressed }) => [sheetStyles.secondary, sheetStyles.danger, styles.bigGap, pressed && sheetStyles.pressed]} onPress={onDisconnect} accessibilityRole="button">
          <Text style={[sheetStyles.secondaryText, sheetStyles.dangerText]}>{t(lang, searching ? 'cancelSearch' : 'disconnect')}</Text>
        </Pressable>
      )}
    </Sheet>
  );
}

function Waiting({ text, done = false }: { text: string; done?: boolean }) {
  return (
    <View style={styles.waiting} accessibilityLiveRegion="polite">
      {!done && <ActivityIndicator color={colors.tealLight} />}
      <Text style={sheetStyles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { marginTop: 12 },
  bigGap: { marginTop: 20 },
  noTop: { marginTop: 0 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  or: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.15)' },
  orText: { fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.creamFaint },
  input: {
    flex: 1,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(0,0,0,0.35)',
    color: colors.cream,
    fontFamily: fonts.extrabold,
    fontSize: 20,
    letterSpacing: 5,
    textAlign: 'center',
  },
  codeCard: {
    marginTop: 14,
    padding: 16,
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'stretch',
  },
  codeLabel: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.creamDim, textAlign: 'center' },
  code: { fontFamily: fonts.extrabold, fontSize: 42, letterSpacing: 10, color: colors.goldBright, textAlign: 'center' },
  waiting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 18 },
  error: { marginTop: 14, fontFamily: fonts.medium, fontSize: 14, color: colors.redSoft },
});
