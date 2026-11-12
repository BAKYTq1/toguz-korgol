import { useEffect, useState, type FormEvent } from 'react';
import { firebaseConfigured } from '../lib/firebase';
import { useJoinedClasses } from '../learn/progress';
import { common } from '../platform/common';
import { CLASS_CODE_LENGTH, createClass, joinByCode, myTeachingClasses, type SchoolClass } from '../platform/data/classes';
import { normalizeCode } from '../platform/data/session';
import { usePlatformLang } from '../platform/LangContext';
import { Link, navigate } from '../platform/router';
import Shell from '../platform/ui/Shell';
import { st } from './schoolStrings';
import ui from '../platform/ui/ui.module.css';
import styles from './SchoolPage.module.css';

export default function SchoolPage() {
  const [lang] = usePlatformLang();
  const t = (key: Parameters<typeof st>[1], vars?: Record<string, string | number>) => st(lang, key, vars);
  const c = (key: Parameters<typeof common>[1]) => common(lang, key);
  const joined = useJoinedClasses();
  const [teaching, setTeaching] = useState<SchoolClass[] | null>(null);
  const [className, setClassName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [code, setCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [busy, setBusy] = useState<'teacher' | 'student' | null>(null);
  const [teacherError, setTeacherError] = useState('');
  const [studentError, setStudentError] = useState('');

  useEffect(() => {
    if (!firebaseConfigured) return;
    let active = true;
    myTeachingClasses()
      .then(list => { if (active) setTeaching(list); })
      .catch(() => { if (active) setTeaching([]); });
    return () => { active = false; };
  }, []);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    setBusy('teacher');
    setTeacherError('');
    try {
      const newCode = await createClass(className, teacherName);
      navigate(`/school/${newCode}`);
    } catch (err) {
      console.error(err);
      setTeacherError(c('error'));
      setBusy(null);
    }
  };

  const join = async (event: FormEvent) => {
    event.preventDefault();
    if (code.length !== CLASS_CODE_LENGTH) {
      setStudentError(t('codeShort'));
      return;
    }
    setBusy('student');
    setStudentError('');
    const problem = await joinByCode(code, studentName, { noClass: t('noClass'), error: c('error') });
    if (problem) {
      setStudentError(problem);
      setBusy(null);
    } else {
      navigate(`/school/${code}`);
    }
  };

  return (
    <Shell>
      <section className={ui.stack}>
        <h1 className={ui.h1}>{t('title')}</h1>
        <p className={ui.lead}>{t('lead')}</p>
        <ol className={styles.steps}>
          {(['how1', 'how2', 'how3'] as const).map((key, i) => (
            <li key={key} className={styles.step}>
              <span className={styles.stepNo}>{i + 1}</span>
              <span>{t(key)}</span>
            </li>
          ))}
        </ol>
      </section>

      {!firebaseConfigured && <p className={ui.errorBox}>{t('unavailable')}</p>}

      <div className={styles.columns}>
        <form className={ui.card} onSubmit={create}>
          <h2 className={ui.h2}>{t('teacher')}</h2>
          <label className={ui.field}>
            <span className={ui.label}>{t('className')}</span>
            <input className={ui.input} required maxLength={60} value={className} placeholder={t('classPlaceholder')} onChange={e => setClassName(e.target.value)} />
          </label>
          <label className={ui.field}>
            <span className={ui.label}>{t('teacherName')}</span>
            <input className={ui.input} required maxLength={40} value={teacherName} placeholder={t('teacherPlaceholder')} onChange={e => setTeacherName(e.target.value)} />
          </label>
          <p className={ui.muted}>{c('signInHint')}</p>
          {teacherError && <p className={ui.errorBox}>{teacherError}</p>}
          <button type="submit" className={`${ui.btn} ${ui.primary}`} disabled={busy !== null || !firebaseConfigured}>{t('createClass')}</button>

          {teaching && teaching.length > 0 && (
            <div className={ui.stack}>
              <h3 className={ui.h3}>{t('myClasses')}</h3>
              {teaching.map(entry => (
                <Link key={entry.code} to={`/school/${entry.code}`} className={styles.classLink}>
                  <span>{entry.name}</span>
                  <code className={styles.code}>{entry.code}</code>
                </Link>
              ))}
            </div>
          )}
        </form>

        <form className={ui.card} onSubmit={join}>
          <h2 className={ui.h2}>{t('student')}</h2>
          <label className={ui.field}>
            <span className={ui.label}>{t('code')}</span>
            <input
              className={`${ui.input} ${styles.codeInput}`}
              required
              value={code}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              placeholder="ABC123"
              onChange={e => setCode(normalizeCode(e.target.value, CLASS_CODE_LENGTH))}
            />
          </label>
          <label className={ui.field}>
            <span className={ui.label}>{t('studentName')}</span>
            <input className={ui.input} required maxLength={40} value={studentName} onChange={e => setStudentName(e.target.value)} />
          </label>
          {studentError && <p className={ui.errorBox}>{studentError}</p>}
          <button type="submit" className={`${ui.btn} ${ui.primary}`} disabled={busy !== null || !firebaseConfigured}>{t('join')}</button>

          {joined.length > 0 && (
            <div className={ui.stack}>
              <h3 className={ui.h3}>{t('joined')}</h3>
              {joined.map(entry => (
                <Link key={entry.code} to={`/school/${entry.code}`} className={styles.classLink}>
                  <span>{entry.name}</span>
                  <code className={styles.code}>{entry.code}</code>
                </Link>
              ))}
            </div>
          )}
        </form>
      </div>
    </Shell>
  );
}
