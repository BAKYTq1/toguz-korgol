/**
 * Central game state hook using useReducer.
 * Keeps all game state in one place for easy persistence and multiplayer sync.
 */

import { useReducer, useCallback } from 'react';
import { GameState, createInitialState, applyMove, legalMoves, MoveResult } from '../game/engine';
import { AIDifficulty } from '../game/ai';
import { Lang } from '../i18n/translations';

export type GameMode = 'local' | 'ai' | 'online';

export interface Settings {
  lang: Lang;
  sound: boolean;
  aiDifficulty: AIDifficulty;
  gameMode: GameMode;
}

export interface Stats {
  wins: number;
  losses: number;
  draws: number;
}

export interface AnimationStep {
  pitIdx: number;
  toKazan: number; // -1 = to pit, 0/1 = to kazan
}

export interface StoreState {
  game: GameState;
  settings: Settings;
  stats: Stats;
  lastResult: MoveResult | null;
  animating: boolean;
  highlightedPit: number; // -1 if none
  invalidFlashPit: number; // -1 if none
}

type Action =
  | { type: 'MOVE'; idx: number; result: MoveResult; nextGame: GameState }
  | { type: 'RESTART' }
  | { type: 'SET_SETTINGS'; settings: Partial<Settings> }
  | { type: 'SET_ANIMATING'; animating: boolean }
  | { type: 'SET_HIGHLIGHT'; pit: number }
  | { type: 'FLASH_INVALID'; pit: number }
  | { type: 'CLEAR_FLASH' }
  | { type: 'RESET_STATS' }
  | { type: 'RECORD_WIN' }
  | { type: 'RECORD_LOSS' }
  | { type: 'RECORD_DRAW' };

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem('tk_settings');
    if (raw) return { ...defaultSettings(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultSettings();
}

function loadStats(): Stats {
  try {
    const raw = localStorage.getItem('tk_stats');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { wins: 0, losses: 0, draws: 0 };
}

function defaultSettings(): Settings {
  return { lang: 'ru', sound: true, aiDifficulty: 'medium', gameMode: 'local' };
}

function saveSettings(s: Settings) {
  try { localStorage.setItem('tk_settings', JSON.stringify(s)); } catch { /* ignore */ }
}

function saveStats(s: Stats) {
  try { localStorage.setItem('tk_stats', JSON.stringify(s)); } catch { /* ignore */ }
}

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'MOVE':
      return {
        ...state,
        game: action.nextGame,
        lastResult: action.result,
        animating: true,
        highlightedPit: -1,
      };

    case 'RESTART':
      return {
        ...state,
        game: createInitialState(),
        lastResult: null,
        animating: false,
        highlightedPit: -1,
        invalidFlashPit: -1,
      };

    case 'SET_SETTINGS': {
      const next = { ...state.settings, ...action.settings };
      saveSettings(next);
      return { ...state, settings: next };
    }

    case 'SET_ANIMATING':
      return { ...state, animating: action.animating };

    case 'SET_HIGHLIGHT':
      return { ...state, highlightedPit: action.pit };

    case 'FLASH_INVALID':
      return { ...state, invalidFlashPit: action.pit };

    case 'CLEAR_FLASH':
      return { ...state, invalidFlashPit: -1 };

    case 'RESET_STATS': {
      const s: Stats = { wins: 0, losses: 0, draws: 0 };
      saveStats(s);
      return { ...state, stats: s };
    }

    case 'RECORD_WIN': {
      const s = { ...state.stats, wins: state.stats.wins + 1 };
      saveStats(s);
      return { ...state, stats: s };
    }
    case 'RECORD_LOSS': {
      const s = { ...state.stats, losses: state.stats.losses + 1 };
      saveStats(s);
      return { ...state, stats: s };
    }
    case 'RECORD_DRAW': {
      const s = { ...state.stats, draws: state.stats.draws + 1 };
      saveStats(s);
      return { ...state, stats: s };
    }

    default:
      return state;
  }
}

export function useGameStore() {
  const initialState: StoreState = {
    game: createInitialState(),
    settings: loadSettings(),
    stats: loadStats(),
    lastResult: null,
    animating: false,
    highlightedPit: -1,
    invalidFlashPit: -1,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  const makeMove = useCallback((idx: number) => {
    if (state.animating || state.game.gameOver) return null;
    const player = state.game.current;
    if (idx < (player === 0 ? 0 : 9) || idx > (player === 0 ? 8 : 17)) return null;
    if (state.game.pits[idx] <= 1) return null; // need at least 2 stones (1 stays)

    const { nextState, result } = applyMove(state.game, idx);
    dispatch({ type: 'MOVE', idx, result, nextGame: nextState });
    return result;
  }, [state.animating, state.game]);

  const restart = useCallback(() => {
    dispatch({ type: 'RESTART' });
  }, []);

  const setSettings = useCallback((s: Partial<Settings>) => {
    dispatch({ type: 'SET_SETTINGS', settings: s });
  }, []);

  const setAnimating = useCallback((v: boolean) => {
    dispatch({ type: 'SET_ANIMATING', animating: v });
  }, []);

  const setHighlight = useCallback((pit: number) => {
    dispatch({ type: 'SET_HIGHLIGHT', pit });
  }, []);

  const flashInvalid = useCallback((pit: number) => {
    dispatch({ type: 'FLASH_INVALID', pit });
    setTimeout(() => dispatch({ type: 'CLEAR_FLASH' }), 300);
  }, []);

  const resetStats = useCallback(() => dispatch({ type: 'RESET_STATS' }), []);
  const recordWin = useCallback(() => dispatch({ type: 'RECORD_WIN' }), []);
  const recordLoss = useCallback(() => dispatch({ type: 'RECORD_LOSS' }), []);
  const recordDraw = useCallback(() => dispatch({ type: 'RECORD_DRAW' }), []);

  const getLegalMoves = useCallback(() => {
    return legalMoves(state.game, state.game.current);
  }, [state.game]);

  return {
    state,
    makeMove,
    restart,
    setSettings,
    setAnimating,
    setHighlight,
    flashInvalid,
    resetStats,
    recordWin,
    recordLoss,
    recordDraw,
    getLegalMoves,
  };
}
