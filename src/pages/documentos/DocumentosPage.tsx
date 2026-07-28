import { useCallback, useEffect, useRef, useState } from 'react';
import type { Documento, TipoDocumentoEnum, PacienteListagemDTO, PageResponse } from '../../types';
import { ApiError, fetchApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Select } from '../../components/ui/Select';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

const TIPO_LABELS: Record<TipoDocumentoEnum, string> = {
  RADIOGRAFIA: 'Radiografia', FOTO_INTRAORAL: 'Foto Intraoral', FOTO_EXTRAORAL: 'Foto Extraoral',
  LAUDO: 'Laudo', CONTRATO: 'Contrato', ORCAMENTO_ASSINADO: 'Orçamento Assinado',
  TERMO_CONSENTIMENTO: 'Termo de Consentimento', OUTRO: 'Outro',
};
const TIPO_OPTIONS = Object.entries(TIPO_LABELS).map(([v, l]) => ({ value: v, label: l }));

export const DocumentosPage = () => {
  const toast = useToast();

  const [pacienteId, setPacienteId] = useState('');
  const [pacienteNome, setPacienteNome] = useState('');
  const [buscaPaciente, setBuscaPaciente] = useState('');
  const [opcoesP, setOpcoesP] = useState<PacienteListagemDTO[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const [docs, setDocs] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formTipo, setFormTipo] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [saving, setSaving] = useState(false);

  const [confirmar, setConfirmar] = useState<Documento | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const buscarPacientes = useCallback(async (q: string) => {
    if (q.length < 2) { setOpcoesP([]); return; }
    try {
      const r = await fetchApi<PageResponse<PacienteListagemDTO>>(`/api/pacientes?pagina=0&tamanho=8&nome=${encodeURIComponent(q)}`);
      setOpcoesP(r.content);
      setDropdownOpen(true);
    } catch { setOpcoesP([]); }
  }, []);

  const onBuscaChange = (v: string) => {
    setBuscaPaciente(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscarPacientes(v), 300);
  };

  const selecionarPaciente = (p: PacienteListagemDTO) => {
    setPacienteId(p.id); setPacienteNome(p.nomeCompleto);
    setBuscaPaciente(''); setDropdownOpen(false); setOpcoesP([]);
  };

  const carregarDocs = useCallback(async () => {
    if (!pacienteId) { setDocs([]); return; }
    setLoading(true);
    try {
      const r = await fetchApi<Documento[]>(`/api/documentos/paciente/${pacienteId}`);
      setDocs(r);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao carregar documentos');
    } finally { setLoading(false); }
  }, [pacienteId, toast]);

  useEffect(() => { carregarDocs(); }, [carregarDocs]);

  const abrirForm = () => {
    if (!pacienteId) { toast.error('Selecione um paciente primeiro.'); return; }
    setFormTipo(''); setFormUrl(''); setFormDescricao(''); setErrors({}); setFormOpen(true);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!formTipo) e.tipo = 'Tipo é obrigatório.';
    if (!formUrl.trim()) e.urlArquivo = 'URL é obrigatória.';
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const payload: Documento = {
        pacienteId, tipo: formTipo as TipoDocumentoEnum,
        urlArquivo: formUrl.trim(), descricao: formDescricao || undefined,
      };
      await fetchApi('/api/documentos', { method: 'POST', body: JSON.stringify(payload) });
      toast.success('Documento adicionado.');
      setFormOpen(false); carregarDocs();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const handleExcluir = async () => {
    if (!confirmar) return;
    setExcluindo(true);
    try {
      await fetchApi(`/api/documentos/${confirmar.id}`, { method: 'DELETE' });
      setConfirmar(null);
      toast.success('Documento excluído.');
      carregarDocs();
    } catch (err) { toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao excluir'); }
    finally { setExcluindo(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold text-slate-800">Documentos</h1>
        <Button onClick={abrirForm} disabled={!pacienteId} icon={<span className="text-lg leading-none">＋</span>}>Novo documento</Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <span className="block text-xs font-medium text-slate-700">Paciente</span>
        {pacienteId ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-800 font-medium">{pacienteNome}</span>
            <Button size="sm" variant="ghost" onClick={() => { setPacienteId(''); setPacienteNome(''); setDocs([]); }}>Trocar</Button>
          </div>
        ) : (
          <div className="relative max-w-md">
            <input className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="Buscar paciente por nome..." value={buscaPaciente} onChange={(e) => onBuscaChange(e.target.value)}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 200)} />
            {dropdownOpen && opcoesP.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                {opcoesP.map((p) => (
                  <li key={p.id} className="px-3 py-2 text-sm hover:bg-sky-50 cursor-pointer" onMouseDown={() => selecionarPaciente(p)}>
                    {p.nomeCompleto} <span className="text-slate-400">— {p.cpf}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {pacienteId && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 uppercase tracking-wide bg-slate-50">
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}><td colSpan={4} className="p-3"><div className="h-8 bg-slate-50 rounded animate-pulse" /></td></tr>
              )) : docs.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Nenhum documento para este paciente.</td></tr>
              ) : docs.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-800 font-medium">{TIPO_LABELS[d.tipo!] ?? d.tipo}</td>
                  <td className="px-4 py-3 text-slate-600">{d.descricao || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{d.dataUpload ? new Date(d.dataUpload).toLocaleDateString('pt-BR') : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      {d.urlArquivo && (
                        <a href={d.urlArquivo} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2.5 py-1.5 text-xs bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">Ver</a>
                      )}
                      <Button size="sm" variant="danger" onClick={() => setConfirmar(d)}>Excluir</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Novo documento">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Tipo" required options={TIPO_OPTIONS} placeholder="Selecione..." value={formTipo} onChange={(e) => { setFormTipo(e.target.value); setErrors((p) => { const n = { ...p }; delete n.tipo; return n; }); }} error={errors.tipo} />
          <TextField label="URL do arquivo" required value={formUrl} onChange={(e) => { setFormUrl(e.target.value); setErrors((p) => { const n = { ...p }; delete n.urlArquivo; return n; }); }} error={errors.urlArquivo} placeholder="https://..." />
          <TextField label="Descrição" value={formDescricao} onChange={(e) => setFormDescricao(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" loading={saving}>Salvar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal open={!!confirmar} title="Excluir documento?" message="Esta ação é irreversível." confirmLabel="Excluir" danger loading={excluindo} onClose={() => setConfirmar(null)} onConfirm={handleExcluir} />
    </div>
  );
};
