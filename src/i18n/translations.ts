export type Lang = 'ky' | 'ru' | 'en';

export type TranslationKey =
  | 'title'
  | 'subtitle'
  | 'player1'
  | 'player2'
  | 'you'
  | 'opponent'
  | 'guestName'
  | 'topRow'
  | 'bottomRow'
  | 'leftSide'
  | 'rightSide'
  | 'accountTitle'
  | 'guestAccount'
  | 'accountEmail'
  | 'passwordLabel'
  | 'registerEmail'
  | 'loginEmail'
  | 'createAccount'
  | 'continueGoogle'
  | 'haveAccount'
  | 'noAccount'
  | 'profileName'
  | 'profileAbout'
  | 'saveProfile'
  | 'achievements'
  | 'gamesPlayed'
  | 'achievementFirstWin'
  | 'achievementFirstWinDesc'
  | 'achievementFiveWins'
  | 'achievementFiveWinsDesc'
  | 'achievementTenWins'
  | 'achievementTenWinsDesc'
  | 'achievementTenGames'
  | 'achievementTenGamesDesc'
  | 'achievementLocked'
  | 'profileSaved'
  | 'accountBusyGame'
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
  | 'navHome'
  | 'navOnline'
  | 'navProfile'
  | 'navSettings'
  | 'navRules'
  | 'navNew'
  | 'aiName'
  | 'aiThinking'
  | 'youWin'
  | 'youLose'
  | 'onlineIdle'
  | 'signOut'
  | 'signedOut'
  | 'signedIn'
  | 'accountCreated'
  | 'forgotPassword'
  | 'resetSent'
  | 'enterEmailFirst'
  | 'passwordHint'
  | 'accountUpgradeHint'
  | 'errEmailInUse'
  | 'errInvalidEmail'
  | 'errWeakPassword'
  | 'errWrongPassword'
  | 'errTooMany'
  | 'errPopupClosed'
  | 'errPopupBlocked'
  | 'errNetwork'
  | 'errProviderDisabled'
  | 'errUnauthorizedDomain'
  | 'errPermission'
  | 'errGeneric'
  | 'waitingFriend'
  | 'roomCodeInvalid'
  | 'roomNotFound'
  | 'roomFull'
  | 'quickMatch'
  | 'quickMatchHint'
  | 'friendRoom'
  | 'friendRoomHint'
  | 'createFriendRoom'
  | 'joinByCode'
  | 'orLabel'
  | 'copyCode'
  | 'copied'
  | 'shareInvite'
  | 'inviteText'
  | 'roomCodeTitle'
  | 'confirmMoveLabel'
  | 'confirmMoveHint'
  | 'confirmMove'
  | 'cancelMove'
  | 'pitNumber'
  | 'previewCapture'
  | 'previewTuzduk'
  | 'previewTapAgain'
  | 'settingOn'
  | 'settingOff'
  | 'modeLabel'
  | 'hapticsLabel'
  | 'rulesText';

type Translations = Record<TranslationKey, string>;

export const translations: Record<Lang, Translations> = {
  ky: {
    title: 'Тогуз Коргоол',
    subtitle: 'Кыргыз улуттук оюну',
    player1: 'Ойунчу 1',
    player2: 'Ойунчу 2',
    you: 'Сиз',
    opponent: 'Каршылаш',
    guestName: 'Конок',
    topRow: 'Жогорку катар',
    bottomRow: 'Төмөнкү катар',
    leftSide: 'Сол жак',
    rightSide: 'Оң жак',
    accountTitle: 'Жеке кабинет',
    guestAccount: 'Анонимдүү оюнчу',
    accountEmail: 'Электрондук почта',
    passwordLabel: 'Сырсөз',
    registerEmail: 'Email менен катталуу',
    loginEmail: 'Аккаунтка кирүү',
    createAccount: 'Аккаунт түзүү',
    continueGoogle: 'Google менен улантуу',
    haveAccount: 'Аккаунтуңуз барбы? Кирүү',
    noAccount: 'Аккаунтуңуз жокпу? Катталуу',
    profileName: 'Оюнчунун аты',
    profileAbout: 'Өзүңүз жөнүндө',
    saveProfile: 'Профилди сактоо',
    achievements: 'Жетишкендиктер',
    gamesPlayed: 'Оюн',
    achievementFirstWin: 'Биринчи жеңиш',
    achievementFirstWinDesc: 'Бир оюнда жеңишке жет',
    achievementFiveWins: 'Тажрыйбалуу оюнчу',
    achievementFiveWinsDesc: '5 оюнда жеңишке жет',
    achievementTenWins: 'Тогуз коргоол чебери',
    achievementTenWinsDesc: '10 оюнда жеңишке жет',
    achievementTenGames: 'Оюнчу',
    achievementTenGamesDesc: '10 оюн ойно',
    achievementLocked: 'Азырынча кулпуланган',
    profileSaved: 'Профиль сакталды',
    accountBusyGame: 'Учурдагы онлайн оюн бүткөндөн кийин аккаунтка кириңиз.',
    newGame: 'Жаңы оюн',
    playOnline: 'Онлайн ойноо',
    onlineConnecting: 'Серверге туташуу…',
    onlineConnected: 'Каршылаш туташты',
    yourTurn: 'Сиздин жүрүш',
    opponentTurn: 'Каршылаштын жүрүшү',
    turnLabel: 'Жүрөт:',
    hint: 'Жүрүш үчүн өз чуңкуруңузду басыңыз',
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
    onlineHint: 'Кокус каршылаш изделет. Ал табылганда оюн автоматтык түрдө башталат.',
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
    navHome: 'Оюндар',
    navOnline: 'Онлайн',
    navProfile: 'Профиль',
    navSettings: 'Жөндөө',
    navRules: 'Эрежелер',
    navNew: 'Жаңы оюн',
    aiName: 'Компьютер',
    aiThinking: 'Компьютер ойлонууда…',
    youWin: 'Сиз жеңдиңиз!',
    youLose: 'Бул жолу утулдуңуз',
    onlineIdle: 'Каршылаш табуу үчүн «Онлайн» баскычын басыңыз',
    signOut: 'Аккаунттан чыгуу',
    signedOut: 'Аккаунттан чыктыңыз',
    signedIn: 'Аккаунтка кирдиңиз',
    accountCreated: 'Аккаунт түзүлдү — статистика сакталды',
    forgotPassword: 'Сырсөздү унуттуңузбу?',
    resetSent: 'Сырсөздү калыбына келтирүү каты жөнөтүлдү. Почтаңызды (жана «Спам» папкасын) текшериңиз.',
    enterEmailFirst: 'Адегенде email жазыңыз',
    passwordHint: 'Кеминде 6 белги',
    accountUpgradeHint: 'Статистикаңызды жоготпоо жана каалаган түзмөктөн ойноо үчүн катталыңыз. Учурдагы жыйынтыктарыңыз сакталат.',
    errEmailInUse: 'Бул email катталган. «Аккаунтуңуз барбы? Кирүү» баскычын басыңыз.',
    errInvalidEmail: 'Email туура эмес жазылды',
    errWeakPassword: 'Сырсөз өтө жөнөкөй — кеминде 6 белги',
    errWrongPassword: 'Email же сырсөз туура эмес',
    errTooMany: 'Аракет өтө көп болду. Бир аздан кийин кайра аракет кылыңыз',
    errPopupClosed: 'Кирүү терезеси жабылды',
    errPopupBlocked: 'Браузер кирүү терезесин бөгөттөдү. Бул сайт үчүн калкыма терезелерге уруксат бериңиз',
    errNetwork: 'Интернет байланышы жок',
    errProviderDisabled: 'Бул кирүү ыкмасы Firebase жөндөөлөрүндө күйгүзүлгөн эмес',
    errUnauthorizedDomain: 'Бул домен Firebase уруксат берилген домендерине кошулган эмес',
    errPermission: 'Маалыматка жетүү жок. Firestore эрежелерин жаңыртыңыз',
    errGeneric: 'Бир нерсе туура эмес болду. Кайра аракет кылыңыз',
    waitingFriend: 'Досуңузду күтүүдө — ага бөлмөнүн кодун жөнөтүңүз',
    roomCodeInvalid: 'Бөлмө коду 5 белгиден турат',
    roomNotFound: 'Бөлмө табылган жок. Кодду текшериңиз',
    roomFull: 'Бул бөлмөдө оюн жүрүп жатат',
    quickMatch: 'Кокус каршылаш',
    quickMatchHint: 'Каалаган бош оюнчуну табабыз',
    friendRoom: 'Дос менен ойноо',
    friendRoomHint: 'Бөлмө түзүп, кодду досуңузга жөнөтүңүз — же сизге келген кодду жазыңыз',
    createFriendRoom: 'Бөлмө түзүү',
    joinByCode: 'Код менен кирүү',
    orLabel: 'же',
    copyCode: 'Көчүрүү',
    copied: 'Көчүрүлдү!',
    shareInvite: 'Бөлүшүү',
    inviteText: 'Тогуз Коргоол ойнойлубу? Бөлмө коду:',
    roomCodeTitle: 'Сиздин бөлмөнүн коду',
    confirmMoveLabel: 'Жүрүштү ырастоо',
    confirmMoveHint: 'Биринчи басуу чуңкурду тандайт, жүрүш — «Жүрүү» баскычы менен',
    confirmMove: 'Жүрүү',
    cancelMove: 'Жокко чыгаруу',
    pitNumber: 'Чуңкур №',
    previewCapture: 'аласыз',
    previewTuzduk: 'туздук!',
    previewTapAgain: 'Жүрүү үчүн дагы бир басыңыз',
    settingOn: 'Күйүк',
    settingOff: 'Өчүк',
    modeLabel: 'Оюн режими',
    hapticsLabel: 'Дирилдөө',
    rulesText: `**Максат:** 162 коргоолдун 82 же андан ашыгын чогулт.

**Жүрүш:** Өз катарыңдан бош эмес чуңкурду тандап, анын бардык коргоолдорун саат жебесине каршы бирден жайгаш. Биринчи коргоол ошол эле чуңкурга калат. Чуңкурда бир гана коргоол болсо — ал кийинки чуңкурга өтөт.

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
    you: 'Вы',
    opponent: 'Соперник',
    guestName: 'Гость',
    topRow: 'Верхний ряд',
    bottomRow: 'Нижний ряд',
    leftSide: 'Левая сторона',
    rightSide: 'Правая сторона',
    accountTitle: 'Личный кабинет',
    guestAccount: 'Анонимный игрок',
    accountEmail: 'Электронная почта',
    passwordLabel: 'Пароль',
    registerEmail: 'Регистрация по email',
    loginEmail: 'Войти в аккаунт',
    createAccount: 'Создать аккаунт',
    continueGoogle: 'Продолжить с Google',
    haveAccount: 'Уже есть аккаунт? Войти',
    noAccount: 'Нет аккаунта? Зарегистрироваться',
    profileName: 'Имя игрока',
    profileAbout: 'О себе',
    saveProfile: 'Сохранить профиль',
    achievements: 'Достижения',
    gamesPlayed: 'Игр сыграно',
    achievementFirstWin: 'Первая победа',
    achievementFirstWinDesc: 'Выиграть первую игру',
    achievementFiveWins: 'Опытный игрок',
    achievementFiveWinsDesc: 'Выиграть 5 игр',
    achievementTenWins: 'Мастер тогуз коргоол',
    achievementTenWinsDesc: 'Выиграть 10 игр',
    achievementTenGames: 'Любитель игры',
    achievementTenGamesDesc: 'Сыграть 10 игр',
    achievementLocked: 'Пока не открыто',
    profileSaved: 'Профиль сохранён',
    accountBusyGame: 'Войдите в аккаунт после завершения онлайн-партии.',
    newGame: 'Новая игра',
    playOnline: 'Играть онлайн',
    onlineConnecting: 'Подключаемся к игре…',
    onlineConnected: 'Соперник подключён',
    yourTurn: 'Ваш ход',
    opponentTurn: 'Ход соперника',
    turnLabel: 'Ходит:',
    hint: 'Нажмите на свою лунку, чтобы сделать ход',
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
    onlineHint: 'Мы подберём случайного соперника. Игра начнётся автоматически, как только он найдётся.',
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
    navHome: 'Игры',
    navOnline: 'Онлайн',
    navProfile: 'Профиль',
    navSettings: 'Настройки',
    navRules: 'Правила',
    navNew: 'Новая игра',
    aiName: 'Компьютер',
    aiThinking: 'Компьютер думает…',
    youWin: 'Вы победили!',
    youLose: 'В этот раз поражение',
    onlineIdle: 'Нажмите «Онлайн», чтобы найти соперника',
    signOut: 'Выйти из аккаунта',
    signedOut: 'Вы вышли из аккаунта',
    signedIn: 'Вы вошли в аккаунт',
    accountCreated: 'Аккаунт создан — статистика сохранена',
    forgotPassword: 'Забыли пароль?',
    resetSent: 'Письмо для сброса пароля отправлено. Проверьте почту (и папку «Спам»).',
    enterEmailFirst: 'Сначала введите email',
    passwordHint: 'Минимум 6 символов',
    accountUpgradeHint: 'Зарегистрируйтесь, чтобы не потерять статистику и играть с любого устройства. Ваши текущие результаты сохранятся.',
    errEmailInUse: 'Этот email уже зарегистрирован. Нажмите «Уже есть аккаунт? Войти».',
    errInvalidEmail: 'Неверный формат email',
    errWeakPassword: 'Пароль слишком простой — минимум 6 символов',
    errWrongPassword: 'Неверный email или пароль',
    errTooMany: 'Слишком много попыток. Подождите немного и попробуйте снова',
    errPopupClosed: 'Окно входа было закрыто',
    errPopupBlocked: 'Браузер заблокировал окно входа. Разрешите всплывающие окна для этого сайта',
    errNetwork: 'Нет подключения к интернету',
    errProviderDisabled: 'Этот способ входа не включён в настройках Firebase',
    errUnauthorizedDomain: 'Этот домен не добавлен в разрешённые домены Firebase',
    errPermission: 'Нет доступа к данным. Обновите правила Firestore',
    errGeneric: 'Что-то пошло не так. Попробуйте ещё раз',
    waitingFriend: 'Ждём друга — отправьте ему код комнаты',
    roomCodeInvalid: 'Код комнаты — 5 символов',
    roomNotFound: 'Комната не найдена. Проверьте код',
    roomFull: 'В этой комнате уже идёт игра',
    quickMatch: 'Случайный соперник',
    quickMatchHint: 'Подберём любого свободного игрока',
    friendRoom: 'Игра с другом',
    friendRoomHint: 'Создайте комнату и отправьте код другу — или введите код, который прислали вам',
    createFriendRoom: 'Создать комнату',
    joinByCode: 'Войти по коду',
    orLabel: 'или',
    copyCode: 'Копировать',
    copied: 'Скопировано!',
    shareInvite: 'Поделиться',
    inviteText: 'Сыграем в Тогуз Коргоол? Код комнаты:',
    roomCodeTitle: 'Код вашей комнаты',
    confirmMoveLabel: 'Подтверждать ход',
    confirmMoveHint: 'Первое нажатие выбирает лунку, ход — кнопкой «Сходить»',
    confirmMove: 'Сходить',
    cancelMove: 'Отмена',
    pitNumber: 'Лунка №',
    previewCapture: 'заберёте',
    previewTuzduk: 'туздук!',
    previewTapAgain: 'Нажмите ещё раз, чтобы сходить',
    settingOn: 'Вкл',
    settingOff: 'Выкл',
    modeLabel: 'Режим игры',
    hapticsLabel: 'Вибрация',
    rulesText: `**Цель:** Собрать 82 или более из 162 камешков в свой казан.

**Ход:** Выберите любую непустую лунку в своём ряду и рассейте все камешки по одному против часовой стрелки. Первый камешек остаётся в той же лунке. Если в лунке один камешек — он переходит в следующую.

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
    you: 'You',
    opponent: 'Opponent',
    guestName: 'Guest',
    topRow: 'Top row',
    bottomRow: 'Bottom row',
    leftSide: 'Left side',
    rightSide: 'Right side',
    accountTitle: 'Player profile',
    guestAccount: 'Anonymous player',
    accountEmail: 'Email address',
    passwordLabel: 'Password',
    registerEmail: 'Register with email',
    loginEmail: 'Sign in',
    createAccount: 'Create account',
    continueGoogle: 'Continue with Google',
    haveAccount: 'Already registered? Sign in',
    noAccount: 'New here? Create an account',
    profileName: 'Player name',
    profileAbout: 'About me',
    saveProfile: 'Save profile',
    achievements: 'Achievements',
    gamesPlayed: 'Games played',
    achievementFirstWin: 'First win',
    achievementFirstWinDesc: 'Win your first game',
    achievementFiveWins: 'Experienced player',
    achievementFiveWinsDesc: 'Win 5 games',
    achievementTenWins: 'Toguz Korgool master',
    achievementTenWinsDesc: 'Win 10 games',
    achievementTenGames: 'Game enthusiast',
    achievementTenGamesDesc: 'Play 10 games',
    achievementLocked: 'Not unlocked yet',
    profileSaved: 'Profile saved',
    accountBusyGame: 'Finish your online game before switching accounts.',
    newGame: 'New Game',
    playOnline: 'Play Online',
    onlineConnecting: 'Connecting to game…',
    onlineConnected: 'Opponent connected',
    yourTurn: 'Your turn',
    opponentTurn: "Opponent's turn",
    turnLabel: 'Turn:',
    hint: 'Tap one of your pits to move',
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
    onlineHint: 'We will pair you with a random opponent. The game starts as soon as one is found.',
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
    navHome: 'Games',
    navOnline: 'Online',
    navProfile: 'Profile',
    navSettings: 'Settings',
    navRules: 'Rules',
    navNew: 'New game',
    aiName: 'Computer',
    aiThinking: 'Computer is thinking…',
    youWin: 'You win!',
    youLose: 'You lost this time',
    onlineIdle: 'Tap “Online” to find an opponent',
    signOut: 'Sign out',
    signedOut: 'You have signed out',
    signedIn: 'Signed in',
    accountCreated: 'Account created — your stats are saved',
    forgotPassword: 'Forgot password?',
    resetSent: 'Password reset email sent. Check your inbox (and spam folder).',
    enterEmailFirst: 'Enter your email first',
    passwordHint: 'At least 6 characters',
    accountUpgradeHint: 'Register to keep your stats and play from any device. Your current results will be kept.',
    errEmailInUse: 'This email is already registered. Tap “Already registered? Sign in”.',
    errInvalidEmail: 'Invalid email address',
    errWeakPassword: 'Password is too weak — use at least 6 characters',
    errWrongPassword: 'Wrong email or password',
    errTooMany: 'Too many attempts. Please wait a moment and try again',
    errPopupClosed: 'The sign-in window was closed',
    errPopupBlocked: 'The browser blocked the sign-in window. Allow pop-ups for this site',
    errNetwork: 'No internet connection',
    errProviderDisabled: 'This sign-in method is not enabled in Firebase',
    errUnauthorizedDomain: 'This domain is not in Firebase’s authorized domains',
    errPermission: 'Access denied. Update the Firestore rules',
    errGeneric: 'Something went wrong. Please try again',
    waitingFriend: 'Waiting for your friend — send them the room code',
    roomCodeInvalid: 'A room code has 5 characters',
    roomNotFound: 'Room not found. Check the code',
    roomFull: 'A game is already running in this room',
    quickMatch: 'Random opponent',
    quickMatchHint: 'We will pair you with any free player',
    friendRoom: 'Play with a friend',
    friendRoomHint: 'Create a room and send the code to a friend — or enter the code you received',
    createFriendRoom: 'Create room',
    joinByCode: 'Join with code',
    orLabel: 'or',
    copyCode: 'Copy',
    copied: 'Copied!',
    shareInvite: 'Share',
    inviteText: 'Let’s play Toguz Korgool! Room code:',
    roomCodeTitle: 'Your room code',
    confirmMoveLabel: 'Confirm moves',
    confirmMoveHint: 'The first tap selects a pit, the “Move” button plays it',
    confirmMove: 'Move',
    cancelMove: 'Cancel',
    pitNumber: 'Pit №',
    previewCapture: 'you take',
    previewTuzduk: 'tuzduk!',
    previewTapAgain: 'Tap again to move',
    settingOn: 'On',
    settingOff: 'Off',
    modeLabel: 'Game mode',
    hapticsLabel: 'Vibration',
    rulesText: `**Goal:** Collect 82 or more of the 162 stones in your kazan (treasury).

**Turn:** Choose any non-empty pit in your row and sow its stones one by one counter-clockwise. The first stone goes back into the same pit; a single stone moves to the next pit.

**Capture:** If the last stone makes an opponent's pit even → take all stones to your kazan.

**Tuzduk:** If the last stone makes an opponent's pit = 3 (after move 1) → that pit becomes your tuzduk. Stones landing there go directly to your kazan.

**Restrictions:** The tuzduk cannot be the last pit (№9). You cannot mirror the opponent's tuzduk position.

**End of game:** A player cannot move, or someone reaches 82+ stones.`,
  },
};

export function t(lang: Lang, key: TranslationKey): string {
  return translations[lang][key];
}
