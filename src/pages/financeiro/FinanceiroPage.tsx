import { useState } from 'react';
import { ContasReceberTab } from './ContasReceberTab';
import { ContasPagarTab } from './ContasPagarTab';

const TABS = [
  { key: 'receber', label: 'Contas a Receber' },
  { key: 'pagar', label: 'Contas a Pagar' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export const FinanceiroPage = () => {
  const [tab, setTab] = useState<TabKey>('receber');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Financeiro</h1>
        <p className="text-sm text-slate-500">Contas a pagar e a receber</p>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-sky-600 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === 'receber' ? <ContasReceberTab /> : <ContasPagarTab />}
    </div>
  );
};
