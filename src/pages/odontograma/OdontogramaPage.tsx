import { useCallback, useEffect, useRef, useState } from 'react';
import type { Odontograma, DenteStatus, CondicaoDenteEnum, PacienteListagemDTO, PageResponse } from '../../types';
import { ApiError, fetchApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

const CONDICAO_LABELS: Record<CondicaoDenteEnum, string> = {
  SAUDAVEL: 'Saudável', CARIADO: 'Cariado', RESTAURADO: 'Restaurado',
  AUSENTE: 'Ausente', IMPLANTE: 'Implante', COROA: 'Coroa',
  FRATURADO: 'Fraturado', EM_TRATAMENTO: 'Em Tratamento', EXTRAIR: 'Extrair',
};
const CONDICAO_OPTIONS = Object.entries(CONDICAO_LABELS).map(([v, l]) => ({ value: v, label: l }));

const CONDICAO_COLORS: Record<CondicaoDenteEnum, string> = {
  SAUDAVEL: 'bg-green-100 text-green-800', CARIADO: 'bg-red-100 text-red-800',
  RESTAURADO: 'bg-blue-100 text-blue-800', AUSENTE: 'bg-slate-200 text-slate-600',
  IMPLANTE: 'bg-purple-100 text-purple-800', COROA: 'bg-amber-100 text-amber-800',
  FRATURADO: 'bg-orange-100 text-orange-800', EM_TRATAMENTO: 'bg-yellow-100 text-yellow-800',
  EXTRAIR: 'bg-red-200 text-red-900',
};

const DENTES_SUPERIOR = ['18','17','16','15','14','13','12','11','21','22','23','24','25','26','27','28'];
const DENTES_INFERIOR = ['48','47','46','45','44','43','42','41','31','32','33','34','35','36','37','38'];

const emptyDente = (num: string): DenteStatus => ({ numeroDente: num, condicao: 'SAUDAVEL', observacao: '' });

export const OdontogramaPage = () => {
  const toast = useToast();

  const [pacienteId, setPacienteId] = useState('');
  const [pacienteNome, setPacienteNome] = useState('');
  const [buscaPaciente, setBuscaPaciente] = useState('');
  const [opcoesP, setOpcoesP] = useState<PacienteListagemDTO[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const [lista, setLista] = useState<Odontograma[]>([]);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dentes, setDentes] = useState<DenteStatus[]>([]);
  const [formObs, setFormObs] = useState('');

  const [detalhe, setDetalhe] = useState<Odontograma | null>(null);

  const buscarPacientes = useCallback(async (q: string) => {
    if (q.length < 2) { setOpcoesP([]); return; }
    try {
      const r = await fetchApi<PageResponse<PacienteListagemDTO>>(`/api/pacientes?pagina=0&tamanho=8&nome=${encodeURIComponent(q)}`);
      setOpcoesP(r.content); setDropdownOpen(true);
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

  const carregar = useCallback(async () => {
    if (!pacienteId) { setLista([]); return; }
    setLoading(true);
    try {
      const r = await fetchApi<Odontograma[]>(`/api/odontogramas/paciente/${pacienteId}`);
      setLista(r);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao carregar odontogramas');
    } finally { setLoading(false); }
  }, [pacienteId, toast]);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirForm = () => {
    if (!pacienteId) { toast.error('Selecione um paciente primeiro.'); return; }
    setDentes([...DENTES_SUPERIOR, ...DENTES_INFERIOR].map(emptyDente));
    setFormObs('');
    setFormOpen(true);
  };

  const setDente = (idx: number, field: 'condicao' | 'observacao', value: string) => {
    setDentes((prev) => { const n = [...prev]; n[idx] = { ...n[idx], [field]: value }; return n; });
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    try {
      const payload: Odontograma = { pacienteId, dentes, observacoes: formObs || undefined };
      await fetchApi('/api/odontogramas', { method: 'POST', body: JSON.stringify(payload) });
      toast.success('Odontograma registrado.');
      setFormOpen(false); carregar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const renderArcada = (nums: string[], label: string) => {
    const dentesMap = new Map((detalhe?.dentes ?? []).map((d) => [d.numeroDente, d]));
    return (
      <div>
        <span className="block text-xs font-medium text-slate-500 mb-2">{label}</span>
        <div className="flex flex-wrap gap-1.5">
          {nums.map((num) => {
            const d = dentesMap.get(num);
            const cond = d?.condicao ?? 'SAUDAVEL';
            return (
              <div key={num} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs ${CONDICAO_COLORS[cond]}`} title={d?.observacao || CONDICAO_LABELS[cond]}>
                <span className="font-bold">{num}</span>
                <span className="text-[10px] leading-tight">{CONDICAO_LABELS[cond]?.slice(0, 4)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold text-slate-800">Odontograma</h1>
        <Button onClick={abrirForm} disabled={!pacienteId} icon={<span className="text-lg leading-none">＋</span>}>Novo odontograma</Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <span className="block text-xs font-medium text-slate-700">Paciente</span>
        {pacienteId ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-800 font-medium">{pacienteNome}</span>
            <Button size="sm" variant="ghost" onClick={() => { setPacienteId(''); setPacienteNome(''); setLista([]); }}>Trocar</Button>
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
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Dentes registrados</th>
                <th className="px-4 py-3 font-medium">Observações</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? Array.from({ length: 2 }).map((_, i) => (
                <tr key={i}><td colSpan={4} className="p-3"><div className="h-8 bg-slate-50 rounded animate-pulse" /></td></tr>
              )) : lista.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Nenhum odontograma registrado.</td></tr>
              ) : lista.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{o.dataAvaliacao ? new Date(o.dataAvaliacao).toLocaleDateString('pt-BR') : '—'}</td>
                  <td className="px-4 py-3 text-slate-800">{o.dentes?.length ?? 0} dentes</td>
                  <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]">{o.observacoes || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="secondary" onClick={() => setDetalhe(o)}>Ver mapa</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Novo odontograma" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">Selecione a condição de cada dente. Dentes sem alteração permanecem como "Saudável".</p>
          {[{ label: 'Arcada Superior', nums: DENTES_SUPERIOR, offset: 0 }, { label: 'Arcada Inferior', nums: DENTES_INFERIOR, offset: 16 }].map(({ label, nums, offset }) => (
            <div key={label}>
              <span className="block text-xs font-medium text-slate-700 mb-2">{label}</span>
              <div className="grid grid-cols-4 gap-2">
                {nums.map((num, i) => {
                  const idx = offset + i;
                  return (
                    <div key={num} className="flex items-center gap-1.5">
                      <span className="text-xs font-mono w-6 text-slate-500">{num}</span>
                      <select className="flex-1 text-xs border border-slate-300 rounded px-1.5 py-1 focus:ring-1 focus:ring-sky-400"
                        value={dentes[idx]?.condicao ?? 'SAUDAVEL'}
                        onChange={(e) => setDente(idx, 'condicao', e.target.value)}>
                        {CONDICAO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <TextField label="Observações gerais" value={formObs} onChange={(e) => setFormObs(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" loading={saving}>Registrar</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detalhe} onClose={() => setDetalhe(null)} title="Mapa dental" size="lg">
        {detalhe && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">Avaliação de {detalhe.dataAvaliacao ? new Date(detalhe.dataAvaliacao).toLocaleDateString('pt-BR') : '—'}</p>
            {renderArcada(DENTES_SUPERIOR, 'Arcada Superior')}
            {renderArcada(DENTES_INFERIOR, 'Arcada Inferior')}
            {detalhe.observacoes && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">Observações:</span>
                <p className="mt-1 text-sm text-slate-800">{detalhe.observacoes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
