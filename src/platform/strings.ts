import type { Lang } from '../i18n/translations';

export type Vars = Record<string, string | number>;

/** A piece of content written in every interface language. */
export type Text = Record<Lang, string>;

/**
 * Typed dictionaries for platform pages. Russian is the reference: Kyrgyz and English must
 * provide every key, so a missing translation is a compile error rather than a blank label.
 */
export function defineStrings<T extends Record<string, string>>(dict: {
  ru: T;
  ky: { [K in keyof T]: string };
  en: { [K in keyof T]: string };
}) {
  return (lang: Lang, key: keyof T, vars?: Vars): string => {
    let text: string = (dict[lang] ?? dict.ru)[key] ?? dict.ru[key];
    if (vars) text = text.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ''));
    return text;
  };
}

/** Russian-style plural forms; Kyrgyz and English use the first/second form. */
export function plural(lang: Lang, n: number, forms: { ru: [string, string, string]; ky: string; en: [string, string] }) {
  if (lang === 'ky') return forms.ky;
  if (lang === 'en') return n === 1 ? forms.en[0] : forms.en[1];
  const mod100 = Math.abs(n) % 100;
  const mod10 = mod100 % 10;
  if (mod100 >= 11 && mod100 <= 19) return forms.ru[2];
  if (mod10 === 1) return forms.ru[0];
  if (mod10 >= 2 && mod10 <= 4) return forms.ru[1];
  return forms.ru[2];
}
