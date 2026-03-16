import { TransactionForm } from '../components/form/TransactionForm';

export function AddTransactionPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Yeni İşlem Ekle</h2>
      <TransactionForm />
    </div>
  );
}
