import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Board from '../components/Board';
import ScoreCard from '../components/ScoreCard';
import { ConfirmBar, TurnStatus } from '../components/StatusBar';
import TabBar from '../components/TabBar';
import SettingsSheet from '../components/SettingsSheet';
import RulesSheet from '../components/RulesSheet';
import OnlineSheet from '../components/OnlineSheet';
import GameOverSheet from '../components/GameOverSheet';
import { useGameController } from '../game/useGameController';
import { useSettings, type Settings } from '../state/useSettings';
import { loadedFirebase } from '../lib/firebase';
import { legalMoves, recordProfileGame, t, useMultiplayer, type GameState, type Player } from '../shared';
import { colors, fonts } from '../theme';

const AI_PLAYER: Player = 1;

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const { settings, setSettings, stats, recordResult, resetStats } = useSettings();
  const { lang } = settings;
  const isAI = settings.gameMode === 'ai';
  const isOnline = settings.gameMode === 'online';

  const [sheet, setSheet] = useState<'settings' | 'rules' | 'online' | null>(null);
  const [gameOverDismissed, setGameOverDismissed] = useState(false);

  // Opponent events arrive through the online hook, which is created before the game controller.
  const controllerRef = useRef<ReturnType<typeof useGameController> | null>(null);
  const multiplayer = useMultiplayer({
    onMove: idx => controllerRef.current?.playRemoteMove(idx),
    onRestart: () => {
      controllerRef.current?.restart();
      setGameOverDismissed(false);
    },
    onPeerLeft: () => undefined,
  }, lang);
  const mp = multiplayer.mp;
  const onlinePlaying = isOnline && mp.status === 'playing';
  const myOnlineSeat = mp.myPlayer;

  const canHumanMove = useCallback((state: GameState) => {
    if (state.gameOver) return false;
    if (isAI && state.current === AI_PLAYER) return false;
    if (isOnline) return onlinePlaying && myOnlineSeat === state.current;
    return true;
  }, [isAI, isOnline, onlinePlaying, myOnlineSeat]);

  const { sendMove } = multiplayer;
  const controller = useGameController({
    aiPlayer: isAI ? AI_PLAYER : null,
    aiDifficulty: settings.aiDifficulty,
    canHumanMove,
    confirmMoves: settings.confirmMoves,
    haptics: settings.haptics,
    onLocalMove: idx => {
      if (onlinePlaying) void sendMove(idx);
    },
  });
  const { game, restart } = controller;
  useLayoutEffect(() => {
    controllerRef.current = controller;
  });

  const me: Player | null = isAI ? (AI_PLAYER === 0 ? 1 : 0) : isOnline ? mp.myPlayer : null;
  const flipped = (me ?? 1) === 0;

  const playerName = (player: Player) => {
    if (isAI) return t(lang, player === AI_PLAYER ? 'aiName' : 'you');
    if (isOnline && mp.myPlayer !== null) {
      const role = t(lang, mp.myPlayer === player ? 'you' : 'opponent');
      const alias = mp.playerNames[player];
      return alias ? `${role} · ${alias}` : role;
    }
    return t(lang, player === 0 ? 'player1' : 'player2');
  };
  const names: [string, string] = [playerName(0), playerName(1)];

  // Results: device statistics, plus the online profile when the player has one.
  const recordedRef = useRef(false);
  useEffect(() => {
    if (!game.gameOver) {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current || me === null || game.winner === null) return;
    recordedRef.current = true;
    const result = game.winner === 'draw' ? 'draws' : game.winner === me ? 'wins' : 'losses';
    recordResult(result);
    const uid = loadedFirebase()?.auth.currentUser?.uid;
    if (uid) void recordProfileGame(uid, result).catch(error => console.warn('Could not save profile result', error));
  }, [game.gameOver, game.winner, me, recordResult]);

  const newGame = useCallback(() => {
    restart();
    setGameOverDismissed(false);
    if (onlinePlaying) void multiplayer.sendRestart();
  }, [restart, onlinePlaying, multiplayer]);

  const changeSettings = useCallback((partial: Partial<Settings>) => {
    if (partial.gameMode && partial.gameMode !== settings.gameMode) {
      if (settings.gameMode === 'online') void multiplayer.disconnect();
      restart();
      setGameOverDismissed(false);
    }
    setSettings(partial);
  }, [settings.gameMode, multiplayer, restart, setSettings]);

  const startOnline = useCallback((connect: () => void) => {
    restart();
    setGameOverDismissed(false);
    setSettings({ gameMode: 'online' });
    connect();
  }, [restart, setSettings]);

  // Close the online window once the opponent has joined.
  useEffect(() => {
    if (mp.status !== 'playing') return;
    const timer = setTimeout(() => setSheet(current => (current === 'online' ? null : current)), 900);
    return () => clearTimeout(timer);
  }, [mp.status]);

  const humanTurn = !controller.animation && canHumanMove(game);
  const playable = humanTurn ? legalMoves(game, game.current) : [];

  const statusText = (() => {
    if (game.gameOver) return t(lang, 'gameOver');
    if (isOnline) {
      switch (mp.status) {
        case 'idle': return t(lang, 'onlineIdle');
        case 'connecting': return t(lang, 'onlineConnecting');
        case 'waiting': return t(lang, mp.isPrivate && mp.myPlayer === 0 ? 'waitingFriend' : 'waitingOpponent');
        case 'disconnected': return t(lang, 'opponentLeft');
        case 'error': return t(lang, 'connectError');
        default: return t(lang, game.current === mp.myPlayer ? 'yourTurn' : 'opponentTurn');
      }
    }
    if (isAI) return t(lang, game.current === AI_PLAYER ? 'aiThinking' : 'yourTurn');
    return `${t(lang, 'turnLabel')} ${names[game.current]}`;
  })();

  const tuzdukText = (player: Player) => {
    const pit = game.tuzduk[player];
    return pit === -1 ? '' : `${t(lang, 'tuzdukLabel')}${pit <= 8 ? pit + 1 : pit - 8}`;
  };
  const gainFor = (player: Player) => controller.gains.find(g => g.player === player);
  // Cards sit on the same side as each player's row on the board.
  const leftPlayer: Player = flipped ? 0 : 1;
  const rightPlayer: Player = flipped ? 1 : 0;
  const kazan = controller.animation ? controller.animation.kazan : game.kazan;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.tunduk} />
        <Text style={styles.title} accessibilityRole="header">{t(lang, 'title')}</Text>
        <View style={styles.tunduk} />
      </View>

      <View style={styles.cards}>
        {[leftPlayer, rightPlayer].map(player => (
          <ScoreCard
            key={player}
            player={player}
            name={names[player]}
            score={kazan[player]}
            tuzdukText={tuzdukText(player)}
            active={game.current === player && !game.gameOver}
            gain={gainFor(player)}
          />
        ))}
      </View>

      <View style={styles.boardArea}>
        <Board
          game={game}
          animation={controller.animation}
          selection={controller.selection}
          lastMove={controller.lastMove}
          invalidPit={controller.invalidPit}
          playable={playable}
          flipped={flipped}
          onTapPit={controller.tapPit}
        />
      </View>

      <View style={styles.status}>
        {controller.selection ? (
          <ConfirmBar
            selection={controller.selection}
            lang={lang}
            onConfirm={controller.confirmSelection}
            onCancel={controller.clearSelection}
          />
        ) : (
          <TurnStatus text={statusText} highlight={humanTurn && me !== null} />
        )}
      </View>

      <TabBar
        items={[
          { key: 'online', icon: 'online', label: t(lang, 'navOnline'), onPress: () => setSheet('online'), highlighted: onlinePlaying },
          { key: 'settings', icon: 'settings', label: t(lang, 'navSettings'), onPress: () => setSheet('settings') },
          { key: 'rules', icon: 'rules', label: t(lang, 'navRules'), onPress: () => setSheet('rules') },
          { key: 'restart', icon: 'restart', label: t(lang, 'navNew'), onPress: newGame },
        ]}
      />

      <SettingsSheet
        visible={sheet === 'settings'}
        settings={settings}
        stats={stats}
        onChange={changeSettings}
        onResetStats={resetStats}
        onClose={() => setSheet(null)}
      />
      <RulesSheet visible={sheet === 'rules'} lang={lang} onClose={() => setSheet(null)} />
      <OnlineSheet
        visible={sheet === 'online'}
        lang={lang}
        mp={mp}
        onQuickMatch={() => startOnline(() => void multiplayer.findMatch())}
        onCreateRoom={() => startOnline(() => void multiplayer.createRoom())}
        onJoinRoom={code => startOnline(() => void multiplayer.joinRoom(code))}
        onDisconnect={() => void multiplayer.disconnect()}
        onClose={() => setSheet(null)}
      />
      <GameOverSheet
        visible={game.gameOver && !gameOverDismissed && sheet === null}
        lang={lang}
        winner={game.winner}
        kazan={game.kazan}
        names={names}
        me={me}
        onRestart={newGame}
        onClose={() => setGameOverDismissed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 6, paddingBottom: 8 },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.cream, letterSpacing: 1 },
  tunduk: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.gold, opacity: 0.9 },
  cards: { flexDirection: 'row', gap: 8, paddingHorizontal: 10 },
  boardArea: { flex: 1, paddingHorizontal: 6, paddingVertical: 8 },
  // Fixed height: the confirm bar replaces the turn status without resizing the board.
  status: { height: 70, justifyContent: 'center', paddingHorizontal: 12, paddingBottom: 6 },
});
