import { useMemo, useState } from 'react';
import {
  Bar,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Clock,
  TrendingUp,
  Download,
  Check,
  Vault,
  Package,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { KpiCard, Card } from '../../components/ui/Card';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { FinanceiroStatusBadge } from '../../components/ui/Badge';
import { SkeletonTableRows } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { bokkaToast } from '../../components/ui/Toast';
import { ContaReceberForm } from './ContaReceberForm';
import { ContaPagarForm, categoriaPagarLabel } from './ContaPagarForm';
import { PagamentoModal } from './PagamentoModal';
import {
  useAtualizarContaPagar,
  useAtualizarContaReceber,
  useContasPagar,
  useContasReceber,
  useCriarContaPagar,
  useCriarContaReceber,
  useExcluirContaPagar,
  useExcluirContaReceber,
  useRegistrarPagamento,
} from '../../services/financeiroService';
import { usePacientes } from '../../services/pacienteService';
import { useEstoque } from '../../services/estoqueService';
import { ApiError } from '../../lib/api';
import { cn, formatCurrency, formatDate } from '../../lib/utils';
import type {
  CategoriaContaPagarEnum,
  ContaPagar,
  ContaReceber,
  StatusFinanceiroEnum,
} from '../../types';

// ============ Helpers ============

const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const isSameMonth = (iso: string | undefined | null, year: number, month: number) => {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === year && d.getMonth() === month;
};

const daysUntil = (iso: string | undefined | null): number | null => {
  if (!iso) return null;
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

type StatusFilter = 'todos' | StatusFinanceiroEnum;

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'PENDENTE', label: 'Pendentes' },
  { value: 'PAGO', label: 'Pagos' },
  { value: 'ATRASADO', label: 'Atrasados' },
  { value: 'CANCELADO', label: 'Cancelados' },
];

// Categoria palette — reused from Bokka semantic tones
const categoriaColors: Record<CategoriaContaPagarEnum, string> = {
  ALUGUEL: '#2A6BF2',
  MATERIAL_ODONTOLOGICO: '#10B981',
  EQUIPAMENTO: '#8B5CF6',
  SALARIO: '#F59E0B',
  AGUA: '#06B6D4',
  LUZ: '#EAB308',
  INTERNET: '#EC4899',
  MANUTENCAO: '#F97316',
  IMPOSTO: '#EF4444',
  OUTRO: '#64748B',
};

// ============ Page ============

export const AuditoriaPage = () => {
  const now = useMemo(() => new Date(), []);

  // Queries
  const receberQ = useContasReceber();
  const pagarQ = useContasPagar();
  const pacientesQ = usePacientes({ pagina: 0, tamanho: 200 });
  const estoqueQ = useEstoque();

  // Mutations
  const criarReceberM = useCriarContaReceber();
  const atualizarReceberM = useAtualizarContaReceber();
  const excluirReceberM = useExcluirContaReceber();
  const pagarReceberM = useRegistrarPagamento();

  const criarPagarM = useCriarContaPagar();
  const atualizarPagarM = useAtualizarContaPagar();
  const excluirPagarM = useExcluirContaPagar();

  // UI state
  const [receberFormOpen, setReceberFormOpen] = useState(false);
  const [receberInitial, setReceberInitial] = useState<ContaReceber | null>(null);
  const [pagarFormOpen, setPagarFormOpen] = useState(false);
  const [pagarInitial, setPagarInitial] = useState<ContaPagar | null>(null);
  const [pagamentoConta, setPagamentoConta] = useState<ContaReceber | null>(null);
  const [confirmar, setConfirmar] = useState<
    | { tipo: 'receber'; id: string; nome: string }
    | { tipo: 'pagar'; id: string; nome: string }
    | null
  >(null);

  const [receberFilter, setReceberFilter] = useState<StatusFilter>('todos');
  const [pagarFilter, setPagarFilter] = useState<StatusFilter>('todos');
  const [novoOpen, setNovoOpen] = useState(false);

  const receber = receberQ.data ?? [];
  const pagar = pagarQ.data ?? [];
  const pacienteMap = useMemo(() => {
    const m = new Map<string, string>();
    (pacientesQ.data?.content ?? []).forEach((p) => m.set(p.id, p.nomeCompleto));
    return m;
  }, [pacientesQ.data]);

  // ============ KPIs ============
  const receitaMes = useMemo(
    () =>
      receber
        .filter(
          (c) => c.status === 'PAGO' && isSameMonth(c.dataPagamento, now.getFullYear(), now.getMonth()),
        )
        .reduce((s, c) => s + (c.valorPago ?? c.valorTotal ?? 0), 0),
    [receber, now],
  );

  const despesaMes = useMemo(
    () =>
      pagar
        .filter(
          (c) => c.status === 'PAGO' && isSameMonth(c.dataPagamento, now.getFullYear(), now.getMonth()),
        )
        .reduce((s, c) => s + (c.valor ?? 0), 0),
    [pagar, now],
  );

  const lucroLiquido = receitaMes - despesaMes;

  // Caixa disponível — saldo cumulativo em todo o histórico
  const caixaDisponivel = useMemo(() => {
    const totalRecebido = receber
      .filter((c) => c.status === 'PAGO')
      .reduce((s, c) => s + (c.valorPago ?? c.valorTotal ?? 0), 0);
    const totalPago = pagar
      .filter((c) => c.status === 'PAGO')
      .reduce((s, c) => s + (c.valor ?? 0), 0);
    return totalRecebido - totalPago;
  }, [receber, pagar]);

  // Investimento em estoque — soma valorCompra × quantidadeAtual
  const estoque = estoqueQ.data ?? [];
  const investimentoEstoque = useMemo(
    () =>
      estoque.reduce(
        (s, e) => s + (e.valorCompra ?? 0) * (e.quantidadeAtual ?? 0),
        0,
      ),
    [estoque],
  );
  const estoqueBaixoCount = useMemo(
    () =>
      estoque.filter(
        (e) => (e.quantidadeAtual ?? 0) <= (e.quantidadeMinima ?? 0),
      ).length,
    [estoque],
  );

  const saldoPendente = useMemo(
    () =>
      receber
        .filter((c) => c.status === 'PENDENTE' || (c.status as string) === 'PARCIAL')
        .reduce((s, c) => s + Math.max(0, (c.valorTotal ?? 0) - (c.valorPago ?? 0)), 0),
    [receber],
  );

  // ============ Fluxo de caixa — últimos 6 meses ============
  const fluxo = useMemo(() => {
    const data: { mes: string; receita: number; despesa: number; lucro: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const rec = receber
        .filter((c) => c.status === 'PAGO' && isSameMonth(c.dataPagamento, y, m))
        .reduce((s, c) => s + (c.valorPago ?? c.valorTotal ?? 0), 0);
      const desp = pagar
        .filter((c) => c.status === 'PAGO' && isSameMonth(c.dataPagamento, y, m))
        .reduce((s, c) => s + (c.valor ?? 0), 0);
      data.push({
        mes: monthLabels[m],
        receita: rec,
        despesa: desp,
        lucro: rec - desp,
      });
    }
    return data;
  }, [receber, pagar, now]);

  // ============ Categorias de despesa (mês) ============
  const categorias = useMemo(() => {
    const map = new Map<CategoriaContaPagarEnum, number>();
    pagar
      .filter((c) => isSameMonth(c.dataVencimento, now.getFullYear(), now.getMonth()))
      .forEach((c) => {
        const cur = map.get(c.categoria) ?? 0;
        map.set(c.categoria, cur + (c.valor ?? 0));
      });
    return Array.from(map.entries())
      .map(([cat, valor]) => ({ cat, valor, label: categoriaPagarLabel[cat] }))
      .sort((a, b) => b.valor - a.valor);
  }, [pagar, now]);
  const categoriasTotal = categorias.reduce((s, c) => s + c.valor, 0);

  // ============ Próximos vencimentos (7 dias) ============
  const proximosVencimentos = useMemo(() => {
    type Item = {
      id: string;
      tipo: 'receber' | 'pagar';
      titulo: string;
      contexto: string;
      valor: number;
      dias: number;
      atrasado: boolean;
    };
    const arr: Item[] = [];
    receber.forEach((c) => {
      if (c.status === 'PAGO' || c.status === 'CANCELADO') return;
      const restante = Math.max(0, (c.valorTotal ?? 0) - (c.valorPago ?? 0));
      if (restante <= 0) return;
      const dias = daysUntil(c.dataVencimento);
      if (dias === null || dias > 7) return;
      arr.push({
        id: c.id ?? '',
        tipo: 'receber',
        titulo: c.descricao || 'Receita',
        contexto: pacienteMap.get(c.pacienteId) || '—',
        valor: restante,
        dias,
        atrasado: dias < 0,
      });
    });
    pagar.forEach((c) => {
      if (c.status === 'PAGO' || c.status === 'CANCELADO') return;
      const dias = daysUntil(c.dataVencimento);
      if (dias === null || dias > 7) return;
      arr.push({
        id: c.id ?? '',
        tipo: 'pagar',
        titulo: c.descricao || 'Despesa',
        contexto: c.fornecedor || categoriaPagarLabel[c.categoria],
        valor: c.valor ?? 0,
        dias,
        atrasado: dias < 0,
      });
    });
    return arr.sort((a, b) => a.dias - b.dias).slice(0, 8);
  }, [receber, pagar, pacienteMap]);

  // ============ Filtered lists ============
  const receberFiltradas = useMemo(() => {
    if (receberFilter === 'todos') return receber;
    return receber.filter((c) => (c.status as string) === receberFilter);
  }, [receber, receberFilter]);

  const pagarFiltradas = useMemo(() => {
    if (pagarFilter === 'todos') return pagar;
    return pagar.filter((c) => (c.status as string) === pagarFilter);
  }, [pagar, pagarFilter]);

  // ============ Handlers ============
  const handleSubmitReceber = async (c: ContaReceber) => {
    if (receberInitial?.id) {
      await atualizarReceberM.mutateAsync({ id: receberInitial.id, conta: c });
      bokkaToast.success('Receita atualizada.');
    } else {
      await criarReceberM.mutateAsync(c);
      bokkaToast.success('Receita registrada.');
    }
    setReceberFormOpen(false);
    setReceberInitial(null);
  };

  const handleSubmitPagar = async (c: ContaPagar) => {
    if (pagarInitial?.id) {
      await atualizarPagarM.mutateAsync({ id: pagarInitial.id, conta: c });
      bokkaToast.success('Despesa atualizada.');
    } else {
      await criarPagarM.mutateAsync(c);
      bokkaToast.success('Despesa registrada.');
    }
    setPagarFormOpen(false);
    setPagarInitial(null);
  };

  const handlePagamentoReceber = async (valor: number) => {
    if (!pagamentoConta?.id) return;
    try {
      await pagarReceberM.mutateAsync({ id: pagamentoConta.id, valor });
      bokkaToast.success(`Pagamento de ${formatCurrency(valor)} registrado.`);
      setPagamentoConta(null);
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao registrar pagamento.',
      );
    }
  };

  const handleQuitarPagar = async (c: ContaPagar) => {
    if (!c.id) return;
    try {
      await atualizarPagarM.mutateAsync({
        id: c.id,
        conta: {
          ...c,
          status: 'PAGO',
          dataPagamento: new Date().toISOString().slice(0, 10),
        },
      });
      bokkaToast.success('Despesa quitada.');
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao quitar despesa.',
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmar) return;
    try {
      if (confirmar.tipo === 'receber') {
        await excluirReceberM.mutateAsync(confirmar.id);
        bokkaToast.success('Receita excluída.');
      } else {
        await excluirPagarM.mutateAsync(confirmar.id);
        bokkaToast.success('Despesa excluída.');
      }
      setConfirmar(null);
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao excluir.',
      );
    }
  };

  const loading = receberQ.isLoading || pagarQ.isLoading;

  return (
    <div className="space-y-4">
      {/* ============ Header ============ */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-bokka-ink tracking-tight">Auditoria Financeira</h1>
          <p className="text-sm text-bokka-ink-3 mt-1">
            Controle completo do fluxo de caixa da clínica — receitas, despesas e lucratividade.
          </p>
        </div>
        <div className="relative">
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setNovoOpen((v) => !v)}>
            Novo lançamento
          </Button>
          {novoOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10"
                onClick={() => setNovoOpen(false)}
                aria-label="Fechar menu"
              />
              <div className="absolute right-0 top-full mt-2 z-20 w-56 bg-bokka-surface border border-bokka-border rounded-xl shadow-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setReceberInitial(null);
                    setReceberFormOpen(true);
                    setNovoOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bokka-surface-3 transition-colors text-left"
                >
                  <span className="w-9 h-9 rounded-lg bg-bokka-success-soft text-bokka-success-ink flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-bokka-ink">Nova receita</p>
                    <p className="text-[11px] text-bokka-ink-3">Cobrança de paciente</p>
                  </div>
                </button>
                <div className="h-px bg-bokka-border" />
                <button
                  type="button"
                  onClick={() => {
                    setPagarInitial(null);
                    setPagarFormOpen(true);
                    setNovoOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bokka-surface-3 transition-colors text-left"
                >
                  <span className="w-9 h-9 rounded-lg bg-bokka-danger-soft text-bokka-danger-ink flex items-center justify-center shrink-0">
                    <ArrowDownRight className="w-4 h-4" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-bokka-ink">Nova despesa</p>
                    <p className="text-[11px] text-bokka-ink-3">Conta, aluguel, salário</p>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ============ Caixa Disponível (Hero) ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CaixaHero value={caixaDisponivel} loading={loading} className="lg:col-span-2" />
        <EstoqueIntegracaoCard
          investimento={investimentoEstoque}
          totalItens={estoque.length}
          baixoCount={estoqueBaixoCount}
          loading={estoqueQ.isLoading}
        />
      </div>

      {/* ============ KPIs ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Receita do mês"
          value={loading ? '—' : formatCurrency(receitaMes)}
          hint={`${monthLabels[now.getMonth()]}/${now.getFullYear()}`}
          icon={<ArrowUpRight className="w-5 h-5" strokeWidth={1.75} />}
          tone="success"
          loading={loading}
        />
        <KpiCard
          label="Despesas do mês"
          value={loading ? '—' : formatCurrency(despesaMes)}
          hint={`${monthLabels[now.getMonth()]}/${now.getFullYear()}`}
          icon={<ArrowDownRight className="w-5 h-5" strokeWidth={1.75} />}
          tone="danger"
          loading={loading}
        />
        <LucroCard value={lucroLiquido} loading={loading} />
        <KpiCard
          label="Saldo a receber"
          value={loading ? '—' : formatCurrency(saldoPendente)}
          hint={saldoPendente > 0 ? 'Cobranças em aberto' : 'Nenhuma pendência'}
          icon={<Wallet className="w-5 h-5" strokeWidth={1.75} />}
          tone="warning"
          loading={loading}
        />
      </div>

      {/* ============ Fluxo de caixa ============ */}
      <div className="bg-bokka-ink rounded-2xl p-5 lg:p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold">Fluxo de caixa</h2>
            <p className="text-xs text-white/60 mt-0.5">Últimos 6 meses · receitas, despesas e lucro líquido</p>
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
        <div className="h-64">
          {loading ? (
            <div className="w-full h-full bg-white/5 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={fluxo} margin={{ top: 12, right: 8, bottom: 0, left: -14 }}>
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
                  width={62}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
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
                  labelStyle={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}
                  formatter={(v: number, name: string) => [formatCurrency(v), name]}
                />
                <Bar dataKey="receita" name="Receita" radius={[8, 8, 0, 0]} fill="#10B981" maxBarSize={26} />
                <Bar dataKey="despesa" name="Despesa" radius={[8, 8, 0, 0]} fill="#EF4444" maxBarSize={26} />
                <Line
                  type="monotone"
                  dataKey="lucro"
                  name="Lucro"
                  stroke="#93B8FC"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#93B8FC' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-5 mt-4 text-xs">
          <LegendDot color="#10B981" label="Receita" />
          <LegendDot color="#EF4444" label="Despesa" />
          <LegendDot color="#93B8FC" label="Lucro líquido" />
        </div>
      </div>

      {/* ============ Receitas + Despesas ============ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Receitas */}
        <Card padded={false}>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-bokka-success-soft text-bokka-success-ink flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
                </span>
                <h2 className="text-base font-semibold text-bokka-ink">Contas a Receber</h2>
              </div>
              <p className="text-xs text-bokka-ink-3 mt-1">
                {receberFiltradas.length} {receberFiltradas.length === 1 ? 'lançamento' : 'lançamentos'}
              </p>
            </div>
            <select
              value={receberFilter}
              onChange={(e) => setReceberFilter(e.target.value as StatusFilter)}
              className="text-sm bg-bokka-surface-2 border border-bokka-border rounded-lg px-3 h-9 text-bokka-ink outline-none focus:border-bokka-primary-ring"
            >
              {statusFilterOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <SkeletonTableRows rows={4} />
          ) : receberFiltradas.length === 0 ? (
            <EmptyState
              compact
              icon={<ArrowUpRight className="w-6 h-6" strokeWidth={1.75} />}
              title="Nenhuma receita"
              description={
                receberFilter === 'todos'
                  ? 'Registre a primeira cobrança de paciente.'
                  : 'Nenhuma receita nesse status.'
              }
              action={
                receberFilter === 'todos' && (
                  <Button
                    size="sm"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => {
                      setReceberInitial(null);
                      setReceberFormOpen(true);
                    }}
                  >
                    Nova receita
                  </Button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-bokka-ink-3 bg-bokka-surface-3">
                    <th className="px-4 py-3 font-semibold">Descrição</th>
                    <th className="px-4 py-3 font-semibold hidden md:table-cell">Vencimento</th>
                    <th className="px-4 py-3 font-semibold text-right">Valor</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bokka-border">
                  {receberFiltradas.map((c) => {
                    const restante = Math.max(0, (c.valorTotal ?? 0) - (c.valorPago ?? 0));
                    const podeReceber = c.status !== 'PAGO' && c.status !== 'CANCELADO' && restante > 0;
                    return (
                      <tr key={c.id} className="hover:bg-bokka-surface-3/60">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-bokka-ink truncate max-w-[220px]">
                            {c.descricao || '—'}
                          </div>
                          <div className="text-[11px] text-bokka-ink-3 mt-0.5 truncate max-w-[220px]">
                            {pacienteMap.get(c.pacienteId) || `Paciente #${c.pacienteId?.slice(-6)}`}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-bokka-ink-2 tabular-nums hidden md:table-cell">
                          {formatDate(c.dataVencimento)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <div className="font-semibold text-bokka-ink">{formatCurrency(c.valorTotal)}</div>
                          {(c.valorPago ?? 0) > 0 && (c.valorPago ?? 0) < (c.valorTotal ?? 0) && (
                            <div className="text-[11px] text-bokka-success-ink mt-0.5">
                              +{formatCurrency(c.valorPago)} recebido
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <FinanceiroStatusBadge status={c.status as StatusFinanceiroEnum} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            {podeReceber && (
                              <button
                                type="button"
                                onClick={() => setPagamentoConta(c)}
                                className="px-2.5 h-8 rounded-md bg-bokka-primary text-white text-xs font-semibold inline-flex items-center gap-1 hover:bg-bokka-primary-hover transition-colors"
                                title="Registrar pagamento"
                              >
                                <Wallet className="w-3.5 h-3.5" strokeWidth={2} />
                                Receber
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setReceberInitial(c);
                                setReceberFormOpen(true);
                              }}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-primary-soft hover:text-bokka-primary transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                c.id &&
                                setConfirmar({ tipo: 'receber', id: c.id, nome: c.descricao || 'Receita' })
                              }
                              className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-danger-soft hover:text-bokka-danger-ink transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Despesas */}
        <Card padded={false}>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-bokka-danger-soft text-bokka-danger-ink flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4" strokeWidth={2} />
                </span>
                <h2 className="text-base font-semibold text-bokka-ink">Contas a Pagar</h2>
              </div>
              <p className="text-xs text-bokka-ink-3 mt-1">
                {pagarFiltradas.length} {pagarFiltradas.length === 1 ? 'lançamento' : 'lançamentos'}
              </p>
            </div>
            <select
              value={pagarFilter}
              onChange={(e) => setPagarFilter(e.target.value as StatusFilter)}
              className="text-sm bg-bokka-surface-2 border border-bokka-border rounded-lg px-3 h-9 text-bokka-ink outline-none focus:border-bokka-primary-ring"
            >
              {statusFilterOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <SkeletonTableRows rows={4} />
          ) : pagarFiltradas.length === 0 ? (
            <EmptyState
              compact
              icon={<ArrowDownRight className="w-6 h-6" strokeWidth={1.75} />}
              title="Nenhuma despesa"
              description={
                pagarFilter === 'todos'
                  ? 'Comece registrando aluguel, energia, salários ou fornecedores.'
                  : 'Nenhuma despesa nesse status.'
              }
              action={
                pagarFilter === 'todos' && (
                  <Button
                    size="sm"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => {
                      setPagarInitial(null);
                      setPagarFormOpen(true);
                    }}
                  >
                    Nova despesa
                  </Button>
                )
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-bokka-ink-3 bg-bokka-surface-3">
                    <th className="px-4 py-3 font-semibold">Descrição</th>
                    <th className="px-4 py-3 font-semibold hidden md:table-cell">Vencimento</th>
                    <th className="px-4 py-3 font-semibold text-right">Valor</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bokka-border">
                  {pagarFiltradas.map((c) => {
                    const podeQuitar = c.status !== 'PAGO' && c.status !== 'CANCELADO';
                    return (
                      <tr key={c.id} className="hover:bg-bokka-surface-3/60">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-bokka-ink truncate max-w-[220px]">
                            {c.descricao || '—'}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ background: categoriaColors[c.categoria] }}
                            />
                            <span className="text-[11px] text-bokka-ink-3 truncate max-w-[200px]">
                              {categoriaPagarLabel[c.categoria]}
                              {c.fornecedor && ` · ${c.fornecedor}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-bokka-ink-2 tabular-nums hidden md:table-cell">
                          {formatDate(c.dataVencimento)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-bokka-ink">
                          {formatCurrency(c.valor)}
                        </td>
                        <td className="px-4 py-3">
                          <FinanceiroStatusBadge status={c.status as StatusFinanceiroEnum} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            {podeQuitar && (
                              <button
                                type="button"
                                onClick={() => handleQuitarPagar(c)}
                                className="px-2.5 h-8 rounded-md bg-bokka-ink text-white text-xs font-semibold inline-flex items-center gap-1 hover:bg-bokka-ink-2 transition-colors"
                                title="Marcar como paga"
                              >
                                <Check className="w-3.5 h-3.5" strokeWidth={2} />
                                Quitar
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setPagarInitial(c);
                                setPagarFormOpen(true);
                              }}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-primary-soft hover:text-bokka-primary transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                c.id &&
                                setConfirmar({ tipo: 'pagar', id: c.id, nome: c.descricao || 'Despesa' })
                              }
                              className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-danger-soft hover:text-bokka-danger-ink transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ============ Distribuição + Vencimentos ============ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Distribuição */}
        <Card padded={false} className="xl:col-span-1">
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4.5 h-4.5 text-bokka-ink-3" strokeWidth={1.75} />
              <h2 className="text-base font-semibold text-bokka-ink">Distribuição de despesas</h2>
            </div>
            <p className="text-xs text-bokka-ink-3 mt-1">
              {monthLabels[now.getMonth()]}/{now.getFullYear()} · {formatCurrency(categoriasTotal)} previsto
            </p>
          </div>
          {categorias.length === 0 ? (
            <EmptyState
              compact
              icon={<Scale className="w-6 h-6" strokeWidth={1.75} />}
              title="Sem despesas no mês"
              description="Cadastre despesas para ver a distribuição por categoria."
            />
          ) : (
            <div className="px-5 pb-5 flex flex-col sm:flex-row xl:flex-col items-center gap-5">
              <div className="w-40 h-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorias}
                      dataKey="valor"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={72}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {categorias.map((c) => (
                        <Cell key={c.cat} fill={categoriaColors[c.cat]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v), 'Valor']}
                      contentStyle={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="flex-1 w-full space-y-2 max-h-52 overflow-y-auto">
                {categorias.map((c) => {
                  const pct = categoriasTotal > 0 ? Math.round((c.valor / categoriasTotal) * 100) : 0;
                  return (
                    <li key={c.cat} className="flex items-center gap-3">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: categoriaColors[c.cat] }}
                      />
                      <span className="text-xs font-medium text-bokka-ink-2 truncate flex-1">
                        {c.label}
                      </span>
                      <span className="text-xs font-semibold text-bokka-ink tabular-nums">
                        {formatCurrency(c.valor)}
                      </span>
                      <span className="text-[11px] text-bokka-ink-3 tabular-nums w-8 text-right">
                        {pct}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Card>

        {/* Próximos vencimentos */}
        <Card padded={false} className="xl:col-span-2">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-bokka-ink-3" strokeWidth={1.75} />
                <h2 className="text-base font-semibold text-bokka-ink">Próximos 7 dias</h2>
              </div>
              <p className="text-xs text-bokka-ink-3 mt-1">
                Vencimentos e cobranças a vigiar
              </p>
            </div>
            <span className="text-xs text-bokka-ink-3 tabular-nums">
              {proximosVencimentos.length} {proximosVencimentos.length === 1 ? 'alerta' : 'alertas'}
            </span>
          </div>
          {proximosVencimentos.length === 0 ? (
            <EmptyState
              compact
              icon={<TrendingUp className="w-6 h-6" strokeWidth={1.75} />}
              title="Nada urgente"
              description="Nenhuma conta com vencimento nos próximos 7 dias."
            />
          ) : (
            <ul className="divide-y divide-bokka-border">
              {proximosVencimentos.map((v) => (
                <li
                  key={`${v.tipo}-${v.id}`}
                  className="px-5 py-3 flex items-center gap-3 hover:bg-bokka-surface-3/60 transition-colors"
                >
                  <span
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                      v.tipo === 'receber'
                        ? 'bg-bokka-success-soft text-bokka-success-ink'
                        : 'bg-bokka-danger-soft text-bokka-danger-ink',
                    )}
                  >
                    {v.tipo === 'receber' ? (
                      <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" strokeWidth={2} />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-bokka-ink truncate">{v.titulo}</p>
                    <p className="text-[11px] text-bokka-ink-3 truncate">{v.contexto}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        'text-sm font-bold tabular-nums',
                        v.tipo === 'receber' ? 'text-bokka-success-ink' : 'text-bokka-danger-ink',
                      )}
                    >
                      {v.tipo === 'receber' ? '+' : '−'}
                      {formatCurrency(v.valor)}
                    </p>
                    <p
                      className={cn(
                        'text-[11px] mt-0.5',
                        v.atrasado
                          ? 'text-bokka-danger-ink font-semibold'
                          : v.dias <= 2
                            ? 'text-bokka-warning-ink font-semibold'
                            : 'text-bokka-ink-3',
                      )}
                    >
                      {v.atrasado
                        ? `${Math.abs(v.dias)} ${Math.abs(v.dias) === 1 ? 'dia atrasado' : 'dias atrasados'}`
                        : v.dias === 0
                          ? 'Vence hoje'
                          : v.dias === 1
                            ? 'Vence amanhã'
                            : `Em ${v.dias} dias`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ============ Modals ============ */}
      <Modal
        open={receberFormOpen}
        onClose={() => {
          setReceberFormOpen(false);
          setReceberInitial(null);
        }}
        title={receberInitial?.id ? 'Editar receita' : 'Nova receita'}
        subtitle={
          receberInitial?.id
            ? 'Atualize os dados da cobrança.'
            : 'Registre uma nova cobrança de paciente.'
        }
        size="lg"
      >
        <ContaReceberForm
          initial={receberInitial}
          onCancel={() => {
            setReceberFormOpen(false);
            setReceberInitial(null);
          }}
          onSubmit={handleSubmitReceber}
        />
      </Modal>

      <Modal
        open={pagarFormOpen}
        onClose={() => {
          setPagarFormOpen(false);
          setPagarInitial(null);
        }}
        title={pagarInitial?.id ? 'Editar despesa' : 'Nova despesa'}
        subtitle={
          pagarInitial?.id
            ? 'Atualize os dados da despesa.'
            : 'Registre aluguel, salário, fornecedor ou outra saída.'
        }
        size="lg"
      >
        <ContaPagarForm
          initial={pagarInitial}
          onCancel={() => {
            setPagarFormOpen(false);
            setPagarInitial(null);
          }}
          onSubmit={handleSubmitPagar}
        />
      </Modal>

      <PagamentoModal
        conta={pagamentoConta}
        onClose={() => setPagamentoConta(null)}
        onSubmit={handlePagamentoReceber}
      />

      <ConfirmModal
        open={!!confirmar}
        onClose={() => setConfirmar(null)}
        onConfirm={handleConfirmDelete}
        title={confirmar?.tipo === 'receber' ? 'Excluir receita?' : 'Excluir despesa?'}
        message={`Esta ação não pode ser desfeita. "${confirmar?.nome}" será removido do sistema.`}
        confirmLabel="Excluir"
        danger
      />
    </div>
  );
};

// ============ Sub-components ============

const LucroCard = ({ value, loading }: { value: number; loading: boolean }) => {
  const positive = value >= 0;
  return (
    <div
      className={cn(
        'rounded-2xl p-5 shadow-sm flex flex-col gap-4 border transition-colors',
        positive
          ? 'bg-bokka-primary text-white border-transparent'
          : 'bg-bokka-surface text-bokka-ink border-bokka-danger/30',
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            'text-sm font-semibold',
            positive ? 'text-white/85' : 'text-bokka-danger-ink',
          )}
        >
          Lucro líquido
        </span>
        <span
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
            positive ? 'bg-white/15' : 'bg-bokka-danger-soft text-bokka-danger-ink',
          )}
        >
          <TrendingUp className="w-5 h-5" strokeWidth={2} />
        </span>
      </div>
      <div>
        {loading ? (
          <span
            className={cn(
              'inline-block w-24 h-9 rounded-md animate-pulse',
              positive ? 'bg-white/15' : 'bg-bokka-surface-3',
            )}
          />
        ) : (
          <span
            className={cn(
              'text-[30px] font-bold tabular-nums leading-none tracking-tight',
              !positive && 'text-bokka-danger-ink',
            )}
          >
            {formatCurrency(value)}
          </span>
        )}
        <p className={cn('text-xs mt-2', positive ? 'text-white/80' : 'text-bokka-ink-3')}>
          {positive ? 'Receita − despesa do mês' : 'Despesas superaram receita'}
        </p>
      </div>
    </div>
  );
};

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <span className="inline-flex items-center gap-2">
    <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
    <span className="text-white/70">{label}</span>
  </span>
);

const CaixaHero = ({
  value,
  loading,
  className,
}: {
  value: number;
  loading: boolean;
  className?: string;
}) => {
  const positive = value >= 0;
  return (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden p-6 lg:p-7 flex flex-col justify-between min-h-[180px] shadow-sm',
        positive ? 'bg-bokka-ink text-white' : 'bg-bokka-danger text-white',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -right-8 w-56 h-56 rounded-full bg-white/[0.03] pointer-events-none"
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-white/70 text-xs font-semibold uppercase tracking-wider">
            <Vault className="w-4 h-4" strokeWidth={2} />
            Caixa disponível
          </div>
          <p className="text-white/60 text-sm mt-2 max-w-md">
            Saldo total em caixa da clínica · soma cumulativa de todas as receitas pagas menos todas as despesas quitadas.
          </p>
        </div>
        <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-white/10 text-white/80 text-[11px] font-semibold uppercase tracking-wider">
          {positive ? 'Positivo' : 'Negativo'}
        </span>
      </div>
      <div className="relative mt-4">
        {loading ? (
          <span className="inline-block w-56 h-12 rounded-md bg-white/10 animate-pulse" />
        ) : (
          <span className="text-[44px] lg:text-[52px] font-bold leading-none tracking-tight tabular-nums">
            {formatCurrency(value)}
          </span>
        )}
      </div>
    </div>
  );
};

const EstoqueIntegracaoCard = ({
  investimento,
  totalItens,
  baixoCount,
  loading,
}: {
  investimento: number;
  totalItens: number;
  baixoCount: number;
  loading: boolean;
}) => (
  <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-5 lg:p-6 flex flex-col justify-between min-h-[180px] shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="inline-flex items-center gap-2 text-bokka-ink-3 text-xs font-semibold uppercase tracking-wider">
          <Package className="w-4 h-4" strokeWidth={2} />
          Investimento em estoque
        </div>
        <p className="text-bokka-ink-3 text-xs mt-2">
          Valor total imobilizado em materiais no depósito.
        </p>
      </div>
      <span className="w-10 h-10 rounded-xl bg-bokka-primary-soft text-bokka-primary flex items-center justify-center shrink-0">
        <Package className="w-5 h-5" strokeWidth={1.75} />
      </span>
    </div>
    <div>
      {loading ? (
        <span className="inline-block w-40 h-9 rounded-md bg-bokka-surface-3 animate-pulse" />
      ) : (
        <span className="text-3xl font-bold text-bokka-ink tabular-nums leading-none tracking-tight">
          {formatCurrency(investimento)}
        </span>
      )}
      <div className="flex items-center gap-3 mt-3 text-xs text-bokka-ink-3">
        <span className="tabular-nums font-semibold text-bokka-ink-2">
          {totalItens} {totalItens === 1 ? 'item' : 'itens'}
        </span>
        {baixoCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bokka-danger-soft text-bokka-danger-ink font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-bokka-danger" />
            {baixoCount} em falta
          </span>
        )}
      </div>
    </div>
  </div>
);
