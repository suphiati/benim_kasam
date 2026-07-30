import { TrendingUp, TrendingDown, Wallet, PiggyBank, BarChart3 } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import { useT } from '../../hooks/useT';
import { useVaultStore } from '../../store/vaultStore';
import { BASE_CURRENCIES, CURRENCY_META } from '../../utils/currency';

interface TotalVaultCardProps {
  totalValue: number;
  totalCost: number;
  totalRealizedPL: number;
  totalUnrealizedPL: number;
  totalPL: number;
  totalPLPercent: number;
}

export function TotalVaultCard({ totalValue, totalCost, totalRealizedPL, totalUnrealizedPL, totalPL, totalPLPercent }: TotalVaultCardProps) {
  const { format } = useCurrency();
  // formatPercent locale'e bağlı: utils'ten doğrudan alsaydık dil değişince
  // yüzde tr-TR biçiminde (%12,34) kalırdı - en-US'te 12.34% olmalı.
  const { t, formatPercent } = useT();
  const baseCurrency = useVaultStore((s) => s.baseCurrency);
  const setBaseCurrency = useVaultStore((s) => s.setBaseCurrency);
  const isProfit = totalPL >= 0;

  return (
    <div className="bg-gradient-to-br from-vault-800 to-vault-900 text-white rounded-2xl p-5 mx-4 mt-4 shadow-lg">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-gold-400" />
          <p className="text-vault-300 text-sm">{t('vault.totalValue')}</p>
        </div>
        {/* Para birimi seçimi burada, kasanın üstünde: "hangisini seçersen kasa ona
            döner" - Ayarlar'a gömmek yerine doğrudan erişilebilir. */}
        <div role="group" aria-label={t('vault.currencyLabel')} className="flex bg-vault-900/60 rounded-full p-0.5">
          {BASE_CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setBaseCurrency(c)}
              aria-pressed={baseCurrency === c}
              className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                baseCurrency === c ? 'bg-gold-400 text-vault-900' : 'text-vault-300 hover:text-white'
              }`}
            >
              {CURRENCY_META[c].symbol}
            </button>
          ))}
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight">{format(totalValue)}</p>

      <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-vault-700">
        <div className="flex items-start gap-2">
          <PiggyBank size={14} className="text-vault-400 mt-0.5" />
          <div>
            <p className="text-vault-400 text-[10px] uppercase tracking-wider">{t('vault.totalCost')}</p>
            <p className="text-sm font-medium">{format(totalCost)}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 justify-end text-right">
          <div>
            <p className="text-vault-400 text-[10px] uppercase tracking-wider">{t('vault.totalPL')}</p>
            <div className="flex items-center gap-1 justify-end">
              {isProfit ? <TrendingUp size={12} className="text-green-400" /> : <TrendingDown size={12} className="text-red-400" />}
              <span className={`text-sm font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                {format(totalPL)}
              </span>
            </div>
            <span className={`text-[10px] ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              ({formatPercent(totalPLPercent)})
            </span>
          </div>
          <BarChart3 size={14} className={`mt-0.5 ${isProfit ? 'text-green-400' : 'text-red-400'}`} />
        </div>
      </div>

      {(totalRealizedPL !== 0) && (
        <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-vault-700/50 text-xs">
          <div>
            <p className="text-vault-400">{t('vault.realizedPL')}</p>
            <p className={`font-medium ${totalRealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {format(totalRealizedPL)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-vault-400">{t('vault.unrealizedPL')}</p>
            <p className={`font-medium ${totalUnrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {format(totalUnrealizedPL)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
