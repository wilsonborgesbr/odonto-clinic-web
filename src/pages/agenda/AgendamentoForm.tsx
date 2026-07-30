import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Field';
import { ApiError } from '../../lib/api';
import { useDentistasAtivos } from '../../services/dentistaService';
import { usePacientes } from '../../services/pacienteService';
import type { Agendamento, StatusAgendamentoEnum } from '../../types';

interface AgendamentoFormProps {
  initial: Agendamento | null;
  onSubmit: (ag: Agendamento) => Promise<void>;
  onCancel: () => void;
}

const emptyAgendamento: Agendamento = {
  pacienteId: '',
  dentistaId: '',
  dataHoraInicio: '',
  dataHoraFim: '',
  status: 'AGENDADO' as StatusAgendamentoEnum,
  observacoes: '',
};

const statusOptions = [
  { value: 'AGENDADO', label: 'Agendado' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'REALIZADO', label: 'Realizado' },
  { value: 'FALTOU', label: 'Faltou' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

// Converte "2026-08-02T10:00" (input datetime-local) para ISO com segundos
const toIso = (v: string) => (v ? `${v}:00` : '');
// Converte ISO para o formato do input
const fromIso = (v?: string) => (v ? v.slice(0, 16) : '');

export const AgendamentoForm = ({ initial, onSubmit, onCancel }: AgendamentoFormProps) => {
  const [values, setValues] = useState<Agendamento>(() => ({
    ...emptyAgendamento,
    ...(initial ?? {}),
    dataHoraInicio: fromIso(initial?.dataHoraInicio),
    dataHoraFim: fromIso(initial?.dataHoraFim),
  }));
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const pacientesQ = usePacientes({ pagina: 0, tamanho: 200, ordem: 'nomeCompleto' });
  const dentistasQ = useDentistasAtivos();

  const pacienteOptions = [
    { value: '', label: '— Selecione um paciente —' },
    ...(pacientesQ.data?.content.map((p) => ({
      value: p.id,
      label: p.nomeCompleto,
    })) ?? []),
  ];

  const dentistaOptions = [
    { value: '', label: '— Selecione um dentista —' },
    ...(dentistasQ.data?.map((d) => ({
      value: d.id,
      label: `Dr(a). ${d.nomeCompleto} · ${d.cro}`,
    })) ?? []),
  ];

  const set = <K extends keyof Agendamento>(k: K, v: Agendamento[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        ...values,
        dataHoraInicio: toIso(values.dataHoraInicio),
        dataHoraFim: toIso(values.dataHoraFim),
      });
    } catch (err) {
      if (err instanceof ApiError) {
        const fe = err.fieldErrors();
        if (Object.keys(fe).length) setErrors(fe);
        else setGlobalError(err.friendlyMessage());
      } else {
        setGlobalError('Não foi possível salvar o agendamento.');
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
          error={errors.pacienteId}
          containerClassName="sm:col-span-2"
          disabled={pacientesQ.isLoading}
        />
        <Select
          label="Dentista"
          required
          value={values.dentistaId}
          onChange={(e) => set('dentistaId', e.target.value)}
          options={dentistaOptions}
          error={errors.dentistaId}
          containerClassName="sm:col-span-2"
          disabled={dentistasQ.isLoading}
        />

        <Input
          label="Início"
          type="datetime-local"
          required
          value={values.dataHoraInicio}
          onChange={(e) => set('dataHoraInicio', e.target.value)}
          error={errors.dataHoraInicio}
        />
        <Input
          label="Término"
          type="datetime-local"
          required
          value={values.dataHoraFim}
          onChange={(e) => set('dataHoraFim', e.target.value)}
          error={errors.dataHoraFim}
        />
        <Select
          label="Status"
          required
          value={values.status}
          onChange={(e) => set('status', e.target.value as StatusAgendamentoEnum)}
          options={statusOptions}
          containerClassName="sm:col-span-2"
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
          {initial?.id ? 'Salvar alterações' : 'Criar agendamento'}
        </Button>
      </div>
    </form>
  );
};
