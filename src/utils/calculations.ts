import type { Transaction, LiveRate, AssetSummary, AssetType } from '../types';

export function computeAssetSummary(
  assetType: AssetType,
  transactions: Transaction[],
  liveRates: LiveRate[],
): AssetSummary | null {
  const filtered = transactions.filter((t) => t.assetType === assetType);
  if (filtered.length === 0) return null;

  const totalAmount = filtered.reduce((sum, t) => sum + t.amount, 0);
  const totalCost = filtered.reduce((sum, t) => sum + t.totalCost, 0);
  const avgUnitPrice = totalCost / totalAmount;

  const rate = liveRates.find((r) => r.assetType === assetType);
  const currentUnitPrice = rate?.sellPrice ?? 0;
  const currentValue = totalAmount * currentUnitPrice;
  const profitLoss = currentValue - totalCost;
  const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

  return {
    assetType,
    totalAmount,
    totalCost,
    avgUnitPrice,
    currentUnitPrice,
    currentValue,
    profitLoss,
    profitLossPercent,
  };
}

export function computeAllSummaries(
  transactions: Transaction[],
  liveRates: LiveRate[],
): AssetSummary[] {
  const assetTypes = [...new Set(transactions.map((t) => t.assetType))];
  return assetTypes
    .map((type) => computeAssetSummary(type, transactions, liveRates))
    .filter((s): s is AssetSummary => s !== null);
}

export function computeTotalVault(summaries: AssetSummary[]) {
  const totalCost = summaries.reduce((sum, s) => sum + s.totalCost, 0);
  const totalValue = summaries.reduce((sum, s) => sum + s.currentValue, 0);
  const totalProfitLoss = totalValue - totalCost;
  const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

  return { totalCost, totalValue, totalProfitLoss, totalProfitLossPercent };
}
