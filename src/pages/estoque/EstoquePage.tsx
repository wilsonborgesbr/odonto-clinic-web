import { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { bokkaToast } from '../../components/ui/Toast';
import { EstoqueForm, categoriaLabel } from './EstoqueForm';
import {
  useEstoque,
  useCriarEstoque,
  useAtualizarEstoque,
  useExcluirEstoque,
} from '../../services/estoqueService';
import { useCriarContaPagar } from '../../services/financeiroService';
import { ApiError } from '../../lib/api';
import { cn, formatDate } from '../../lib/utils';
import type { Estoque, CategoriaEstoqueEnum } from '../../types';

const allCategorias: CategoriaEstoqueEnum[] = [
  'DESCARTAVEL', 'MEDICAMENTO', 'INSTRUMENTO', 'ANESTESICO',
  'MATERIAL_RESTAURADOR', 'MATERIAL_PROTESE', 'EPI', 'LIMPEZA', 'OUTRO',
];

export const EstoquePage = () => {
  const [catFilter, setCatFilter] = useState<CategoriaEstoqueEnum | 'todos'>('todos');
  const [stockFilter, setStockFilter] = useState<'todos' | 'baixo'>('todos');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<Estoque | null>(null);
  const [confirmar, setConfirmar] = useState<{ id: string; nome: string } | null>(null);

  const estoqueQ = useEstoque();
  const criarM = useCriarEstoque();
  const atualizarM = useAtualizarEstoque();
  const excluirM = useExcluirEstoque();
  const criarContaPagarM = useCriarContaPagar();

  const todos = estoqueQ.data ?? [];

  const filtrados = useMemo(() => {
    let list = todos;
    if (catFilter !== 'todos') list = list.filter((e) => e.categoria === catFilter);
    if (stockFilter === 'baixo') list = list.filter((e) => (e.quantidadeAtual ?? 0) <= (e.quantidadeMinima ?? 0));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          (e.nomeMaterial ?? '').toLowerCase().includes(q) ||
          (e.fornecedor ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [todos, catFilter, stockFilter, search]);

  const stats = useMemo(() => {
    const total = todos.length;
    const baixo = todos.filter((e) => (e.quantidadeAtual ?? 0) <= (e.quantidadeMinima ?? 0)).length;
    const categorias = new Set(todos.map((e) => e.categoria)).size;
    return { total, baixo, categorias };
  }, [todos]);

  const handleSubmit = async (values: Estoque) => {
    try {
      if (formInitial?.id) {
        await atualizarM.mutateAsync({ id: formInitial.id, estoque: values });
        bokkaToast.success('Item atualizado.');
      } else {
        await criarM.mutateAsync(values);
        const total = (values.valorCompra ?? 0) * (values.quantidadeAtual ?? 0);
        if (total > 0) {
          try {
            await criarContaPagarM.mutateAsync({
              descricao: `Compra de estoque · ${values.nomeMaterial ?? 'material'}`,
              categoria: 'MATERIAL_ODONTOLOGICO',
              fornecedor: values.fornecedor || undefined,
              valor: total,
              dataVencimento: new Date().toISOString().slice(0, 10),
              status: 'PAGO',
              dataPagamento: new Date().toISOString().slice(0, 10),
            });
            bokkaToast.success(`Item cadastrado. Despesa de R$ ${total.toFixed(2)} lançada na Auditoria.`);
          } catch {
            bokkaToast.success('Item cadastrado. (Falha ao lançar despesa automática)');
          }
        } else {
          bokkaToast.success('Item cadastrado.');
        }
      }
      setFormOpen(false);
      setFormInitial(null);
    } catch (err) {
      throw err;
    }
  };

  const handleExcluir = async () => {
    if (!confirmar) return;
    try {
      await excluirM.mutateAsync(confirmar.id);
      bokkaToast.success('Item excluído.');
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao excluir.',
      );
    } finally {
      setConfirmar(null);
    }
  };

  const openEdit = (item: Estoque) => {
    setFormInitial(item);
    setFormOpen(true);
  };

  const isLow = (e: Estoque) => (e.quantidadeAtual ?? 0) <= (e.quantidadeMinima ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-bokka-ink tracking-tight">Estoque</h1>
          <p className="text-sm text-bokka-ink-3 mt-1">
            Controle de insumos, materiais e medicamentos.
          </p>
        </div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setFormInitial(null);
            setFormOpen(true);
          }}
        >
          Novo item
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-bokka-ink-3">Total de itens</p>
          <p className="text-2xl font-bold text-bokka-ink mt-1 tabular-nums">{stats.total}</p>
        </div>
        <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-bokka-ink-3">Abaixo do mínimo</p>
          <p className={cn('text-2xl font-bold mt-1 tabular-nums', stats.baixo > 0 ? 'text-bokka-danger-ink' : 'text-bokka-success-ink')}>
            {stats.baixo}
          </p>
        </div>
        <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-bokka-ink-3">Categorias</p>
          <p className="text-2xl font-bold text-bokka-ink mt-1 tabular-nums">{stats.categorias}</p>
        </div>
      </div>

      <Card padded={false}>
        <div className="p-4 border-b border-bokka-border space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
              className="text-sm bg-bokka-surface-2 border border-bokka-border rounded-lg px-3 h-9 text-bokka-ink outline-none focus:border-bokka-primary-ring"
            >
              <option value="todos">Todos</option>
              <option value="baixo">Estoque baixo</option>
            </select>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value as typeof catFilter)}
              className="text-sm bg-bokka-surface-2 border border-bokka-border rounded-lg px-3 h-9 text-bokka-ink outline-none focus:border-bokka-primary-ring"
            >
              <option value="todos">Todas as categorias</option>
              {allCategorias.map((cat) => (
                <option key={cat} value={cat}>{categoriaLabel[cat]}</option>
              ))}
            </select>
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bokka-ink-3" />
              <input
                type="text"
                placeholder="Buscar por nome ou fornecedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm bg-bokka-surface-2 border border-bokka-border rounded-lg pl-9 pr-3 h-9 placeholder:text-bokka-ink-3 outline-none focus:border-bokka-primary-ring"
              />
            </div>
          </div>
        </div>

        {estoqueQ.isLoading ? (
          <div className="p-5 space-y-3">
            <Skeleton className="h-16 w-full" rounded="xl" />
            <Skeleton className="h-16 w-full" rounded="xl" />
            <Skeleton className="h-16 w-full" rounded="xl" />
          </div>
        ) : filtrados.length === 0 ? (
          <EmptyState
            icon={<Package className="w-6 h-6" strokeWidth={1.75} />}
            title="Nenhum item encontrado"
            description={
              search.trim() || catFilter !== 'todos' || stockFilter !== 'todos'
                ? 'Nenhum resultado para os filtros aplicados.'
                : 'Cadastre o primeiro item do estoque.'
            }
            action={
              !search.trim() && catFilter === 'todos' && stockFilter === 'todos' ? (
                <Button
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setFormInitial(null);
                    setFormOpen(true);
                  }}
                >
                  Cadastrar item
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Abaixo de md: lista de cards empilhados */}
            <div className="md:hidden divide-y divide-bokka-border">
              {filtrados.map((item) => {
                const low = isLow(item);
                return (
                  <div
                    key={item.id}
                    className={cn('px-4 py-3', low && 'bg-bokka-danger-soft/20')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex items-center gap-1.5">
                        {low && <AlertTriangle className="w-3.5 h-3.5 text-bokka-danger-ink shrink-0" strokeWidth={2} />}
                        <span className="font-semibold text-bokka-ink truncate">{item.nomeMaterial}</span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-primary-soft hover:text-bokka-primary transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmar({ id: item.id!, nome: item.nomeMaterial ?? 'Item' })}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-danger-soft hover:text-bokka-danger-ink transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-bokka-primary-soft text-bokka-primary text-[10px] font-semibold">
                        {categoriaLabel[item.categoria!] ?? item.categoria}
                      </span>
                      <span className={cn('text-xs tabular-nums font-semibold', low ? 'text-bokka-danger-ink' : 'text-bokka-ink-2')}>
                        {item.quantidadeAtual}/{item.quantidadeMinima} {item.unidadeMedida ?? ''}
                      </span>
                    </div>
                    <p className="text-xs text-bokka-ink-3 mt-1 truncate">
                      {item.fornecedor || '—'}
                      {item.dataValidade && ` · Val. ${formatDate(item.dataValidade)}`}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-bokka-ink-3 bg-bokka-surface-3">
                  <th className="px-5 py-3 font-semibold">Material</th>
                  <th className="px-4 py-3 font-semibold">Categoria</th>
                  <th className="px-4 py-3 font-semibold text-center">Qtd. Atual</th>
                  <th className="px-4 py-3 font-semibold text-center">Qtd. Mínima</th>
                  <th className="px-4 py-3 font-semibold">Fornecedor</th>
                  <th className="px-4 py-3 font-semibold">Validade</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bokka-border">
                {filtrados.map((item) => {
                  const low = isLow(item);
                  return (
                    <tr key={item.id} className={cn('hover:bg-bokka-surface-3', low && 'bg-bokka-danger-soft/30')}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {low && <AlertTriangle className="w-3.5 h-3.5 text-bokka-danger-ink shrink-0" strokeWidth={2} />}
                          <span className="font-semibold text-bokka-ink">{item.nomeMaterial}</span>
                        </div>
                        {item.observacoes && (
                          <p className="text-[11px] text-bokka-ink-3 mt-0.5 truncate max-w-[200px]">{item.observacoes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-bokka-primary-soft text-bokka-primary text-[10px] font-semibold">
                          {categoriaLabel[item.categoria!] ?? item.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums font-semibold">
                        <span className={low ? 'text-bokka-danger-ink' : 'text-bokka-ink'}>
                          {item.quantidadeAtual}
                        </span>
                        {item.unidadeMedida && (
                          <span className="text-[10px] text-bokka-ink-3 ml-1">{item.unidadeMedida}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums text-bokka-ink-3">
                        {item.quantidadeMinima}
                      </td>
                      <td className="px-4 py-3 text-bokka-ink-2 truncate max-w-[140px]">
                        {item.fornecedor || '—'}
                      </td>
                      <td className="px-4 py-3 text-bokka-ink-3 tabular-nums whitespace-nowrap">
                        {item.dataValidade ? formatDate(item.dataValidade) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-primary-soft hover:text-bokka-primary transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmar({ id: item.id!, nome: item.nomeMaterial ?? 'Item' })}
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
          </>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setFormInitial(null);
        }}
        title={formInitial?.id ? 'Editar item' : 'Novo item de estoque'}
        subtitle={
          formInitial?.id
            ? 'Atualize os dados do material.'
            : 'Preencha os dados para cadastrar um novo insumo.'
        }
        size="xl"
      >
        <EstoqueForm
          initial={formInitial}
          onCancel={() => {
            setFormOpen(false);
            setFormInitial(null);
          }}
          onSubmit={handleSubmit}
        />
      </Modal>

      <ConfirmModal
        open={!!confirmar}
        onClose={() => setConfirmar(null)}
        title="Excluir item"
        message={`Tem certeza que deseja excluir "${confirmar?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleExcluir}
      />
    </div>
  );
};
