/**
 * Learning progress: kept on the device, and copied to every school class the student joined
 * so the teacher can follow it.
 */
import { useEffect, useState } from 'react';

export interface Progress {
  lessons: string[];
  puzzles: string[];
}

export interface JoinedClass {
  code: string;
  name: string;
}

const PROGRESS_KEY = 'nomad_progress';
const CLASSES_KEY = 'nomad_classes';
const listeners = new Set<() => void>();

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode: progress lasts for this visit only.
  }
  listeners.forEach(listener => listener());
}

export function readProgress(): Progress {
  const saved = read<Progress>(PROGRESS_KEY, { lessons: [], puzzles: [] });
  return { lessons: [...saved.lessons], puzzles: [...saved.puzzles] };
}

export function readJoinedClasses(): JoinedClass[] {
  return read<{ list: JoinedClass[] }>(CLASSES_KEY, { list: [] }).list;
}

export function rememberClass(joined: JoinedClass) {
  const list = readJoinedClasses().filter(entry => entry.code !== joined.code);
  write(CLASSES_KEY, { list: [...list, joined] });
}

export function forgetClass(code: string) {
  write(CLASSES_KEY, { list: readJoinedClasses().filter(entry => entry.code !== code) });
}

async function syncToClasses(progress: Progress) {
  const classes = readJoinedClasses();
  if (classes.length === 0) return;
  const { syncStudentProgress } = await import('../platform/data/classes');
  await Promise.all(classes.map(entry => syncStudentProgress(entry.code, progress).catch(error => {
    console.warn('Could not sync progress to class', entry.code, error);
  })));
}

function complete(kind: keyof Progress, id: string) {
  const progress = readProgress();
  if (progress[kind].includes(id)) return;
  progress[kind].push(id);
  write(PROGRESS_KEY, progress);
  void syncToClasses(progress);
}

export const completeLesson = (id: string) => complete('lessons', id);
export const solvePuzzle = (id: string) => complete('puzzles', id);

function useStored<T>(readValue: () => T): T {
  const [value, setValue] = useState(readValue);
  useEffect(() => {
    const update = () => setValue(readValue());
    listeners.add(update);
    window.addEventListener('storage', update);
    return () => {
      listeners.delete(update);
      window.removeEventListener('storage', update);
    };
  }, [readValue]);
  return value;
}

export const useProgress = () => useStored(readProgress);
export const useJoinedClasses = () => useStored(readJoinedClasses);
