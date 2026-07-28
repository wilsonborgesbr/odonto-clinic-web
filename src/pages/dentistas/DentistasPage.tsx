import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Dentista, DentistaListagemDTO, PageResponse, EspecialidadeEnum, SexoEnum } from '../../types';
import { ApiError } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { fetchApi } from '../../services/api';

const PAGE_SIZE = 10;

const ESPECIALIDADE_LABELS: Record<EspecialidadeEnum, string> = {
  CLINICO_GERAL: 'Clínico Geral', ORTODONTIA: 'Ortodontia', IMPLANTODONTIA: 'Implantodontia',
  ENDODONTIA: 'Endodontia', PERIODONTIA: 'Periodontia', ODONTOPEDIATRIA: 'Odontopediatria',
  CIRURGIA: 'Cirurgia', PROTESE: 'Prótese', ESTETICA: 'Estética', RADIOLOGIA: 'Radiologia',
};
const ESPECIALIDADE_OPTIONS = Object.entries(ESPECIALIDADE_LABELS).map(([v, l]) => ({ value: v, label: l }));

const SEXO_OPTIONS = [
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMININO', label: 'Feminino' },
  { value: 'OUTRO', label: 'Outro' },
];

interface FormState {
  nomeCompleto: string; cro: string; especialidades: string[];
  email: string; telefoneCelular: string; sexo: string;
}
const emptyForm: FormState = { nomeCompleto: '', cro: '', especialidades: [], email: '', telefoneCelular: '', sexo: '' };

const fromDentista = (d: Dentista): FormState => ({
  nomeCompleto: d.nomeCompleto, cro: d.cro, especialidades: d.especialidades ?? [],
  email: d.email ?? '', telefoneCelular: d.telefoneCelular ?? '', sexo: d.sexo,
});

const CRO_RE = /^CRO-[A-Z]{2} \d{4,6}(\/\d{4})?$/;

export const DentistasPage = () => {
  const toast = useToast();
  const [page, setPage] = useState<PageResponse<DentistaListagemDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [confirmar, setConfirmar] = useState<DentistaListagemDTO | null>(null);
  const [inativando, setInativando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchApi<PageResponse<DentistaListagemDTO>>(
        `/api/dentistas?pagina=${pagina}&tamanho=${PAGE_SIZE}&ordem=nomeCompleto`,
      );
      setPage(r);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao carregar dentistas');
    } finally { setLoading(false); }
  }, [pagina, toast]);

  useEffect(() => { carregar(); }, [carregar]);

  const setField = (k: keyof FormState, v: string | string[]) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => { const n = { ...p }; delete n[k]; return n; });
    setGlobalError(null);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nomeCompleto.trim()) e.nomeCompleto = 'Nome é obrigatório.';
    if (!form.cro.trim()) e.cro = 'CRO é obrigatório.';
    else if (!CRO_RE.test(form.cro.trim())) e.cro = 'Formato: CRO-UF 12345 (ex: CRO-SP 12345)';
    if (!form.sexo) e.sexo = 'Sexo é obrigatório.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido.';
    return e;
  };

  const abrirNovo = () => { setEditId(null); setForm(emptyForm); setErrors({}); setGlobalError(null); setFormOpen(true); };
  const abrirEdicao = async (item: DentistaListagemDTO) => {
    try {
      const d = await fetchApi<Dentista>(`/api/dentistas/${item.id}`);
      setEditId(item.id); setForm(fromDentista(d)); setErrors({}); setGlobalError(null); setFormOpen(true);
    } catch (err) { toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao carregar'); }
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    const payload: Dentista = {
      nomeCompleto: form.nomeCompleto.trim(), cro: form.cro.trim(),
      especialidades: form.especialidades as EspecialidadeEnum[],
      email: form.email || undefined, telefoneCelular: form.telefoneCelular || undefined,
      sexo: form.sexo as SexoEnum,
    };
    setSaving(true); setGlobalError(null);
    try {
      if (editId) {
        await fetchApi(`/api/dentistas/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Dentista atualizado.');
      } else {
        await fetchApi('/api/dentistas', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Dentista cadastrado.');
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
      await fetchApi(`/api/dentistas/${alvo.id}`, { method: 'DELETE' });
      setConfirmar(null);
      toast.info(`${alvo.nomeCompleto} inativado.`, {
        actionLabel: 'Desfazer', onAction: async () => {
          try { await fetchApi(`/api/dentistas/${alvo.id}/reativar`, { method: 'PATCH' }); toast.success('Reativado.'); carregar(); }
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
          <h1 className="text-2xl font-semibold text-slate-800">Dentistas</h1>
          <p className="text-sm text-slate-500">{loading ? 'Carregando...' : `${page?.totalElements ?? 0} dentista(s) ativo(s)`}</p>
        </div>
        <Button onClick={abrirNovo} icon={<span className="text-lg leading-none">＋</span>}>Novo dentista</Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase tracking-wide bg-slate-50">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">CRO</th>
              <th className="px-4 py-3 font-medium">Especialidades</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Telefone</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}><td colSpan={6} className="p-3"><div className="h-8 bg-slate-50 rounded animate-pulse" /></td></tr>
            )) : linhas.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">Nenhum dentista cadastrado.</td></tr>
            ) : linhas.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-800 font-medium">{d.nomeCompleto}</td>
                <td className="px-4 py-3 text-slate-600 tabular-nums">{d.cro}</td>
                <td className="px-4 py-3 text-slate-600">
                  {d.especialidades?.map((e) => ESPECIALIDADE_LABELS[e] ?? e).join(', ') || '—'}
                </td>
                <td className="px-4 py-3 text-slate-600">{d.email || '—'}</td>
                <td className="px-4 py-3 text-slate-600 tabular-nums">{d.telefoneCelular || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => abrirEdicao(d)}>Editar</Button>
                    <Button size="sm" variant="danger" onClick={() => setConfirmar(d)}>Inativar</Button>
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

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editId ? 'Editar dentista' : 'Novo dentista'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {globalError && <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{globalError}</div>}
          <TextField label="Nome completo" required value={form.nomeCompleto} onChange={(e) => setField('nomeCompleto', e.target.value)} error={errors.nomeCompleto} />
          <div className="grid grid-cols-2 gap-4">
            <TextField label="CRO" required placeholder="CRO-SP 12345" value={form.cro} onChange={(e) => setField('cro', e.target.value)} error={errors.cro} hint="Formato: CRO-UF NÚMERO" />
            <Select label="Sexo" required options={SEXO_OPTIONS} placeholder="Selecione..." value={form.sexo} onChange={(e) => setField('sexo', e.target.value)} error={errors.sexo} />
          </div>
          <div>
            <span className="block text-xs font-medium text-slate-700 mb-1">Especialidades</span>
            <div className="flex flex-wrap gap-2">
              {ESPECIALIDADE_OPTIONS.map((opt) => {
                const checked = form.especialidades.includes(opt.value);
                return (
                  <label key={opt.value} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer border transition-colors ${checked ? 'bg-sky-100 border-sky-300 text-sky-800' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                    <input type="checkbox" className="sr-only" checked={checked}
                      onChange={() => setField('especialidades', checked ? form.especialidades.filter((v) => v !== opt.value) : [...form.especialidades, opt.value])} />
                    {opt.label}
                  </label>
                );
              })}
            </div>
          </div>
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

      <ConfirmModal open={!!confirmar} title="Inativar dentista?" message={confirmar ? `${confirmar.nomeCompleto} deixará de aparecer na listagem.` : ''} confirmLabel="Inativar" danger loading={inativando} onClose={() => setConfirmar(null)} onConfirm={handleInativar} />
    </div>
  );
};
