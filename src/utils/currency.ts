import type { BaseCurrency, FxSnapshot, LiveRate } from '../types';

export const BASE_CURRENCIES: BaseCurrency[] = ['TRY', 'USD', 'EUR'];

export const CURRENCY_META: Record<BaseCurrency, { label: string; symbol: string }> = {
  TRY: { label: 'Türk Lirası', symbol: '₺' },
  USD: { label: 'Amerikan Doları', symbol: '$' },
  EUR: { label: 'Euro', symbol: '€' },
};

/**
 * Canlı kurlardan bugünkü FX damgasını çıkarır (1 birim yabancı para = kaç TRY).
 *
 * ALIŞ (buyPrice) konvansiyonu bilinçli: varlık değerlemesi de buyPrice kullanıyor
 * (bkz. calculations.ts). Aynı tarafı kullanmak self-reference'ı tam tutuyor —
 * taban USD iken 100 USD tam "100 USD" görünür. Mid kur kullansaydık
 * 100 x 40 / 40,2 = 99,5 USD çıkar, kullanıcı haklı olarak "hani 100 dolarım vardı?" derdi.
 */
export function getFxToday(liveRates: LiveRate[]): FxSnapshot | null {
  const usd = liveRates.find((r) => r.assetType === 'USD')?.buyPrice;
  const eur = liveRates.find((r) => r.assetType === 'EUR')?.buyPrice;
  if (!usd || !eur || usd <= 0 || eur <= 0) return null;
  return { USD: usd, EUR: eur };
}

/**
 * TRY cinsinden bir değeri taban para birimine çevirir.
 * `fx` = ilgili AN'da geçerli kur: güncel değer için bugünkü kur, maliyet için
 * işlemin KENDİ damgası (tx.fxSnapshot) verilmeli.
 * Kur yoksa 0 döner — kurlar yüklenmeden zaten currentValue de 0 (calculations.ts).
 */
export function toBase(
  tryValue: number,
  fx: FxSnapshot | null | undefined,
  base: BaseCurrency,
): number {
  if (base === 'TRY') return tryValue;
  const rate = fx?.[base];
  if (!rate || rate <= 0) return 0;
  return tryValue / rate;
}

/**
 * İşlemin kur damgası yoksa (eski kayıt veya backfill başarısız) taban para
 * cinsinden maliyeti yaklaşıktır — bugünkü kura düşülür. UI bunu işaretler,
 * backfill sonraki açılışta tekrar dener.
 */
export function isFxApprox(tx: { fxSnapshot?: FxSnapshot }, base: BaseCurrency): boolean {
  return base !== 'TRY' && !tx.fxSnapshot;
}
