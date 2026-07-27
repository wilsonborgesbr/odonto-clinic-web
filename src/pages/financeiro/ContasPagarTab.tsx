import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ContaPagar, CategoriaContaPagarEnum, StatusFinanceiroEnum } from '../../types';
import { contaPagarService } from '../../services/financeiroService';
import { ApiError } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { TextField, TextArea } from '../../components/ui/TextField';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

const STATUS_LABELS: Record<StatusFinanceiroEnum, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  ATRASADO: 'Atrasado',
  CANCELADO: 'Cancelado',
};

const STATUS_COLORS: Record<StatusFinanceiroEnum, string> = {
  PENDENTE: 'bg-amber-100 text-amber-800',
  PAGO: 'bg-emerald-100 text-emerald-800',
  ATRASADO: 'bg-red-100 text-red-800',
  CANCELADO: 'bg-slate-100 text-slate-500',
};

const CATEGORIA_LABELS: Record<CategoriaContaPagarEnum, string> = {
  ALUGUEL: 'Aluguel',
  MATERIAL_ODONTOLOGICO: 'Material Odontológico',
  EQUIPAMENTO: 'Equipamento',
  SALARIO: 'Salário',
  AGUA: 'Água',
  LUZ: 'Luz',
  INTERNET: 'Internet',
  MANUTENCAO: 'Manutenção',
  IMPOSTO: 'Imposto',
  OUTRO: 'Outro',
};

const CATEGORIA_OPTIONS = Object.entries(CATEGORIA_LABELS).map(([v, l]) => ({ value: v, label: l }));

const STATUS_FILTER = [
  { value: '', label: 'Todos os status' },
  ...Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l })),
];

const CATEGORIA_FILTER = [
  { value: '', label: 'Todas as categorias' },
  ...CATEGORIA_OPTIONS,
];

const formatBRL = (v?: number) =>
  (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (d?: string) => {
  if (!d) return '—';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
};

interface FormState {
  descricao: string;
  categoria: string;
  fornecedor: string;
  valor: string;
  dataVencimento: string;
  observacoes: string;
}

const emptyForm: FormState = {
  descricao: '',
  categoria: '',
  fornecedor: '',
  valor: '',
  dataVencimento: '',
  observacoes: '',
};

export const ContasPagarTab = () => {
  const toast = useToast();

  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [confirmarExcluir, setConfirmarExcluir] = useState<ContaPagar | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await contaPagarService.listar();
      setContas(resp);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao carregar contas');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { carregar(); }, [carregar]);

  const contasFiltradas = useMemo(() => {
    let list = contas;
    if (filtroStatus) list = list.filter((c) => c.status === filtroStatus);
    if (filtroCategoria) list = list.filter((c) => c.categoria === filtroCategoria);
    return list;
  }, [contas, filtroStatus, filtroCategoria]);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    setFormErrors((p) => { const n = { ...p }; delete n[k]; return n; });
    setGlobalError(null);
  };

  const validateForm = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.descricao.trim()) e.descricao = 'Descrição é obrigatória.';
    if (!form.categoria) e.categoria = 'Categoria é obrigatória.';
    if (!form.valor || Number(form.valor) <= 0) e.valor = 'Valor deve ser maior que zero.';
    if (!form.dataVencimento) e.dataVencimento = 'Data de vencimento é obrigatória.';
    return e;
  };

  const handleSubmitForm = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const v = validateForm();
    if (Object.keys(v).length) { setFormErrors(v); return; }

    const payload: ContaPagar = {
      descricao: form.descricao.trim(),
      categoria: form.categoria as CategoriaContaPagarEnum,
      valor: Number(form.valor),
      dataVencimento: form.dataVencimento,
      status: 'PENDENTE',
    };
    if (form.fornecedor.trim()) payload.fornecedor = form.fornecedor.trim();
    if (form.observacoes.trim()) payload.observacoes = form.observacoes.trim();

    setSaving(true);
    setGlobalError(null);
    try {
      await contaPagarService.criar(payload);
      toast.success('Conta a pagar criada.');
      setFormOpen(false);
      setForm(emptyForm);
      carregar();
    } catch (err) {
      if (err instanceof ApiError) {
        const fe = err.fieldErrors();
        if (Object.keys(fe).length) setFormErrors(fe as Partial<Record<keyof FormState, string>>);
        else setGlobalError(err.friendlyMessage());
      } else {
        setGlobalError('Erro inesperado.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleExcluir = async () => {
    if (!confirmarExcluir?.id) return;
    setExcluindo(true);
    try {
      await contaPagarService.excluir(confirmarExcluir.id);
      toast.success('Conta excluída.');
      setConfirmarExcluir(null);
      carregar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao excluir');
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Select label="" options={STATUS_FILTER} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} containerClassName="min-w-[160px]" />
          <Select label="" options={CATEGORIA_FILTER} value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} containerClassName="min-w-[200px]" />
        </div>
        <Button onClick={() => { setForm(emptyForm); setFormErrors({}); setGlobalError(null); setFormOpen(true); }} icon={<span className="text-lg leading-none">＋</span>}>
          Nova conta
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase tracking-wide bg-slate-50">
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Fornecedor</th>
              <th className="px-4 py-3 font-medium text-right">Valor</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="p-3"><div className="h-8 bg-slate-50 rounded animate-pulse" /></td></tr>
              ))
            ) : contasFiltradas.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-400">Nenhuma conta a pagar encontrada.</td></tr>
            ) : (
              contasFiltradas.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-800 font-medium">{c.descricao}</td>
                  <td className="px-4 py-3 text-slate-600">{CATEGORIA_LABELS[c.categoria] ?? c.categoria}</td>
                  <td className="px-4 py-3 text-slate-600">{c.fornecedor || '—'}</td>
                  <td className="px-4 py-3 text-slate-700 text-right tabular-nums">{formatBRL(c.valor)}</td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums">{formatDate(c.dataVencimento)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="danger" onClick={() => setConfirmarExcluir(c)}>Excluir</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Nova conta a pagar" size="lg">
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {globalError && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{globalError}</div>
          )}

          <TextField label="Descrição" required value={form.descricao} onChange={(e) => setField('descricao', e.target.value)} error={formErrors.descricao} />

          <div className="grid grid-cols-2 gap-4">
            <Select label="Categoria" required options={CATEGORIA_OPTIONS} placeholder="Selecione..." value={form.categoria} onChange={(e) => setField('categoria', e.target.value)} error={formErrors.categoria} />
            <TextField label="Fornecedor" value={form.fornecedor} onChange={(e) => setField('fornecedor', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField label="Valor (R$)" required type="number" step="0.01" min="0" value={form.valor} onChange={(e) => setField('valor', e.target.value)} error={formErrors.valor} />
            <TextField label="Data de vencimento" required type="date" value={form.dataVencimento} onChange={(e) => setField('dataVencimento', e.target.value)} error={formErrors.dataVencimento} />
          </div>

          <TextArea label="Observações" value={form.observacoes} onChange={(e) => setField('observacoes', e.target.value)} rows={2} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" loading={saving}>Criar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!confirmarExcluir}
        title="Excluir conta a pagar?"
        message={confirmarExcluir ? `"${confirmarExcluir.descricao}" será excluída permanentemente.` : ''}
        confirmLabel="Excluir"
        danger
        loading={excluindo}
        onClose={() => setConfirmarExcluir(null)}
        onConfirm={handleExcluir}
      />
    </div>
  );
};
