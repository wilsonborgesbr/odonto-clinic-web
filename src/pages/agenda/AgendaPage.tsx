import { useMemo, useState } from 'react';
import { Plus, CalendarDays, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { AgendamentoStatusBadge } from '../../components/ui/Badge';
import { SkeletonTableRows } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Card } from '../../components/ui/Card';
import { bokkaToast } from '../../components/ui/Toast';
import { AgendamentoForm } from './AgendamentoForm';
import {
  useAgendamentos,
  useAtualizarAgendamento,
  useCriarAgendamento,
  useExcluirAgendamento,
} from '../../services/agendamentoService';
import { useDentistasAtivos } from '../../services/dentistaService';
import { usePacientes } from '../../services/pacienteService';
import { ApiError } from '../../lib/api';
import { formatDateLong, formatTime } from '../../lib/utils';
import type { Agendamento } from '../../types';

const todayIso = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const shiftDay = (dateStr: string, delta: number) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
};

export const AgendaPage = () => {
  const [selectedDate, setSelectedDate] = useState<string>(todayIso());
  const [dentistaFilter, setDentistaFilter] = useState<string>('');

  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<Agendamento | null>(null);
  const [confirmar, setConfirmar] = useState<Agendamento | null>(null);

  const listQuery = useAgendamentos({ pagina: 0, tamanho: 500, ordem: 'dataHoraInicio' });
  const dentistasQ = useDentistasAtivos();
  const pacientesQ = usePacientes({ pagina: 0, tamanho: 200 });

  const criarM = useCriarAgendamento();
  const atualizarM = useAtualizarAgendamento();
  const excluirM = useExcluirAgendamento();

  const agendamentos = listQuery.data?.content ?? [];

  const doDia = useMemo(() => {
    return agendamentos
      .filter((a) => a.dataHoraInicio?.slice(0, 10) === selectedDate)
      .filter((a) => !dentistaFilter || a.dentistaId === dentistaFilter)
      .sort((a, b) => (a.dataHoraInicio || '').localeCompare(b.dataHoraInicio || ''));
  }, [agendamentos, selectedDate, dentistaFilter]);

  const dentistaMap = useMemo(() => {
    const m = new Map<string, string>();
    dentistasQ.data?.forEach((d) => m.set(d.id, d.nomeCompleto));
    return m;
  }, [dentistasQ.data]);

  const pacienteMap = useMemo(() => {
    const m = new Map<string, string>();
    (pacientesQ.data?.content ?? []).forEach((p) => m.set(p.id, p.nomeCompleto));
    return m;
  }, [pacientesQ.data]);

  const dentistaOptions = [
    { value: '', label: 'Todos os dentistas' },
    ...(dentistasQ.data?.map((d) => ({ value: d.id, label: `Dr(a). ${d.nomeCompleto}` })) ?? []),
  ];

  const abrirNovo = () => {
    setFormInitial(null);
    setFormOpen(true);
  };

  const handleSubmit = async (ag: Agendamento) => {
    if (formInitial?.id) {
      await atualizarM.mutateAsync({ id: formInitial.id, agendamento: ag });
      bokkaToast.success('Agendamento atualizado.');
    } else {
      await criarM.mutateAsync(ag);
      bokkaToast.success('Agendamento criado.');
    }
    setFormOpen(false);
  };

  const handleExcluir = async () => {
    if (!confirmar?.id) return;
    try {
      await excluirM.mutateAsync(confirmar.id);
      setConfirmar(null);
      bokkaToast.success('Agendamento excluído.');
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao excluir agendamento',
      );
    }
  };

  const loading = listQuery.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-bokka-ink">Agendamentos</h1>
          <p className="text-sm text-bokka-ink-3 mt-1">
            {doDia.length} {doDia.length === 1 ? 'consulta' : 'consultas'} para o dia selecionado
          </p>
        </div>
        <Button onClick={abrirNovo} icon={<Plus />}>
          Novo agendamento
        </Button>
      </div>

      <Card padded={false}>
        {/* Barra de filtros */}
        <div className="p-4 border-b border-bokka-border flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => shiftDay(d, -1))}
              className="p-2 rounded-md text-bokka-ink-2 hover:bg-bokka-surface-3 hover:text-bokka-ink border border-bokka-border-strong"
              aria-label="Dia anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              fullWidth={false}
              containerClassName="w-44"
              leadingIcon={<CalendarDays className="w-4 h-4" strokeWidth={1.75} />}
            />
            <button
              type="button"
              onClick={() => setSelectedDate((d) => shiftDay(d, 1))}
              className="p-2 rounded-md text-bokka-ink-2 hover:bg-bokka-surface-3 hover:text-bokka-ink border border-bokka-border-strong"
              aria-label="Próximo dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedDate(todayIso())}
              className="ml-1"
            >
              Hoje
            </Button>
          </div>
          <div className="w-full sm:w-64">
            <Select
              value={dentistaFilter}
              onChange={(e) => setDentistaFilter(e.target.value)}
              options={dentistaOptions}
            />
          </div>
          <div className="flex-1 min-w-0 text-sm text-bokka-ink-3 capitalize text-right hidden lg:block">
            {formatDateLong(new Date(`${selectedDate}T00:00:00`))}
          </div>
        </div>

        {loading ? (
          <SkeletonTableRows rows={5} />
        ) : listQuery.isError ? (
          <div className="px-4 py-3 text-sm text-bokka-danger-ink bg-bokka-danger-soft">
            {listQuery.error instanceof ApiError
              ? listQuery.error.friendlyMessage()
              : 'Erro ao carregar agendamentos'}
          </div>
        ) : doDia.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="w-6 h-6" strokeWidth={1.75} />}
            title="Nenhum agendamento para esta data"
            description="Escolha outro dia ou crie um novo agendamento."
            action={
              <Button onClick={abrirNovo} icon={<Plus />}>
                Novo agendamento
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-bokka-ink-3 bg-bokka-surface-3">
                  <th className="px-4 py-3 font-semibold w-32">Horário</th>
                  <th className="px-4 py-3 font-semibold">Paciente</th>
                  <th className="px-4 py-3 font-semibold">Dentista</th>
                  <th className="px-4 py-3 font-semibold">Observações</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bokka-border">
                {doDia.map((ag) => (
                  <tr key={ag.id} className="hover:bg-bokka-surface-3">
                    <td className="px-4 py-3 font-semibold text-bokka-ink tabular-nums">
                      {formatTime(ag.dataHoraInicio)}
                      <span className="text-bokka-ink-3 font-normal">
                        {' – '}
                        {formatTime(ag.dataHoraFim)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-bokka-ink font-semibold">
                      {pacienteMap.get(ag.pacienteId ?? '') ??
                        (ag.pacienteId ? `Paciente #${ag.pacienteId.slice(-6)}` : '—')}
                    </td>
                    <td className="px-4 py-3 text-bokka-ink-2">
                      {dentistaMap.get(ag.dentistaId ?? '') ??
                        (ag.dentistaId ? `#${ag.dentistaId.slice(-6)}` : '—')}
                    </td>
                    <td className="px-4 py-3 text-bokka-ink-2 max-w-xs truncate">
                      {ag.observacoes || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <AgendamentoStatusBadge status={ag.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setFormInitial(ag);
                            setFormOpen(true);
                          }}
                          className="p-2 rounded-md text-bokka-ink-2 hover:bg-bokka-surface hover:text-bokka-primary"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmar(ag)}
                          className="p-2 rounded-md text-bokka-ink-2 hover:bg-bokka-danger-soft hover:text-bokka-danger-ink"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formInitial?.id ? 'Editar agendamento' : 'Novo agendamento'}
        subtitle={
          formInitial?.id
            ? 'Ajuste horários, dentista ou status.'
            : 'Reserve um horário na agenda da clínica.'
        }
        size="lg"
      >
        <AgendamentoForm
          initial={formInitial}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      <ConfirmModal
        open={!!confirmar}
        onClose={() => setConfirmar(null)}
        onConfirm={handleExcluir}
        title="Excluir agendamento?"
        message="Esta ação não pode ser desfeita. O agendamento será removido definitivamente."
        confirmLabel="Excluir"
        danger
        loading={excluirM.isPending}
      />
    </div>
  );
};
