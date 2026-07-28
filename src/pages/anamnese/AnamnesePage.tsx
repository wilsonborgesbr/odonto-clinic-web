import { useCallback, useEffect, useRef, useState } from 'react';
import type { Anamnese, PacienteListagemDTO, PageResponse } from '../../types';
import { ApiError, fetchApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';

const boolLabel = (v?: boolean) => v === true ? 'Sim' : v === false ? 'Não' : '—';

export const AnamnesePage = () => {
  const toast = useToast();

  const [pacienteId, setPacienteId] = useState('');
  const [pacienteNome, setPacienteNome] = useState('');
  const [buscaPaciente, setBuscaPaciente] = useState('');
  const [opcoesP, setOpcoesP] = useState<PacienteListagemDTO[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const [lista, setLista] = useState<Anamnese[]>([]);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    queixaPrincipal: '', historicoDental: '', usaMedicamentos: false, quaisMedicamentos: '',
    temAlergia: false, quaisAlergias: '', doencasPreexistentes: '', gestante: false,
    fumante: false, consumoAlcool: false, historiaFamiliar: '', observacoes: '',
  });

  const [detalhe, setDetalhe] = useState<Anamnese | null>(null);

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
      const r = await fetchApi<Anamnese[]>(`/api/anamneses/paciente/${pacienteId}`);
      setLista(r);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao carregar anamneses');
    } finally { setLoading(false); }
  }, [pacienteId, toast]);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirForm = () => {
    if (!pacienteId) { toast.error('Selecione um paciente primeiro.'); return; }
    setForm({
      queixaPrincipal: '', historicoDental: '', usaMedicamentos: false, quaisMedicamentos: '',
      temAlergia: false, quaisAlergias: '', doencasPreexistentes: '', gestante: false,
      fumante: false, consumoAlcool: false, historiaFamiliar: '', observacoes: '',
    });
    setFormOpen(true);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    try {
      const payload: Anamnese = { pacienteId, ...form };
      await fetchApi('/api/anamneses', { method: 'POST', body: JSON.stringify(payload) });
      toast.success('Anamnese registrada.');
      setFormOpen(false); carregar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const toggleBool = (k: 'usaMedicamentos' | 'temAlergia' | 'gestante' | 'fumante' | 'consumoAlcool') =>
    setForm((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold text-slate-800">Anamnese</h1>
        <Button onClick={abrirForm} disabled={!pacienteId} icon={<span className="text-lg leading-none">＋</span>}>Nova anamnese</Button>
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
                <th className="px-4 py-3 font-medium">Queixa Principal</th>
                <th className="px-4 py-3 font-medium">Medicamentos</th>
                <th className="px-4 py-3 font-medium">Alergias</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? Array.from({ length: 2 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="p-3"><div className="h-8 bg-slate-50 rounded animate-pulse" /></td></tr>
              )) : lista.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhuma anamnese registrada.</td></tr>
              ) : lista.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{a.dataPreenchimento ? new Date(a.dataPreenchimento).toLocaleDateString('pt-BR') : '—'}</td>
                  <td className="px-4 py-3 text-slate-800">{a.queixaPrincipal || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{boolLabel(a.usaMedicamentos)}</td>
                  <td className="px-4 py-3 text-slate-600">{boolLabel(a.temAlergia)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="secondary" onClick={() => setDetalhe(a)}>Ver detalhes</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Nova anamnese" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField label="Queixa principal" value={form.queixaPrincipal} onChange={(e) => setForm((p) => ({ ...p, queixaPrincipal: e.target.value }))} />
          <TextField label="Histórico dental" value={form.historicoDental} onChange={(e) => setForm((p) => ({ ...p, historicoDental: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex flex-wrap gap-3">
                {(['usaMedicamentos', 'temAlergia', 'gestante', 'fumante', 'consumoAlcool'] as const).map((k) => (
                  <label key={k} className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form[k]} onChange={() => toggleBool(k)} className="rounded border-slate-300 text-sky-600 focus:ring-sky-400" />
                    {({ usaMedicamentos: 'Usa medicamentos', temAlergia: 'Tem alergia', gestante: 'Gestante', fumante: 'Fumante', consumoAlcool: 'Consome álcool' })[k]}
                  </label>
                ))}
              </div>
            </div>
          </div>
          {form.usaMedicamentos && <TextField label="Quais medicamentos?" value={form.quaisMedicamentos} onChange={(e) => setForm((p) => ({ ...p, quaisMedicamentos: e.target.value }))} />}
          {form.temAlergia && <TextField label="Quais alergias?" value={form.quaisAlergias} onChange={(e) => setForm((p) => ({ ...p, quaisAlergias: e.target.value }))} />}
          <TextField label="Doenças preexistentes" value={form.doencasPreexistentes} onChange={(e) => setForm((p) => ({ ...p, doencasPreexistentes: e.target.value }))} />
          <TextField label="História familiar" value={form.historiaFamiliar} onChange={(e) => setForm((p) => ({ ...p, historiaFamiliar: e.target.value }))} />
          <TextField label="Observações" value={form.observacoes} onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" loading={saving}>Registrar</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detalhe} onClose={() => setDetalhe(null)} title="Detalhes da anamnese" size="lg">
        {detalhe && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              <div><span className="text-slate-500">Data:</span> <span className="ml-1 text-slate-800">{detalhe.dataPreenchimento ? new Date(detalhe.dataPreenchimento).toLocaleDateString('pt-BR') : '—'}</span></div>
              <div><span className="text-slate-500">Queixa principal:</span> <span className="ml-1 text-slate-800">{detalhe.queixaPrincipal || '—'}</span></div>
              <div><span className="text-slate-500">Histórico dental:</span> <span className="ml-1 text-slate-800">{detalhe.historicoDental || '—'}</span></div>
              <div><span className="text-slate-500">Usa medicamentos:</span> <span className="ml-1 text-slate-800">{boolLabel(detalhe.usaMedicamentos)} {detalhe.quaisMedicamentos ? `(${detalhe.quaisMedicamentos})` : ''}</span></div>
              <div><span className="text-slate-500">Alergias:</span> <span className="ml-1 text-slate-800">{boolLabel(detalhe.temAlergia)} {detalhe.quaisAlergias ? `(${detalhe.quaisAlergias})` : ''}</span></div>
              <div><span className="text-slate-500">Doenças preexistentes:</span> <span className="ml-1 text-slate-800">{detalhe.doencasPreexistentes || '—'}</span></div>
              <div><span className="text-slate-500">Gestante:</span> <span className="ml-1 text-slate-800">{boolLabel(detalhe.gestante)}</span></div>
              <div><span className="text-slate-500">Fumante:</span> <span className="ml-1 text-slate-800">{boolLabel(detalhe.fumante)}</span></div>
              <div><span className="text-slate-500">Consumo de álcool:</span> <span className="ml-1 text-slate-800">{boolLabel(detalhe.consumoAlcool)}</span></div>
              <div><span className="text-slate-500">História familiar:</span> <span className="ml-1 text-slate-800">{detalhe.historiaFamiliar || '—'}</span></div>
            </div>
            {detalhe.observacoes && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500">Observações:</span>
                <p className="mt-1 text-slate-800">{detalhe.observacoes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
