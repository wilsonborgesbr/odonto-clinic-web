import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { formatCurrency } from '../../lib/utils';
import type { ContaReceber } from '../../types';

interface PagamentoModalProps {
  conta: ContaReceber | null;
  onClose: () => void;
  onSubmit: (valor: number) => Promise<void>;
}

export const PagamentoModal = ({ conta, onClose, onSubmit }: PagamentoModalProps) => {
  const saldoRestante = conta
    ? Math.max(0, (conta.valorTotal ?? 0) - (conta.valorPago ?? 0))
    : 0;

  const [valor, setValor] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (conta) {
      setValor(saldoRestante.toFixed(2));
      setError(null);
    }
  }, [conta, saldoRestante]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const num = parseFloat(valor);
    if (Number.isNaN(num) || num <= 0) {
      setError('Informe um valor positivo.');
      return;
    }
    if (num > saldoRestante + 0.005) {
      setError(`Valor não pode passar o saldo restante (${formatCurrency(saldoRestante)}).`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(num);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={!!conta}
      onClose={onClose}
      title="Registrar pagamento"
      subtitle={conta?.descricao}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={(e) => handleSubmit(e as unknown as FormEvent)}
            loading={submitting}
            disabled={!conta}
          >
            Registrar
          </Button>
        </>
      }
    >
      {conta && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-bokka-surface-3 p-3">
              <div className="text-[11px] uppercase font-semibold text-bokka-ink-3">Total</div>
              <div className="text-base font-bold text-bokka-ink tabular-nums mt-1">
                {formatCurrency(conta.valorTotal)}
              </div>
            </div>
            <div className="rounded-lg bg-bokka-success-soft p-3">
              <div className="text-[11px] uppercase font-semibold text-bokka-success-ink">Pago</div>
              <div className="text-base font-bold text-bokka-success-ink tabular-nums mt-1">
                {formatCurrency(conta.valorPago)}
              </div>
            </div>
            <div className="rounded-lg bg-bokka-warning-soft p-3">
              <div className="text-[11px] uppercase font-semibold text-bokka-warning-ink">
                Restante
              </div>
              <div className="text-base font-bold text-bokka-warning-ink tabular-nums mt-1">
                {formatCurrency(saldoRestante)}
              </div>
            </div>
          </div>

          <Input
            label="Valor a receber agora (R$)"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            autoFocus
            error={error ?? undefined}
            hint="Você pode receber o valor total ou parcelas. O status muda automaticamente."
          />
        </form>
      )}
    </Modal>
  );
};
