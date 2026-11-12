/**
 * Tournaments in Firestore: tournaments/{id}. Anyone with the link can follow a tournament;
 * only its organiser changes it. Pairings and standings come from platform/tournament.ts.
 */
import type { GameId } from '../catalog';
import { roundRobin, swissRound, type Format, type Round } from '../tournament';
import { currentUser, ensureUser } from './session';

export const MAX_PLAYERS = 64;

export interface Entrant {
  id: string;
  name: string;
}

export type TournamentStatus = 'running' | 'finished';

export interface Tournament {
  id: string;
  name: string;
  game: GameId;
  format: Format;
  plannedRounds: number;
  players: Entrant[];
  rounds: Round[];
  status: TournamentStatus;
  ownerUid: string;
  classCode: string | null;
  createdAt: number | null;
}

export type NewTournament = Pick<Tournament, 'name' | 'game' | 'format' | 'plannedRounds' | 'players' | 'rounds' | 'classCode'>;

type Unsubscribe = () => void;

function fromDoc(id: string, data: Record<string, unknown>): Tournament {
  return {
    id,
    name: String(data.name ?? ''),
    game: data.game as GameId,
    format: data.format as Format,
    plannedRounds: Number(data.plannedRounds ?? 0),
    players: (data.players as Entrant[]) ?? [],
    rounds: (data.rounds as Round[]) ?? [],
    status: (data.status as TournamentStatus) ?? 'running',
    ownerUid: String(data.ownerUid ?? ''),
    classCode: (data.classCode as string | null) ?? null,
    createdAt: (data.createdAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? null,
  };
}

export async function createTournament(input: NewTournament): Promise<string> {
  const { fb, user } = await ensureUser();
  const { db, fs } = fb;
  const ref = fs.doc(fs.collection(db, 'tournaments'));
  await fs.setDoc(ref, {
    ...input,
    name: input.name.trim().slice(0, 80),
    status: 'running',
    ownerUid: user.uid,
    createdAt: fs.serverTimestamp(),
    updatedAt: fs.serverTimestamp(),
  });
  return ref.id;
}

/**
 * Creates a tournament from a list of names in seeding order. A round robin gets its whole
 * schedule up front; a Swiss event gets its first round, the rest are paired as it goes.
 */
export async function startTournament(input: {
  name: string;
  game: GameId;
  format: Format;
  names: string[];
  swissRounds: number;
  classCode?: string | null;
}): Promise<string> {
  const players = input.names.map((name, i) => ({ id: `p${i + 1}`, name: name.trim().slice(0, 40) }));
  const ids = players.map(player => player.id);
  const rounds = input.format === 'round-robin' ? roundRobin(ids) : [swissRound(ids, [])];
  return createTournament({
    name: input.name,
    game: input.game,
    format: input.format,
    plannedRounds: input.format === 'round-robin' ? rounds.length : Math.max(1, Math.min(input.swissRounds, players.length - 1)),
    players,
    rounds,
    classCode: input.classCode ?? null,
  });
}

export async function updateTournament(id: string, changes: Partial<Pick<Tournament, 'rounds' | 'status' | 'name'>>): Promise<void> {
  const { fb } = await ensureUser();
  await fb.fs.updateDoc(fb.fs.doc(fb.db, 'tournaments', id), { ...changes, updatedAt: fb.fs.serverTimestamp() });
}

export async function deleteTournament(id: string): Promise<void> {
  const { fb } = await ensureUser();
  await fb.fs.deleteDoc(fb.fs.doc(fb.db, 'tournaments', id));
}

export async function myTournaments(): Promise<Tournament[]> {
  const { fb, user } = await currentUser();
  if (!user) return [];
  const { db, fs } = fb;
  const snapshot = await fs.getDocs(fs.query(fs.collection(db, 'tournaments'), fs.where('ownerUid', '==', user.uid)));
  return snapshot.docs
    .map(doc => fromDoc(doc.id, doc.data()))
    .sort((a, b) => (b.createdAt ?? Infinity) - (a.createdAt ?? Infinity));
}

/** Live tournament, plus the viewer's uid (null for visitors) to tell the organiser apart. */
export async function watchTournament(
  id: string,
  onChange: (tournament: Tournament | null, viewerUid: string | null) => void,
  onError: (error: unknown) => void,
): Promise<Unsubscribe> {
  const { fb, user } = await currentUser();
  const { db, fs } = fb;
  return fs.onSnapshot(
    fs.doc(db, 'tournaments', id),
    snapshot => onChange(snapshot.exists() ? fromDoc(snapshot.id, snapshot.data()) : null, user?.uid ?? null),
    onError,
  );
}
