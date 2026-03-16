import { useMemo } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { computeAllSummaries, computeTotalVault } from '../utils/calculations';

export function useAssetSummaries() {
  const transactions = useVaultStore((s) => s.transactions);
  const liveRates = useVaultStore((s) => s.liveRates);

  const summaries = useMemo(
    () => computeAllSummaries(transactions, liveRates),
    [transactions, liveRates],
  );

  const totals = useMemo(() => computeTotalVault(summaries), [summaries]);

  return { summaries, totals };
}
