import { useEffect, useMemo, useRef, useState } from 'react';
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
  ArrowRight,
  Download,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { KpiCard, Card } from '../components/ui/Card';
import { AgendamentoStatusBadge } from '../components/ui/Badge';
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
import { useEstoque } from '../services/estoqueService';
import { useAuth } from '../context/AuthContext';
import { photoKeys } from '../lib/profilePhotos';
import {
  cn,
  formatCurrency,
  formatDateLong,
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
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const Dashboard = () => {
  const { user, hasPermissao } = useAuth();
  const userPhotoKey = photoKeys.user(user?.email);

  // Permissões que gateiam cards e queries
  const canAgendamentos = hasPermissao('AGENDAMENTOS');
  const canFinanceiro = hasPermissao('AUDITORIA_FINANCEIRA');
  const canPacientes = hasPermissao('PACIENTES');
  const canDentistas = hasPermissao('DENTISTAS');
  const canEstoque = hasPermissao('ESTOQUE');

  // Reloga a cada minuto pra o timer atualizar
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const agendamentosQ = useAgendamentos(
    { pagina: 0, tamanho: 300, ordem: 'dataHoraInicio' },
    { enabled: canAgendamentos },
  );
  const contasQ = useContasReceber({ enabled: canFinanceiro });
  const pacientesQ = usePacientes({ pagina: 0, tamanho: 200 }, { enabled: canPacientes });
  const dentistasQ = useDentistasAtivos({ enabled: canDentistas });
  const estoqueQ = useEstoque({ enabled: canEstoque });
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

  const pacienteMap = useMemo(() => {
    const map = new Map<string, string>();
    (pacientesQ.data?.content ?? []).forEach((p) => map.set(p.id, p.nomeCompleto));
    return map;
  }, [pacientesQ.data]);

  const [estoquePage, setEstoquePage] = useState(0);
  const ESTOQUE_PER_PAGE = 6;
  const estoqueOrdenado = useMemo(() => {
    const itens = [...(estoqueQ.data ?? [])];
    itens.sort((a, b) => {
      const ratioA = (a.quantidadeMinima ?? 0) > 0 ? (a.quantidadeAtual ?? 0) / (a.quantidadeMinima ?? 0) : 999;
      const ratioB = (b.quantidadeMinima ?? 0) > 0 ? (b.quantidadeAtual ?? 0) / (b.quantidadeMinima ?? 0) : 999;
      return ratioA - ratioB;
    });
    return itens;
  }, [estoqueQ.data]);
  const estoqueTotalPages = Math.max(1, Math.ceil(estoqueOrdenado.length / ESTOQUE_PER_PAGE));
  const estoquePaginado = useMemo(
    () => estoqueOrdenado.slice(estoquePage * ESTOQUE_PER_PAGE, (estoquePage + 1) * ESTOQUE_PER_PAGE),
    [estoqueOrdenado, estoquePage],
  );
  const estoqueAlertaCount = useMemo(
    () => estoqueOrdenado.filter((e) => (e.quantidadeAtual ?? 0) <= (e.quantidadeMinima ?? 0)).length,
    [estoqueOrdenado],
  );

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

  const exportProdutividadeCSV = () => {
    const year = now.getFullYear();
    const rows = [
      ['Mês', String(year), String(year - 1)],
      ...produtividade.map((r) => [r.mes, String(r.anoAtual), String(r.anoAnterior)]),
    ];
    const csv = rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bokka-produtividade-${year}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    bokkaToast.success('CSV de produtividade baixado.');
  };

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
    (canAgendamentos && agendamentosQ.isLoading) ||
    (canFinanceiro && contasQ.isLoading) ||
    (canPacientes && pacientesQ.isLoading) ||
    (canDentistas && dentistasQ.isLoading) ||
    (canEstoque && estoqueQ.isLoading);
  const dentistasAtivos = dentistasQ.data ?? [];

  // Conta quantos KPIs vão renderizar (pra ajustar grid)
  const kpisVisiveis =
    (canAgendamentos ? 2 : 0) + (canFinanceiro ? 2 : 0) + (canDentistas ? 1 : 0);
  const kpiGridCols = kpisVisiveis <= 1
    ? 'grid-cols-1'
    : kpisVisiveis === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : kpisVisiveis === 3
        ? 'grid-cols-1 sm:grid-cols-3'
        : kpisVisiveis === 4
          ? 'grid-cols-2 sm:grid-cols-4'
          : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';

  return (
    <div className="space-y-4">
      {/* Cabeçalho + Perfil compacto */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar photoKey={userPhotoKey} name={user?.name || user?.email} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-bokka-ink tracking-tight">
              {getGreeting()}, {user?.name || 'Dra. Tainah'}
            </h1>
            <p className="text-sm text-bokka-ink-3 capitalize mt-1">{formatDateLong(now)}</p>
          </div>
        </div>
      </div>

      {/* KPIs — filtrados por permissão */}
      {kpisVisiveis > 0 && (
        <div className={cn('grid gap-4', kpiGridCols)}>
          {canAgendamentos && (
            <KpiCard
              label="Agendamentos hoje"
              value={loading ? '—' : agendamentosHoje.length}
              hint={agendamentosHoje.length ? 'Consultas do dia' : 'Nenhuma hoje'}
              icon={<CalendarDays className="w-5 h-5" strokeWidth={1.75} />}
              tone="primary"
              loading={loading}
            />
          )}
          {canAgendamentos && (
            <HighlightKpi
              label="Confirmadas"
              value={loading ? '—' : confirmadosHoje}
              hint={`de ${agendamentosHoje.length} agendadas`}
              icon={<CalendarDays className="w-5 h-5" strokeWidth={2} />}
              loading={loading}
            />
          )}
          {canFinanceiro && (
            <KpiCard
              label="Receita mês"
              value={loading ? '—' : formatCurrency(receitaMes)}
              icon={<Wallet className="w-5 h-5" strokeWidth={1.75} />}
              tone="success"
              loading={loading}
            />
          )}
          {canFinanceiro && (
            <KpiCard
              label="Pendente"
              value={loading ? '—' : formatCurrency(saldoPendente)}
              hint={saldoPendente > 0 ? 'A receber' : 'Sem pendências'}
              icon={<Wallet className="w-5 h-5" strokeWidth={1.75} />}
              tone="warning"
              loading={loading}
            />
          )}
          {canDentistas && (
            <TeamCard
              label="Equipe clínica"
              count={dentistasAtivos.length}
              members={dentistasAtivos.slice(0, 4)}
              loading={loading}
            />
          )}
        </div>
      )}

      {/* Grid principal — 2 linhas × pares balanceados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-fr">
        {/* ═══════ LINHA 1 ═══════ */}
        {/* Agenda de hoje — HERO (2/3) */}
        {canAgendamentos && (
        <Card padded={false} className="lg:col-span-2 flex flex-col min-h-[440px] overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
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
            <div className="px-5 pb-5 flex-1">
              <Skeleton className="h-full min-h-[340px] w-full" rounded="lg" />
            </div>
          ) : agendamentosHoje.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-bokka-primary-soft text-bokka-primary flex items-center justify-center mb-4">
                <CalendarDays className="w-7 h-7" strokeWidth={1.75} />
              </div>
              <h3 className="text-base font-semibold text-bokka-ink">
                Nenhum agendamento para hoje
              </h3>
              <p className="text-sm text-bokka-ink-3 mt-1.5 max-w-sm">
                Sua agenda de hoje está livre. Clique em qualquer dia do calendário ao lado para marcar uma consulta.
              </p>
              <Link
                to="/agenda"
                className="mt-5 inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-bokka-primary text-white text-sm font-semibold hover:bg-bokka-primary-hover transition-colors"
              >
                Abrir agenda completa
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Link>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <TimelineDia byHour={timelineByHour} nowSlotIdx={nowSlotIdx} nowMin={nowMin} pacienteMap={pacienteMap} />
            </div>
          )}
        </Card>
        )}

        {/* Mini calendar AZUL — clicável (1/3) */}
        {canAgendamentos && (
        <div className="bg-bokka-primary-soft rounded-2xl p-5 flex flex-col justify-center min-h-[440px]">
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
                      'aspect-square rounded-full flex flex-col items-center justify-center text-[13px] tabular-nums transition-all cursor-pointer relative',
                      'hover:ring-2 hover:ring-bokka-primary hover:scale-105',
                      isToday
                        ? 'bg-bokka-primary text-white font-bold ring-2 ring-white'
                        : 'bg-white/60 text-bokka-ink font-medium hover:bg-white',
                    )}
                    aria-label={
                      hasEvent
                        ? `Dia ${n} — clínica atendendo. Clique para agendar.`
                        : `Agendar dia ${n}`
                    }
                  >
                    <span className={cn(hasEvent && 'leading-none')}>{n}</span>
                    {hasEvent && (
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className={cn('w-3 h-3 mt-0.5 shrink-0', isToday && 'text-white')}
                      >
                        <defs>
                          <linearGradient id="starGold" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FFE066" />
                            <stop offset="45%" stopColor="#FFC300" />
                            <stop offset="100%" stopColor="#D68F00" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M12 1.7l2.85 6.52 7.03.6-5.34 4.7 1.62 6.86L12 16.86l-6.16 3.52 1.62-6.86L2.12 8.82l7.03-.6L12 1.7z"
                          fill={isToday ? 'currentColor' : 'url(#starGold)'}
                          stroke={isToday ? 'rgba(255,255,255,0.9)' : '#B37800'}
                          strokeWidth="0.5"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

          {/* ═══════ LINHA 2 ═══════ */}
          {/* Produtividade PRETO — chart (2/3) */}
          {canAgendamentos && (
          <div className="bg-bokka-ink rounded-2xl p-5 lg:p-6 text-white lg:col-span-2 flex flex-col min-h-[440px]">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <h2 className="text-base font-semibold">Produtividade</h2>
                <p className="text-xs text-white/60 mt-0.5">Consultas por mês · este ano vs anterior</p>
              </div>
              <button
                type="button"
                onClick={exportProdutividadeCSV}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors"
                aria-label="Exportar CSV"
                title="Exportar CSV (planilha)"
              >
                <Download className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <div className="flex-1 min-h-0">
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
            <div className="flex items-center gap-5 mt-4 text-xs shrink-0">
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
          )}

          {/* Estoque — card expandido paginado (1/3) */}
          {canEstoque && (
          <div className="bg-bokka-surface border border-bokka-border rounded-2xl overflow-hidden flex flex-col min-h-[440px]">
            <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="w-4.5 h-4.5 text-bokka-ink-3" strokeWidth={1.75} />
                  <h2 className="text-base font-semibold text-bokka-ink">Estoque</h2>
                </div>
                <p className="text-xs text-bokka-ink-3 mt-1">
                  {estoqueOrdenado.length} {estoqueOrdenado.length === 1 ? 'item' : 'itens'}
                  {estoqueAlertaCount > 0 && (
                    <span className="text-bokka-danger-ink font-semibold"> · {estoqueAlertaCount} em falta</span>
                  )}
                </p>
              </div>
              <Link
                to="/estoque"
                className="text-xs font-semibold text-bokka-primary hover:text-bokka-primary-hover inline-flex items-center gap-1"
              >
                Ver tudo <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
              </Link>
            </div>
            {estoqueOrdenado.length === 0 ? (
              <div className="px-5 pb-5">
                <p className="text-sm font-semibold text-bokka-success-ink">Tudo em dia</p>
                <p className="text-xs text-bokka-ink-3 mt-0.5">
                  Nenhum item cadastrado no estoque.
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-bokka-border flex-1 overflow-y-auto">
                  {estoquePaginado.map((item) => {
                    // Ratio atual/mínimo determina o nível de saúde do item:
                    // < 1   → abaixo do mínimo (vermelho)
                    // 1..2  → moderado (laranja)
                    // >= 2  → acima do recomendado (verde)
                    const ratio = (item.quantidadeMinima ?? 0) > 0
                      ? (item.quantidadeAtual ?? 0) / (item.quantidadeMinima ?? 0)
                      : 2;
                    const nivel: 'baixo' | 'moderado' | 'acima' =
                      ratio < 1 ? 'baixo' : ratio < 2 ? 'moderado' : 'acima';
                    const barPct = Math.min(100, Math.round(ratio * 50));
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center gap-3 px-5 py-3',
                          nivel === 'baixo' && 'bg-bokka-danger-soft/20',
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {nivel === 'baixo' && (
                              <AlertTriangle
                                className="w-3.5 h-3.5 text-bokka-danger-ink shrink-0"
                                strokeWidth={2}
                              />
                            )}
                            <p className="text-sm font-semibold text-bokka-ink truncate">
                              {item.nomeMaterial}
                            </p>
                          </div>
                          <p className="text-[11px] text-bokka-ink-3 mt-0.5">
                            {item.quantidadeAtual} / {item.quantidadeMinima} {item.unidadeMedida ?? ''}
                          </p>
                        </div>
                        <div className="w-16 shrink-0">
                          <div className="h-1.5 rounded-full bg-bokka-surface-3 overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                nivel === 'baixo'
                                  ? 'bg-bokka-danger'
                                  : nivel === 'moderado'
                                    ? 'bg-bokka-warning'
                                    : 'bg-bokka-success',
                              )}
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {estoqueTotalPages > 1 && (
                  <div className="px-5 py-3 border-t border-bokka-border flex items-center justify-between shrink-0">
                    <span className="text-[11px] text-bokka-ink-3 tabular-nums">
                      Página {estoquePage + 1} de {estoqueTotalPages}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEstoquePage((p) => Math.max(0, p - 1))}
                        disabled={estoquePage === 0}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-surface-3 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Página anterior"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEstoquePage((p) => Math.min(estoqueTotalPages - 1, p + 1))}
                        disabled={estoquePage >= estoqueTotalPages - 1}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-surface-3 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Próxima página"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          )}
      </div>

      {/* Empty state — usuário sem nenhum módulo visível no dashboard */}
      {!canAgendamentos && !canFinanceiro && !canEstoque && !canDentistas && (
        <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-bokka-surface-3 text-bokka-ink-3 flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-7 h-7" strokeWidth={1.75} />
          </div>
          <h2 className="text-lg font-bold text-bokka-ink">Sem cards para exibir</h2>
          <p className="text-sm text-bokka-ink-3 mt-2 max-w-md mx-auto">
            Seu cargo atual não tem permissão para nenhum dos módulos exibidos aqui. Use o menu ao lado para acessar as áreas do seu perfil.
          </p>
        </div>
      )}

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

// ============ Timeline horária ============

// Cores por status do agendamento — casam com a legenda embaixo do Timeline.
const statusTone: Record<string, string> = {
  AGENDADO: 'bg-bokka-primary text-white',
  CONFIRMADO: 'bg-bokka-success text-white',
  REALIZADO: 'bg-bokka-surface-3 text-bokka-ink border border-bokka-border',
  FALTOU: 'bg-bokka-warning text-white',
  CANCELADO: 'bg-bokka-danger-soft text-bokka-danger-ink border border-bokka-danger/30',
};

const TIMELINE_MIN_WIDTH = 1400; // px — mesmo valor usado inline
const BUSINESS_HOUR_START = 8; // horário comercial brasileiro de clínicas odontológicas

const TimelineDia = ({
  byHour,
  nowSlotIdx,
  nowMin,
  pacienteMap,
}: {
  byHour: Record<number, Array<{ id?: string; observacoes?: string; pacienteId?: string; status: string }>>;
  nowSlotIdx: number;
  nowMin: number;
  pacienteMap: Map<string, string>;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Ao MONTAR o componente (entrar no dashboard ou dar refresh),
  // posiciona o scroll no início do horário comercial brasileiro (8h).
  // Depois disso, o usuário rola livremente sem que a agenda o force de volta.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hourWidth = TIMELINE_MIN_WIDTH / HOURS.length;
    el.scrollLeft = Math.round(BUSINESS_HOUR_START * hourWidth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pb-5">
      {/* Faixa de scroll horizontal — headers + grade */}
      <div ref={scrollRef} className="px-5 overflow-x-auto">
        <div className="relative" style={{ minWidth: `${TIMELINE_MIN_WIDTH}px` }}>
          <div
            className="grid border-b border-bokka-border"
            style={{ gridTemplateColumns: `repeat(${HOURS.length}, minmax(0, 1fr))` }}
          >
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
                  <span
                    className={cn(
                      'inline-block px-1 py-0.5 rounded-md',
                      isNow && 'bg-bokka-primary text-white',
                    )}
                  >
                    {String(h).padStart(2, '0')}:00
                  </span>
                </div>
              );
            })}
          </div>

          <div
            className="grid relative"
            style={{
              gridTemplateColumns: `repeat(${HOURS.length}, minmax(0, 1fr))`,
              minHeight: '260px',
            }}
          >
            {nowSlotIdx >= 0 && (
              <div
                className="absolute top-0 bottom-0 w-px bg-bokka-primary/40 z-0"
                style={{
                  left: `calc(${nowSlotIdx * (100 / HOURS.length)}% + ${(nowMin / 60) * (100 / HOURS.length)}%)`,
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
                    'relative pt-3 pb-2 px-0.5 border-l border-bokka-border/60',
                    isNow && 'bg-bokka-primary-soft/40',
                    i === HOURS.length - 1 && 'border-r border-bokka-border/60',
                  )}
                  style={{ minHeight: '200px' }}
                >
                  {items?.slice(0, 4).map((ag, idx) => {
                    const nome = pacienteMap.get(ag.pacienteId ?? '') || '—';
                    const obs = ag.observacoes || 'Consulta';
                    const tone = statusTone[ag.status] || statusTone.AGENDADO;
                    return (
                      <div
                        key={ag.id ?? idx}
                        className={cn(
                          'rounded-lg px-1.5 py-1.5 text-[10px] font-semibold mb-1 shadow-sm truncate',
                          tone,
                        )}
                        title={`${nome} — ${obs}`}
                      >
                        <div className="truncate leading-tight">{nome}</div>
                      </div>
                    );
                  })}
                  {items && items.length > 4 && (
                    <div className="text-[10px] text-bokka-ink-3 font-semibold text-center mt-1">
                      +{items.length - 4}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legenda de status — FORA do scroll horizontal, sempre visível */}
      <div className="flex flex-wrap items-center gap-3 pt-4 mt-2 px-5 border-t border-bokka-border">
        {['AGENDADO', 'CONFIRMADO', 'REALIZADO', 'CANCELADO'].map((s) => (
          <AgendamentoStatusBadge key={s} status={s as never} />
        ))}
      </div>
    </div>
  );
};


