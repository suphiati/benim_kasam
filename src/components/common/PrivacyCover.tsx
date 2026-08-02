import { Vault } from 'lucide-react';

/**
 * Arka plandayken kasayı gizleyen örtü — recent-apps (son uygulamalar) önizlemesinde
 * varlıklar görünmesin diye. Biyometri İSTEMEZ; öne dönünce otomatik kalkar.
 * Kilit ekranının (BiometricLock, z-200) altında kalır (z-190); açılış kilidi
 * varken bu görünmez, App.tsx yalnızca !locked iken render eder.
 */
export function PrivacyCover() {
  return (
    <div className="fixed inset-0 z-[190] bg-vault-900 flex flex-col items-center justify-center text-white">
      <div className="w-20 h-20 rounded-3xl bg-vault-800 flex items-center justify-center mb-4">
        <Vault size={40} className="text-gold-400" />
      </div>
      <h1 className="text-xl font-bold tracking-tight">BenimKasam</h1>
    </div>
  );
}
