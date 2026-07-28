import { useCallback, useEffect, useState } from 'react';
import type { Convenio } from '../../types';
import { ApiError, fetchApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

interface FormState {
  nome: string; cnpj: string; telefone: string; email: string; tabelaDePrecos: string;
}
const emptyForm: FormState = { nome: '', cnpj: '', telefone: '', email: '', tabelaDePrecos: '' };

const fromConvenio = (c: Convenio): FormState => ({
  nome: c.nome ?? '', cnpj: c.cnpj ?? '', telefone: c.telefone ?? '',
  email: c.email ?? '', tabelaDePrecos: c.tabelaDePrecos ?? '',
});

export const ConveniosPage = () => {
  const toast = useToast();
  const [lista, setLista] = useState<Convenio[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [confirmar, setConfirmar] = useState<Convenio | null>(null);
  const [inativando, setInativando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchApi<Convenio[]>('/api/convenios');
      setLista(r);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao carregar convênios');
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { carregar(); }, [carregar]);

  const setField = (k: keyof FormState, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => { const n = { ...p }; delete n[k]; return n; });
    setGlobalError(null);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = 'Nome é obrigatório.';
    if (!form.cnpj.trim()) e.cnpj = 'CNPJ é obrigatório.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido.';
    return e;
  };

  const abrirNovo = () => { setEditId(null); setForm(emptyForm); setErrors({}); setGlobalError(null); setFormOpen(true); };
  const abrirEdicao = (c: Convenio) => {
    setEditId(c.id!); setForm(fromConvenio(c)); setErrors({}); setGlobalError(null); setFormOpen(true);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    const payload: Convenio = {
      nome: form.nome.trim(), cnpj: form.cnpj.trim(),
      telefone: form.telefone || undefined, email: form.email || undefined,
      tabelaDePrecos: form.tabelaDePrecos || undefined,
    };
    setSaving(true); setGlobalError(null);
    try {
      if (editId) {
        await fetchApi(`/api/convenios/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Convênio atualizado.');
      } else {
        await fetchApi('/api/convenios', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Convênio cadastrado.');
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

  const handleInativar = async () => {
    if (!confirmar) return;
    setInativando(true);
    try {
      await fetchApi(`/api/convenios/${confirmar.id}`, { method: 'DELETE' });
      setConfirmar(null);
      toast.success('Convênio inativado.');
      carregar();
    } catch (err) { toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao inativar'); }
    finally { setInativando(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Convênios</h1>
          <p className="text-sm text-slate-500">{loading ? 'Carregando...' : `${lista.length} convênio(s) ativo(s)`}</p>
        </div>
        <Button onClick={abrirNovo} icon={<span className="text-lg leading-none">＋</span>}>Novo convênio</Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase tracking-wide bg-slate-50">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">CNPJ</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Telefone</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}><td colSpan={5} className="p-3"><div className="h-8 bg-slate-50 rounded animate-pulse" /></td></tr>
            )) : lista.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhum convênio cadastrado.</td></tr>
            ) : lista.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-800 font-medium">{c.nome}</td>
                <td className="px-4 py-3 text-slate-600 tabular-nums">{c.cnpj}</td>
                <td className="px-4 py-3 text-slate-600">{c.email || '—'}</td>
                <td className="px-4 py-3 text-slate-600 tabular-nums">{c.telefone || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => abrirEdicao(c)}>Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => setConfirmar(c)}>Inativar</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editId ? 'Editar convênio' : 'Novo convênio'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {globalError && <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{globalError}</div>}
          <TextField label="Nome" required value={form.nome} onChange={(e) => setField('nome', e.target.value)} error={errors.nome} />
          <TextField label="CNPJ" required value={form.cnpj} onChange={(e) => setField('cnpj', e.target.value)} error={errors.cnpj} />
          <div className="grid grid-cols-2 gap-4">
            <TextField label="E-mail" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} error={errors.email} />
            <TextField label="Telefone" value={form.telefone} onChange={(e) => setField('telefone', e.target.value)} />
          </div>
          <TextField label="Tabela de preços (referência)" value={form.tabelaDePrecos} onChange={(e) => setField('tabelaDePrecos', e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editId ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal open={!!confirmar} title="Inativar convênio?" message={confirmar ? `${confirmar.nome} será inativado.` : ''} confirmLabel="Inativar" danger loading={inativando} onClose={() => setConfirmar(null)} onConfirm={handleInativar} />
    </div>
  );
};
