import type { Transaction, LiveRate, AssetSummary, AssetType, BaseCurrency, FxSnapshot } from '../types';
import { toBase } from './currency';

export function computeAssetSummary(
  assetType: AssetType,
  transactions: Transaction[],
  liveRates: LiveRate[],
  base: BaseCurrency = 'TRY',
  fxToday: FxSnapshot | null = null,
): AssetSummary | null {
  const filtered = transactions.filter((t) => t.assetType === assetType);
  if (filtered.length === 0) return null;

  const buys = filtered.filter((t) => t.type === 'buy' || !t.type);
  const sells = filtered.filter((t) => t.type === 'sell');

  const totalBought = buys.reduce((sum, t) => sum + t.amount, 0);
  const totalSold = sells.reduce((sum, t) => sum + t.amount, 0);
  const totalAmount = totalBought - totalSold;

  // Maliyet/hasılat her işlemin KENDİ tarihindeki kuruyla çevrilir. Toplayıp sonra
  // bugünkü kurla çevirmek K/Z'yi bozar: ₺ enflasyonu geçmiş maliyeti olduğundan
  // ucuz gösterir ve herkesi dâhi yatırımcı gibi kâra geçirir.
  // Damga yoksa (eski kayıt/backfill başarısız) bugünkü kura düşeriz — yaklaşık; UI işaretler.
  const costInBase = (t: Transaction) => toBase(t.totalCost, t.fxSnapshot ?? fxToday, base);
  const totalCost = buys.reduce((sum, t) => sum + costInBase(t), 0);
  const totalSellRevenue = sells.reduce((sum, t) => sum + costInBase(t), 0);

  const avgUnitPrice = totalBought > 0 ? totalCost / totalBought : 0;
  const realizedPL = totalSold > 0 ? totalSellRevenue - (avgUnitPrice * totalSold) : 0;

  const rate = liveRates.find((r) => r.assetType === assetType);
  // Elimizdeki varlığı ŞU AN bozdursak alacağımız fiyat = kuyumcunun/bankanın ALIŞ fiyatı (buyPrice).
  // Satış (sellPrice) müşterinin aldığı yüksek fiyattır; değerlemede kullanmak portföyü şişirir.
  // Güncel değer bugünkü kurla çevrilir (maliyetin aksine).
  const currentUnitPrice = toBase(rate?.buyPrice ?? 0, fxToday, base);
  const currentValue = totalAmount * currentUnitPrice;
  const remainingCost = totalAmount * avgUnitPrice;
  const unrealizedPL = currentValue - remainingCost;
  const unrealizedPLPercent = remainingCost > 0 ? (unrealizedPL / remainingCost) * 100 : 0;
  const totalPL = realizedPL + unrealizedPL;

  return {
    assetType,
    totalAmount,
    totalBought,
    totalSold,
    totalCost,
    totalSellRevenue,
    realizedPL,
    avgUnitPrice,
    currentUnitPrice,
    currentValue,
    unrealizedPL,
    unrealizedPLPercent,
    totalPL,
    buyCount: buys.length,
    sellCount: sells.length,
  };
}

export function computeAllSummaries(
  transactions: Transaction[],
  liveRates: LiveRate[],
  base: BaseCurrency = 'TRY',
  fxToday: FxSnapshot | null = null,
): AssetSummary[] {
  const assetTypes = [...new Set(transactions.map((t) => t.assetType))];
  return assetTypes
    .map((type) => computeAssetSummary(type, transactions, liveRates, base, fxToday))
    .filter((s): s is AssetSummary => s !== null);
}

export function computeTotalVault(summaries: AssetSummary[]) {
  const totalCost = summaries.reduce((sum, s) => sum + s.totalCost, 0);
  const totalValue = summaries.reduce((sum, s) => sum + s.currentValue, 0);
  const totalSellRevenue = summaries.reduce((sum, s) => sum + s.totalSellRevenue, 0);
  const totalRealizedPL = summaries.reduce((sum, s) => sum + s.realizedPL, 0);
  const totalUnrealizedPL = summaries.reduce((sum, s) => sum + s.unrealizedPL, 0);
  const totalPL = totalRealizedPL + totalUnrealizedPL;
  const netInvestment = totalCost - totalSellRevenue;
  const totalPLPercent = netInvestment > 0 ? (totalPL / netInvestment) * 100 : 0;

  return { totalCost, totalValue, totalSellRevenue, totalRealizedPL, totalUnrealizedPL, totalPL, totalPLPercent };
}
