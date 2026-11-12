import { createContext, useContext, type ReactNode } from 'react';
import type { Lang } from '../i18n/translations';
import { useLang } from './lang';

const LangContext = createContext<[Lang, (lang: Lang) => void]>(['ru', () => undefined]);

export function LangProvider({ children }: { children: ReactNode }) {
  const value = useLang();
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

/** The interface language for platform pages, shared with the Toguz Korgool game. */
export function usePlatformLang() {
  return useContext(LangContext);
}
