export type Lang = 'ky' | 'ru' | 'en';

export type TranslationKey =
  | 'title'
  | 'subtitle'
  | 'player1'
  | 'player2'
  | 'newGame'
  | 'playOnline'
  | 'onlineConnecting'
  | 'onlineConnected'
  | 'yourTurn'
  | 'opponentTurn'
  | 'turnLabel'
  | 'hint'
  | 'tuzdukLabel'
  | 'gameOver'
  | 'player1wins'
  | 'player2wins'
  | 'draw'
  | 'restart'
  | 'rulesTitle'
  | 'rulesClose'
  | 'rulesBtn'
  | 'aiLabel'
  | 'aiEasy'
  | 'aiMedium'
  | 'aiHard'
  | 'aiNone'
  | 'modeLocal'
  | 'modeAI'
  | 'modeOnline'
  | 'settingsTitle'
  | 'soundLabel'
  | 'langLabel'
  | 'statsTitle'
  | 'statsWins'
  | 'statsLosses'
  | 'statsDraws'
  | 'statsReset'
  | 'onlineTitle'
  | 'onlineHint'
  | 'serverLabel'
  | 'roomLabel'
  | 'createRoom'
  | 'joinRoom'
  | 'findOpponent'
  | 'cancelSearch'
  | 'disconnect'
  | 'onlineClose'
  | 'waitingOpponent'
  | 'youAre'
  | 'opponentLeft'
  | 'connectionLost'
  | 'connectError'
  | 'rulesText';

type Translations = Record<TranslationKey, string>;

export const translations: Record<Lang, Translations> = {
  ky: {
    title: 'Тогуз Коргоол',
    subtitle: 'Кыргыз улуттук оюну',
    player1: 'Ойунчу 1',
    player2: 'Ойунчу 2',
    newGame: 'Жаңы оюн ↺',
    playOnline: '🌐 Онлайн ойноо',
    onlineConnecting: 'Серверге туташуу…',
    onlineConnected: 'Каршылаш туташты',
    yourTurn: 'Сиздин жүрүш',
    opponentTurn: 'Каршылаштын жүрүшү',
    turnLabel: 'Жүрөт:',
    hint: 'Чуңкурду кармап тартыңыз',
    tuzdukLabel: 'Туздук: чуңкур №',
    gameOver: 'Оюн бүттү',
    player1wins: 'Ойунчу 1 жеңди!',
    player2wins: 'Ойунчу 2 жеңди!',
    draw: 'Тең байге!',
    restart: 'Кайра баштоо',
    rulesTitle: 'Оюнун эрежелери',
    rulesClose: 'Жабуу',
    rulesBtn: '?',
    aiLabel: 'ИИ деңгээли',
    aiEasy: 'Оңой',
    aiMedium: 'Орто',
    aiHard: 'Кыйын',
    aiNone: 'Жок',
    modeLocal: 'Жергиликтүү',
    modeAI: 'ИИга каршы',
    modeOnline: 'Онлайн',
    settingsTitle: 'Жөндөөлөр',
    soundLabel: 'Үн',
    langLabel: 'Тил',
    statsTitle: 'Статистика',
    statsWins: 'Жеңүүлөр',
    statsLosses: 'Жоготуулар',
    statsDraws: 'Тең байге',
    statsReset: 'Тазалоо',
    onlineTitle: 'Онлайн оюн',
    onlineHint: 'Кокус каршылашты табыңыз же бөлмө түзүп, досуңузду код менен чакырыңыз.',
    serverLabel: 'Сервер дареги (wss://...)',
    roomLabel: 'Бөлмө коду',
    createRoom: 'Түзүү',
    joinRoom: 'Кирүү',
    findOpponent: 'Каршылашты издөө',
    cancelSearch: 'Издөөнү токтотуу',
    disconnect: 'Байланышты үзүү',
    onlineClose: 'Жабуу',
    waitingOpponent: 'Каршылаш күтүлүүдө...',
    youAre: 'Сиз — Ойунчу',
    opponentLeft: 'Каршылаш чыгып кетти.',
    connectionLost: 'Байланыш үзүлдү.',
    connectError: 'Туташуу мүмкүн эмес. Серверди текшериңиз.',
    rulesText: `**Максат:** 162 коргоолдун 82 же андан ашыгын чогулт.

**Жүрүш:** Өз катарыңдан бир чуңкурду тандап, анын бардык коргоолдорун саат жебесинен тескери тарта жайгаш.

**Жоюу:** Акыркы коргоол каршылаштын чуңкурун жуп санга жеткирсе — бардыгын казаныңа ал.

**Туздук:** Акыркы коргоол каршылаштын чуңкурунда 3 коргоол жасаса (1-жүрүштөн кийин) — ал чуңкур туздукка айланат. Туздукка түшкөн коргоол ошол чуңкурдун ээсинин казанына өтөт.

**Чектөөлөр:** Туздук акыркы чуңкур (№9) боло албайт. Каршылаштын туздугунун "күзгүсү" боло албайт.

**Оюн аяктайт** качан бир ойунчу жүрө албай калса же бирөө 82+ коргоол чогулткандан кийин.`,
  },

  ru: {
    title: 'Тогуз Коргоол',
    subtitle: 'Кыргызская национальная игра',
    player1: 'Игрок 1',
    player2: 'Игрок 2',
    newGame: 'Новая игра ↺',
    playOnline: '🌐 Играть онлайн',
    onlineConnecting: 'Подключаемся к игре…',
    onlineConnected: 'Соперник подключён',
    yourTurn: 'Ваш ход',
    opponentTurn: 'Ход соперника',
    turnLabel: 'Ходит:',
    hint: 'Потяните лунку и отпустите',
    tuzdukLabel: 'Туздук: лунка №',
    gameOver: 'Игра окончена',
    player1wins: 'Игрок 1 победил!',
    player2wins: 'Игрок 2 победил!',
    draw: 'Ничья!',
    restart: 'Начать заново',
    rulesTitle: 'Правила игры',
    rulesClose: 'Закрыть',
    rulesBtn: '?',
    aiLabel: 'Уровень ИИ',
    aiEasy: 'Лёгкий',
    aiMedium: 'Средний',
    aiHard: 'Сложный',
    aiNone: 'Нет',
    modeLocal: 'Местная',
    modeAI: 'Против ИИ',
    modeOnline: 'Онлайн',
    settingsTitle: 'Настройки',
    soundLabel: 'Звук',
    langLabel: 'Язык',
    statsTitle: 'Статистика',
    statsWins: 'Победы',
    statsLosses: 'Поражения',
    statsDraws: 'Ничьи',
    statsReset: 'Сбросить',
    onlineTitle: 'Игра по сети',
    onlineHint: 'Найдите случайного соперника или создайте комнату и пригласите друга по коду.',
    serverLabel: 'Адрес сервера (wss://...)',
    roomLabel: 'Код комнаты',
    createRoom: 'Создать',
    joinRoom: 'Войти',
    findOpponent: 'Найти соперника',
    cancelSearch: 'Отменить поиск',
    disconnect: 'Отключиться',
    onlineClose: 'Закрыть',
    waitingOpponent: 'Ожидаем соперника...',
    youAre: 'Вы — Игрок',
    opponentLeft: 'Соперник отключился.',
    connectionLost: 'Соединение потеряно.',
    connectError: 'Не удалось подключиться. Проверьте адрес сервера.',
    rulesText: `**Цель:** Собрать 82 или более из 162 камешков в свой казан.

**Ход:** Выберите любую непустую лунку в своём ряду и рассейте все камешки по одному против часовой стрелки.

**Захват:** Если последний камешек делает лунку соперника чётной — заберите все в казан.

**Туздук:** Если последний камешек делает лунку соперника = 3 (после 1-го хода) — она становится туздуком. Камешки, попавшие в туздук, автоматически идут в казан его владельца.

**Ограничения:** Туздуком не может быть последняя лунка (№9). Нельзя создать туздук в зеркальной позиции туздука соперника.

**Конец игры:** Один из игроков не может сделать ход или кто-то набрал 82+ камешков.`,
  },

  en: {
    title: 'Toguz Korgool',
    subtitle: 'Kyrgyz national board game',
    player1: 'Player 1',
    player2: 'Player 2',
    newGame: 'New Game ↺',
    playOnline: '🌐 Play Online',
    onlineConnecting: 'Connecting to game…',
    onlineConnected: 'Opponent connected',
    yourTurn: 'Your turn',
    opponentTurn: "Opponent's turn",
    turnLabel: 'Turn:',
    hint: 'Drag a pit and release',
    tuzdukLabel: 'Tuzduk: pit №',
    gameOver: 'Game Over',
    player1wins: 'Player 1 wins!',
    player2wins: 'Player 2 wins!',
    draw: 'Draw!',
    restart: 'Play Again',
    rulesTitle: 'Rules of the Game',
    rulesClose: 'Close',
    rulesBtn: '?',
    aiLabel: 'AI Level',
    aiEasy: 'Easy',
    aiMedium: 'Medium',
    aiHard: 'Hard',
    aiNone: 'None',
    modeLocal: 'Local',
    modeAI: 'vs AI',
    modeOnline: 'Online',
    settingsTitle: 'Settings',
    soundLabel: 'Sound',
    langLabel: 'Language',
    statsTitle: 'Statistics',
    statsWins: 'Wins',
    statsLosses: 'Losses',
    statsDraws: 'Draws',
    statsReset: 'Reset',
    onlineTitle: 'Online Game',
    onlineHint: 'Find a random opponent or create a room and invite a friend with its code.',
    serverLabel: 'Server address (wss://...)',
    roomLabel: 'Room code',
    createRoom: 'Create',
    joinRoom: 'Join',
    findOpponent: 'Find an opponent',
    cancelSearch: 'Cancel search',
    disconnect: 'Disconnect',
    onlineClose: 'Close',
    waitingOpponent: 'Waiting for opponent...',
    youAre: 'You are Player',
    opponentLeft: 'Opponent disconnected.',
    connectionLost: 'Connection lost.',
    connectError: 'Could not connect. Check the server address.',
    rulesText: `**Goal:** Collect 82 or more of the 162 stones in your kazan (treasury).

**Turn:** Choose any non-empty pit in your row and sow its stones one by one counter-clockwise.

**Capture:** If the last stone makes an opponent's pit even → take all stones to your kazan.

**Tuzduk:** If the last stone makes an opponent's pit = 3 (after move 1) → that pit becomes your tuzduk. Stones landing there go directly to your kazan.

**Restrictions:** The tuzduk cannot be the last pit (№9). You cannot mirror the opponent's tuzduk position.

**End of game:** A player cannot move, or someone reaches 82+ stones.`,
  },
};

export function t(lang: Lang, key: TranslationKey): string {
  return translations[lang][key];
}
