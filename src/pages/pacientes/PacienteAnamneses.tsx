import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ClipboardList,
  AlertTriangle,
  Pill,
  HeartPulse,
  Baby,
  Cigarette,
  Wine,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Field';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { bokkaToast } from '../../components/ui/Toast';
import {
  useAnamnesesPorPaciente,
  useCriarAnamnese,
  useAtualizarAnamnese,
  useExcluirAnamnese,
} from '../../services/anamneseService';
import { ApiError } from '../../lib/api';
import { cn, formatDate } from '../../lib/utils';
import type { Anamnese } from '../../types';

interface PacienteAnamnesesProps {
  pacienteId: string;
}

export const PacienteAnamneses = ({ pacienteId }: PacienteAnamnesesProps) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Anamnese | null>(null);
  const [confirmar, setConfirmar] = useState<{ id: string; label: string } | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);

  const anamnesesQ = useAnamnesesPorPaciente(pacienteId);
  const criarM = useCriarAnamnese();
  const atualizarM = useAtualizarAnamnese();
  const excluirM = useExcluirAnamnese();

  const anamneses = anamnesesQ.data ?? [];

  const handleExcluir = async () => {
    if (!confirmar) return;
    try {
      await excluirM.mutateAsync({ id: confirmar.id, pacienteId });
      bokkaToast.success('Anamnese excluída.');
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao excluir.',
      );
    } finally {
      setConfirmar(null);
    }
  };

  const abrirCriar = () => {
    setEditando(null);
    setFormOpen(true);
  };

  const abrirEditar = (a: Anamnese) => {
    setEditando(a);
    setFormOpen(true);
  };

  return (
    <>
      <div className="bg-bokka-surface-2 border border-bokka-border rounded-2xl overflow-hidden">
        <div className="p-5 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-bokka-ink">Anamnese</h3>
            <p className="text-xs text-bokka-ink-3 mt-0.5">
              {anamneses.length} registro{anamneses.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={abrirCriar}
          >
            Nova anamnese
          </Button>
        </div>

        {anamnesesQ.isLoading ? (
          <div className="px-5 pb-5 space-y-2">
            <Skeleton className="h-16 w-full" rounded="lg" />
            <Skeleton className="h-16 w-full" rounded="lg" />
          </div>
        ) : anamneses.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState
              compact
              icon={<ClipboardList className="w-6 h-6" strokeWidth={1.75} />}
              title="Nenhuma anamnese"
              description="Registre a anamnese do paciente para acompanhar o histórico clínico."
            />
          </div>
        ) : (
          <div className="divide-y divide-bokka-border">
            {anamneses.map((a) => {
              const isExpanded = expandido === a.id;
              return (
                <div key={a.id} className="group">
                  <button
                    type="button"
                    onClick={() => setExpandido(isExpanded ? null : a.id!)}
                    className="w-full px-5 py-3.5 flex items-center gap-4 text-left hover:bg-bokka-surface-3/50 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-lg bg-bokka-primary-soft text-bokka-primary flex items-center justify-center shrink-0">
                      <ClipboardList className="w-4 h-4" strokeWidth={1.75} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-bokka-ink tabular-nums">
                          {formatDate(a.dataPreenchimento)}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {a.temAlergia && <Badge tone="warning">Alergia</Badge>}
                          {a.usaMedicamentos && <Badge tone="info">Medicamentos</Badge>}
                          {a.fumante && <Badge tone="neutral">Fumante</Badge>}
                          {a.gestante && <Badge tone="danger">Gestante</Badge>}
                          {a.consumoAlcool && <Badge tone="neutral">Álcool</Badge>}
                        </div>
                      </div>
                      <p className="text-xs text-bokka-ink-3 mt-0.5 truncate">
                        {a.queixaPrincipal || 'Sem queixa registrada'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-bokka-ink-3" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-bokka-ink-3" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5">
                      <div className="bg-bokka-surface border border-bokka-border rounded-xl p-5 space-y-4">
                        {a.queixaPrincipal && (
                          <AnamneseField
                            icon={<HeartPulse className="w-4 h-4" />}
                            label="Queixa principal"
                            value={a.queixaPrincipal}
                          />
                        )}
                        {a.historicoDental && (
                          <AnamneseField
                            icon={<ClipboardList className="w-4 h-4" />}
                            label="Histórico dental"
                            value={a.historicoDental}
                          />
                        )}
                        {a.doencasPreexistentes && (
                          <AnamneseField
                            icon={<HeartPulse className="w-4 h-4" />}
                            label="Doenças preexistentes"
                            value={a.doencasPreexistentes}
                          />
                        )}
                        {a.usaMedicamentos && a.quaisMedicamentos && (
                          <AnamneseField
                            icon={<Pill className="w-4 h-4" />}
                            label="Medicamentos em uso"
                            value={a.quaisMedicamentos}
                          />
                        )}
                        {a.temAlergia && a.quaisAlergias && (
                          <AnamneseField
                            icon={<AlertTriangle className="w-4 h-4" />}
                            label="Alergias"
                            value={a.quaisAlergias}
                            tone="warning"
                          />
                        )}

                        <div className="flex flex-wrap gap-3">
                          <HabitoTag
                            icon={<Baby className="w-3.5 h-3.5" />}
                            label="Gestante"
                            active={a.gestante}
                          />
                          <HabitoTag
                            icon={<Cigarette className="w-3.5 h-3.5" />}
                            label="Fumante"
                            active={a.fumante}
                          />
                          <HabitoTag
                            icon={<Wine className="w-3.5 h-3.5" />}
                            label="Consumo de álcool"
                            active={a.consumoAlcool}
                          />
                        </div>

                        {a.historiaFamiliar && (
                          <AnamneseField
                            icon={<Eye className="w-4 h-4" />}
                            label="Histórico familiar"
                            value={a.historiaFamiliar}
                          />
                        )}
                        {a.observacoes && (
                          <AnamneseField
                            icon={<ClipboardList className="w-4 h-4" />}
                            label="Observações"
                            value={a.observacoes}
                          />
                        )}

                        <div className="flex justify-end gap-2 pt-2 border-t border-bokka-border">
                          <button
                            type="button"
                            onClick={() => abrirEditar(a)}
                            className="w-8 h-8 rounded-full inline-flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-primary-soft hover:text-bokka-primary transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmar({
                                id: a.id!,
                                label: formatDate(a.dataPreenchimento) || 'anamnese',
                              })
                            }
                            className="w-8 h-8 rounded-full inline-flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-danger-soft hover:text-bokka-danger-ink transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditando(null); }}
        title={editando ? 'Editar anamnese' : 'Nova anamnese'}
        subtitle={editando ? 'Atualize os dados da ficha clínica.' : 'Preencha a ficha de anamnese do paciente.'}
        size="xl"
      >
        <AnamneseFormInline
          pacienteId={pacienteId}
          initial={editando}
          onCancel={() => { setFormOpen(false); setEditando(null); }}
          onSubmit={async (data) => {
            if (editando?.id) {
              await atualizarM.mutateAsync({ id: editando.id, anamnese: data });
              bokkaToast.success('Anamnese atualizada.');
            } else {
              await criarM.mutateAsync(data);
              bokkaToast.success('Anamnese registrada.');
            }
            setFormOpen(false);
            setEditando(null);
          }}
        />
      </Modal>

      <ConfirmModal
        open={!!confirmar}
        onClose={() => setConfirmar(null)}
        title="Excluir anamnese"
        message={`Tem certeza que deseja excluir a anamnese de ${confirmar?.label}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleExcluir}
      />
    </>
  );
};

const AnamneseField = ({
  icon,
  label,
  value,
  tone = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'default' | 'warning';
}) => (
  <div className="flex gap-3">
    <span
      className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
        tone === 'warning'
          ? 'bg-bokka-warning-soft text-bokka-warning-ink'
          : 'bg-bokka-surface-3 text-bokka-ink-3',
      )}
    >
      {icon}
    </span>
    <div className="min-w-0">
      <p className="text-[11px] uppercase font-semibold text-bokka-ink-3 tracking-wider">
        {label}
      </p>
      <p className="text-sm text-bokka-ink mt-0.5 whitespace-pre-line">{value}</p>
    </div>
  </div>
);

const HabitoTag = ({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border',
      active
        ? 'bg-bokka-warning-soft text-bokka-warning-ink border-bokka-warning/20'
        : 'bg-bokka-surface-3 text-bokka-ink-3 border-bokka-border',
    )}
  >
    {icon}
    {label}: {active ? 'Sim' : 'Não'}
  </span>
);

const AnamneseFormInline = ({
  pacienteId,
  initial,
  onSubmit,
  onCancel,
}: {
  pacienteId: string;
  initial: Anamnese | null;
  onSubmit: (data: Anamnese) => Promise<void>;
  onCancel: () => void;
}) => {
  const [queixaPrincipal, setQueixaPrincipal] = useState(initial?.queixaPrincipal ?? '');
  const [historicoDental, setHistoricoDental] = useState(initial?.historicoDental ?? '');
  const [usaMedicamentos, setUsaMedicamentos] = useState(initial?.usaMedicamentos ?? false);
  const [quaisMedicamentos, setQuaisMedicamentos] = useState(initial?.quaisMedicamentos ?? '');
  const [temAlergia, setTemAlergia] = useState(initial?.temAlergia ?? false);
  const [quaisAlergias, setQuaisAlergias] = useState(initial?.quaisAlergias ?? '');
  const [doencasPreexistentes, setDoencasPreexistentes] = useState(initial?.doencasPreexistentes ?? '');
  const [gestante, setGestante] = useState(initial?.gestante ?? false);
  const [fumante, setFumante] = useState(initial?.fumante ?? false);
  const [consumoAlcool, setConsumoAlcool] = useState(initial?.consumoAlcool ?? false);
  const [historiaFamiliar, setHistoriaFamiliar] = useState(initial?.historiaFamiliar ?? '');
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setGlobalError(null);
    try {
      await onSubmit({
        ...initial,
        pacienteId,
        queixaPrincipal,
        historicoDental,
        usaMedicamentos,
        quaisMedicamentos: usaMedicamentos ? quaisMedicamentos : '',
        temAlergia,
        quaisAlergias: temAlergia ? quaisAlergias : '',
        doencasPreexistentes,
        gestante,
        fumante,
        consumoAlcool,
        historiaFamiliar,
        observacoes,
      });
    } catch (err) {
      setGlobalError(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao salvar.',
      );
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
        <h4 className="text-sm font-semibold text-bokka-ink mb-3">Queixa e histórico</h4>
        <div className="space-y-4">
          <Textarea
            label="Queixa principal"
            required
            value={queixaPrincipal}
            onChange={(e) => setQueixaPrincipal(e.target.value)}
            placeholder="Descreva a queixa principal do paciente..."
            rows={3}
          />
          <Textarea
            label="Histórico dental"
            value={historicoDental}
            onChange={(e) => setHistoricoDental(e.target.value)}
            placeholder="Tratamentos anteriores, extrações, próteses..."
            rows={2}
          />
        </div>
      </section>

      <section>
        <h4 className="text-sm font-semibold text-bokka-ink mb-3">Saúde geral</h4>
        <div className="space-y-4">
          <Input
            label="Doenças preexistentes"
            value={doencasPreexistentes}
            onChange={(e) => setDoencasPreexistentes(e.target.value)}
            placeholder="Diabetes, hipertensão, cardiopatias..."
          />

          <ToggleField
            label="Usa medicamentos?"
            checked={usaMedicamentos}
            onChange={setUsaMedicamentos}
          />
          {usaMedicamentos && (
            <Input
              label="Quais medicamentos?"
              required
              value={quaisMedicamentos}
              onChange={(e) => setQuaisMedicamentos(e.target.value)}
              placeholder="Nome do medicamento e dosagem..."
            />
          )}

          <ToggleField
            label="Possui alergias?"
            checked={temAlergia}
            onChange={setTemAlergia}
          />
          {temAlergia && (
            <Input
              label="Quais alergias?"
              required
              value={quaisAlergias}
              onChange={(e) => setQuaisAlergias(e.target.value)}
              placeholder="Penicilina, látex, anestésicos..."
            />
          )}
        </div>
      </section>

      <section>
        <h4 className="text-sm font-semibold text-bokka-ink mb-3">Hábitos e condições</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ToggleCard
            icon={<Baby className="w-4 h-4" />}
            label="Gestante"
            checked={gestante}
            onChange={setGestante}
          />
          <ToggleCard
            icon={<Cigarette className="w-4 h-4" />}
            label="Fumante"
            checked={fumante}
            onChange={setFumante}
          />
          <ToggleCard
            icon={<Wine className="w-4 h-4" />}
            label="Consumo de álcool"
            checked={consumoAlcool}
            onChange={setConsumoAlcool}
          />
        </div>
      </section>

      <section>
        <h4 className="text-sm font-semibold text-bokka-ink mb-3">Informações complementares</h4>
        <div className="space-y-4">
          <Input
            label="Histórico familiar"
            value={historiaFamiliar}
            onChange={(e) => setHistoriaFamiliar(e.target.value)}
            placeholder="Doenças hereditárias, problemas bucais na família..."
          />
          <Textarea
            label="Observações"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Notas adicionais relevantes..."
            rows={2}
          />
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-2 border-t border-bokka-border -mx-6 px-6 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initial?.id ? 'Salvar alterações' : 'Registrar anamnese'}
        </Button>
      </div>
    </form>
  );
};

const ToggleField = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-10 h-[22px] rounded-full transition-colors shrink-0',
        checked ? 'bg-bokka-primary' : 'bg-bokka-border-strong',
      )}
    >
      <span
        className={cn(
          'absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform',
          checked && 'translate-x-[18px]',
        )}
      />
    </button>
    <span className="text-sm font-medium text-bokka-ink-2 group-hover:text-bokka-ink transition-colors">
      {label}
    </span>
  </label>
);

const ToggleCard = ({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={cn(
      'flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
      checked
        ? 'bg-bokka-warning-soft border-bokka-warning/30 text-bokka-warning-ink'
        : 'bg-bokka-surface border-bokka-border text-bokka-ink-3 hover:bg-bokka-surface-3',
    )}
  >
    <span
      className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
        checked
          ? 'bg-bokka-warning/10 text-bokka-warning-ink'
          : 'bg-bokka-surface-3 text-bokka-ink-3',
      )}
    >
      {icon}
    </span>
    <div className="min-w-0">
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-[11px]">{checked ? 'Sim' : 'Não'}</p>
    </div>
  </button>
);
