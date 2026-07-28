import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Funcionario, FuncionarioListagemDTO, PageResponse, CargoFuncionarioEnum, SexoEnum } from '../../types';
import { ApiError, fetchApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

const PAGE_SIZE = 10;

const CARGO_LABELS: Record<CargoFuncionarioEnum, string> = {
  RECEPCIONISTA: 'Recepcionista', AUXILIAR_DENTARIO: 'Auxiliar Dentário',
  TECNICO_RADIOLOGIA: 'Técnico Radiologia', ADMINISTRATIVO: 'Administrativo', GERENTE: 'Gerente',
};
const CARGO_OPTIONS = Object.entries(CARGO_LABELS).map(([v, l]) => ({ value: v, label: l }));

const SEXO_OPTIONS = [
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMININO', label: 'Feminino' },
  { value: 'OUTRO', label: 'Outro' },
];

interface FormState {
  nomeCompleto: string; cpf: string; cargo: string;
  email: string; telefoneCelular: string; sexo: string;
}
const emptyForm: FormState = { nomeCompleto: '', cpf: '', cargo: '', email: '', telefoneCelular: '', sexo: '' };

const fromFunc = (f: Funcionario): FormState => ({
  nomeCompleto: f.nomeCompleto, cpf: f.cpf, cargo: f.cargo,
  email: f.email ?? '', telefoneCelular: f.telefoneCelular ?? '', sexo: f.sexo,
});

export const FuncionariosPage = () => {
  const toast = useToast();
  const [page, setPage] = useState<PageResponse<FuncionarioListagemDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [confirmar, setConfirmar] = useState<FuncionarioListagemDTO | null>(null);
  const [inativando, setInativando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchApi<PageResponse<FuncionarioListagemDTO>>(
        `/api/funcionarios?pagina=${pagina}&tamanho=${PAGE_SIZE}&ordem=nomeCompleto`,
      );
      setPage(r);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao carregar funcionários');
    } finally { setLoading(false); }
  }, [pagina, toast]);

  useEffect(() => { carregar(); }, [carregar]);

  const setField = (k: keyof FormState, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => { const n = { ...p }; delete n[k]; return n; });
    setGlobalError(null);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nomeCompleto.trim()) e.nomeCompleto = 'Nome é obrigatório.';
    if (!form.cpf.trim()) e.cpf = 'CPF é obrigatório.';
    if (!form.cargo) e.cargo = 'Cargo é obrigatório.';
    if (!form.sexo) e.sexo = 'Sexo é obrigatório.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido.';
    return e;
  };

  const abrirNovo = () => { setEditId(null); setForm(emptyForm); setErrors({}); setGlobalError(null); setFormOpen(true); };
  const abrirEdicao = async (item: FuncionarioListagemDTO) => {
    try {
      const f = await fetchApi<Funcionario>(`/api/funcionarios/${item.id}`);
      setEditId(item.id); setForm(fromFunc(f)); setErrors({}); setGlobalError(null); setFormOpen(true);
    } catch (err) { toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao carregar'); }
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    const payload: Funcionario = {
      nomeCompleto: form.nomeCompleto.trim(), cpf: form.cpf.trim(),
      cargo: form.cargo as CargoFuncionarioEnum,
      email: form.email || undefined, telefoneCelular: form.telefoneCelular || undefined,
      sexo: form.sexo as SexoEnum,
    };
    setSaving(true); setGlobalError(null);
    try {
      if (editId) {
        await fetchApi(`/api/funcionarios/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Funcionário atualizado.');
      } else {
        await fetchApi('/api/funcionarios', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Funcionário cadastrado.');
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
      const alvo = confirmar;
      await fetchApi(`/api/funcionarios/${alvo.id}`, { method: 'DELETE' });
      setConfirmar(null);
      toast.info(`${alvo.nomeCompleto} inativado.`, {
        actionLabel: 'Desfazer', onAction: async () => {
          try { await fetchApi(`/api/funcionarios/${alvo.id}/reativar`, { method: 'PATCH' }); toast.success('Reativado.'); carregar(); }
          catch { toast.error('Erro ao reativar.'); }
        },
      });
      carregar();
    } catch (err) { toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao inativar'); }
    finally { setInativando(false); }
  };

  const linhas = useMemo(() => page?.content ?? [], [page]);
  const totalPaginas = page?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Funcionários</h1>
          <p className="text-sm text-slate-500">{loading ? 'Carregando...' : `${page?.totalElements ?? 0} funcionário(s) ativo(s)`}</p>
        </div>
        <Button onClick={abrirNovo} icon={<span className="text-lg leading-none">＋</span>}>Novo funcionário</Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase tracking-wide bg-slate-50">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">CPF</th>
              <th className="px-4 py-3 font-medium">Cargo</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Telefone</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}><td colSpan={6} className="p-3"><div className="h-8 bg-slate-50 rounded animate-pulse" /></td></tr>
            )) : linhas.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">Nenhum funcionário cadastrado.</td></tr>
            ) : linhas.map((f) => (
              <tr key={f.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-800 font-medium">{f.nomeCompleto}</td>
                <td className="px-4 py-3 text-slate-600 tabular-nums">{f.cpf}</td>
                <td className="px-4 py-3 text-slate-600">{CARGO_LABELS[f.cargo] ?? f.cargo}</td>
                <td className="px-4 py-3 text-slate-600">{f.email || '—'}</td>
                <td className="px-4 py-3 text-slate-600 tabular-nums">{f.telefoneCelular || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => abrirEdicao(f)}>Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => setConfirmar(f)}>Inativar</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm">
            <span className="text-slate-500">Página {pagina + 1} de {totalPaginas}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={pagina === 0 || loading} onClick={() => setPagina((p) => Math.max(0, p - 1))}>Anterior</Button>
              <Button size="sm" variant="secondary" disabled={pagina >= totalPaginas - 1 || loading} onClick={() => setPagina((p) => p + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editId ? 'Editar funcionário' : 'Novo funcionário'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {globalError && <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{globalError}</div>}
          <TextField label="Nome completo" required value={form.nomeCompleto} onChange={(e) => setField('nomeCompleto', e.target.value)} error={errors.nomeCompleto} />
          <div className="grid grid-cols-2 gap-4">
            <TextField label="CPF" required value={form.cpf} onChange={(e) => setField('cpf', e.target.value)} error={errors.cpf} />
            <Select label="Sexo" required options={SEXO_OPTIONS} placeholder="Selecione..." value={form.sexo} onChange={(e) => setField('sexo', e.target.value)} error={errors.sexo} />
          </div>
          <Select label="Cargo" required options={CARGO_OPTIONS} placeholder="Selecione o cargo..." value={form.cargo} onChange={(e) => setField('cargo', e.target.value)} error={errors.cargo} />
          <div className="grid grid-cols-2 gap-4">
            <TextField label="E-mail" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} error={errors.email} />
            <TextField label="Telefone celular" value={form.telefoneCelular} onChange={(e) => setField('telefoneCelular', e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" loading={saving}>{editId ? 'Salvar' : 'Cadastrar'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal open={!!confirmar} title="Inativar funcionário?" message={confirmar ? `${confirmar.nomeCompleto} deixará de aparecer na listagem.` : ''} confirmLabel="Inativar" danger loading={inativando} onClose={() => setConfirmar(null)} onConfirm={handleInativar} />
    </div>
  );
};
