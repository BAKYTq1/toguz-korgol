import { lazy, Suspense, useState, useCallback, useEffect, useRef } from 'react';
import Board, { BoardHandle, MoveSelection } from './components/Board';
import Header from './components/Header';
import ScorePanel from './components/ScorePanel';
import TurnBanner from './components/TurnBanner';
import GameOverlay from './components/GameOverlay';
import RulesModal from './components/RulesModal';
import SettingsModal from './components/SettingsModal';
import OnlineModal from './components/OnlineModal';
import MoveConfirmBar from './components/MoveConfirmBar';
import Icon, { IconName } from './components/Icon';
import { useGameStore } from './hooks/useGameStore';
import { normalizeRoomCode, useMultiplayer } from './hooks/useMultiplayer';
import { t, TranslationKey } from './i18n/translations';
import { firebaseConfigured, loadFirebase, preloadFirebase } from './lib/firebase';
import { recordProfileGame } from './lib/profile';
import type { Player } from './game/engine';
import styles from './App.module.css';

const AI_PLAYER: Player = 1;

// The profile window (and the Firebase SDK it needs) is only downloaded when it is opened.
const AccountModal = lazy(() => import('./components/AccountModal'));

/** Room code from an invite link (?room=ABC23), read once on load. */
function readInviteCode() {
  try {
    const code = new URLSearchParams(window.location.search).get('room');
    return code ? normalizeRoomCode(code) : '';
  } catch {
    return '';
  }
}

export default function App() {
  const store = useGameStore();
  const { state, makeMove, restart, setSettings, setAnimating, resetStats, recordWin, recordLoss, recordDraw } = store;
  const { game, settings, stats } = state;

  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOnline, setShowOnline] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [statsRecorded, setStatsRecorded] = useState(false);
  const [selection, setSelection] = useState<MoveSelection | null>(null);
  const [inviteCode] = useState(readInviteCode);
  const boardRef = useRef<BoardHandle>(null);

  // Multiplayer — opponent moves go through the board so they are animated and queued.
  const mpCallbacks = {
    onMove: useCallback((idx: number) => {
      boardRef.current?.playRemoteMove(idx);
    }, []),
    onRestart: useCallback(() => {
      boardRef.current?.clearQueue();
      restart();
      setStatsRecorded(false);
    }, [restart]),
    onPeerLeft: useCallback(() => {
      // handled by status message
    }, []),
  };
  const mp = useMultiplayer(mpCallbacks, settings.lang);

  // Every way into an online game starts from a fresh board in online mode.
  const prepareOnlineGame = useCallback(() => {
    boardRef.current?.clearQueue();
    restart();
    setStatsRecorded(false);
    setSettings({ gameMode: 'online' });
  }, [restart, setSettings]);

  const handleQuickMatch = useCallback(() => {
    prepareOnlineGame();
    void mp.findMatch();
  }, [prepareOnlineGame, mp.findMatch]);

  const handleCreateRoom = useCallback(() => {
    prepareOnlineGame();
    void mp.createRoom();
  }, [prepareOnlineGame, mp.createRoom]);

  const handleJoinRoom = useCallback((code: string) => {
    prepareOnlineGame();
    void mp.joinRoom(code);
  }, [prepareOnlineGame, mp.joinRoom]);

  // An invite link opens the online window and joins the friend's room right away.
  const inviteHandledRef = useRef(false);
  useEffect(() => {
    if (!inviteCode || inviteHandledRef.current) return;
    inviteHandledRef.current = true;
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch {
      // Keeping the parameter in the address bar is harmless.
    }
    setShowOnline(true);
    handleJoinRoom(inviteCode);
  }, [inviteCode, handleJoinRoom]);

  // Close the online window once the opponent is there.
  const onlineStatus = mp.mp.status;
  useEffect(() => {
    if (onlineStatus !== 'playing') return;
    const timer = setTimeout(() => setShowOnline(false), 900);
    return () => clearTimeout(timer);
  }, [onlineStatus]);

  const lang = settings.lang;
  const isAI = settings.gameMode === 'ai';
  const isOnline = settings.gameMode === 'online';
  const onlinePlaying = isOnline && mp.mp.status === 'playing';

  // The human player's seat (null in local two-player mode).
  const me: Player | null = isAI ? (AI_PLAYER === 0 ? 1 : 0) : isOnline ? mp.mp.myPlayer : null;
  // The player whose row is drawn nearest to the viewer.
  const perspective: Player = me ?? 1;

  const getPlayerName = (player: Player): string | undefined => {
    if (isAI) return t(lang, player === AI_PLAYER ? 'aiName' : 'you');
    if (!isOnline) return undefined;
    const alias = mp.mp.playerNames[player];
    if (mp.mp.myPlayer === null) return alias ?? t(lang, player === 0 ? 'player1' : 'player2');
    const role = t(lang, mp.mp.myPlayer === player ? 'you' : 'opponent');
    return alias ? `${role} · ${alias}` : role;
  };
  const names: [string, string] = [
    getPlayerName(0) ?? t(lang, 'player1'),
    getPlayerName(1) ?? t(lang, 'player2'),
  ];

  // Save results locally and to the signed-in Firebase profile.
  useEffect(() => {
    if (!game.gameOver || statsRecorded || (!isAI && !isOnline)) return;
    if (isOnline && mp.mp.myPlayer === null) return;

    let result: 'wins' | 'losses' | 'draws';
    if (game.winner === 'draw') result = 'draws';
    else if (game.winner === null) return;
    else result = game.winner === me ? 'wins' : 'losses';

    setStatsRecorded(true);
    if (result === 'wins') recordWin();
    else if (result === 'losses') recordLoss();
    else recordDraw();
    // Only players who already have a Firebase session (guest or registered) get profile stats.
    if (firebaseConfigured) {
      void loadFirebase()
        .then(async ({ auth }) => {
          await auth.authStateReady();
          if (auth.currentUser) await recordProfileGame(auth.currentUser.uid, result);
        })
        .catch(error => console.error('Could not save profile result', error));
    }
  }, [game.gameOver, game.winner, isAI, isOnline, me, mp.mp.myPlayer, statsRecorded, recordWin, recordLoss, recordDraw]);

  const handleRestart = useCallback(() => {
    boardRef.current?.clearQueue();
    restart();
    setStatsRecorded(false);
    if (isOnline) mp.sendRestart();
  }, [restart, isOnline, mp]);

  const handleMove = useCallback((idx: number) => {
    return makeMove(idx);
  }, [makeMove]);

  const handleMoveForMP = useCallback((idx: number) => {
    if (onlinePlaying) mp.sendMove(idx);
  }, [onlinePlaying, mp]);

  const handlePlayOnline = useCallback(() => {
    // Start downloading Firebase while the player reads the options.
    preloadFirebase();
    setShowOnline(true);
  }, []);

  const handleAnimDone = useCallback(() => {
    setAnimating(false);
  }, [setAnimating]);

  const navItems: { key: string; icon: IconName; label: TranslationKey; title: TranslationKey; onClick: () => void; accent?: string; wide?: boolean }[] = [
    { key: 'online', icon: 'online', label: 'navOnline', title: 'playOnline', onClick: handlePlayOnline, accent: onlinePlaying ? styles.linked : undefined, wide: true },
    { key: 'account', icon: 'user', label: 'navProfile', title: 'accountTitle', onClick: () => { preloadFirebase(); setShowAccount(true); } },
    { key: 'settings', icon: 'settings', label: 'navSettings', title: 'settingsTitle', onClick: () => setShowSettings(true) },
    { key: 'rules', icon: 'rules', label: 'navRules', title: 'rulesTitle', onClick: () => setShowRules(true), accent: styles.gold },
    { key: 'restart', icon: 'restart', label: 'navNew', title: 'newGame', onClick: handleRestart, accent: styles.light, wide: true },
  ];

  return (
    <div className={styles.app}>
      {/* Background canvas stage */}
      <div className={styles.stage}>
        <Board
          ref={boardRef}
          game={game}
          onMove={handleMove}
          onAnimDone={handleAnimDone}
          soundEnabled={settings.sound}
          aiEnabled={isAI}
          aiDifficulty={settings.aiDifficulty}
          aiPlayer={AI_PLAYER}
          mpEnabled={onlinePlaying}
          mpMyPlayer={mp.mp.myPlayer}
          inputLocked={isOnline && !onlinePlaying}
          perspective={perspective}
          onMoveForMP={handleMoveForMP}
          confirmMoves={settings.confirmMoves}
          onSelectionChange={setSelection}
        />
      </div>

      {/* UI layer */}
      <Header lang={lang} />

      {([0, 1] as const).map(player => (
        <ScorePanel
          key={player}
          player={player}
          score={game.kazan[player]}
          tuzdukPit={game.tuzduk[player]}
          isActive={game.current === player && !game.gameOver}
          lang={lang}
          name={getPlayerName(player)}
          side={(player === 0) === (perspective === 0) ? 'left' : 'right'}
          isMe={me === player}
        />
      ))}

      {/* Controls: top-right pills on desktop, bottom tab bar on phones */}
      <nav className={styles.controls} data-hud="bottom" aria-label={t(lang, 'title')}>
        {navItems.map(item => (
          <button
            key={item.key}
            className={`${styles.ctrl} ${item.wide ? styles.wide : ''} ${item.accent ?? ''}`}
            onClick={item.onClick}
            aria-label={t(lang, item.title)}
            title={t(lang, item.title)}
          >
            <Icon name={item.icon} />
            <span className={styles.ctrlLabel}>{t(lang, item.label)}</span>
          </button>
        ))}
      </nav>

      {selection ? (
        <MoveConfirmBar
          selection={selection}
          lang={lang}
          onConfirm={() => boardRef.current?.confirmSelection()}
          onCancel={() => boardRef.current?.clearSelection()}
        />
      ) : (
      <TurnBanner
        current={game.current}
        gameOver={game.gameOver}
        lang={lang}
        p1Name={names[0]}
        p2Name={names[1]}
        onlineStatus={isOnline ? mp.mp.status : null}
        myPlayer={me}
        aiPlayer={isAI ? AI_PLAYER : null}
      />
      )}

      <div className={styles.hint}>{t(lang, 'hint')}</div>

      {/* Modals */}
      <GameOverlay
        show={game.gameOver}
        winner={game.winner}
        kazan={game.kazan}
        names={names}
        me={me}
        lang={lang}
        onRestart={handleRestart}
      />

      <RulesModal
        show={showRules}
        lang={lang}
        onClose={() => setShowRules(false)}
      />

      <SettingsModal
        show={showSettings}
        lang={lang}
        settings={settings}
        stats={stats}
        onSettingsChange={setSettings}
        onResetStats={resetStats}
        onClose={() => setShowSettings(false)}
      />

      <OnlineModal
        show={showOnline}
        lang={lang}
        mp={mp.mp}
        initialCode={inviteCode}
        onQuickMatch={handleQuickMatch}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onClose={() => setShowOnline(false)}
        onDisconnect={mp.disconnect}
      />

      {showAccount && (
        <Suspense fallback={null}>
          <AccountModal
            show
            lang={lang}
            sessionBusy={mp.mp.status === 'connecting' || mp.mp.status === 'waiting' || mp.mp.status === 'playing'}
            localStats={stats}
            onClose={() => setShowAccount(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
