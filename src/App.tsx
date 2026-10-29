import { useState, useCallback, useEffect } from 'react';
import Board from './components/Board';
import Header from './components/Header';
import ScorePanel from './components/ScorePanel';
import TurnBanner from './components/TurnBanner';
import GameOverlay from './components/GameOverlay';
import RulesModal from './components/RulesModal';
import SettingsModal from './components/SettingsModal';
import OnlineModal from './components/OnlineModal';
import { useGameStore } from './hooks/useGameStore';
import { useMultiplayer } from './hooks/useMultiplayer';
import { t } from './i18n/translations';
import styles from './App.module.css';

export default function App() {
  const store = useGameStore();
  const { state, makeMove, restart, setSettings, setAnimating, resetStats, recordWin, recordLoss, recordDraw } = store;
  const { game, settings, stats } = state;

  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOnline, setShowOnline] = useState(false);
  const [statsRecorded, setStatsRecorded] = useState(false);

  // Multiplayer
  const mpCallbacks = {
    onMove: useCallback((idx: number) => {
      makeMove(idx);
    }, [makeMove]),
    onRestart: useCallback(() => {
      restart();
    }, [restart]),
    onPeerLeft: useCallback(() => {
      // handled by status message
    }, []),
  };
  const mp = useMultiplayer(mpCallbacks, settings.lang);

  const findOnlineOpponent = useCallback(() => {
    restart();
    setStatsRecorded(false);
    setSettings({ gameMode: 'online' });
    void mp.findMatch();
  }, [mp.findMatch, restart, setSettings]);

  const lang = settings.lang;
  const isAI = settings.gameMode === 'ai';
  const isOnline = settings.gameMode === 'online';

  // Record stats on game end (AI mode only, from player 0 perspective)
  useEffect(() => {
    if (!game.gameOver || statsRecorded || !isAI) return;
    setStatsRecorded(true);
    if (game.winner === 0) recordWin();
    else if (game.winner === 1) recordLoss();
    else recordDraw();
  }, [game.gameOver, game.winner, isAI, statsRecorded, recordWin, recordLoss, recordDraw]);

  const handleRestart = useCallback(() => {
    restart();
    setStatsRecorded(false);
    if (isOnline) mp.sendRestart();
  }, [restart, isOnline, mp]);

  const handleMove = useCallback((idx: number) => {
    return makeMove(idx);
  }, [makeMove]);

  const handleMoveForMP = useCallback((idx: number) => {
    if (isOnline && mp.mp.status === 'playing') {
      mp.sendMove(idx);
    }
  }, [isOnline, mp]);

  const handlePlayOnline = useCallback(() => {
    setShowOnline(true);
    if (mp.mp.status === 'idle' || mp.mp.status === 'error' || mp.mp.status === 'disconnected') {
      findOnlineOpponent();
    }
  }, [findOnlineOpponent, mp.mp.status]);

  const handleAnimDone = useCallback(() => {
    setAnimating(false);
  }, [setAnimating]);

  return (
    <div className={styles.app}>
      {/* Background canvas stage */}
      <div className={styles.stage}>
        <Board
          game={game}
          onMove={handleMove}
          onAnimDone={handleAnimDone}
          soundEnabled={settings.sound}
          aiEnabled={isAI}
          aiDifficulty={settings.aiDifficulty}
          aiPlayer={1}
          mpEnabled={isOnline && mp.mp.status === 'playing'}
          mpMyPlayer={mp.mp.myPlayer}
          onMoveForMP={handleMoveForMP}
        />
      </div>

      {/* UI layer */}
      <Header lang={lang} />

      <ScorePanel
        player={0}
        score={game.kazan[0]}
        tuzdukPit={game.tuzduk[0]}
        isActive={game.current === 0 && !game.gameOver}
        lang={lang}
      />
      <ScorePanel
        player={1}
        score={game.kazan[1]}
        tuzdukPit={game.tuzduk[1]}
        isActive={game.current === 1 && !game.gameOver}
        lang={lang}
      />

      {/* Top controls */}
      <div className={styles.topControls}>
        <button
          className={`${styles.topBtn} ${styles.topBtnTeal} ${isOnline && mp.mp.status === 'playing' ? styles.linked : ''}`}
          onClick={handlePlayOnline}
          aria-label={t(lang, 'playOnline')}
        >
          {t(lang, 'playOnline')}
        </button>

        <button
          className={`${styles.topBtn} ${styles.topBtnTeal}`}
          onClick={() => setShowSettings(true)}
          aria-label={t(lang, 'settingsTitle')}
        >
          ⚙️
        </button>

        <button
          className={`${styles.topBtn} ${styles.topBtnGold}`}
          onClick={() => setShowRules(true)}
          aria-label={t(lang, 'rulesTitle')}
        >
          {t(lang, 'rulesBtn')}
        </button>

        <button
          className={`${styles.topBtn} ${styles.topBtnLight}`}
          onClick={handleRestart}
          aria-label={t(lang, 'newGame')}
        >
          {t(lang, 'newGame')}
        </button>
      </div>

      <TurnBanner
        current={game.current}
        gameOver={game.gameOver}
        lang={lang}
      />

      <div className={styles.hint}>{t(lang, 'hint')}</div>

      {/* Modals */}
      <GameOverlay
        show={game.gameOver}
        winner={game.winner}
        kazan={game.kazan}
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
        onClose={() => setShowOnline(false)}
        onDisconnect={mp.disconnect}
      />
    </div>
  );
}
