import { useCallback } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { formatCurrency } from '../utils/formatters';
import { CURRENCY_META, getFxToday, toBase } from '../utils/currency';
import type { FxSnapshot } from '../types';

/**
 * Para gösteren bileşenlerin tek girişi. formatCurrency'yi doğrudan çağırmak yerine
 * bunu kullan: taban para birimi değişince tüm ekran birlikte döner.
 *
 * `format`  - zaten taban para cinsinden olan bir değeri yazdırır (summary'ler öyle gelir).
 * `fromTry` - TRY cinsinden ham bir değeri (canlı kur, tek işlem) çevirip yazdırır.
 */
export function useCurrency() {
  const currency = useVaultStore((s) => s.baseCurrency);
  const liveRates = useVaultStore((s) => s.liveRates);

  const format = useCallback((value: number) => formatCurrency(value, currency), [currency]);

  // TRY ham değer -> taban para. `fx` verilmezse bugünkü kur kullanılır; işlem
  // gösterirken işlemin KENDİ damgasını (tx.fxSnapshot) geçmek gerekir.
  const fromTry = useCallback(
    (tryValue: number, fx?: FxSnapshot) => {
      const rate = fx ?? getFxToday(liveRates);
      return formatCurrency(toBase(tryValue, rate, currency), currency);
    },
    [currency, liveRates],
  );

  return { format, fromTry, currency, symbol: CURRENCY_META[currency].symbol };
}
