import { useCallback, useEffect, useState } from 'react';
import type { Estoque, CategoriaEstoqueEnum } from '../../types';
import { ApiError, fetchApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

const CATEGORIA_LABELS: Record<CategoriaEstoqueEnum, string> = {
  DESCARTAVEL: 'Descartável', MEDICAMENTO: 'Medicamento', INSTRUMENTO: 'Instrumento',
  ANESTESICO: 'Anestésico', MATERIAL_RESTAURADOR: 'Material Restaurador',
  MATERIAL_PROTESE: 'Material Prótese', EPI: 'EPI', LIMPEZA: 'Limpeza', OUTRO: 'Outro',
};
const CATEGORIA_OPTIONS = Object.entries(CATEGORIA_LABELS).map(([v, l]) => ({ value: v, label: l }));
const FILTRO_OPTIONS = [{ value: '', label: 'Todas' }, ...CATEGORIA_OPTIONS];

interface FormState {
  nomeMaterial: string; categoria: string; quantidadeAtual: string; quantidadeMinima: string;
  unidadeMedida: string; fornecedor: string; dataValidade: string; observacoes: string;
}
const emptyForm: FormState = {
  nomeMaterial: '', categoria: '', quantidadeAtual: '', quantidadeMinima: '',
  unidadeMedida: '', fornecedor: '', dataValidade: '', observacoes: '',
};

const fromEstoque = (e: Estoque): FormState => ({
  nomeMaterial: e.nomeMaterial ?? '', categoria: e.categoria ?? '',
  quantidadeAtual: String(e.quantidadeAtual ?? ''), quantidadeMinima: String(e.quantidadeMinima ?? ''),
  unidadeMedida: e.unidadeMedida ?? '', fornecedor: e.fornecedor ?? '',
  dataValidade: e.dataValidade ?? '', observacoes: e.observacoes ?? '',
});

export const EstoquePage = () => {
  const toast = useToast();
  const [lista, setLista] = useState<Estoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [confirmar, setConfirmar] = useState<Estoque | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const url = filtroCategoria ? `/api/estoque/categoria/${filtroCategoria}` : '/api/estoque';
      const r = await fetchApi<Estoque[]>(url);
      setLista(r);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao carregar estoque');
    } finally { setLoading(false); }
  }, [filtroCategoria, toast]);

  useEffect(() => { carregar(); }, [carregar]);

  const setField = (k: keyof FormState, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => { const n = { ...p }; delete n[k]; return n; });
    setGlobalError(null);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nomeMaterial.trim()) e.nomeMaterial = 'Nome é obrigatório.';
    if (!form.categoria) e.categoria = 'Categoria é obrigatória.';
    if (!form.quantidadeAtual || Number(form.quantidadeAtual) < 0) e.quantidadeAtual = 'Quantidade inválida.';
    if (!form.quantidadeMinima || Number(form.quantidadeMinima) < 0) e.quantidadeMinima = 'Quantidade mínima inválida.';
    return e;
  };

  const abrirNovo = () => { setEditId(null); setForm(emptyForm); setErrors({}); setGlobalError(null); setFormOpen(true); };
  const abrirEdicao = (item: Estoque) => {
    setEditId(item.id!); setForm(fromEstoque(item)); setErrors({}); setGlobalError(null); setFormOpen(true);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    const payload: Estoque = {
      nomeMaterial: form.nomeMaterial.trim(), categoria: form.categoria as CategoriaEstoqueEnum,
      quantidadeAtual: Number(form.quantidadeAtual), quantidadeMinima: Number(form.quantidadeMinima),
      unidadeMedida: form.unidadeMedida || undefined, fornecedor: form.fornecedor || undefined,
      dataValidade: form.dataValidade || undefined, observacoes: form.observacoes || undefined,
    };
    setSaving(true); setGlobalError(null);
    try {
      if (editId) {
        await fetchApi(`/api/estoque/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Item atualizado.');
      } else {
        await fetchApi('/api/estoque', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Item cadastrado.');
      }
      setFormOpen(false); carregar();
    } catch (err) {
      if (err instanceof ApiError) {
        const fe = err.fieldErrors();
        if (Object.keys(fe).length) setErrors(fe);
        else setGlobalError(err.friendlyMessage());
      } else setGlobalError('Erro inesperado.');
    } finally { setSaving(false); }
  };

  const handleExcluir = async () => {
    if (!confirmar) return;
    setExcluindo(true);
    try {
      await fetchApi(`/api/estoque/${confirmar.id}`, { method: 'DELETE' });
      setConfirmar(null);
      toast.success('Item excluído.');
      carregar();
    } catch (err) { toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao excluir'); }
    finally { setExcluindo(false); }
  };

  const abaixoMinimo = (e: Estoque) => (e.quantidadeAtual ?? 0) < (e.quantidadeMinima ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Estoque</h1>
          <p className="text-sm text-slate-500">{loading ? 'Carregando...' : `${lista.length} item(ns)`}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select label="" options={FILTRO_OPTIONS} value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} containerClassName="min-w-[180px]" />
          <Button onClick={abrirNovo} icon={<span className="text-lg leading-none">＋</span>}>Novo item</Button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase tracking-wide bg-slate-50">
              <th className="px-4 py-3 font-medium">Material</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium text-right">Qtd. Atual</th>
              <th className="px-4 py-3 font-medium text-right">Qtd. Mín.</th>
              <th className="px-4 py-3 font-medium">Unidade</th>
              <th className="px-4 py-3 font-medium">Fornecedor</th>
              <th className="px-4 py-3 font-medium">Validade</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}><td colSpan={8} className="p-3"><div className="h-8 bg-slate-50 rounded animate-pulse" /></td></tr>
            )) : lista.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-slate-400">Nenhum item no estoque.</td></tr>
            ) : lista.map((e) => (
              <tr key={e.id} className={`hover:bg-slate-50 ${abaixoMinimo(e) ? 'bg-red-50' : ''}`}>
                <td className="px-4 py-3 text-slate-800 font-medium">
                  {e.nomeMaterial}
                  {abaixoMinimo(e) && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">ABAIXO DO MÍNIMO</span>}
                </td>
                <td className="px-4 py-3 text-slate-600">{CATEGORIA_LABELS[e.categoria!] ?? e.categoria}</td>
                <td className={`px-4 py-3 text-right tabular-nums ${abaixoMinimo(e) ? 'text-red-700 font-semibold' : 'text-slate-600'}`}>{e.quantidadeAtual}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">{e.quantidadeMinima}</td>
                <td className="px-4 py-3 text-slate-600">{e.unidadeMedida || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{e.fornecedor || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{e.dataValidade ? new Date(e.dataValidade).toLocaleDateString('pt-BR') : '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => abrirEdicao(e)}>Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => setConfirmar(e)}>Excluir</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editId ? 'Editar item' : 'Novo item de estoque'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {globalError && <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{globalError}</div>}
          <TextField label="Nome do material" required value={form.nomeMaterial} onChange={(e) => setField('nomeMaterial', e.target.value)} error={errors.nomeMaterial} />
          <Select label="Categoria" required options={CATEGORIA_OPTIONS} placeholder="Selecione..." value={form.categoria} onChange={(e) => setField('categoria', e.target.value)} error={errors.categoria} />
          <div className="grid grid-cols-3 gap-4">
            <TextField label="Quantidade atual" required type="number" min="0" value={form.quantidadeAtual} onChange={(e) => setField('quantidadeAtual', e.target.value)} error={errors.quantidadeAtual} />
            <TextField label="Quantidade mínima" required type="number" min="0" value={form.quantidadeMinima} onChange={(e) => setField('quantidadeMinima', e.target.value)} error={errors.quantidadeMinima} />
            <TextField label="Unidade de medida" placeholder="un, cx, ml..." value={form.unidadeMedida} onChange={(e) => setField('unidadeMedida', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Fornecedor" value={form.fornecedor} onChange={(e) => setField('fornecedor', e.target.value)} />
            <TextField label="Data de validade" type="date" value={form.dataValidade} onChange={(e) => setField('dataValidade', e.target.value)} />
          </div>
          <TextField label="Observações" value={form.observacoes} onChange={(e) => setField('observacoes', e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editId ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal open={!!confirmar} title="Excluir item?" message={confirmar ? `"${confirmar.nomeMaterial}" será removido permanentemente.` : ''} confirmLabel="Excluir" danger loading={excluindo} onClose={() => setConfirmar(null)} onConfirm={handleExcluir} />
    </div>
  );
};
