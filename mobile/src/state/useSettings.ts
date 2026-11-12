import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AIDifficulty, Lang } from '../shared';

export type GameMode = 'local' | 'ai' | 'online';

export interface Settings {
  lang: Lang;
  gameMode: GameMode;
  aiDifficulty: AIDifficulty;
  /** First tap selects a pit, a second tap (or the Move button) plays it. */
  confirmMoves: boolean;
  haptics: boolean;
}

export interface Stats {
  wins: number;
  losses: number;
  draws: number;
}

const SETTINGS_KEY = 'tk_settings';
const STATS_KEY = 'tk_stats';

const defaultSettings: Settings = {
  lang: 'ru',
  gameMode: 'ai',
  aiDifficulty: 'medium',
  confirmMoves: true,
  haptics: true,
};

const emptyStats: Stats = { wins: 0, losses: 0, draws: 0 };

/** Settings and local statistics, saved on the device. */
export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(defaultSettings);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [rawSettings, rawStats] = await Promise.all([
          AsyncStorage.getItem(SETTINGS_KEY),
          AsyncStorage.getItem(STATS_KEY),
        ]);
        if (rawSettings) setSettingsState({ ...defaultSettings, ...JSON.parse(rawSettings) });
        if (rawStats) setStats({ ...emptyStats, ...JSON.parse(rawStats) });
      } catch {
        // Corrupt or unavailable storage: start with defaults.
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const setSettings = useCallback((partial: Partial<Settings>) => {
    setSettingsState(previous => {
      const next = { ...previous, ...partial };
      void AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const recordResult = useCallback((result: keyof Stats) => {
    setStats(previous => {
      const next = { ...previous, [result]: previous[result] + 1 };
      void AsyncStorage.setItem(STATS_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const resetStats = useCallback(() => {
    setStats(emptyStats);
    void AsyncStorage.setItem(STATS_KEY, JSON.stringify(emptyStats)).catch(() => undefined);
  }, []);

  return { settings, setSettings, stats, recordResult, resetStats, loaded };
}
