import { useMemo } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { computeAllSummaries, computeTotalVault } from '../utils/calculations';
import { getFxToday } from '../utils/currency';

export function useAssetSummaries() {
  const transactions = useVaultStore((s) => s.transactions);
  const liveRates = useVaultStore((s) => s.liveRates);
  const baseCurrency = useVaultStore((s) => s.baseCurrency);

  const fxToday = useMemo(() => getFxToday(liveRates), [liveRates]);

  const summaries = useMemo(
    () => computeAllSummaries(transactions, liveRates, baseCurrency, fxToday),
    [transactions, liveRates, baseCurrency, fxToday],
  );

  const totals = useMemo(() => computeTotalVault(summaries), [summaries]);

  return { summaries, totals };
}
