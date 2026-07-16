import { TransactionForm } from '../components/form/TransactionForm';
import { useT } from '../hooks/useT';

export function AddTransactionPage() {
  const { t } = useT();

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{t('form.pageTitle')}</h2>
      <TransactionForm />
    </div>
  );
}
