import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ContaReceber, PacienteListagemDTO, StatusFinanceiroEnum } from '../../types';
import { contaReceberService } from '../../services/financeiroService';
import { pacienteService } from '../../services/pacienteService';
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

const FORMA_PAGAMENTO_LABELS: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'Pix',
  CARTAO_CREDITO: 'Cartão de Crédito',
  CARTAO_DEBITO: 'Cartão de Débito',
  CONVENIO: 'Convênio',
  BOLETO: 'Boleto',
  TRANSFERENCIA: 'Transferência',
};

const FORMA_OPTIONS = Object.entries(FORMA_PAGAMENTO_LABELS).map(([v, l]) => ({ value: v, label: l }));

const STATUS_FILTER = [
  { value: '', label: 'Todos os status' },
  ...Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l })),
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
  pacienteId: string;
  descricao: string;
  valorTotal: string;
  formaPagamento: string;
  numeroParcelas: string;
  dataVencimento: string;
  observacoes: string;
}

const emptyForm: FormState = {
  pacienteId: '',
  descricao: '',
  valorTotal: '',
  formaPagamento: '',
  numeroParcelas: '1',
  dataVencimento: '',
  observacoes: '',
};

export const ContasReceberTab = () => {
  const toast = useToast();

  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [loading, setLoading] = useState(true);

  const [pacientes, setPacientes] = useState<PacienteListagemDTO[]>([]);
  const [pacienteMap, setPacienteMap] = useState<Record<string, string>>({});

  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroPaciente, setFiltroPaciente] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [buscaPacForm, setBuscaPacForm] = useState('');
  const [pacFormResults, setPacFormResults] = useState<PacienteListagemDTO[]>([]);

  const [pagModal, setPagModal] = useState<ContaReceber | null>(null);
  const [valorPagamento, setValorPagamento] = useState('');
  const [pagSaving, setPagSaving] = useState(false);

  const [confirmarExcluir, setConfirmarExcluir] = useState<ContaReceber | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [contasResp, pacResp] = await Promise.all([
        contaReceberService.listar(),
        pacienteService.listar({ tamanho: 500 }),
      ]);
      setContas(contasResp);
      setPacientes(pacResp.content);
      const m: Record<string, string> = {};
      pacResp.content.forEach((p) => { m[p.id] = p.nomeCompleto; });
      setPacienteMap(m);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao carregar contas');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { carregar(); }, [carregar]);

  const pacienteFilterOptions = useMemo(() => [
    { value: '', label: 'Todos os pacientes' },
    ...pacientes.map((p) => ({ value: p.id, label: p.nomeCompleto })),
  ], [pacientes]);

  const contasFiltradas = useMemo(() => {
    let list = contas;
    if (filtroStatus) list = list.filter((c) => c.status === filtroStatus);
    if (filtroPaciente) list = list.filter((c) => c.pacienteId === filtroPaciente);
    return list;
  }, [contas, filtroStatus, filtroPaciente]);

  useEffect(() => {
    if (buscaPacForm.trim().length < 2) { setPacFormResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await pacienteService.listar({ nome: buscaPacForm, tamanho: 10 });
        setPacFormResults(r.content);
      } catch { setPacFormResults([]); }
    }, 350);
    return () => clearTimeout(t);
  }, [buscaPacForm]);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    setFormErrors((p) => { const n = { ...p }; delete n[k]; return n; });
    setGlobalError(null);
  };

  const validateForm = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.pacienteId) e.pacienteId = 'Selecione um paciente.';
    if (!form.descricao.trim()) e.descricao = 'Descrição é obrigatória.';
    if (!form.valorTotal || Number(form.valorTotal) <= 0) e.valorTotal = 'Valor deve ser maior que zero.';
    if (!form.formaPagamento) e.formaPagamento = 'Selecione a forma de pagamento.';
    if (!form.dataVencimento) e.dataVencimento = 'Data de vencimento é obrigatória.';
    return e;
  };

  const handleSubmitForm = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const v = validateForm();
    if (Object.keys(v).length) { setFormErrors(v); return; }

    const payload: ContaReceber = {
      pacienteId: form.pacienteId,
      descricao: form.descricao.trim(),
      valorTotal: Number(form.valorTotal),
      formaPagamento: form.formaPagamento as ContaReceber['formaPagamento'],
      numeroParcelas: Number(form.numeroParcelas) || 1,
      dataVencimento: form.dataVencimento,
      status: 'PENDENTE',
    };
    if (form.observacoes.trim()) payload.observacoes = form.observacoes.trim();

    setSaving(true);
    setGlobalError(null);
    try {
      await contaReceberService.criar(payload);
      toast.success('Conta a receber criada.');
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

  const handleRegistrarPagamento = async () => {
    if (!pagModal?.id) return;
    const valor = Number(valorPagamento);
    if (!valor || valor <= 0) { toast.error('Informe um valor maior que zero.'); return; }
    const saldo = (pagModal.valorTotal ?? 0) - (pagModal.valorPago ?? 0);
    if (valor > saldo) { toast.error(`Valor excede o saldo restante de ${formatBRL(saldo)}.`); return; }

    setPagSaving(true);
    try {
      await contaReceberService.registrarPagamento(pagModal.id, valor);
      toast.success(`Pagamento de ${formatBRL(valor)} registrado.`);
      setPagModal(null);
      setValorPagamento('');
      carregar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao registrar pagamento');
    } finally {
      setPagSaving(false);
    }
  };

  const handleExcluir = async () => {
    if (!confirmarExcluir?.id) return;
    setExcluindo(true);
    try {
      await contaReceberService.excluir(confirmarExcluir.id);
      toast.success('Conta excluída.');
      setConfirmarExcluir(null);
      carregar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao excluir');
    } finally {
      setExcluindo(false);
    }
  };

  const pacienteSelecionado = pacientes.find((p) => p.id === form.pacienteId)
    ?? pacFormResults.find((p) => p.id === form.pacienteId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Select label="" options={STATUS_FILTER} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} containerClassName="min-w-[160px]" />
          <Select label="" options={pacienteFilterOptions} value={filtroPaciente} onChange={(e) => setFiltroPaciente(e.target.value)} containerClassName="min-w-[200px]" />
        </div>
        <Button onClick={() => { setForm(emptyForm); setBuscaPacForm(''); setFormErrors({}); setGlobalError(null); setFormOpen(true); }} icon={<span className="text-lg leading-none">＋</span>}>
          Nova conta
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase tracking-wide bg-slate-50">
              <th className="px-4 py-3 font-medium">Paciente</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium text-right">Pago</th>
              <th className="px-4 py-3 font-medium text-right">Saldo</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="p-3"><div className="h-8 bg-slate-50 rounded animate-pulse" /></td></tr>
              ))
            ) : contasFiltradas.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-slate-400">Nenhuma conta a receber encontrada.</td></tr>
            ) : (
              contasFiltradas.map((c) => {
                const saldo = (c.valorTotal ?? 0) - (c.valorPago ?? 0);
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800 font-medium">{pacienteMap[c.pacienteId] ?? c.pacienteId}</td>
                    <td className="px-4 py-3 text-slate-600">{c.descricao}</td>
                    <td className="px-4 py-3 text-slate-700 text-right tabular-nums">{formatBRL(c.valorTotal)}</td>
                    <td className="px-4 py-3 text-emerald-700 text-right tabular-nums">{formatBRL(c.valorPago)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium" style={{ color: saldo > 0 ? '#b45309' : '#059669' }}>{formatBRL(saldo)}</td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums">{formatDate(c.dataVencimento)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        {c.status !== 'PAGO' && c.status !== 'CANCELADO' && (
                          <Button size="sm" variant="primary" onClick={() => { setPagModal(c); setValorPagamento(''); }}>
                            Receber
                          </Button>
                        )}
                        <Button size="sm" variant="danger" onClick={() => setConfirmarExcluir(c)}>
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal criar conta */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Nova conta a receber" size="lg">
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {globalError && (
            <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{globalError}</div>
          )}

          <div>
            <span className="block text-xs font-medium text-slate-700 mb-1">Paciente <span className="text-red-500">*</span></span>
            {pacienteSelecionado ? (
              <div className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg bg-slate-50">
                <span className="flex-1 text-slate-800">{pacienteSelecionado.nomeCompleto}</span>
                <button type="button" onClick={() => { setField('pacienteId', ''); setBuscaPacForm(''); }} className="text-slate-400 hover:text-slate-600">×</button>
              </div>
            ) : (
              <div className="relative">
                <input type="text" placeholder="Digite o nome do paciente..." value={buscaPacForm} onChange={(e) => setBuscaPacForm(e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 ${formErrors.pacienteId ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'}`} />
                {pacFormResults.length > 0 && buscaPacForm.trim().length >= 2 && (
                  <ul className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
                    {pacFormResults.map((p) => (
                      <li key={p.id}>
                        <button type="button" onClick={() => { setField('pacienteId', p.id); setBuscaPacForm(''); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-sky-50">
                          {p.nomeCompleto}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {formErrors.pacienteId && <span className="block text-xs text-red-600 mt-1">{formErrors.pacienteId}</span>}
          </div>

          <TextField label="Descrição" required value={form.descricao} onChange={(e) => setField('descricao', e.target.value)} error={formErrors.descricao} />

          <div className="grid grid-cols-3 gap-4">
            <TextField label="Valor total (R$)" required type="number" step="0.01" min="0" value={form.valorTotal} onChange={(e) => setField('valorTotal', e.target.value)} error={formErrors.valorTotal} />
            <Select label="Forma de pagamento" required options={FORMA_OPTIONS} placeholder="Selecione..." value={form.formaPagamento} onChange={(e) => setField('formaPagamento', e.target.value)} error={formErrors.formaPagamento} />
            <TextField label="Parcelas" type="number" min="1" value={form.numeroParcelas} onChange={(e) => setField('numeroParcelas', e.target.value)} />
          </div>

          <TextField label="Data de vencimento" required type="date" value={form.dataVencimento} onChange={(e) => setField('dataVencimento', e.target.value)} error={formErrors.dataVencimento} />

          <TextArea label="Observações" value={form.observacoes} onChange={(e) => setField('observacoes', e.target.value)} rows={2} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" loading={saving}>Criar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal de pagamento */}
      <Modal open={!!pagModal} onClose={() => setPagModal(null)} title="Registrar pagamento" size="md">
        {pagModal && (() => {
          const saldo = (pagModal.valorTotal ?? 0) - (pagModal.valorPago ?? 0);
          return (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">{pacienteMap[pagModal.pacienteId] ?? 'Paciente'} — {pagModal.descricao}</p>

              <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-4">
                <div className="text-center">
                  <div className="text-xs text-slate-500">Valor total</div>
                  <div className="text-base font-semibold text-slate-800">{formatBRL(pagModal.valorTotal)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500">Já pago</div>
                  <div className="text-base font-semibold text-emerald-700">{formatBRL(pagModal.valorPago)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-500">Saldo restante</div>
                  <div className="text-base font-semibold text-amber-700">{formatBRL(saldo)}</div>
                </div>
              </div>

              <div className="relative">
                <TextField
                  label="Valor a receber (R$)"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={saldo}
                  value={valorPagamento}
                  onChange={(e) => setValorPagamento(e.target.value)}
                  hint={`Máximo: ${formatBRL(saldo)}`}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setPagModal(null)} disabled={pagSaving}>Cancelar</Button>
                <Button onClick={handleRegistrarPagamento} loading={pagSaving}>Registrar pagamento</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      <ConfirmModal
        open={!!confirmarExcluir}
        title="Excluir conta a receber?"
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
