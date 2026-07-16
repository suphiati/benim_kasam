import type { Locale } from '../utils/formatters';
import { tr, type TKey } from './tr';
import { en } from './en';

export type Lang = 'tr' | 'en';
export type { TKey };

export const LANGS: Lang[] = ['tr', 'en'];
export const LANG_LABEL: Record<Lang, string> = { tr: 'Türkçe', en: 'English' };
export const LOCALE: Record<Lang, Locale> = { tr: 'tr-TR', en: 'en-US' };

const DICT: Record<Lang, Record<TKey, string>> = { tr, en };

/**
 * Çoğul anahtar tabanları. Sözlükte `x_one` / `x_other` çiftleri olarak durur;
 * tp() hangisinin seçileceğini Intl.PluralRules'a sorar.
 * Türkçe sayıdan sonra çoğul yapmaz ("5 işlem") - tr tablosunda iki form da aynıdır,
 * ama CLDR tr'ye de one/other kategorilerini verdiği için mekanizma sorunsuz çalışır.
 */
export type PluralKey = { [K in TKey]: K extends `${infer B}_other` ? B : never }[TKey];

type Vars = Record<string, string | number>;

function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export function translate(lang: Lang, key: TKey, vars?: Vars): string {
  // Eksik anahtar TS'te yakalanır (en: Record<TKey, string>); bu yalnızca son çare.
  const text = DICT[lang][key] ?? DICT.tr[key] ?? key;
  return interpolate(text, vars);
}

const pluralRules = new Map<Lang, Intl.PluralRules>();
function getPluralRules(lang: Lang): Intl.PluralRules {
  let r = pluralRules.get(lang);
  if (!r) {
    r = new Intl.PluralRules(LOCALE[lang]);
    pluralRules.set(lang, r);
  }
  return r;
}

/** Sayıya bağlı metin. `n` otomatik olarak enterpolasyona geçer. */
export function translatePlural(lang: Lang, key: PluralKey, n: number, vars?: Vars): string {
  const category = getPluralRules(lang).select(n);
  const candidate = `${key}_${category}` as TKey;
  const finalKey = DICT[lang][candidate] !== undefined ? candidate : (`${key}_other` as TKey);
  return translate(lang, finalKey, { n, ...vars });
}

/**
 * Kayıtlı tercih > cihaz dili > Türkçe.
 * Prefix eşleşmesi: 'tr', 'tr-TR', 'tr-CY' hepsi Türkçe. Capacitor WebView'da
 * navigator.language cihaz dilini verir, yani tek kod yolu PWA + native'i kapsar.
 */
export function detectLang(): Lang {
  try {
    const nav = navigator.language?.toLowerCase() ?? '';
    if (nav.startsWith('tr')) return 'tr';
    if (nav.startsWith('en')) return 'en';
  } catch {
    // navigator yoksa varsayılana düş
  }
  return 'tr';
}
