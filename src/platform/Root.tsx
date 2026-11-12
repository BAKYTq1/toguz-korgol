/**
 * The platform: a catalogue of traditional games plus learning, tournaments and school classes.
 * Every page is its own chunk, so opening one game does not download the others.
 */
import { lazy, Suspense, useEffect, type ComponentType } from 'react';
import { LangProvider } from './LangContext';
import { matchRoute, navigate, useLocation } from './router';

const ToguzApp = lazy(() => import('../App'));
const HomePage = lazy(() => import('../pages/HomePage'));
const MangalaPage = lazy(() => import('../pages/MangalaPage'));
const OrdoPage = lazy(() => import('../pages/OrdoPage'));
const LearnPage = lazy(() => import('../pages/LearnPage'));
const LessonPage = lazy(() => import('../pages/LessonPage'));
const PuzzlePage = lazy(() => import('../pages/PuzzlePage'));
const TournamentsPage = lazy(() => import('../pages/TournamentsPage'));
const TournamentPage = lazy(() => import('../pages/TournamentPage'));
const SchoolPage = lazy(() => import('../pages/SchoolPage'));
const ClassPage = lazy(() => import('../pages/ClassPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

type Page = ComponentType<{ params: Record<string, string> }>;

const ROUTES: [string, Page][] = [
  ['/', HomePage],
  ['/toguz-korgool', ToguzApp as Page],
  ['/mangala', MangalaPage],
  ['/ordo', OrdoPage],
  ['/learn', LearnPage],
  ['/learn/:lessonId', LessonPage],
  ['/puzzles/:puzzleId', PuzzlePage],
  ['/tournaments', TournamentsPage],
  ['/tournaments/:id', TournamentPage],
  ['/school', SchoolPage],
  ['/school/:code', ClassPage],
];

export const TOGUZ_PATH = '/toguz-korgool';

export default function Root() {
  const { path, search } = useLocation();

  // Invite links shared before the platform existed point at '/?room=CODE': they open the game.
  const legacyInvite = path === '/' && search.has('room');
  useEffect(() => {
    if (legacyInvite) navigate(`${TOGUZ_PATH}?room=${encodeURIComponent(search.get('room') ?? '')}`, { replace: true });
  }, [legacyInvite, search]);

  // Each page starts at the top.
  useEffect(() => {
    document.querySelector('main')?.parentElement?.scrollTo?.(0, 0);
  }, [path]);

  let Page: Page = NotFoundPage;
  let params: Record<string, string> = {};
  for (const [pattern, component] of ROUTES) {
    const match = matchRoute(pattern, path);
    if (match) {
      Page = component;
      params = match;
      break;
    }
  }

  if (legacyInvite) return null;

  return (
    // Remounted when leaving the game, whose settings window can change the language too.
    <LangProvider key={path === TOGUZ_PATH ? 'game' : 'platform'}>
      <Suspense fallback={null}>
        <Page key={path} params={params} />
      </Suspense>
    </LangProvider>
  );
}
