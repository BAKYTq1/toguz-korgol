/**
 * School classes in Firestore:
 *   classes/{code}                 { name, teacherUid, teacherName, createdAt }
 *   classes/{code}/students/{uid}  { name, lessons[], puzzles[], joinedAt, updatedAt }
 * The teacher sees every student's progress; a student only writes their own entry.
 */
import { readProgress, rememberClass, type Progress } from '../../learn/progress';
import { currentUser, ensureUser, randomCode } from './session';

export const CLASS_CODE_LENGTH = 6;

export interface SchoolClass {
  code: string;
  name: string;
  teacherUid: string;
  teacherName: string;
}

export interface Student {
  uid: string;
  name: string;
  lessons: string[];
  puzzles: string[];
  updatedAt: number | null;
}

type Unsubscribe = () => void;

export async function createClass(name: string, teacherName: string): Promise<string> {
  const { fb, user } = await ensureUser();
  const { db, fs } = fb;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode(CLASS_CODE_LENGTH);
    const ref = fs.doc(db, 'classes', code);
    const created = await fs.runTransaction(db, async transaction => {
      if ((await transaction.get(ref)).exists()) return false;
      transaction.set(ref, {
        name: name.trim().slice(0, 60),
        teacherUid: user.uid,
        teacherName: teacherName.trim().slice(0, 40),
        createdAt: fs.serverTimestamp(),
      });
      return true;
    });
    if (created) return code;
  }
  throw new Error('Could not pick a free class code');
}

/** The class with this code (null if there is none) and the viewer's uid. */
export async function openClass(code: string): Promise<{ schoolClass: SchoolClass | null; uid: string }> {
  const { fb, user } = await ensureUser();
  const snapshot = await fb.fs.getDoc(fb.fs.doc(fb.db, 'classes', code));
  if (!snapshot.exists()) return { schoolClass: null, uid: user.uid };
  const data = snapshot.data();
  return {
    schoolClass: { code, name: String(data.name), teacherUid: String(data.teacherUid), teacherName: String(data.teacherName ?? '') },
    uid: user.uid,
  };
}

export async function myTeachingClasses(): Promise<SchoolClass[]> {
  const { fb, user } = await currentUser();
  if (!user) return [];
  const { db, fs } = fb;
  const snapshot = await fs.getDocs(fs.query(fs.collection(db, 'classes'), fs.where('teacherUid', '==', user.uid)));
  return snapshot.docs.map(doc => ({
    code: doc.id,
    name: String(doc.data().name),
    teacherUid: user.uid,
    teacherName: String(doc.data().teacherName ?? ''),
  }));
}

export async function joinClass(code: string, studentName: string, progress: Progress): Promise<void> {
  const { fb, user } = await ensureUser();
  const { db, fs } = fb;
  await fs.setDoc(fs.doc(db, 'classes', code, 'students', user.uid), {
    name: studentName.trim().slice(0, 40),
    lessons: progress.lessons.slice(0, 200),
    puzzles: progress.puzzles.slice(0, 500),
    joinedAt: fs.serverTimestamp(),
    updatedAt: fs.serverTimestamp(),
  });
}

export async function syncStudentProgress(code: string, progress: Progress): Promise<void> {
  const { fb, user } = await ensureUser();
  const { db, fs } = fb;
  await fs.updateDoc(fs.doc(db, 'classes', code, 'students', user.uid), {
    lessons: progress.lessons.slice(0, 200),
    puzzles: progress.puzzles.slice(0, 500),
    updatedAt: fs.serverTimestamp(),
  });
}

export async function leaveClass(code: string): Promise<void> {
  const { fb, user } = await currentUser();
  if (!user) return;
  await fb.fs.deleteDoc(fb.fs.doc(fb.db, 'classes', code, 'students', user.uid));
}

/** Live list of a class's students (teacher only). */
export async function watchStudents(code: string, onChange: (students: Student[]) => void, onError: (error: unknown) => void): Promise<Unsubscribe> {
  const { fb } = await ensureUser();
  const { db, fs } = fb;
  return fs.onSnapshot(
    fs.collection(db, 'classes', code, 'students'),
    snapshot => {
      onChange(
        snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              uid: doc.id,
              name: String(data.name ?? ''),
              lessons: Array.isArray(data.lessons) ? data.lessons : [],
              puzzles: Array.isArray(data.puzzles) ? data.puzzles : [],
              updatedAt: data.updatedAt?.toMillis?.() ?? null,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    },
    onError,
  );
}

export async function removeStudent(code: string, uid: string): Promise<void> {
  const { fb } = await ensureUser();
  await fb.fs.deleteDoc(fb.fs.doc(fb.db, 'classes', code, 'students', uid));
}

/** Joins a class by code; resolves to an error message, or '' once the student is in. */
export async function joinByCode(code: string, name: string, messages: { noClass: string; error: string }): Promise<string> {
  try {
    const { schoolClass } = await openClass(code);
    if (!schoolClass) return messages.noClass;
    await joinClass(code, name, readProgress());
    rememberClass({ code, name: schoolClass.name });
    return '';
  } catch (err) {
    console.error(err);
    return messages.error;
  }
}
