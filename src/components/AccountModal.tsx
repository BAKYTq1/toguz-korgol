import { useEffect, useState, type FormEvent } from 'react';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { Lang, t, type TranslationKey } from '../i18n/translations';
import { firebaseAuth, firestore } from '../lib/firebase';
import {
  adoptAccountName,
  ensureUserProfile,
  localStatsAlreadyImported,
  markLocalStatsImported,
  mergeGuestProfile,
  saveUserProfile,
  type ProfileStats,
  type UserProfile,
} from '../lib/profile';
import styles from './AccountModal.module.css';

interface AccountModalProps {
  show: boolean;
  lang: Lang;
  sessionBusy: boolean;
  localStats: ProfileStats;
  onClose: () => void;
}

const achievements = [
  { title: 'achievementFirstWin', description: 'achievementFirstWinDesc', earned: (p: UserProfile) => p.stats.wins >= 1 },
  { title: 'achievementFiveWins', description: 'achievementFiveWinsDesc', earned: (p: UserProfile) => p.stats.wins >= 5 },
  { title: 'achievementTenWins', description: 'achievementTenWinsDesc', earned: (p: UserProfile) => p.stats.wins >= 10 },
  { title: 'achievementTenGames', description: 'achievementTenGamesDesc', earned: (p: UserProfile) => p.stats.wins + p.stats.losses + p.stats.draws >= 10 },
] as const;

const AUTH_ERRORS: Record<string, TranslationKey> = {
  'auth/email-already-in-use': 'errEmailInUse',
  'auth/credential-already-in-use': 'errEmailInUse',
  'auth/invalid-email': 'errInvalidEmail',
  'auth/missing-email': 'errInvalidEmail',
  'auth/weak-password': 'errWeakPassword',
  'auth/wrong-password': 'errWrongPassword',
  'auth/invalid-credential': 'errWrongPassword',
  'auth/invalid-login-credentials': 'errWrongPassword',
  'auth/user-not-found': 'errWrongPassword',
  'auth/too-many-requests': 'errTooMany',
  'auth/popup-closed-by-user': 'errPopupClosed',
  'auth/cancelled-popup-request': 'errPopupClosed',
  'auth/popup-blocked': 'errPopupBlocked',
  'auth/network-request-failed': 'errNetwork',
  'unavailable': 'errNetwork',
  'auth/operation-not-allowed': 'errProviderDisabled',
  'auth/admin-restricted-operation': 'errProviderDisabled',
  'auth/unauthorized-domain': 'errUnauthorizedDomain',
  'permission-denied': 'errPermission',
  'session-busy': 'accountBusyGame',
};

function describeError(err: unknown, lang: Lang): string {
  const code = (err as { code?: string } | null)?.code;
  if (code && AUTH_ERRORS[code]) return t(lang, AUTH_ERRORS[code]);
  console.error(err);
  return t(lang, 'errGeneric');
}

export default function AccountModal({ show, lang, sessionBusy, localStats, onClose }: AccountModalProps) {
  const [user, setUser] = useState<User | null>(firebaseAuth?.currentUser ?? null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!firebaseAuth) return;
    return onAuthStateChanged(firebaseAuth, setUser);
  }, []);

  // Everyone gets at least a guest account so stats and the profile work right away.
  useEffect(() => {
    if (!show || !firebaseAuth || user) return;
    void signInAnonymously(firebaseAuth).catch(err => setError(describeError(err, lang)));
  }, [show, user, lang]);

  useEffect(() => {
    const db = firestore;
    if (!show || !user || !db) return;
    let unsubscribe: (() => void) | undefined;
    let active = true;
    setProfile(null);
    const legacy = localStatsAlreadyImported() ? undefined : localStats;
    void ensureUserProfile(user, lang, legacy).then(() => {
      if (legacy) markLocalStatsImported();
      if (!active) return;
      unsubscribe = onSnapshot(doc(db, 'profiles', user.uid), snapshot => {
        if (!snapshot.exists()) return;
        const data = snapshot.data() as UserProfile;
        setProfile(data);
        setDisplayName(data.displayName ?? '');
        setBio(data.bio ?? '');
      }, err => setError(describeError(err, lang)));
    }).catch(err => setError(describeError(err, lang)));
    return () => {
      active = false;
      unsubscribe?.();
    };
    // localStats is read only once per device, so finished games need not re-run this.
  }, [show, user?.uid, lang]);

  if (!show) return null;

  const resetMessages = () => {
    setError('');
    setNotice('');
  };

  const runAuthAction = async (action: () => Promise<User>, successKey: TranslationKey) => {
    setBusy(true);
    resetMessages();
    try {
      const signedUser = await action();
      await ensureUserProfile(signedUser, lang);
      await adoptAccountName(signedUser);
      setUser(signedUser);
      setMode('register');
      setPassword('');
      setNotice(t(lang, successKey));
    } catch (err) {
      setError(describeError(err, lang));
    } finally {
      setBusy(false);
    }
  };

  // Signing in to an existing account switches the uid, so the guest's results are merged into it.
  const guestToMerge = () => (user?.isAnonymous && profile ? { uid: user.uid, profile } : null);

  const blockedByOnlineGame = () => {
    if (!sessionBusy) return false;
    setError(t(lang, 'accountBusyGame'));
    return true;
  };

  const handleEmailRegister = () => {
    const auth = firebaseAuth;
    if (!auth || !email.trim() || password.length < 6) return;
    void runAuthAction(async () => {
      const credential = EmailAuthProvider.credential(email.trim(), password);
      // Linking keeps the guest uid, so the current profile and stats simply become the account's.
      if (auth.currentUser?.isAnonymous) {
        return (await linkWithCredential(auth.currentUser, credential)).user;
      }
      return (await createUserWithEmailAndPassword(auth, email.trim(), password)).user;
    }, 'accountCreated');
  };

  const handleEmailLogin = () => {
    const auth = firebaseAuth;
    if (!auth || !email.trim() || !password) return;
    if (blockedByOnlineGame()) return;
    const guest = guestToMerge();
    void runAuthAction(async () => {
      const signedUser = (await signInWithEmailAndPassword(auth, email.trim(), password)).user;
      await ensureUserProfile(signedUser, lang);
      if (guest) await mergeGuestProfile(signedUser.uid, guest.uid, guest.profile);
      return signedUser;
    }, 'signedIn');
  };

  const handleGoogle = () => {
    const auth = firebaseAuth;
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const guest = guestToMerge();
    void runAuthAction(async () => {
      if (auth.currentUser?.isAnonymous) {
        try {
          return (await linkWithPopup(auth.currentUser, provider)).user;
        } catch (err) {
          // This Google account already has a profile: sign in to it with the credential from the
          // same popup (a second popup would be blocked) and carry the guest's results over.
          const credential = GoogleAuthProvider.credentialFromError(err as never);
          const code = (err as { code?: string }).code;
          if (!credential || (code !== 'auth/credential-already-in-use' && code !== 'auth/email-already-in-use')) throw err;
          if (sessionBusy) throw Object.assign(new Error('busy'), { code: 'session-busy' });
          const signedUser = (await signInWithCredential(auth, credential)).user;
          await ensureUserProfile(signedUser, lang);
          if (guest) await mergeGuestProfile(signedUser.uid, guest.uid, guest.profile);
          return signedUser;
        }
      }
      return (await signInWithPopup(auth, provider)).user;
    }, 'signedIn');
  };

  const handleSignOut = async () => {
    const auth = firebaseAuth;
    if (!auth || blockedByOnlineGame()) return;
    setBusy(true);
    resetMessages();
    try {
      await signOut(auth);
      setProfile(null);
      setEmail('');
      setPassword('');
      setMode('login');
      setNotice(t(lang, 'signedOut'));
    } catch (err) {
      setError(describeError(err, lang));
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async () => {
    const auth = firebaseAuth;
    if (!auth) return;
    if (!email.trim()) {
      setError(t(lang, 'enterEmailFirst'));
      return;
    }
    setBusy(true);
    resetMessages();
    try {
      auth.languageCode = lang;
      await sendPasswordResetEmail(auth, email.trim());
      setNotice(t(lang, 'resetSent'));
    } catch (err) {
      setError(describeError(err, lang));
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !displayName.trim()) return;
    setBusy(true);
    resetMessages();
    try {
      await saveUserProfile(user.uid, displayName, bio);
      setNotice(t(lang, 'profileSaved'));
    } catch (err) {
      setError(describeError(err, lang));
    } finally {
      setBusy(false);
    }
  };

  const handleAuthSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (mode === 'register') handleEmailRegister();
    else handleEmailLogin();
  };

  const totalGames = profile ? profile.stats.wins + profile.stats.losses + profile.stats.draws : 0;
  const isGuest = user?.isAnonymous ?? true;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="account-title" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.box}>
        <div className={styles.heading}>
          <div>
            <h3 className={styles.title} id="account-title">{t(lang, 'accountTitle')}</h3>
            <p className={styles.identity}>{isGuest ? t(lang, 'guestAccount') : user?.email ?? user?.displayName}</p>
          </div>
          <button className={styles.iconClose} onClick={onClose} aria-label={t(lang, 'onlineClose')}>×</button>
        </div>

        {!user || !profile ? (
          !error && <p className={styles.loading}>{t(lang, 'onlineConnecting')}</p>
        ) : (
          <>
            <div className={styles.stats}>
              <div><strong>{profile.stats.wins}</strong><span>{t(lang, 'statsWins')}</span></div>
              <div><strong>{profile.stats.losses}</strong><span>{t(lang, 'statsLosses')}</span></div>
              <div><strong>{profile.stats.draws}</strong><span>{t(lang, 'statsDraws')}</span></div>
              <div><strong>{totalGames}</strong><span>{t(lang, 'gamesPlayed')}</span></div>
            </div>

            <h4 className={styles.sectionTitle}>{t(lang, 'achievements')}</h4>
            <div className={styles.achievements}>
              {achievements.map(item => {
                const earned = item.earned(profile);
                return (
                  <div className={`${styles.achievement} ${earned ? styles.earned : ''}`} key={item.title}>
                    <span className={styles.badge} aria-hidden="true">{earned ? '✦' : '◇'}</span>
                    <span><b>{t(lang, item.title)}</b><small>{earned ? t(lang, item.description) : t(lang, 'achievementLocked')}</small></span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSave}>
              <h4 className={styles.sectionTitle}>{t(lang, 'profileName')}</h4>
              <label className={styles.fieldLabel} htmlFor="profile-name">{t(lang, 'profileName')}</label>
              <input id="profile-name" className={styles.input} value={displayName} maxLength={28} autoComplete="nickname" onChange={e => setDisplayName(e.target.value)} />
              <label className={styles.fieldLabel} htmlFor="profile-bio">{t(lang, 'profileAbout')}</label>
              <textarea id="profile-bio" className={styles.input} value={bio} maxLength={160} rows={2} onChange={e => setBio(e.target.value)} />
              <button type="submit" className={styles.primaryButton} disabled={busy || !displayName.trim()}>{t(lang, 'saveProfile')}</button>
            </form>
          </>
        )}

        {user && isGuest && (
          <>
            <div className={styles.separator} />
            <h4 className={styles.sectionTitle}>{t(lang, mode === 'register' ? 'registerEmail' : 'loginEmail')}</h4>
            {mode === 'register' && <p className={styles.upgradeHint}>{t(lang, 'accountUpgradeHint')}</p>}
            <form onSubmit={handleAuthSubmit}>
              <label className={styles.fieldLabel} htmlFor="account-email">{t(lang, 'accountEmail')}</label>
              <input id="account-email" className={styles.input} type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
              <label className={styles.fieldLabel} htmlFor="account-password">{t(lang, 'passwordLabel')}</label>
              <input id="account-password" className={styles.input} type="password" minLength={6} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} />
              {mode === 'register' && <p className={styles.fieldHint}>{t(lang, 'passwordHint')}</p>}
              <button type="submit" className={styles.primaryButton} disabled={busy || !email.trim() || password.length < 6}>
                {t(lang, mode === 'register' ? 'createAccount' : 'loginEmail')}
              </button>
            </form>
            <button className={styles.googleButton} onClick={handleGoogle} disabled={busy}>
              <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>
              {t(lang, 'continueGoogle')}
            </button>
            <div className={styles.linkRow}>
              <button className={styles.modeButton} onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); resetMessages(); }} disabled={busy}>
                {t(lang, mode === 'register' ? 'haveAccount' : 'noAccount')}
              </button>
              {mode === 'login' && (
                <button className={styles.modeButton} onClick={() => void handleResetPassword()} disabled={busy}>
                  {t(lang, 'forgotPassword')}
                </button>
              )}
            </div>
          </>
        )}

        {user && !isGuest && (
          <button className={styles.signOutButton} onClick={() => void handleSignOut()} disabled={busy}>
            {t(lang, 'signOut')}
          </button>
        )}

        {error && <div className={styles.error} role="alert">{error}</div>}
        {notice && <div className={styles.notice} role="status">{notice}</div>}
      </div>
    </div>
  );
}
