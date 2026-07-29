import { useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  CircleDollarSign,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, KpiCard } from '../../components/ui/Card';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { FinanceiroStatusBadge } from '../../components/ui/Badge';
import { SkeletonTableRows } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { bokkaToast } from '../../components/ui/Toast';
import { ContaReceberForm } from './ContaReceberForm';
import { PagamentoModal } from './PagamentoModal';
import {
  useAtualizarContaReceber,
  useContasReceber,
  useCriarContaReceber,
  useExcluirContaReceber,
  useRegistrarPagamento,
} from '../../services/financeiroService';
import { ApiError } from '../../lib/api';
import { cn, formatCurrency, formatDate } from '../../lib/utils';
import type { ContaReceber, StatusFinanceiroEnum } from '../../types';

type StatusFilter = '' | StatusFinanceiroEnum | 'PARCIAL';

const filters: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'PENDENTE', label: 'Pendentes' },
  { value: 'PARCIAL', label: 'Parciais' },
  { value: 'PAGO', label: 'Pagas' },
  { value: 'ATRASADO', label: 'Atrasadas' },
  { value: 'CANCELADO', label: 'Canceladas' },
];

export const ContasReceberPage = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<ContaReceber | null>(null);
  const [pagamentoConta, setPagamentoConta] = useState<ContaReceber | null>(null);
  const [confirmar, setConfirmar] = useState<ContaReceber | null>(null);

  const listQuery = useContasReceber();
  const criarM = useCriarContaReceber();
  const atualizarM = useAtualizarContaReceber();
  const pagarM = useRegistrarPagamento();
  const excluirM = useExcluirContaReceber();

  const todas = listQuery.data ?? [];

  const filtradas = useMemo(() => {
    if (!statusFilter) return todas;
    return todas.filter((c) => (c.status as string) === statusFilter);
  }, [todas, statusFilter]);

  const totais = useMemo(() => {
    const total = todas.reduce((s, c) => s + (c.valorTotal ?? 0), 0);
    const pago = todas.reduce((s, c) => s + (c.valorPago ?? 0), 0);
    const restante = todas.reduce(
      (s, c) => s + Math.max(0, (c.valorTotal ?? 0) - (c.valorPago ?? 0)),
      0,
    );
    return { total, pago, restante };
  }, [todas]);

  const abrirNovo = () => {
    setFormInitial(null);
    setFormOpen(true);
  };

  const handleSubmit = async (conta: ContaReceber) => {
    if (formInitial?.id) {
      await atualizarM.mutateAsync({ id: formInitial.id, conta });
      bokkaToast.success('Conta atualizada.');
    } else {
      await criarM.mutateAsync(conta);
      bokkaToast.success('Conta criada.');
    }
    setFormOpen(false);
  };

  const handlePagamento = async (valor: number) => {
    if (!pagamentoConta?.id) return;
    try {
      await pagarM.mutateAsync({ id: pagamentoConta.id, valor });
      bokkaToast.success(`Pagamento de ${formatCurrency(valor)} registrado.`);
      setPagamentoConta(null);
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao registrar pagamento',
      );
    }
  };

  const handleExcluir = async () => {
    if (!confirmar?.id) return;
    try {
      await excluirM.mutateAsync(confirmar.id);
      setConfirmar(null);
      bokkaToast.success('Conta excluída.');
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao excluir conta',
      );
    }
  };

  const loading = listQuery.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-bokka-ink">Contas a Receber</h1>
          <p className="text-sm text-bokka-ink-3 mt-1">
            Receitas dos pacientes com pagamento parcial e transição automática de status.
          </p>
        </div>
        <Button onClick={abrirNovo} icon={<Plus />}>
          Nova conta
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Total faturado"
          value={formatCurrency(totais.total)}
          icon={<CircleDollarSign className="w-5 h-5" strokeWidth={1.75} />}
          tone="primary"
          loading={loading}
        />
        <KpiCard
          label="Já recebido"
          value={formatCurrency(totais.pago)}
          icon={<Wallet className="w-5 h-5" strokeWidth={1.75} />}
          tone="success"
          loading={loading}
        />
        <KpiCard
          label="Saldo a receber"
          value={formatCurrency(totais.restante)}
          icon={<Wallet className="w-5 h-5" strokeWidth={1.75} />}
          tone={totais.restante > 0 ? 'warning' : 'neutral'}
          loading={loading}
        />
      </div>

      <Card padded={false}>
        <div className="p-3 border-b border-bokka-border flex gap-1 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                statusFilter === f.value
                  ? 'bg-bokka-primary-soft text-bokka-primary'
                  : 'text-bokka-ink-2 hover:bg-bokka-surface-3',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <SkeletonTableRows rows={5} />
        ) : listQuery.isError ? (
          <div className="px-4 py-3 text-sm text-bokka-danger-ink bg-bokka-danger-soft">
            {listQuery.error instanceof ApiError
              ? listQuery.error.friendlyMessage()
              : 'Erro ao carregar contas'}
          </div>
        ) : filtradas.length === 0 ? (
          <EmptyState
            icon={<Wallet className="w-6 h-6" strokeWidth={1.75} />}
            title="Nenhuma conta a receber"
            description={
              statusFilter
                ? 'Nenhuma conta nesse status.'
                : 'Comece registrando a primeira conta a receber da clínica.'
            }
            action={
              !statusFilter && (
                <Button onClick={abrirNovo} icon={<Plus />}>
                  Nova conta
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
                  <th className="px-4 py-3 font-semibold">Vencimento</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                  <th className="px-4 py-3 font-semibold text-right">Pago</th>
                  <th className="px-4 py-3 font-semibold text-right">Restante</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bokka-border">
                {filtradas.map((c) => {
                  const restante = Math.max(
                    0,
                    (c.valorTotal ?? 0) - (c.valorPago ?? 0),
                  );
                  const podeReceber =
                    c.status !== 'PAGO' && c.status !== 'CANCELADO' && restante > 0;
                  return (
                    <tr key={c.id} className="hover:bg-bokka-surface-3">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-bokka-ink truncate max-w-xs">
                          {c.descricao || '—'}
                        </div>
                        <div className="text-xs text-bokka-ink-3 mt-0.5">
                          Paciente #{c.pacienteId?.slice(-6) || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-bokka-ink-2 tabular-nums">
                        {formatDate(c.dataVencimento)}
                      </td>
                      <td className="px-4 py-3 text-right text-bokka-ink tabular-nums font-semibold">
                        {formatCurrency(c.valorTotal)}
                      </td>
                      <td className="px-4 py-3 text-right text-bokka-success-ink tabular-nums font-medium">
                        {formatCurrency(c.valorPago)}
                      </td>
                      <td className="px-4 py-3 text-right text-bokka-ink-2 tabular-nums">
                        {formatCurrency(restante)}
                      </td>
                      <td className="px-4 py-3">
                        <FinanceiroStatusBadge status={c.status as StatusFinanceiroEnum} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {podeReceber && (
                            <Button
                              size="sm"
                              onClick={() => setPagamentoConta(c)}
                              icon={<Wallet />}
                            >
                              Receber
                            </Button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setFormInitial(c);
                              setFormOpen(true);
                            }}
                            className="p-2 rounded-md text-bokka-ink-2 hover:bg-bokka-surface hover:text-bokka-primary"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmar(c)}
                            className="p-2 rounded-md text-bokka-ink-2 hover:bg-bokka-danger-soft hover:text-bokka-danger-ink"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={1.75} />
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

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formInitial?.id ? 'Editar conta' : 'Nova conta a receber'}
        size="lg"
      >
        <ContaReceberForm
          initial={formInitial}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      <PagamentoModal
        conta={pagamentoConta}
        onClose={() => setPagamentoConta(null)}
        onSubmit={handlePagamento}
      />

      <ConfirmModal
        open={!!confirmar}
        onClose={() => setConfirmar(null)}
        onConfirm={handleExcluir}
        title="Excluir conta?"
        message="Esta ação não pode ser desfeita. A conta será removida do sistema."
        confirmLabel="Excluir"
        danger
        loading={excluirM.isPending}
      />
    </div>
  );
};
