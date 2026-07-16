import { useCallback } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { translate, translatePlural, LOCALE, type TKey, type PluralKey } from '../i18n';
import {
  formatNumber as fmtNumber,
  formatDate as fmtDate,
  formatPercent as fmtPercent,
} from '../utils/formatters';

type Vars = Record<string, string | number>;

/**
 * Metin gösteren bileşenlerin tek girişi - useCurrency'nin dil karşılığı.
 *
 * `t`  - düz metin. `t('vault.emptyHint', { tab: t('nav.add') })` gibi enterpolasyon.
 * `tp` - sayıya bağlı metin; `n` otomatik enterpolasyona girer.
 *
 * formatNumber/formatDate/formatPercent burada locale'e BAĞLANMIŞ döner:
 * bileşenler utils/formatters'ı doğrudan çağırırsa varsayılan tr-TR'ye düşer ve
 * dil değişince sayılar/tarihler eski locale'de kalır. Hep buradan al.
 */
export function useT() {
  const lang = useVaultStore((s) => s.language);
  const locale = LOCALE[lang];

  const t = useCallback((key: TKey, vars?: Vars) => translate(lang, key, vars), [lang]);

  const tp = useCallback(
    (key: PluralKey, n: number, vars?: Vars) => translatePlural(lang, key, n, vars),
    [lang],
  );

  const formatNumber = useCallback((value: number) => fmtNumber(value, locale), [locale]);
  const formatDate = useCallback((dateStr: string) => fmtDate(dateStr, locale), [locale]);
  const formatPercent = useCallback((value: number) => fmtPercent(value, locale), [locale]);

  return { t, tp, lang, locale, formatNumber, formatDate, formatPercent };
}
