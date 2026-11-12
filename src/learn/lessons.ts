/**
 * Step-by-step Toguz Korgool lessons for beginners and school classes.
 * Positions are written row by row: `top` is pits 0..8 (opponent), `bottom` is pits 9..17 (you).
 * Each task lists every accepted move; lessons.test.ts checks them with the engine.
 */
import type { GameState } from '../game/engine';
import type { Text } from '../platform/strings';

export interface LessonPosition {
  top: number[];
  bottom: number[];
  kazan?: [number, number];
  tuzduk?: [number, number];
  moveCount?: number;
}

export interface LessonTask {
  accept: number[];
  /** What the accepted move is expected to do (checked in tests). */
  expect: 'sow' | 'capture' | 'tuzduk' | 'win';
  success: Text;
  retry: Text;
}

export interface LessonStep {
  text: Text;
  position?: LessonPosition;
  highlight?: number[];
  task?: LessonTask;
}

export interface Lesson {
  id: string;
  title: Text;
  summary: Text;
  steps: LessonStep[];
}

const START: LessonPosition = { top: Array(9).fill(9), bottom: Array(9).fill(9), kazan: [0, 0], moveCount: 0 };

/** Fills in kazans so the position holds exactly 162 stones, as in a real game. */
export function lessonState(position: LessonPosition = START): GameState {
  const pits = [...position.top, ...position.bottom];
  const onBoard = pits.reduce((a, b) => a + b, 0);
  const rest = 162 - onBoard;
  const kazan: [number, number] = position.kazan ?? [Math.floor(rest / 2), Math.ceil(rest / 2)];
  return {
    pits,
    kazan,
    tuzduk: position.tuzduk ?? [-1, -1],
    current: 1,
    moveCount: position.moveCount ?? 20,
    gameOver: false,
    winner: null,
  };
}

export const LESSONS: Lesson[] = [
  {
    id: 'board',
    title: { ky: 'Такта жана максат', ru: 'Доска и цель игры', en: 'The board and the goal' },
    summary: {
      ky: 'Чуңкурлар, казандар жана 162 коргоол',
      ru: 'Лунки, казаны и 162 камешка',
      en: 'Pits, kazans and 162 stones',
    },
    steps: [
      {
        text: {
          ky: 'Тактада эки катар бар, ар биринде **9 чуңкур**. Төмөнкү катар — сиздики, жогорку — каршылаштыкы. Оюндун башында ар бир чуңкурда **9 коргоолдон**, баары **162**.',
          ru: 'На доске два ряда по **9 лунок**. Нижний ряд — ваш, верхний — соперника. В начале в каждой лунке **по 9 камешков**, всего **162**.',
          en: 'The board has two rows of **9 pits**. The bottom row is yours, the top row belongs to your opponent. Each pit starts with **9 stones** — **162** in all.',
        },
        position: START,
      },
      {
        text: {
          ky: 'Ар бир оюнчунун **казаны** бар — утуп алган коргоолдор ошол жакка түшөт. **82 коргоол** чогулткан оюнчу жеңет: бул жарымынан көп.',
          ru: 'У каждого игрока есть **казан** — туда попадают выигранные камешки. Побеждает тот, кто соберёт **82 камешка**: это больше половины.',
          en: 'Each player has a **kazan** where captured stones go. Whoever collects **82 stones** — more than half — wins.',
        },
        position: START,
      },
      {
        text: {
          ky: 'Чуңкурлар **1ден 9га чейин** номерленет, ар бир оюнчу үчүн өзүнүн сол жагынан. Коргоолдор **саат жебесине каршы** жылат: өз катарыңыз боюнча оңго, андан кийин каршылаштын катарына.',
          ru: 'Лунки нумеруются **от 1 до 9** — у каждого игрока слева направо со своей стороны. Камешки движутся **против часовой стрелки**: по вашему ряду вправо, затем в ряд соперника.',
          en: 'Pits are numbered **1 to 9** from each player\'s own left. Stones travel **counter-clockwise**: rightwards along your row, then on into your opponent\'s row.',
        },
        position: START,
        highlight: [9, 17],
      },
    ],
  },
  {
    id: 'sowing',
    title: { ky: 'Кантип жүрүү керек', ru: 'Как ходить', en: 'How to move' },
    summary: {
      ky: 'Коргоолдорду бирден таратуу',
      ru: 'Рассеивание камешков по одному',
      en: 'Sowing stones one by one',
    },
    steps: [
      {
        text: {
          ky: 'Өз катарыңыздан бош эмес чуңкурду тандаңыз. Анын бардык коргоолдорун алып, бирден таратасыз. **Биринчи коргоол ошол эле чуңкурга калат.**',
          ru: 'Выберите непустую лунку в своём ряду. Вы берёте все камешки и раскладываете по одному. **Первый камешек кладётся обратно в ту же лунку.**',
          en: 'Pick a non-empty pit in your row. Lift all its stones and sow them one per pit. **The first stone goes back into the same pit.**',
        },
      },
      {
        text: {
          ky: '**1-чуңкурдан** (эң сол жактагы) жүрүңүз. 9 коргоолдун бирөө ордунда калат, калган 8и оңго карай таралат.',
          ru: 'Сходите из **лунки 1** (крайней слева). Один из 9 камешков останется на месте, остальные 8 разойдутся вправо.',
          en: 'Move from **pit 1** (the leftmost). One of its 9 stones stays put; the other 8 spread to the right.',
        },
        position: START,
        highlight: [9],
        task: {
          accept: [9],
          expect: 'sow',
          success: {
            ky: 'Мына! 1-чуңкурда бир коргоол калды, калган чуңкурлар бирден көбөйдү.',
            ru: 'Вот так! В лунке 1 остался один камешек, в следующих стало на один больше.',
            en: 'That\'s it! Pit 1 kept one stone, and each pit after it gained one.',
          },
          retry: {
            ky: 'Бул жолу 1-чуңкурду — эң сол жактагысын басыңыз.',
            ru: 'В этот раз нажмите на лунку 1 — крайнюю слева.',
            en: 'This time tap pit 1 — the leftmost one.',
          },
        },
      },
      {
        text: {
          ky: 'Чуңкурда **бир гана коргоол** болсо, ал ордунда калбайт — кийинки чуңкурга өтөт. 3-чуңкурдагы жалгыз коргоол менен жүрүңүз.',
          ru: 'Если в лунке **всего один камешек**, он не остаётся — а переходит в следующую лунку. Сходите одиноким камешком из лунки 3.',
          en: 'If a pit holds **a single stone**, it doesn\'t stay — it moves into the next pit. Play the lone stone in pit 3.',
        },
        position: { top: [5, 4, 3, 6, 2, 1, 7, 3, 4], bottom: [3, 0, 1, 4, 2, 5, 0, 2, 6] },
        highlight: [11],
        task: {
          accept: [11],
          expect: 'sow',
          success: {
            ky: 'Туура: 3-чуңкур бошоду, коргоол 4-чуңкурга өттү.',
            ru: 'Верно: лунка 3 опустела, камешек перешёл в лунку 4.',
            en: 'Right: pit 3 is now empty and its stone moved to pit 4.',
          },
          retry: {
            ky: 'Бир гана коргоолу бар 3-чуңкурду табыңыз.',
            ru: 'Найдите лунку 3 — в ней один камешек.',
            en: 'Find pit 3 — the one with a single stone.',
          },
        },
      },
    ],
  },
  {
    id: 'capture',
    title: { ky: 'Утуп алуу', ru: 'Взятие', en: 'Capturing' },
    summary: {
      ky: 'Жуп сан — коргоолдор сиздики',
      ru: 'Чётное число — камешки ваши',
      en: 'Make it even and the stones are yours',
    },
    steps: [
      {
        text: {
          ky: 'Эгер **акыркы коргоол** каршылаштын чуңкуруна түшүп, андагы коргоолдордун саны **жуп** болуп калса (2, 4, 6…), ал чуңкурдагынын баары казаныңызга өтөт.',
          ru: 'Если **последний камешек** попал в лунку соперника и там стало **чётное** число (2, 4, 6…), все камешки из этой лунки идут в ваш казан.',
          en: 'If your **last stone** lands in an opponent\'s pit and makes the count **even** (2, 4, 6…), every stone in that pit goes to your kazan.',
        },
      },
      {
        text: {
          ky: 'Коргоолдорду уткан жүрүштү табыңыз. Ар бир чуңкурдан акыркы коргоол кайда түшөрүн эсептеңиз.',
          ru: 'Найдите ход, который берёт камешки. Посчитайте, куда упадёт последний камешек из каждой лунки.',
          en: 'Find the move that captures. Count where the last stone of each pit would land.',
        },
        position: { top: [4, 2, 5, 3, 6, 2, 1, 7, 3], bottom: [2, 1, 3, 2, 4, 5, 1, 3, 4] },
        task: {
          accept: [17],
          expect: 'capture',
          success: {
            ky: 'Мыкты! Акыркы коргоол 5ти 6га айлантты — 6 коргоол казаныңызда.',
            ru: 'Отлично! Последний камешек превратил 5 в 6 — шесть камешков в вашем казане.',
            en: 'Great! Your last stone turned 5 into 6 — six stones in your kazan.',
          },
          retry: {
            ky: 'Бул жүрүш эч нерсе утпайт. 9-чуңкурду караңыз: 4 коргоол — бирөө калат, үчөө каршылашка кетет.',
            ru: 'Этот ход ничего не берёт. Посмотрите на лунку 9: 4 камешка — один останется, три уйдут к сопернику.',
            en: 'That move captures nothing. Look at pit 9: 4 stones — one stays, three go to the opponent.',
          },
        },
      },
    ],
  },
  {
    id: 'tuzduk',
    title: { ky: 'Туздук', ru: 'Туздук', en: 'The tuzduk' },
    summary: {
      ky: 'Оюндагы эң күчтүү курал',
      ru: 'Самое сильное оружие в игре',
      en: 'The strongest weapon in the game',
    },
    steps: [
      {
        text: {
          ky: 'Эгер акыркы коргоол каршылаштын чуңкурунда **так 3 коргоол** жасаса, ал чуңкур сиздин **туздугуңуз** болот. Мындан ары ага түшкөн ар бир коргоол **сиздин казаныңызга** кетет — оюндун аягына чейин.',
          ru: 'Если последний камешек сделал в лунке соперника **ровно 3 камешка**, эта лунка становится вашим **туздуком**. Каждый камешек, попавший туда потом, уходит **в ваш казан** — до конца партии.',
          en: 'If your last stone makes **exactly 3** in an opponent\'s pit, that pit becomes your **tuzduk**. Every stone that lands in it afterwards goes **to your kazan** — for the rest of the game.',
        },
      },
      {
        text: {
          ky: 'Туздук жасаңыз. Көңүл буруңуз: бул жерде 6 коргоолду утуп алса да болот — бирок туздук узак убакыт пайда берет.',
          ru: 'Сделайте туздук. Заметьте: здесь можно и взять 6 камешков — но туздук приносит камешки всю партию.',
          en: 'Make a tuzduk. Note that you could also capture 6 stones here — but a tuzduk keeps paying for the whole game.',
        },
        position: { top: [5, 3, 2, 4, 1, 6, 3, 2, 7], bottom: [1, 4, 2, 6, 1, 3, 2, 5, 2] },
        task: {
          accept: [16],
          expect: 'tuzduk',
          success: {
            ky: 'Туздук! Каршылаштын 3-чуңкуру эми сиз үчүн иштейт.',
            ru: 'Туздук! Лунка 3 соперника теперь работает на вас.',
            en: 'Tuzduk! Your opponent\'s pit 3 now works for you.',
          },
          retry: {
            ky: 'Каршылаштын катарында 2 коргоолу бар чуңкурду табыңыз жана акыркы коргоолду ошого түшүрүңүз.',
            ru: 'Найдите в ряду соперника лунку с 2 камешками и приведите туда последний камешек.',
            en: 'Find a pit with 2 stones in your opponent\'s row and land your last stone there.',
          },
        },
      },
      {
        text: {
          ky: 'Туздуктун эрежелери: ар бир оюнчу **бир гана** туздук жасай алат. Каршылаштын **9-чуңкуру** туздук боло албайт. Каршылаштын туздугу менен **бирдей номердеги** чуңкур да туздук боло албайт.',
          ru: 'Правила туздука: у каждого игрока может быть **только один** туздук. **Лунка 9** соперника не может стать туздуком. Нельзя сделать туздук в лунке **с тем же номером**, что и туздук соперника.',
          en: 'Tuzduk rules: each player may make **only one**. The opponent\'s **pit 9** can never become a tuzduk. Nor can the pit **with the same number** as the opponent\'s tuzduk.',
        },
        position: START,
        highlight: [8],
      },
    ],
  },
  {
    id: 'endgame',
    title: { ky: 'Оюндун аягы', ru: 'Конец партии', en: 'The end of the game' },
    summary: {
      ky: '82 коргоол, тең чыгуу жана жүрүш жок болгондо',
      ru: '82 камешка, ничья и когда нет ходов',
      en: '82 stones, draws, and running out of moves',
    },
    steps: [
      {
        text: {
          ky: 'Оюн бүтөт, качан бирөө **82 коргоол** чогултса же оюнчунун **жүрүшү калбаса**. Акыркы учурда ар ким өз катарындагы коргоолдорду казанына алат. **81:81** — тең чыгуу.',
          ru: 'Партия заканчивается, когда кто-то собрал **82 камешка** или игроку **нечем ходить**. Тогда каждый забирает камешки своего ряда в свой казан. **81:81** — ничья.',
          en: 'The game ends when someone reaches **82 stones**, or a player **has no move**. Then each player takes the stones on their own side. **81–81** is a draw.',
        },
      },
      {
        text: {
          ky: 'Казаныңызда 78 коргоол бар. Бир жүрүш менен жеңиңиз!',
          ru: 'В вашем казане 78 камешков. Выиграйте одним ходом!',
          en: 'Your kazan holds 78 stones. Win in one move!',
        },
        position: { top: [3, 1, 2, 0, 1, 0, 0, 0, 1], bottom: [1, 0, 0, 2, 0, 0, 0, 0, 2], kazan: [71, 78], moveCount: 120 },
        task: {
          accept: [17],
          expect: 'win',
          success: {
            ky: 'Жеңиш! 78 + 4 = 82.',
            ru: 'Победа! 78 + 4 = 82.',
            en: 'Victory! 78 + 4 = 82.',
          },
          retry: {
            ky: 'Каршылаштын 1-чуңкурунда 3 коргоол — ага бир коргоол кошсоңуз, 4 болот.',
            ru: 'В лунке 1 соперника 3 камешка — добавьте один, и станет 4.',
            en: 'Your opponent\'s pit 1 holds 3 — add one and it becomes 4.',
          },
        },
      },
    ],
  },
];
