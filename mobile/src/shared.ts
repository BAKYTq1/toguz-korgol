/**
 * Code shared with the web app (../src). Game rules, AI, texts and the online protocol live
 * there once, so the phone and the site always play by the same rules and can play each other.
 */
export * from '../../src/game/engine';
export { getAIMove, type AIDifficulty } from '../../src/game/ai';
export { t, translations, type Lang, type TranslationKey } from '../../src/i18n/translations';
export {
  useMultiplayer,
  normalizeRoomCode,
  ROOM_CODE_LENGTH,
  type MPState,
  type MPStatus,
} from '../../src/hooks/useMultiplayer';
export { recordProfileGame } from '../../src/lib/profile';
