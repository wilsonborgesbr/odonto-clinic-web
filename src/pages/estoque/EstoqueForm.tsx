import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { CurrencyInput, Input, Select } from '../../components/ui/Field';
import { ApiError } from '../../lib/api';
import type { Estoque, CategoriaEstoqueEnum } from '../../types';

interface EstoqueFormProps {
  initial: Estoque | null;
  onSubmit: (item: Estoque) => Promise<void>;
  onCancel: () => void;
}

const emptyEstoque: Estoque = {
  nomeMaterial: '',
  categoria: 'DESCARTAVEL',
  quantidadeAtual: 0,
  quantidadeMinima: 0,
  unidadeMedida: '',
  fornecedor: '',
  dataValidade: '',
  observacoes: '',
};

const categoriaOptions: { value: CategoriaEstoqueEnum; label: string }[] = [
  { value: 'DESCARTAVEL', label: 'Descartável' },
  { value: 'MEDICAMENTO', label: 'Medicamento' },
  { value: 'INSTRUMENTO', label: 'Instrumento' },
  { value: 'ANESTESICO', label: 'Anestésico' },
  { value: 'MATERIAL_RESTAURADOR', label: 'Material Restaurador' },
  { value: 'MATERIAL_PROTESE', label: 'Material de Prótese' },
  { value: 'EPI', label: 'EPI' },
  { value: 'LIMPEZA', label: 'Limpeza' },
  { value: 'OUTRO', label: 'Outro' },
];

export const categoriaLabel: Record<CategoriaEstoqueEnum, string> = {
  DESCARTAVEL: 'Descartável',
  MEDICAMENTO: 'Medicamento',
  INSTRUMENTO: 'Instrumento',
  ANESTESICO: 'Anestésico',
  MATERIAL_RESTAURADOR: 'Mat. Restaurador',
  MATERIAL_PROTESE: 'Mat. Prótese',
  EPI: 'EPI',
  LIMPEZA: 'Limpeza',
  OUTRO: 'Outro',
};

export const EstoqueForm = ({ initial, onSubmit, onCancel }: EstoqueFormProps) => {
  const [values, setValues] = useState<Estoque>(() => initial ?? emptyEstoque);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const set = <K extends keyof Estoque>(k: K, v: Estoque[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGlobalError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      if (err instanceof ApiError) {
        const fe = err.fieldErrors();
        if (Object.keys(fe).length) setErrors(fe);
        else setGlobalError(err.friendlyMessage());
      } else {
        setGlobalError('Não foi possível salvar. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {globalError && (
        <div className="text-sm text-bokka-danger-ink bg-bokka-danger-soft border border-bokka-danger/20 rounded-md px-3 py-2">
          {globalError}
        </div>
      )}

      <section>
        <h3 className="text-sm font-semibold text-bokka-ink mb-3">Identificação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nome do material"
            required
            value={values.nomeMaterial ?? ''}
            onChange={(e) => set('nomeMaterial', e.target.value)}
            error={errors.nomeMaterial}
            containerClassName="sm:col-span-2"
          />
          <Select
            label="Categoria"
            required
            value={values.categoria ?? 'DESCARTAVEL'}
            onChange={(e) => set('categoria', e.target.value as CategoriaEstoqueEnum)}
            options={categoriaOptions}
            error={errors.categoria}
          />
          <Input
            label="Unidade de medida"
            value={values.unidadeMedida ?? ''}
            onChange={(e) => set('unidadeMedida', e.target.value)}
            placeholder="ex: unidade, caixa, frasco"
            error={errors.unidadeMedida}
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-bokka-ink mb-3">Quantidades</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Quantidade atual"
            type="number"
            required
            value={String(values.quantidadeAtual ?? 0)}
            onChange={(e) => set('quantidadeAtual', parseInt(e.target.value) || 0)}
            error={errors.quantidadeAtual}
          />
          <Input
            label="Quantidade mínima"
            type="number"
            value={String(values.quantidadeMinima ?? 0)}
            onChange={(e) => set('quantidadeMinima', parseInt(e.target.value) || 0)}
            error={errors.quantidadeMinima}
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-bokka-ink mb-3">Detalhes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Fornecedor"
            value={values.fornecedor ?? ''}
            onChange={(e) => set('fornecedor', e.target.value)}
            error={errors.fornecedor}
          />
          <Input
            label="Data de validade"
            type="date"
            value={values.dataValidade ?? ''}
            onChange={(e) => set('dataValidade', e.target.value)}
            error={errors.dataValidade}
          />
          <CurrencyInput
            label="Valor de compra unitário"
            value={values.valorCompra}
            onChange={(v) => set('valorCompra', v)}
            hint="Ao cadastrar, uma despesa será lançada automaticamente na Auditoria."
            error={errors.valorCompra}
          />
          <Input
            label="Observações"
            value={values.observacoes ?? ''}
            onChange={(e) => set('observacoes', e.target.value)}
            error={errors.observacoes}
          />
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-2 border-t border-bokka-border -mx-6 px-6 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initial?.id ? 'Salvar alterações' : 'Cadastrar item'}
        </Button>
      </div>
    </form>
  );
};
