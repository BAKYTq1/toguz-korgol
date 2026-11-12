import { CATALOG } from '../platform/catalog';
import { defineStrings } from '../platform/strings';
import { usePlatformLang } from '../platform/LangContext';
import { Link } from '../platform/router';
import Shell from '../platform/ui/Shell';
import GameArt from '../platform/ui/GameArt';
import { Divider } from '../platform/ui/Ornament';
import { LESSONS } from '../learn/lessons';
import { TOGUZ_PUZZLES } from '../learn/toguzPuzzles';
import { useProgress } from '../learn/progress';
import ui from '../platform/ui/ui.module.css';
import styles from './HomePage.module.css';

const t = defineStrings({
  ru: {
    heroTitle: 'Тогуз коргоол, мангала и ордо',
    heroLead: 'Играйте с компьютером или с другом, разбирайте задачи, проводите турниры в школе и клубе.',
    playToguz: 'Играть в тогуз коргоол',
    startLearning: 'Учиться с нуля',
    gamesTitle: 'Игры',
    play: 'Играть',
    soon: 'Готовим',
    learnTitle: 'Обучение',
    learnText: '{lessons} уроков и {puzzles} задач. Ответы проверяет компьютер.',
    learnMore: 'Все уроки',
    tournamentsTitle: 'Турниры',
    tournamentsText: 'Круговая или швейцарская система. Пары и таблица считаются сами.',
    tournamentsMore: 'Провести турнир',
    schoolTitle: 'Школам',
    schoolText: 'Ученики входят по коду, учитель видит, кто что прошёл.',
    schoolMore: 'Создать класс',
    classCode: 'код класса',
    sampleTable: 'Пример таблицы',
    pts: 'очк.',
    player: 'Игрок {n}',
  },
  ky: {
    heroTitle: 'Тогуз коргоол, мангала жана ордо',
    heroLead: 'Компьютер же дос менен ойноңуз, маселелерди чечиңиз, мектепте жана клубда турнир өткөрүңүз.',
    playToguz: 'Тогуз коргоол ойноо',
    startLearning: 'Нөлдөн үйрөнүү',
    gamesTitle: 'Оюндар',
    play: 'Ойноо',
    soon: 'Даярдалууда',
    learnTitle: 'Окуу',
    learnText: '{lessons} сабак жана {puzzles} маселе. Жоопторду компьютер текшерет.',
    learnMore: 'Бардык сабактар',
    tournamentsTitle: 'Турнирлер',
    tournamentsText: 'Айлампа же швейцар системасы. Жуптар жана таблица өзү эсептелет.',
    tournamentsMore: 'Турнир өткөрүү',
    schoolTitle: 'Мектептерге',
    schoolText: 'Окуучулар код менен кирет, мугалим ким эмнени өткөнүн көрөт.',
    schoolMore: 'Класс түзүү',
    classCode: 'класстын коду',
    sampleTable: 'Таблицанын үлгүсү',
    pts: 'уп.',
    player: 'Оюнчу {n}',
  },
  en: {
    heroTitle: 'Toguz Korgool, Mangala and Ordo',
    heroLead: 'Play the computer or a friend, work through puzzles, run tournaments at your school or club.',
    playToguz: 'Play Toguz Korgool',
    startLearning: 'Learn from scratch',
    gamesTitle: 'Games',
    play: 'Play',
    soon: 'In progress',
    learnTitle: 'Learn',
    learnText: '{lessons} lessons and {puzzles} puzzles. The computer checks the answers.',
    learnMore: 'All lessons',
    tournamentsTitle: 'Tournaments',
    tournamentsText: 'Round robin or Swiss. Pairings and standings are worked out for you.',
    tournamentsMore: 'Run a tournament',
    schoolTitle: 'Schools',
    schoolText: 'Students join with a code; the teacher sees who finished what.',
    schoolMore: 'Create a class',
    classCode: 'class code',
    sampleTable: 'Sample standings',
    pts: 'pts',
    player: 'Player {n}',
  },
});

export default function HomePage() {
  const [lang] = usePlatformLang();
  const progress = useProgress();

  return (
    <Shell>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={ui.h1}>{t(lang, 'heroTitle')}</h1>
          <p className={ui.lead}>{t(lang, 'heroLead')}</p>
          <div className={ui.row}>
            <Link to="/toguz-korgool" className={`${ui.btn} ${ui.primary}`}>{t(lang, 'playToguz')}</Link>
            <Link to="/learn" className={ui.btn}>{t(lang, 'startLearning')}</Link>
          </div>
        </div>
        <Link to="/toguz-korgool" className={styles.heroArt} aria-label={t(lang, 'playToguz')}>
          <GameArt id="toguz-korgool" />
        </Link>
      </section>

      <Divider />

      <section className={ui.section} aria-labelledby="games-title">
        <h2 id="games-title" className={ui.h2}>{t(lang, 'gamesTitle')}</h2>
        <div className={styles.games}>
          {CATALOG.map(game => {
            const body = (
              <>
                <div className={styles.art}><GameArt id={game.id} /></div>
                <div className={styles.gameHead}>
                  <span className={ui.h3}>{game.name[lang]}</span>
                  <span className={styles.origin}>{game.origin[lang]}</span>
                </div>
                <p className={ui.muted}>{game.blurb[lang]}</p>
                <span className={game.live ? styles.play : styles.soonLabel}>{game.live ? t(lang, 'play') : t(lang, 'soon')}</span>
              </>
            );
            return game.live && game.path ? (
              <Link key={game.id} to={game.path} className={`${ui.card} ${styles.game}`}>{body}</Link>
            ) : (
              <div key={game.id} className={`${ui.card} ${styles.game} ${styles.soon}`}>{body}</div>
            );
          })}
        </div>
      </section>

      <Divider />

      <section className={styles.features}>
        <div className={styles.feature}>
          <h2 className={ui.h2}>{t(lang, 'learnTitle')}</h2>
          <p className={ui.muted}>{t(lang, 'learnText', { lessons: LESSONS.length, puzzles: TOGUZ_PUZZLES.length })}</p>
          <ol className={styles.lessonList}>
            {LESSONS.slice(0, 4).map((lesson, i) => (
              <li key={lesson.id}>
                <span className={progress.lessons.includes(lesson.id) ? styles.done : styles.todo}>
                  {progress.lessons.includes(lesson.id) ? '✓' : i + 1}
                </span>
                {lesson.title[lang]}
              </li>
            ))}
          </ol>
          <Link to="/learn" className={styles.more}>{t(lang, 'learnMore')}</Link>
        </div>

        <div className={styles.feature}>
          <h2 className={ui.h2}>{t(lang, 'tournamentsTitle')}</h2>
          <p className={ui.muted}>{t(lang, 'tournamentsText')}</p>
          <table className={styles.sample} aria-label={t(lang, 'sampleTable')}>
            <tbody>
              {[['3', '7.5'], ['2½', '8'], ['2½', '6.5'], ['1', '7']].map(([points, buchholz], i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{t(lang, 'player', { n: [4, 1, 6, 2][i] })}</td>
                  <td className={styles.pts}>{points} {t(lang, 'pts')}</td>
                  <td className={styles.buch}>{buchholz}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link to="/tournaments" className={styles.more}>{t(lang, 'tournamentsMore')}</Link>
        </div>

        <div className={styles.feature}>
          <h2 className={ui.h2}>{t(lang, 'schoolTitle')}</h2>
          <p className={ui.muted}>{t(lang, 'schoolText')}</p>
          <div className={styles.code}>
            <span>K7Q2MX</span>
            <small>{t(lang, 'classCode')}</small>
          </div>
          <Link to="/school" className={styles.more}>{t(lang, 'schoolMore')}</Link>
        </div>
      </section>
    </Shell>
  );
}
