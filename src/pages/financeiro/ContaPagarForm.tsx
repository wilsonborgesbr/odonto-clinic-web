import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { CurrencyInput, Input, Select, Textarea } from '../../components/ui/Field';
import { ApiError } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import type {
  CategoriaContaPagarEnum,
  ContaPagar,
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

interface ContaPagarFormProps {
  initial: ContaPagar | null;
  onSubmit: (c: ContaPagar) => Promise<void>;
  onCancel: () => void;
}

const empty: ContaPagar = {
  descricao: '',
  categoria: 'OUTRO',
  fornecedor: '',
  valor: 0,
  dataVencimento: '',
  status: 'PENDENTE',
};

export const categoriaPagarLabel: Record<CategoriaContaPagarEnum, string> = {
  ALUGUEL: 'Aluguel',
  MATERIAL_ODONTOLOGICO: 'Material odontológico',
  EQUIPAMENTO: 'Equipamento',
  SALARIO: 'Salário',
  AGUA: 'Água',
  LUZ: 'Luz',
  INTERNET: 'Internet',
  MANUTENCAO: 'Manutenção',
  IMPOSTO: 'Imposto',
  OUTRO: 'Outro',
};

const categoriaOptions = (Object.keys(categoriaPagarLabel) as CategoriaContaPagarEnum[]).map(
  (v) => ({ value: v, label: categoriaPagarLabel[v] }),
);

const statusOptions: { value: StatusFinanceiroEnum; label: string }[] = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'PAGO', label: 'Pago' },
  { value: 'ATRASADO', label: 'Atrasado' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

export const ContaPagarForm = ({ initial, onSubmit, onCancel }: ContaPagarFormProps) => {
  const [values, setValues] = useState<ContaPagar>(() => ({
    ...empty,
    ...(initial ?? {}),
    dataVencimento: initial?.dataVencimento?.slice(0, 10) ?? '',
    dataPagamento: initial?.dataPagamento?.slice(0, 10) ?? '',
  }));
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const set = <K extends keyof ContaPagar>(k: K, v: ContaPagar[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError(null);
    setSubmitting(true);
    try {
      const payload: ContaPagar = {
        ...values,
        dataPagamento: values.status === 'PAGO' && !values.dataPagamento
          ? new Date().toISOString().slice(0, 10)
          : values.dataPagamento || undefined,
      };
      await onSubmit(payload);
    } catch (err) {
      if (err instanceof ApiError) {
        const fe = err.fieldErrors();
        if (Object.keys(fe).length) setErrors(fe);
        else setGlobalError(err.friendlyMessage());
      } else {
        setGlobalError('Não foi possível salvar a despesa.');
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
        <Input
          label="Descrição"
          required
          value={values.descricao}
          onChange={(e) => set('descricao', e.target.value)}
          placeholder="Ex.: Conta de energia elétrica — julho"
          error={errors.descricao}
          containerClassName="sm:col-span-2"
        />
        <Select
          label="Categoria"
          required
          value={values.categoria}
          onChange={(e) => set('categoria', e.target.value as CategoriaContaPagarEnum)}
          options={categoriaOptions}
          error={errors.categoria}
        />
        <Input
          label="Fornecedor"
          value={values.fornecedor ?? ''}
          onChange={(e) => set('fornecedor', e.target.value)}
          placeholder="Ex.: Energisa Sergipe"
          error={errors.fornecedor}
        />
        <CurrencyInput
          label="Valor"
          required
          value={values.valor}
          onChange={(v) => set('valor', v ?? 0)}
          error={errors.valor}
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
              values.valor && values.numeroParcelas
                ? `${values.numeroParcelas}x de ${formatCurrency(values.valor / values.numeroParcelas)} — 1 despesa por mês`
                : 'Cria uma despesa por mês a partir do dia de pagamento'
            }
          />
        )}
        <Select
          label="Status"
          required
          value={values.status}
          onChange={(e) => set('status', e.target.value as StatusFinanceiroEnum)}
          options={statusOptions}
        />
        <Input
          label="Data de pagamento"
          type="date"
          value={values.dataPagamento ?? ''}
          onChange={(e) => set('dataPagamento', e.target.value)}
          hint={values.status === 'PAGO' ? 'Preencha para registrar quando pagou.' : undefined}
        />
        <Textarea
          label="Observações"
          value={values.observacoes ?? ''}
          onChange={(e) => set('observacoes', e.target.value)}
          rows={3}
          containerClassName="sm:col-span-2"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-bokka-border -mx-6 px-6">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initial?.id ? 'Salvar alterações' : 'Criar despesa'}
        </Button>
      </div>
    </form>
  );
};
