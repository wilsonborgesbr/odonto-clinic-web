import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { CurrencyInput, Input, Select, Textarea } from '../../components/ui/Field';
import { usePaciente } from '../../services/pacienteService';
import { ApiError } from '../../lib/api';
import { nomeProcOptions, statusOptions } from '../../lib/procedimentoLabels';
import type { NomeProcedimentoEnum, Procedimento, StatusProcedimentoEnum } from '../../types';

interface ProcedimentoQuickLaunchProps {
  pacienteId: string;
  dente?: string;
  odontogramaId?: string;
  /** Rótulo da condição atual do dente (só pra contexto visual, não é persistido aqui). */
  condicaoLabel?: string;
  onSubmit: (values: Procedimento) => Promise<void>;
  onCancel: () => void;
  /** Abre o formulário completo (pagamento detalhado/parcelamento) com o que já foi digitado. */
  onEditarCompleto: (draft: Procedimento) => void;
}

/**
 * Formulário enxuto pra lançar um procedimento sem sair da tela do odontograma — pagamento
 * à vista + data (opcional), sem parcelamento (quem precisar usa o link de escape hatch).
 */
export const ProcedimentoQuickLaunch = ({
  pacienteId,
  dente,
  odontogramaId,
  condicaoLabel,
  onSubmit,
  onCancel,
  onEditarCompleto,
}: ProcedimentoQuickLaunchProps) => {
  const [nomeProcedimento, setNomeProcedimento] = useState<NomeProcedimentoEnum>('PROFILAXIA');
  const [status, setStatus] = useState<StatusProcedimentoEnum>('ORCADO');
  const [valor, setValor] = useState<number | undefined>(undefined);
  const [dataPrimeiroPagamento, setDataPrimeiroPagamento] = useState('');
  const [observacoesTecnicas, setObservacoesTecnicas] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const pacienteQ = usePaciente(pacienteId);
  // Mesma regra do formulário completo: conveniado paga via convênio, sem valor/pagamento aqui.
  const isConveniado = pacienteQ.data?.tipoPaciente === 'CONVENIO';

  const buildDraft = (): Procedimento => ({
    pacienteId,
    dente,
    odontogramaId,
    nomeProcedimento,
    status,
    numeroDeSessoes: 1,
    sessaoAtual: 1,
    observacoesTecnicas: observacoesTecnicas || undefined,
    ...(isConveniado
      ? { valor: 0, tipoPagamento: undefined, dataPrimeiroPagamento: undefined }
      : {
          valor: valor ?? 0,
          tipoPagamento: 'A_VISTA',
          dataPrimeiroPagamento: dataPrimeiroPagamento || undefined,
        }),
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setGlobalError(null);
    try {
      await onSubmit(buildDraft());
    } catch (err) {
      setGlobalError(
        err instanceof ApiError ? err.friendlyMessage() : 'Não foi possível lançar o procedimento.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {globalError && (
        <div className="text-sm text-bokka-danger-ink bg-bokka-danger-soft border border-bokka-danger/20 rounded-md px-3 py-2">
          {globalError}
        </div>
      )}

      {(dente || condicaoLabel) && (
        <div className="flex items-center gap-2 text-xs text-bokka-ink-2 bg-bokka-surface-2 border border-bokka-border rounded-md px-3 py-2">
          {dente && <span className="font-semibold text-bokka-ink">Dente {dente}</span>}
          {dente && condicaoLabel && <span className="text-bokka-ink-3">·</span>}
          {condicaoLabel && <span>{condicaoLabel}</span>}
        </div>
      )}

      <Select
        label="Procedimento"
        required
        value={nomeProcedimento}
        onChange={(e) => setNomeProcedimento(e.target.value as NomeProcedimentoEnum)}
        options={nomeProcOptions}
      />

      <Select
        label="Status"
        required
        value={status}
        onChange={(e) => setStatus(e.target.value as StatusProcedimentoEnum)}
        options={statusOptions}
      />

      {isConveniado ? (
        <div className="text-xs text-bokka-ink-3 bg-bokka-primary-soft/50 border border-bokka-primary/15 rounded-md px-3 py-2">
          Paciente conveniado — cobrança será feita via convênio, sem valor aqui.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CurrencyInput label="Valor à vista" value={valor} onChange={setValor} />
          <Input
            label="Data de pagamento"
            type="date"
            value={dataPrimeiroPagamento}
            onChange={(e) => setDataPrimeiroPagamento(e.target.value)}
            hint={
              valor && valor > 0 && dataPrimeiroPagamento
                ? '1 cobrança será criada na Auditoria Financeira.'
                : 'Opcional — deixe em branco pra lançar sem cobrança.'
            }
          />
        </div>
      )}

      <Textarea
        label="Observação rápida"
        value={observacoesTecnicas}
        onChange={(e) => setObservacoesTecnicas(e.target.value)}
        rows={2}
      />

      <button
        type="button"
        onClick={() => onEditarCompleto(buildDraft())}
        className="text-xs font-semibold text-bokka-primary hover:text-bokka-primary-hover"
      >
        Editar pagamento detalhado / parcelar
      </button>

      <div className="flex justify-end gap-3 pt-4 border-t border-bokka-border -mx-6 px-6">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          Lançar procedimento
        </Button>
      </div>
    </form>
  );
};
