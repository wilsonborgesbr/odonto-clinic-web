import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Agendamento, DentistaListagemDTO, StatusAgendamentoEnum } from '../../types';
import { agendamentoService } from '../../services/agendamentoService';
import { dentistaService } from '../../services/dentistaService';
import { pacienteService } from '../../services/pacienteService';
import { ApiError } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { AgendamentoForm } from './AgendamentoForm';

const HORA_INICIO = 7;
const HORA_FIM = 20;
const TOTAL_HORAS = HORA_FIM - HORA_INICIO;

const STATUS_LABELS: Record<StatusAgendamentoEnum, string> = {
  AGENDADO: 'Agendado',
  CONFIRMADO: 'Confirmado',
  REALIZADO: 'Realizado',
  FALTOU: 'Faltou',
  CANCELADO: 'Cancelado',
};

const STATUS_COLORS: Record<StatusAgendamentoEnum, string> = {
  AGENDADO: 'bg-sky-100 border-sky-300 text-sky-800',
  CONFIRMADO: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  REALIZADO: 'bg-slate-100 border-slate-300 text-slate-600',
  FALTOU: 'bg-amber-100 border-amber-300 text-amber-800',
  CANCELADO: 'bg-red-50 border-red-200 text-red-400 line-through',
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const getInicioSemana = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = d.getDay();
  d.setDate(d.getDate() - diff);
  return d;
};

const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const formatDateShort = (date: Date): string =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

const formatDateISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isSameDay = (dateStr: string, target: Date): boolean => {
  const d = new Date(dateStr);
  return d.getFullYear() === target.getFullYear()
    && d.getMonth() === target.getMonth()
    && d.getDate() === target.getDate();
};

const isToday = (date: Date): boolean => {
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
};

const getMinutesFromMidnight = (dateStr: string): number => {
  const d = new Date(dateStr);
  return d.getHours() * 60 + d.getMinutes();
};

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos os status' },
  ...Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l })),
];

export const AgendaPage = () => {
  const toast = useToast();

  const [inicioSemana, setInicioSemana] = useState(() => getInicioSemana(new Date()));
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  const [dentistas, setDentistas] = useState<DentistaListagemDTO[]>([]);
  const [pacienteMap, setPacienteMap] = useState<Record<string, string>>({});

  const [filtroDentista, setFiltroDentista] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<Agendamento | null>(null);
  const [formDefaultStart, setFormDefaultStart] = useState<string | undefined>();

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Agendamento | null>(null);
  const [novoStatus, setNovoStatus] = useState<StatusAgendamentoEnum>('AGENDADO');
  const [salvandoStatus, setSalvandoStatus] = useState(false);

  const [confirmarExcluir, setConfirmarExcluir] = useState<Agendamento | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const diasSemana = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(inicioSemana, i)),
    [inicioSemana],
  );

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await agendamentoService.listar({ tamanho: 500, ordem: 'dataHoraInicio' });
      setAgendamentos(resp.content);

      const ids = new Set(resp.content.map((a) => a.pacienteId));
      if (ids.size > 0) {
        const pacResp = await pacienteService.listar({ tamanho: 500 });
        const map: Record<string, string> = {};
        pacResp.content.forEach((p) => { map[p.id] = p.nomeCompleto; });
        setPacienteMap(map);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.friendlyMessage() : 'Erro ao carregar agendamentos';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => {
    dentistaService.listarAtivos().then((r) => setDentistas(r.content)).catch(() => {});
  }, []);

  const dentistaMap = useMemo(() => {
    const m: Record<string, string> = {};
    dentistas.forEach((d) => { m[d.id] = d.nomeCompleto; });
    return m;
  }, [dentistas]);

  const dentistaFilterOptions = useMemo(() => [
    { value: '', label: 'Todos os dentistas' },
    ...dentistas.map((d) => ({ value: d.id, label: d.nomeCompleto })),
  ], [dentistas]);

  const agendamentosFiltrados = useMemo(() => {
    let list = agendamentos;
    if (filtroDentista) list = list.filter((a) => a.dentistaId === filtroDentista);
    if (filtroStatus) list = list.filter((a) => a.status === filtroStatus);
    return list;
  }, [agendamentos, filtroDentista, filtroStatus]);

  const getAgendamentosDia = useCallback(
    (dia: Date) => agendamentosFiltrados.filter((a) => isSameDay(a.dataHoraInicio, dia)),
    [agendamentosFiltrados],
  );

  const irParaHoje = () => setInicioSemana(getInicioSemana(new Date()));
  const semanaAnterior = () => setInicioSemana((s) => addDays(s, -7));
  const proximaSemana = () => setInicioSemana((s) => addDays(s, 7));

  const abrirNovoAgendamento = (dia?: Date, hora?: number) => {
    setFormInitial(null);
    if (dia && hora != null) {
      const isoDate = formatDateISO(dia);
      const h = String(hora).padStart(2, '0');
      setFormDefaultStart(`${isoDate}T${h}:00`);
    } else {
      setFormDefaultStart(undefined);
    }
    setFormOpen(true);
  };

  const abrirEdicao = (ag: Agendamento) => {
    setFormInitial(ag);
    setFormDefaultStart(undefined);
    setFormOpen(true);
  };

  const handleSubmitForm = async (payload: Agendamento) => {
    if (formInitial?.id) {
      await agendamentoService.atualizar(formInitial.id, payload);
      toast.success('Agendamento atualizado.');
    } else {
      await agendamentoService.criar(payload);
      toast.success('Agendamento criado.');
    }
    setFormOpen(false);
    carregar();
  };

  const abrirAlterarStatus = (ag: Agendamento) => {
    setStatusTarget(ag);
    setNovoStatus(ag.status);
    setStatusModalOpen(true);
  };

  const handleSalvarStatus = async () => {
    if (!statusTarget?.id) return;
    setSalvandoStatus(true);
    try {
      await agendamentoService.atualizar(statusTarget.id, { ...statusTarget, status: novoStatus });
      toast.success(`Status alterado para ${STATUS_LABELS[novoStatus]}.`);
      setStatusModalOpen(false);
      carregar();
    } catch (err) {
      const msg = err instanceof ApiError ? err.friendlyMessage() : 'Erro ao alterar status';
      toast.error(msg);
    } finally {
      setSalvandoStatus(false);
    }
  };

  const handleExcluir = async () => {
    if (!confirmarExcluir?.id) return;
    setExcluindo(true);
    try {
      await agendamentoService.excluir(confirmarExcluir.id);
      toast.success('Agendamento excluído.');
      setConfirmarExcluir(null);
      carregar();
    } catch (err) {
      const msg = err instanceof ApiError ? err.friendlyMessage() : 'Erro ao excluir';
      toast.error(msg);
    } finally {
      setExcluindo(false);
    }
  };

  const labelSemana = `${formatDateShort(diasSemana[0])} — ${formatDateShort(diasSemana[6])}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Agenda</h1>
          <p className="text-sm text-slate-500">
            {loading ? 'Carregando...' : `${agendamentosFiltrados.length} agendamento(s) visível(is)`}
          </p>
        </div>
        <Button onClick={() => abrirNovoAgendamento()} icon={<span className="text-lg leading-none">＋</span>}>
          Novo agendamento
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center justify-between gap-4 p-4 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={semanaAnterior}>‹</Button>
            <Button size="sm" variant="ghost" onClick={irParaHoje}>Hoje</Button>
            <Button size="sm" variant="secondary" onClick={proximaSemana}>›</Button>
            <span className="text-sm font-medium text-slate-700 ml-2">{labelSemana}</span>
          </div>
          <div className="flex items-center gap-3">
            <Select
              label=""
              options={dentistaFilterOptions}
              value={filtroDentista}
              onChange={(e) => setFiltroDentista(e.target.value)}
              containerClassName="min-w-[180px]"
            />
            <Select
              label=""
              options={STATUS_FILTER_OPTIONS}
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              containerClassName="min-w-[160px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header dos dias */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-100">
              <div className="p-2" />
              {diasSemana.map((dia, i) => (
                <div
                  key={i}
                  className={`p-2 text-center border-l border-slate-100 ${
                    isToday(dia) ? 'bg-sky-50' : ''
                  }`}
                >
                  <div className="text-xs text-slate-500 uppercase">{DIAS_SEMANA[dia.getDay()]}</div>
                  <div className={`text-sm font-semibold ${
                    isToday(dia) ? 'text-sky-600' : 'text-slate-700'
                  }`}>
                    {dia.getDate()}
                  </div>
                </div>
              ))}
            </div>

            {/* Grid de horários */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)]">
              {Array.from({ length: TOTAL_HORAS }, (_, hi) => {
                const hora = HORA_INICIO + hi;
                return (
                  <div key={hora} className="contents">
                    <div className="h-16 px-2 flex items-start justify-end pt-1 text-[10px] text-slate-400 border-t border-slate-50">
                      {String(hora).padStart(2, '0')}:00
                    </div>
                    {diasSemana.map((dia, di) => {
                      const agDia = getAgendamentosDia(dia);
                      const agHora = agDia.filter((a) => {
                        const m = getMinutesFromMidnight(a.dataHoraInicio);
                        return m >= hora * 60 && m < (hora + 1) * 60;
                      });
                      return (
                        <div
                          key={di}
                          className={`h-16 border-t border-l border-slate-50 relative cursor-pointer hover:bg-slate-25 ${
                            isToday(dia) ? 'bg-sky-50/30' : ''
                          }`}
                          onClick={() => abrirNovoAgendamento(dia, hora)}
                        >
                          {agHora.map((ag) => {
                            const startMin = getMinutesFromMidnight(ag.dataHoraInicio);
                            const endMin = getMinutesFromMidnight(ag.dataHoraFim);
                            const top = ((startMin - hora * 60) / 60) * 64;
                            const height = Math.max(((endMin - startMin) / 60) * 64, 20);
                            return (
                              <div
                                key={ag.id}
                                className={`absolute left-0.5 right-0.5 rounded border text-[10px] leading-tight px-1 py-0.5 overflow-hidden cursor-pointer z-10 ${
                                  STATUS_COLORS[ag.status]
                                }`}
                                style={{ top: `${top}px`, height: `${height}px` }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirEdicao(ag);
                                }}
                                title={`${pacienteMap[ag.pacienteId] ?? ag.pacienteId}\n${dentistaMap[ag.dentistaId] ?? ag.dentistaId}\n${STATUS_LABELS[ag.status]}`}
                              >
                                <div className="font-medium truncate">
                                  {pacienteMap[ag.pacienteId] ?? 'Paciente'}
                                </div>
                                <div className="truncate opacity-75">
                                  {dentistaMap[ag.dentistaId] ?? 'Dentista'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de formulário (criar/editar) */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formInitial?.id ? 'Editar agendamento' : 'Novo agendamento'}
        size="lg"
      >
        <AgendamentoForm
          initial={formInitial}
          defaultStart={formDefaultStart}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleSubmitForm}
        />
        {formInitial?.id && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setFormOpen(false);
                abrirAlterarStatus(formInitial);
              }}
            >
              Alterar status
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                setFormOpen(false);
                setConfirmarExcluir(formInitial);
              }}
            >
              Excluir
            </Button>
          </div>
        )}
      </Modal>

      {/* Modal de alteração de status */}
      <Modal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Alterar status"
        size="md"
      >
        {statusTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              {pacienteMap[statusTarget.pacienteId] ?? 'Paciente'} — {dentistaMap[statusTarget.dentistaId] ?? 'Dentista'}
            </p>
            <Select
              label="Novo status"
              options={STATUS_OPTIONS_ALL}
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value as StatusAgendamentoEnum)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setStatusModalOpen(false)} disabled={salvandoStatus}>
                Cancelar
              </Button>
              <Button onClick={handleSalvarStatus} loading={salvandoStatus}>
                Salvar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de confirmação de exclusão */}
      <ConfirmModal
        open={!!confirmarExcluir}
        title="Excluir agendamento?"
        message={
          confirmarExcluir
            ? `O agendamento de ${pacienteMap[confirmarExcluir.pacienteId] ?? 'paciente'} será excluído permanentemente.`
            : ''
        }
        confirmLabel="Excluir"
        danger
        loading={excluindo}
        onClose={() => setConfirmarExcluir(null)}
        onConfirm={handleExcluir}
      />
    </div>
  );
};

const STATUS_OPTIONS_ALL = [
  { value: 'AGENDADO', label: 'Agendado' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'REALIZADO', label: 'Realizado' },
  { value: 'FALTOU', label: 'Faltou' },
  { value: 'CANCELADO', label: 'Cancelado' },
];
