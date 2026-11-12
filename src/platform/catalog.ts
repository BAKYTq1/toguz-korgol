/** The games on the platform. Adding a game starts here. */
import type { Text } from './strings';

export type GameId = 'toguz-korgool' | 'mangala' | 'togyz-kumalak' | 'ordo' | 'shatra';

export interface CatalogGame {
  id: GameId;
  path: string | null;
  live: boolean;
  /** Can be picked for a tournament. */
  tournaments: boolean;
  name: Text;
  origin: Text;
  blurb: Text;
}

export const CATALOG: CatalogGame[] = [
  {
    id: 'toguz-korgool',
    path: '/toguz-korgool',
    live: true,
    tournaments: true,
    name: { ky: 'Тогуз коргоол', ru: 'Тогуз коргоол', en: 'Toguz Korgool' },
    origin: { ky: 'Кыргызстан', ru: 'Кыргызстан', en: 'Kyrgyzstan' },
    blurb: {
      ky: '9 чуңкур, 162 коргоол жана туздук. Компьютерге каршы, досуңуз менен же онлайн ойноңуз.',
      ru: '9 лунок, 162 камешка и туздук. Играйте с компьютером, с другом или онлайн.',
      en: '9 pits, 162 stones and the tuzduk. Play the computer, a friend, or online.',
    },
  },
  {
    id: 'mangala',
    path: '/mangala',
    live: true,
    tournaments: true,
    name: { ky: 'Мангала', ru: 'Мангала', en: 'Mangala' },
    origin: { ky: 'Түрк элдери', ru: 'Тюркские народы', en: 'Turkic peoples' },
    blurb: {
      ky: 'Тогуз коргоолдун тууганы: 6 чуңкур, 48 таш. Казаныңызга түшсөңүз — дагы бир жүрөсүз.',
      ru: 'Родственница тогуз коргоола: 6 лунок, 48 камней. Попали в свой казан — ходите ещё раз.',
      en: 'A cousin of Toguz Korgool: 6 pits, 48 stones. Land in your store and you move again.',
    },
  },
  {
    id: 'togyz-kumalak',
    path: null,
    live: false,
    tournaments: false,
    name: { ky: 'Тогыз кумалак', ru: 'Тогыз кумалак', en: 'Togyz Kumalak' },
    origin: { ky: 'Казакстан', ru: 'Казахстан', en: 'Kazakhstan' },
    blurb: {
      ky: 'Ошол эле оюндун казак салты — казак тилиндеги интерфейс жана турнирлер менен.',
      ru: 'Казахская традиция той же игры — с интерфейсом и турнирами на казахском языке.',
      en: 'The Kazakh tradition of the same game, with a Kazakh-language interface and tournaments.',
    },
  },
  {
    id: 'ordo',
    path: '/ordo',
    live: true,
    tournaments: false,
    name: { ky: 'Ордо', ru: 'Ордо', en: 'Ordo' },
    origin: { ky: 'Кыргызстан', ru: 'Кыргызстан', en: 'Kyrgyzstan' },
    blurb: {
      ky: 'Хандын кароолун бузуп, чүкөлөрдү тегеректен сака менен уруп чыгарыңыз. Компьютерге каршы же экөөлөп.',
      ru: 'Разбейте стражу хана: выбивайте чүкө из круга тяжёлой сакой. С компьютером или вдвоём.',
      en: "Break the khan's guard: knock the chükö out of the circle with the heavy saka. Against the computer or a friend.",
    },
  },
  {
    id: 'shatra',
    path: null,
    live: false,
    tournaments: false,
    name: { ky: 'Шатра', ru: 'Шатра', en: 'Shatra' },
    origin: { ky: 'Алтай', ru: 'Алтай', en: 'Altai' },
    blurb: {
      ky: 'Түрк жана монгол элдеринин байыркы шахмат оюну.',
      ru: 'Старинные шахматы тюркских и монгольских народов.',
      en: 'The old chess game of Turkic and Mongolic peoples.',
    },
  },
];

export const gameById = (id: string) => CATALOG.find(game => game.id === id);
export const TOURNAMENT_GAMES = CATALOG.filter(game => game.tournaments);
