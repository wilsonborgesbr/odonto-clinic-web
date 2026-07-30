import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  CalendarDays,
  Wallet,
  Users,
  Plus,
  ArrowRight,
  Download,
  ChevronLeft,
  ChevronRight,
  Play,
  X as CloseIcon,
} from 'lucide-react';
import { KpiCard, Card } from '../components/ui/Card';
import { AgendamentoStatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { Avatar } from '../components/ui/Avatar';
import { Modal } from '../components/ui/Modal';
import { bokkaToast } from '../components/ui/Toast';
import { AgendamentoForm } from './agenda/AgendamentoForm';
import {
  useAgendamentos,
  useCriarAgendamento,
} from '../services/agendamentoService';
import { useContasReceber } from '../services/financeiroService';
import { usePacientes } from '../services/pacienteService';
import { useDentistasAtivos } from '../services/dentistaService';
import { useAuth } from '../context/AuthContext';
import { photoKeys } from '../lib/profilePhotos';
import {
  cn,
  formatCurrency,
  formatDateLong,
  formatTime,
  getGreeting,
  isSameDay,
} from '../lib/utils';
import type { Agendamento } from '../types';

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
const inRange = (iso: string | undefined | null, from: Date, to: Date): boolean => {
  if (!iso) return false;
  const d = new Date(iso);
  return d >= from && d <= to;
};

const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const semanaLabels = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export const Dashboard = () => {
  const { user } = useAuth();
  const userPhotoKey = photoKeys.user(user?.email);

  // Reloga a cada minuto pra o timer atualizar
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const agendamentosQ = useAgendamentos({ pagina: 0, tamanho: 300, ordem: 'dataHoraInicio' });
  const contasQ = useContasReceber();
  const pacientesQ = usePacientes({ pagina: 0, tamanho: 1 });
  const dentistasQ = useDentistasAtivos();
  const criarM = useCriarAgendamento();

  const agendamentos = agendamentosQ.data?.content ?? [];
  const contas = contasQ.data ?? [];

  // Estado do mini-calendário (mês exibido)
  const [calMonth, setCalMonth] = useState<Date>(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [novoAgDate, setNovoAgDate] = useState<string | null>(null); // "YYYY-MM-DD"

  const agendamentosHoje = useMemo(
    () =>
      agendamentos
        .filter((a) => isSameDay(a.dataHoraInicio, now))
        .sort((a, b) => (a.dataHoraInicio || '').localeCompare(b.dataHoraInicio || '')),
    [agendamentos, now],
  );

  const confirmadosHoje = useMemo(
    () => agendamentosHoje.filter((a) => a.status === 'CONFIRMADO').length,
    [agendamentosHoje],
  );

  const proximaConsulta = useMemo(() => {
    const nowMs = now.getTime();
    return (
      agendamentos
        .filter((a) => a.dataHoraInicio && new Date(a.dataHoraInicio).getTime() > nowMs)
        .sort((a, b) =>
          (a.dataHoraInicio || '').localeCompare(b.dataHoraInicio || ''),
        )[0] ?? null
    );
  }, [agendamentos, now]);

  const proximoPaciente = useMemo(() => {
    if (!proximaConsulta || !pacientesQ.data) return null;
    return pacientesQ.data.content.find((p) => p.id === proximaConsulta.pacienteId) ?? null;
  }, [proximaConsulta, pacientesQ.data]);

  const proximoDentista = useMemo(() => {
    if (!proximaConsulta || !dentistasQ.data) return null;
    return dentistasQ.data.find((d) => d.id === proximaConsulta.dentistaId) ?? null;
  }, [proximaConsulta, dentistasQ.data]);

  const receitaMes = useMemo(() => {
    const from = startOfMonth(now);
    const to = endOfMonth(now);
    return contas
      .filter((c) => c.status === 'PAGO' && inRange(c.dataPagamento, from, to))
      .reduce((sum, c) => sum + (c.valorPago ?? c.valorTotal ?? 0), 0);
  }, [contas, now]);

  const saldoPendente = useMemo(
    () =>
      contas
        .filter((c) => c.status === 'PENDENTE' || (c.status as string) === 'PARCIAL')
        .reduce((sum, c) => sum + Math.max(0, (c.valorTotal ?? 0) - (c.valorPago ?? 0)), 0),
    [contas],
  );

  const totalPacientes = pacientesQ.data?.totalElements ?? 0;

  // Produtividade: consultas por mês nos últimos 12 meses
  const produtividade = useMemo(() => {
    const arr: { mes: string; anoAtual: number; anoAnterior: number }[] = [];
    const y = now.getFullYear();
    for (let m = 0; m < 12; m++) {
      arr.push({ mes: meses[m], anoAtual: 0, anoAnterior: 0 });
    }
    agendamentos.forEach((a) => {
      if (!a.dataHoraInicio) return;
      const d = new Date(a.dataHoraInicio);
      const dy = d.getFullYear();
      const dm = d.getMonth();
      if (dy === y) arr[dm].anoAtual += 1;
      else if (dy === y - 1) arr[dm].anoAnterior += 1;
    });
    return arr;
  }, [agendamentos, now]);

  // Timeline horária de hoje
  const nowHour = now.getHours();
  const nowMin = now.getMinutes();
  const nowSlotIdx = HOURS.indexOf(nowHour);
  const timelineByHour = useMemo(() => {
    const m: Record<number, typeof agendamentosHoje> = {};
    HOURS.forEach((h) => (m[h] = []));
    agendamentosHoje.forEach((ag) => {
      if (!ag.dataHoraInicio) return;
      const h = new Date(ag.dataHoraInicio).getHours();
      if (m[h]) m[h].push(ag);
    });
    return m;
  }, [agendamentosHoje]);

  // Mini calendário — usa calMonth (não now)
  const miniCalendar = useMemo(() => {
    const y = calMonth.getFullYear();
    const m = calMonth.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const daysInMonth = last.getDate();
    const firstDow = (first.getDay() + 6) % 7; // Mon=0..Sun=6
    const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7;
    const cells: (number | null)[] = [];
    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - firstDow + 1;
      cells.push(dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null);
    }
    const daysWithEvents = new Set(
      agendamentos
        .filter((a) => {
          if (!a.dataHoraInicio) return false;
          const d = new Date(a.dataHoraInicio);
          return d.getFullYear() === y && d.getMonth() === m;
        })
        .map((a) => new Date(a.dataHoraInicio!).getDate()),
    );
    const isCurrentMonth =
      y === now.getFullYear() && m === now.getMonth();
    return {
      cells,
      daysWithEvents,
      todayNum: isCurrentMonth ? now.getDate() : -1,
      year: y,
      month: m,
      monthLabel: calMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    };
  }, [calMonth, now, agendamentos]);

  const shiftMonth = (delta: number) => {
    setCalMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const abrirNovoAgendamento = (dayNum: number) => {
    const iso = `${miniCalendar.year}-${String(miniCalendar.month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    setNovoAgDate(iso);
  };

  const handleCriarAgendamento = async (ag: Agendamento) => {
    await criarM.mutateAsync(ag);
    bokkaToast.success('Agendamento criado.');
    setNovoAgDate(null);
  };

  const loading =
    agendamentosQ.isLoading || contasQ.isLoading || pacientesQ.isLoading || dentistasQ.isLoading;
  const dentistasAtivos = dentistasQ.data ?? [];

  return (
    <div className="space-y-6">
      {/* Cabeçalho + Perfil compacto */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar photoKey={userPhotoKey} name={user?.name || user?.email} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-bokka-ink tracking-tight">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Dra. Tainah'}
            </h1>
            <p className="text-sm text-bokka-ink-3 capitalize mt-1">{formatDateLong(now)}</p>
          </div>
        </div>
      </div>

      {/* KPIs — 4 cards heterogêneos estilo Moru */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Agendamentos hoje"
          value={loading ? '—' : agendamentosHoje.length}
          hint={agendamentosHoje.length ? 'Consultas do dia' : 'Nenhuma hoje'}
          icon={<CalendarDays className="w-5 h-5" strokeWidth={1.75} />}
          tone="primary"
          loading={loading}
        />
        <HighlightKpi
          label="Confirmadas"
          value={loading ? '—' : confirmadosHoje}
          hint={`de ${agendamentosHoje.length} agendadas`}
          icon={<CalendarDays className="w-5 h-5" strokeWidth={2} />}
          loading={loading}
        />
        <CtaHatchedCard
          title="Novo agendamento"
          to="/agenda"
          icon={<Plus className="w-5 h-5" strokeWidth={2.25} />}
        />
        <TeamCard
          label="Equipe clínica"
          count={dentistasAtivos.length}
          members={dentistasAtivos.slice(0, 4)}
          loading={loading}
        />
      </div>

      {/* Painel duplo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-4">
          {/* Painel PRETO — Produtividade */}
          <div className="bg-bokka-ink rounded-2xl p-5 lg:p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold">Produtividade</h2>
                <p className="text-xs text-white/60 mt-0.5">Consultas por mês</p>
              </div>
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors"
                aria-label="Exportar"
                title="Exportar"
              >
                <Download className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="h-56">
              {loading ? (
                <div className="w-full h-full bg-white/5 rounded-lg animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={produtividade} margin={{ top: 12, right: 8, bottom: 0, left: -22 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="mes"
                      tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      width={30}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{
                        background: '#0B1220',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '10px',
                        fontSize: '12px',
                        color: 'white',
                      }}
                      labelStyle={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}
                    />
                    <Bar dataKey="anoAtual" radius={[999, 999, 999, 999]} fill="white" maxBarSize={22} name="Este ano" />
                    <Line
                      type="monotone"
                      dataKey="anoAnterior"
                      stroke="#93B8FC"
                      strokeWidth={2.5}
                      dot={false}
                      name="Ano anterior"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex items-center gap-5 mt-4 text-xs">
              <span className="inline-flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white" />
                <span className="text-white/70">Este ano</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full border border-white/60 border-dashed" />
                <span className="text-white/70">Ano anterior</span>
              </span>
            </div>
          </div>

          {/* Timeline horizontal do dia */}
          <Card padded={false}>
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-bokka-ink">Agenda de hoje</h2>
                <p className="text-xs text-bokka-ink-3 mt-0.5 capitalize">
                  {now.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })} · {agendamentosHoje.length} {agendamentosHoje.length === 1 ? 'consulta' : 'consultas'}
                </p>
              </div>
              <Link
                to="/agenda"
                className="text-sm font-semibold text-bokka-primary hover:text-bokka-primary-hover inline-flex items-center gap-1"
              >
                Ver agenda <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Link>
            </div>
            {loading ? (
              <div className="px-5 pb-5">
                <Skeleton className="h-40 w-full" rounded="lg" />
              </div>
            ) : agendamentosHoje.length === 0 ? (
              <EmptyState
                compact
                icon={<CalendarDays className="w-6 h-6" strokeWidth={1.75} />}
                title="Nenhum agendamento para hoje"
                description="Clique num dia no calendário ao lado pra agendar."
              />
            ) : (
              <TimelineDia byHour={timelineByHour} nowSlotIdx={nowSlotIdx} nowMin={nowMin} />
            )}
          </Card>
        </div>

        {/* Coluna direita */}
        <div className="space-y-4">
          {/* Mini calendar AZUL — clicável */}
          <div className="bg-bokka-primary-soft rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-bokka-ink capitalize">
                  {miniCalendar.monthLabel}
                </h2>
                <p className="text-xs text-bokka-ink-2/70 mt-0.5">
                  {miniCalendar.daysWithEvents.size} dias com consultas · clique pra agendar
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-white/85 flex items-center justify-center text-bokka-ink transition-colors"
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-white/85 flex items-center justify-center text-bokka-ink transition-colors"
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {semanaLabels.map((d, i) => (
                <div
                  key={i}
                  className="h-7 flex items-center justify-center text-[11px] font-semibold text-bokka-ink-2/70"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {miniCalendar.cells.map((n, i) => {
                if (n == null) {
                  return (
                    <div
                      key={i}
                      className="aspect-square rounded-full border border-dashed border-bokka-ink-2/20"
                    />
                  );
                }
                const hasEvent = miniCalendar.daysWithEvents.has(n);
                const isToday = n === miniCalendar.todayNum;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => abrirNovoAgendamento(n)}
                    className={cn(
                      'aspect-square rounded-full flex items-center justify-center text-[13px] tabular-nums transition-all cursor-pointer',
                      'hover:ring-2 hover:ring-bokka-primary hover:scale-105',
                      isToday
                        ? 'bg-bokka-primary text-white font-bold ring-2 ring-white'
                        : hasEvent
                          ? 'bg-bokka-ink text-white font-semibold'
                          : 'bg-white/60 text-bokka-ink font-medium hover:bg-white',
                    )}
                    aria-label={`Agendar dia ${n}`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card PRETO — Próxima consulta com countdown REAL */}
          <ProximaConsultaCard
            proxima={proximaConsulta}
            pacienteNome={proximoPaciente?.nomeCompleto}
            dentistaNome={proximoDentista?.nomeCompleto}
            now={now}
          />

          {/* Financeiros compactos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4">
              <div className="flex items-center gap-2 text-bokka-ink-3">
                <Wallet className="w-4 h-4" strokeWidth={2} />
                <span className="text-xs font-semibold">Receita mês</span>
              </div>
              <p className="text-lg font-bold text-bokka-success-ink mt-2 tabular-nums">
                {formatCurrency(receitaMes)}
              </p>
            </div>
            <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4">
              <div className="flex items-center gap-2 text-bokka-ink-3">
                <Wallet className="w-4 h-4" strokeWidth={2} />
                <span className="text-xs font-semibold">Pendente</span>
              </div>
              <p className="text-lg font-bold text-bokka-warning-ink mt-2 tabular-nums">
                {formatCurrency(saldoPendente)}
              </p>
            </div>
          </div>

          <Link
            to="/pacientes"
            className="block bg-bokka-surface border border-bokka-border rounded-2xl p-4 hover:border-bokka-primary/40 hover:bg-bokka-surface transition-colors"
          >
            <div className="flex items-center gap-2 text-bokka-ink-3">
              <Users className="w-4 h-4" strokeWidth={2} />
              <span className="text-xs font-semibold">Pacientes cadastrados</span>
            </div>
            <p className="text-lg font-bold text-bokka-ink mt-2 tabular-nums">
              {totalPacientes}
            </p>
          </Link>
        </div>
      </div>

      {/* Modal de novo agendamento a partir do calendário */}
      <Modal
        open={!!novoAgDate}
        onClose={() => setNovoAgDate(null)}
        title="Novo agendamento"
        subtitle={
          novoAgDate
            ? `Reserve um horário para ${new Date(`${novoAgDate}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`
            : ''
        }
        size="lg"
      >
        {novoAgDate && (
          <AgendamentoForm
            initial={
              {
                pacienteId: '',
                dentistaId: '',
                dataHoraInicio: `${novoAgDate}T09:00:00`,
                dataHoraFim: `${novoAgDate}T10:00:00`,
                status: 'AGENDADO',
                observacoes: '',
              } as Agendamento
            }
            onCancel={() => setNovoAgDate(null)}
            onSubmit={handleCriarAgendamento}
          />
        )}
      </Modal>
    </div>
  );
};

// ============ Sub-componentes ============

interface HighlightKpiProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  loading?: boolean;
}

const HighlightKpi = ({ label, value, hint, icon, loading }: HighlightKpiProps) => (
  <div className="bg-bokka-primary rounded-2xl p-5 shadow-sm text-white flex flex-col gap-4">
    <div className="flex items-start justify-between">
      <span className="text-sm font-semibold text-white/85">{label}</span>
      <span className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
        {icon}
      </span>
    </div>
    <div>
      {loading ? (
        <span className="inline-block w-20 h-9 rounded-md bg-white/15 animate-pulse" />
      ) : (
        <span className="text-[30px] font-bold tabular-nums leading-none tracking-tight">
          {value}
        </span>
      )}
      {hint && <p className="text-xs text-white/80 mt-2">{hint}</p>}
    </div>
  </div>
);

interface CtaHatchedProps {
  title: string;
  to: string;
  icon: React.ReactNode;
}

const CtaHatchedCard = ({ title, to, icon }: CtaHatchedProps) => (
  <Link
    to={to}
    className="relative rounded-2xl border border-bokka-border shadow-sm p-5 flex flex-col items-center justify-center gap-3 text-center overflow-hidden hover:border-bokka-primary/40 transition-colors group min-h-[140px]"
    style={{
      backgroundImage:
        'repeating-linear-gradient(135deg, rgba(148,163,184,0.14) 0px, rgba(148,163,184,0.14) 1px, transparent 1px, transparent 8px)',
      backgroundColor: 'var(--color-bokka-surface-2)',
    }}
  >
    <span className="text-sm font-semibold text-bokka-ink">{title}</span>
    <span className="w-11 h-11 rounded-full bg-bokka-primary text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
      {icon}
    </span>
  </Link>
);

interface TeamMember {
  id: string;
  nomeCompleto: string;
}

const TeamCard = ({
  label,
  count,
  members,
  loading,
}: {
  label: string;
  count: number;
  members: TeamMember[];
  loading?: boolean;
}) => {
  const extras = Math.max(0, count - members.length);
  return (
    <Link
      to="/dentistas"
      className="bg-bokka-surface border border-bokka-border rounded-2xl p-5 shadow-sm flex flex-col gap-4 hover:border-bokka-primary/40 transition-colors min-h-[140px]"
    >
      <div className="flex items-start justify-between">
        <span className="text-sm font-semibold text-bokka-ink-3">{label}</span>
        <span className="text-xs font-semibold text-bokka-primary">Ver</span>
      </div>
      {loading ? (
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-10 h-10" rounded="full" />
          ))}
        </div>
      ) : count === 0 ? (
        <p className="text-sm text-bokka-ink-3">Nenhum dentista ativo.</p>
      ) : (
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {members.map((m) => (
              <Avatar
                key={m.id}
                photoKey={photoKeys.dentista(m.id)}
                name={m.nomeCompleto}
                size="md"
                ring
              />
            ))}
            {extras > 0 && (
              <div className="w-11 h-11 rounded-full bg-bokka-ink text-white flex items-center justify-center text-xs font-bold ring-2 ring-bokka-surface">
                +{extras}
              </div>
            )}
          </div>
        </div>
      )}
    </Link>
  );
};

// ============ Próxima consulta com countdown ============

const ProximaConsultaCard = ({
  proxima,
  pacienteNome,
  dentistaNome,
  now,
}: {
  proxima: Agendamento | null;
  pacienteNome?: string;
  dentistaNome?: string;
  now: Date;
}) => {
  if (!proxima) {
    return (
      <div className="bg-bokka-ink rounded-2xl p-5 text-white">
        <p className="text-xs text-white/60 uppercase tracking-wider font-semibold">
          Próxima consulta
        </p>
        <p className="text-lg font-semibold text-white/70 mt-2">
          Sem próximas agendadas
        </p>
        <p className="text-xs text-white/50 mt-1">
          Você está livre no momento.
        </p>
      </div>
    );
  }

  const target = new Date(proxima.dataHoraInicio).getTime();
  const diff = target - now.getTime();
  const totalSec = Math.max(0, Math.floor(diff / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const started = diff <= 0;

  return (
    <div className="bg-bokka-ink rounded-2xl p-5 text-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/60 uppercase tracking-wider font-semibold">
            Próxima consulta
          </p>
          <p className="text-3xl font-bold tabular-nums mt-1">
            {formatTime(proxima.dataHoraInicio)}
          </p>
        </div>
        <button
          type="button"
          className="w-11 h-11 rounded-full bg-white text-bokka-ink hover:bg-white/90 flex items-center justify-center transition-colors shadow"
          aria-label="Iniciar atendimento"
          title="Iniciar atendimento"
        >
          <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
        <div>
          <p className="text-[10px] uppercase font-semibold text-white/60 tracking-wider">
            {started ? 'Iniciou' : 'Começa em'}
          </p>
          <p className="text-2xl font-bold tabular-nums mt-1">
            {started
              ? `Há ${formatElapsed(-diff)}`
              : `${h > 0 ? `${String(h).padStart(2, '0')}:` : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white truncate">
            {pacienteNome || `Paciente #${proxima.pacienteId?.slice(-6) || '—'}`}
          </p>
          <p className="text-xs text-white/60 mt-0.5 truncate">
            {dentistaNome ? `Dr(a). ${dentistaNome}` : proxima.observacoes || 'Sem observações'}
          </p>
        </div>
      </div>
    </div>
  );
};

const formatElapsed = (ms: number): string => {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h}h ${min % 60}min`;
};

// ============ Timeline horária ============

const cardTones = [
  'bg-bokka-primary text-white',
  'bg-bokka-primary-soft text-bokka-primary',
  'bg-white border border-bokka-border text-bokka-ink',
  'bg-bokka-ink text-white',
];

const TimelineDia = ({
  byHour,
  nowSlotIdx,
  nowMin,
}: {
  byHour: Record<number, Array<{ id?: string; observacoes?: string; pacienteId?: string; status: string }>>;
  nowSlotIdx: number;
  nowMin: number;
}) => {
  return (
    <div className="px-5 pb-5 overflow-x-auto">
      <div className="min-w-[720px] relative">
        <div className="grid grid-cols-11 border-b border-bokka-border">
          {HOURS.map((h, i) => {
            const isNow = i === nowSlotIdx;
            return (
              <div
                key={h}
                className={cn(
                  'text-center text-[11px] font-semibold tabular-nums pb-2',
                  isNow ? 'text-bokka-primary' : 'text-bokka-ink-3',
                )}
              >
                <span className={cn('inline-block px-1.5 py-0.5 rounded-md', isNow && 'bg-bokka-primary text-white')}>
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-11 relative" style={{ minHeight: '160px' }}>
          {nowSlotIdx >= 0 && (
            <div
              className="absolute top-0 bottom-0 w-px bg-bokka-primary/40 z-0"
              style={{
                left: `calc(${nowSlotIdx * (100 / 11)}% + ${(nowMin / 60) * (100 / 11)}%)`,
              }}
            >
              <span className="absolute -top-1.5 -left-1 w-2 h-2 rounded-full bg-bokka-primary" />
            </div>
          )}

          {HOURS.map((h, i) => {
            const items = byHour[h];
            const isNow = i === nowSlotIdx;
            return (
              <div
                key={h}
                className={cn(
                  'relative pt-3 pb-2 px-1 border-l border-bokka-border/60',
                  isNow && 'bg-bokka-primary-soft/40',
                  i === HOURS.length - 1 && 'border-r border-bokka-border/60',
                )}
                style={{ minHeight: '160px' }}
              >
                {items?.slice(0, 2).map((ag, idx) => (
                  <div
                    key={ag.id ?? idx}
                    className={cn(
                      'rounded-xl px-2.5 py-2 text-xs font-semibold mb-1 shadow-sm truncate',
                      cardTones[(i + idx) % cardTones.length],
                    )}
                    title={ag.observacoes || 'Consulta'}
                  >
                    <div className="truncate leading-tight">{ag.observacoes?.slice(0, 24) || 'Consulta'}</div>
                    <div className="text-[10px] font-medium opacity-80 mt-0.5 truncate">
                      #{ag.pacienteId?.slice(-6) || '—'}
                    </div>
                  </div>
                ))}
                {items && items.length > 2 && (
                  <div className="text-[10px] text-bokka-ink-3 font-semibold text-center mt-1">
                    +{items.length - 2}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4 mt-2 border-t border-bokka-border">
          {['AGENDADO', 'CONFIRMADO', 'REALIZADO', 'CANCELADO'].map((s) => (
            <AgendamentoStatusBadge key={s} status={s as never} />
          ))}
        </div>
      </div>
    </div>
  );
};

// unused CloseIcon reference retained via alias avoidance
void CloseIcon;
