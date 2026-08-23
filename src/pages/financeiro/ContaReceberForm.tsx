import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { CurrencyInput, Input, Select, Textarea } from '../../components/ui/Field';
import { ApiError } from '../../lib/api';
import { usePacientes } from '../../services/pacienteService';
import { formatCurrency } from '../../lib/utils';
import type {
  ContaReceber,
  FormaPagamentoEnum,
  StatusFinanceiroEnum,
  TipoPagamentoProcedimentoEnum,
} from '../../types';

const tipoPagamentoOptions: { value: TipoPagamentoProcedimentoEnum; label: string }[] = [
  { value: 'A_VISTA', label: 'À vista' },
  { value: 'PARCELADO', label: 'Parcelado' },
];

const parcelaOptions = Array.from({ length: 23 }, (_, i) => ({
  value: String(i + 2),
  label: `${i + 2}x`,
}));

interface ContaReceberFormProps {
  initial: ContaReceber | null;
  onSubmit: (c: ContaReceber) => Promise<void>;
  onCancel: () => void;
}

const empty: ContaReceber = {
  pacienteId: '',
  descricao: '',
  valorTotal: 0,
  valorPago: 0,
  formaPagamento: 'DINHEIRO' as FormaPagamentoEnum,
  dataVencimento: '',
  status: 'PENDENTE' as StatusFinanceiroEnum,
};

const formaOptions = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de crédito' },
  { value: 'CARTAO_DEBITO', label: 'Cartão de débito' },
  { value: 'CONVENIO', label: 'Convênio' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
];

const statusOptions = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'PAGO', label: 'Pago' },
  { value: 'ATRASADO', label: 'Atrasado' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

export const ContaReceberForm = ({ initial, onSubmit, onCancel }: ContaReceberFormProps) => {
  const [values, setValues] = useState<ContaReceber>(() => ({
    ...empty,
    ...(initial ?? {}),
    dataVencimento: initial?.dataVencimento?.slice(0, 10) ?? '',
  }));
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const pacientesQ = usePacientes({ pagina: 0, tamanho: 200, ordem: 'nomeCompleto' });
  const pacienteOptions = [
    { value: '', label: '— Selecione a paciente —' },
    ...(pacientesQ.data?.content.map((p) => ({ value: p.id, label: p.nomeCompleto })) ?? []),
  ];

  const set = <K extends keyof ContaReceber>(k: K, v: ContaReceber[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError(null);
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      if (err instanceof ApiError) {
        const fe = err.fieldErrors();
        if (Object.keys(fe).length) setErrors(fe);
        else setGlobalError(err.friendlyMessage());
      } else {
        setGlobalError('Não foi possível salvar a conta.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {globalError && (
        <div className="text-sm text-bokka-danger-ink bg-bokka-danger-soft border border-bokka-danger/20 rounded-md px-3 py-2">
          {globalError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Paciente"
          required
          value={values.pacienteId}
          onChange={(e) => set('pacienteId', e.target.value)}
          options={pacienteOptions}
          disabled={pacientesQ.isLoading}
          error={errors.pacienteId}
          containerClassName="sm:col-span-2"
        />
        <Input
          label="Descrição"
          required
          value={values.descricao}
          onChange={(e) => set('descricao', e.target.value)}
          placeholder="Ex.: Restauração dente 26"
          error={errors.descricao}
          containerClassName="sm:col-span-2"
        />
        <CurrencyInput
          label="Valor total"
          required
          value={values.valorTotal}
          onChange={(v) => set('valorTotal', v ?? 0)}
          error={errors.valorTotal}
        />
        <Input
          label="Dia de pagamento (1º vencimento)"
          type="date"
          required
          value={values.dataVencimento}
          onChange={(e) => set('dataVencimento', e.target.value)}
          error={errors.dataVencimento}
        />
        <Select
          label="Forma de pagamento"
          required
          value={values.formaPagamento}
          onChange={(e) => set('formaPagamento', e.target.value as FormaPagamentoEnum)}
          options={formaOptions}
        />
        <Select
          label="Tipo de pagamento"
          value={values.tipoPagamento ?? 'A_VISTA'}
          onChange={(e) =>
            set('tipoPagamento', e.target.value as TipoPagamentoProcedimentoEnum)
          }
          options={tipoPagamentoOptions}
        />
        {values.tipoPagamento === 'PARCELADO' && (
          <Select
            label="Número de parcelas"
            required
            value={String(values.numeroParcelas ?? 2)}
            onChange={(e) => set('numeroParcelas', parseInt(e.target.value, 10))}
            options={parcelaOptions}
            hint={
              values.valorTotal && values.numeroParcelas
                ? `${values.numeroParcelas}x de ${formatCurrency(values.valorTotal / values.numeroParcelas)} — 1 cobrança por mês`
                : 'Cria uma cobrança por mês a partir do dia de pagamento'
            }
            containerClassName="sm:col-span-2"
          />
        )}
        <Select
          label="Status inicial"
          required
          value={values.status}
          onChange={(e) => set('status', e.target.value as StatusFinanceiroEnum)}
          options={statusOptions}
          containerClassName={values.tipoPagamento === 'PARCELADO' ? 'sm:col-span-2' : ''}
        />
        <Textarea
          label="Observações"
          value={values.observacoes ?? ''}
          onChange={(e) => set('observacoes', e.target.value)}
          rows={3}
          containerClassName="sm:col-span-2"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-bokka-border -mx-6 px-6 max-sm:sticky max-sm:bottom-0 max-sm:-mb-6 max-sm:pb-4 max-sm:bg-bokka-surface max-sm:z-10">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initial?.id ? 'Salvar alterações' : 'Criar conta'}
        </Button>
      </div>
    </form>
  );
};
