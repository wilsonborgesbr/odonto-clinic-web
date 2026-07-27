import { useCallback, useEffect, useState } from 'react';
import type { Agendamento, DentistaListagemDTO, PacienteListagemDTO, StatusAgendamentoEnum } from '../../types';
import { ApiError } from '../../services/api';
import { pacienteService } from '../../services/pacienteService';
import { dentistaService } from '../../services/dentistaService';
import { Button } from '../../components/ui/Button';
import { TextField, TextArea } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';

interface FormState {
  pacienteId: string;
  dentistaId: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  status: StatusAgendamentoEnum;
  observacoes: string;
}

const emptyState: FormState = {
  pacienteId: '',
  dentistaId: '',
  dataHoraInicio: '',
  dataHoraFim: '',
  status: 'AGENDADO',
  observacoes: '',
};

const fromAgendamento = (a: Agendamento): FormState => ({
  pacienteId: a.pacienteId,
  dentistaId: a.dentistaId,
  dataHoraInicio: a.dataHoraInicio?.slice(0, 16) ?? '',
  dataHoraFim: a.dataHoraFim?.slice(0, 16) ?? '',
  status: a.status,
  observacoes: a.observacoes ?? '',
});

const STATUS_OPTIONS = [
  { value: 'AGENDADO', label: 'Agendado' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'REALIZADO', label: 'Realizado' },
  { value: 'FALTOU', label: 'Faltou' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

interface Props {
  initial: Agendamento | null;
  defaultStart?: string;
  onCancel: () => void;
  onSubmit: (agendamento: Agendamento) => Promise<void>;
}

export const AgendamentoForm = ({ initial, defaultStart, onCancel, onSubmit }: Props) => {
  const isEdit = !!initial?.id;

  const [form, setForm] = useState<FormState>(emptyState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [dentistas, setDentistas] = useState<DentistaListagemDTO[]>([]);
  const [pacientes, setPacientes] = useState<PacienteListagemDTO[]>([]);
  const [buscaPaciente, setBuscaPaciente] = useState('');
  const [loadingPacientes, setLoadingPacientes] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm(fromAgendamento(initial));
    } else {
      const s = { ...emptyState };
      if (defaultStart) s.dataHoraInicio = defaultStart;
      setForm(s);
    }
    setErrors({});
    setGlobalError(null);
  }, [initial, defaultStart]);

  useEffect(() => {
    dentistaService.listarAtivos().then((r) => setDentistas(r.content)).catch(() => {});
  }, []);

  const buscarPacientes = useCallback(async (nome: string) => {
    if (nome.trim().length < 2) {
      setPacientes([]);
      return;
    }
    setLoadingPacientes(true);
    try {
      const r = await pacienteService.listar({ nome, tamanho: 10 });
      setPacientes(r.content);
    } catch {
      setPacientes([]);
    } finally {
      setLoadingPacientes(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => buscarPacientes(buscaPaciente), 350);
    return () => clearTimeout(t);
  }, [buscaPaciente, buscarPacientes]);

  useEffect(() => {
    if (initial?.pacienteId) {
      pacienteService.listar({ tamanho: 200 }).then((r) => {
        const found = r.content.find((p) => p.id === initial.pacienteId);
        if (found) setPacientes((prev) => {
          if (prev.some((p) => p.id === found.id)) return prev;
          return [found, ...prev];
        });
      }).catch(() => {});
    }
  }, [initial?.pacienteId]);

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setGlobalError(null);
  };

  const validate = (): Partial<Record<keyof FormState, string>> => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.pacienteId) e.pacienteId = 'Selecione um paciente.';
    if (!form.dentistaId) e.dentistaId = 'Selecione um dentista.';
    if (!form.dataHoraInicio) e.dataHoraInicio = 'Data/hora de início é obrigatória.';
    if (!form.dataHoraFim) e.dataHoraFim = 'Data/hora de fim é obrigatória.';
    if (form.dataHoraInicio && form.dataHoraFim && form.dataHoraInicio >= form.dataHoraFim) {
      e.dataHoraFim = 'Fim deve ser após o início.';
    }
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }

    const payload: Agendamento = {
      pacienteId: form.pacienteId,
      dentistaId: form.dentistaId,
      dataHoraInicio: form.dataHoraInicio + ':00',
      dataHoraFim: form.dataHoraFim + ':00',
      status: form.status,
      observacoes: form.observacoes || undefined,
    };

    setSaving(true);
    setGlobalError(null);
    try {
      await onSubmit(payload);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setGlobalError(err.friendlyMessage());
        } else {
          const fe = err.fieldErrors();
          if (Object.keys(fe).length) {
            setErrors(fe as Partial<Record<keyof FormState, string>>);
          } else {
            setGlobalError(err.friendlyMessage());
          }
        }
      } else {
        setGlobalError('Erro inesperado ao salvar.');
      }
    } finally {
      setSaving(false);
    }
  };

  const pacienteSelecionado = pacientes.find((p) => p.id === form.pacienteId);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {globalError && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-2">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{globalError}</span>
        </div>
      )}

      <div>
        <span className="block text-xs font-medium text-slate-700 mb-1">
          Paciente <span className="text-red-500">*</span>
        </span>
        {pacienteSelecionado ? (
          <div className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50">
            <span className="flex-1 text-slate-800">{pacienteSelecionado.nomeCompleto}</span>
            <button
              type="button"
              onClick={() => {
                setField('pacienteId', '');
                setBuscaPaciente('');
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              placeholder="Digite o nome do paciente..."
              value={buscaPaciente}
              onChange={(e) => setBuscaPaciente(e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                errors.pacienteId ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'
              }`}
            />
            {loadingPacientes && (
              <div className="absolute right-3 top-2.5 text-xs text-slate-400">Buscando...</div>
            )}
            {pacientes.length > 0 && !form.pacienteId && buscaPaciente.trim().length >= 2 && (
              <ul className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
                {pacientes.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setField('pacienteId', p.id);
                        setBuscaPaciente('');
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-sky-50 flex justify-between"
                    >
                      <span>{p.nomeCompleto}</span>
                      <span className="text-slate-400 text-xs">{p.cpf}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {errors.pacienteId && (
          <span className="block text-xs text-red-600 mt-1">{errors.pacienteId}</span>
        )}
      </div>

      <Select
        label="Dentista"
        required
        placeholder="Selecione um dentista..."
        options={dentistas.map((d) => ({
          value: d.id,
          label: `${d.nomeCompleto} — ${d.cro}`,
        }))}
        value={form.dentistaId}
        onChange={(e) => setField('dentistaId', e.target.value)}
        error={errors.dentistaId}
      />

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Início"
          required
          type="datetime-local"
          value={form.dataHoraInicio}
          onChange={(e) => setField('dataHoraInicio', e.target.value)}
          error={errors.dataHoraInicio}
        />
        <TextField
          label="Fim"
          required
          type="datetime-local"
          value={form.dataHoraFim}
          onChange={(e) => setField('dataHoraFim', e.target.value)}
          error={errors.dataHoraFim}
        />
      </div>

      {isEdit && (
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={form.status}
          onChange={(e) => setField('status', e.target.value as StatusAgendamentoEnum)}
        />
      )}

      <TextArea
        label="Observações"
        value={form.observacoes}
        onChange={(e) => setField('observacoes', e.target.value)}
        rows={3}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving}>
          {isEdit ? 'Salvar alterações' : 'Agendar'}
        </Button>
      </div>
    </form>
  );
};
