import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Syringe,
  Link2,
  ExternalLink,
  Grid3X3,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import type { BadgeTone } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { CurrencyInput, Input, Select, Textarea } from '../../components/ui/Field';
import { bokkaToast } from '../../components/ui/Toast';
import {
  useProcedimentosPorPaciente,
  useCriarProcedimento,
  useAtualizarProcedimento,
  useExcluirProcedimento,
} from '../../services/procedimentoService';
import { usePaciente } from '../../services/pacienteService';
import { useOdontogramaRecente, useOdontogramasPorPaciente } from '../../services/odontogramaService';
import { SeletorDenteFace } from '../../components/odontograma/SeletorDenteFace';
import type { SelecaoDentes } from '../../components/odontograma/SeletorDenteFace';
import { MarcarNoOdontogramaConteudo } from '../../components/odontograma/MarcarNoOdontogramaModal';
import { denteValido, dentesDoTexto, mapaDentes, separarDentes } from '../../lib/dentes';
import { useMarcarDenteAposSalvar } from '../../hooks/useMarcarDenteAposSalvar';
import type { MarcaNoSeletor } from '../../hooks/useMarcarDenteAposSalvar';
import { ApiError } from '../../lib/api';
import { formatDate, formatCurrency, cn } from '../../lib/utils';
import { nomeProcLabel, statusLabel, nomeProcOptions } from '../../lib/procedimentoLabels';
import type {
  Procedimento,
  NomeProcedimentoEnum,
  StatusProcedimentoEnum,
  RegiaoEnum,
  TipoPagamentoProcedimentoEnum,
  FaceDenteEnum,
  CondicaoDenteEnum,
} from '../../types';

const parcelaOptions = Array.from({ length: 23 }, (_, i) => ({
  value: String(i + 2),
  label: `${i + 2}x`,
}));

const tipoPagamentoOptions: { value: TipoPagamentoProcedimentoEnum; label: string }[] = [
  { value: 'A_VISTA', label: 'À vista' },
  { value: 'PARCELADO', label: 'Parcelado' },
];

const statusTone: Record<StatusProcedimentoEnum, BadgeTone> = {
  ORCADO: 'neutral',
  AGENDADO: 'info',
  EM_ANDAMENTO: 'warning',
  CONCLUIDO: 'success',
  CANCELADO: 'danger',
};

const regiaoLabel: Record<RegiaoEnum, string> = {
  SUPERIOR: 'Superior',
  INFERIOR: 'Inferior',
  ANTERIOR: 'Anterior',
  POSTERIOR: 'Posterior',
};

const allRegioes: RegiaoEnum[] = ['SUPERIOR', 'INFERIOR', 'ANTERIOR', 'POSTERIOR'];
const allStatus: StatusProcedimentoEnum[] = ['ORCADO', 'AGENDADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'];

const regiaoOptions = [
  { value: '', label: 'Todas' },
  ...allRegioes.map((r) => ({ value: r, label: regiaoLabel[r] })),
];

const statusOptions = allStatus.map((s) => ({ value: s, label: statusLabel[s] }));

const emptyProcedimento: Procedimento = {
  pacienteId: '',
  nomeProcedimento: 'PROFILAXIA',
  descricao: '',
  dente: '',
  regiao: undefined,
  status: 'ORCADO',
  dataRealizacao: '',
  valor: 0,
  numeroDeSessoes: 1,
  sessaoAtual: 1,
  observacoesTecnicas: '',
};

interface PacienteProcedimentosProps {
  pacienteId: string;
}

export const PacienteProcedimentos = ({ pacienteId }: PacienteProcedimentosProps) => {
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<Procedimento | null>(null);
  // Um Dialog só, que troca de conteúdo: empilhar dois Dialogs do Headless UI na mesma leva de estado
  // deixa o primeiro sem desmontar (mesmo cuidado da OdontogramaPacientePage).
  const [modo, setModo] = useState<'form' | 'marcar'>('form');
  const [confirmar, setConfirmar] = useState<{ id: string; nome: string } | null>(null);

  const procedimentosQ = useProcedimentosPorPaciente(pacienteId);
  const criarM = useCriarProcedimento();
  const atualizarM = useAtualizarProcedimento();
  const excluirM = useExcluirProcedimento();
  const marcarDente = useMarcarDenteAposSalvar();

  const procedimentos = useMemo(() => {
    const list = procedimentosQ.data ?? [];
    return [...list].sort((a, b) => {
      const da = a.dataRealizacao ?? '';
      const db = b.dataRealizacao ?? '';
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return db.localeCompare(da);
    });
  }, [procedimentosQ.data]);

  const fecharModal = () => {
    setFormOpen(false);
    setFormInitial(null);
    setModo('form');
  };

  const abrirMarcar = (item: Procedimento) => {
    setFormInitial(item);
    setModo('marcar');
    setFormOpen(true);
  };

  const handleSubmit = async (values: Procedimento, marca?: MarcaNoSeletor) => {
    let salvo: Procedimento;
    if (formInitial?.id) {
      salvo = await atualizarM.mutateAsync({ id: formInitial.id, procedimento: values });
      bokkaToast.success('Procedimento atualizado.');
    } else {
      salvo = await criarM.mutateAsync(values);
      bokkaToast.success('Procedimento cadastrado.');
    }
    await marcarDente(salvo.id, marca);
    fecharModal();
  };

  const handleExcluir = async () => {
    if (!confirmar) return;
    try {
      await excluirM.mutateAsync(confirmar.id);
      bokkaToast.success('Procedimento excluído.');
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao excluir.',
      );
    } finally {
      setConfirmar(null);
    }
  };

  return (
    <>
      <div className="bg-bokka-surface-2 border border-bokka-border rounded-2xl overflow-hidden">
        <div className="p-5 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-bokka-ink">Procedimentos</h3>
            <p className="text-xs text-bokka-ink-3 mt-0.5">
              {procedimentos.length} procedimento{procedimentos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => {
              setFormInitial(null);
              setModo('form');
              setFormOpen(true);
            }}
          >
            Adicionar
          </Button>
        </div>

        {procedimentosQ.isLoading ? (
          <div className="px-5 pb-5 space-y-2">
            <Skeleton className="h-12 w-full" rounded="lg" />
            <Skeleton className="h-12 w-full" rounded="lg" />
          </div>
        ) : procedimentos.length === 0 ? (
          <div className="px-5 pb-5">
            <EmptyState
              compact
              icon={<Syringe className="w-6 h-6" strokeWidth={1.75} />}
              title="Nenhum procedimento"
              description="Registre procedimentos realizados neste paciente."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-bokka-ink-3 bg-bokka-surface-3">
                  <th className="px-5 py-2.5 font-semibold">Procedimento</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Valor</th>
                  <th className="px-3 py-2.5 font-semibold text-center">Sessão</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bokka-border">
                {procedimentos.map((item) => (
                  <tr key={item.id} className="hover:bg-bokka-surface-3/50 transition-colors">
                    <td className="px-5 py-2.5">
                      <span className="font-semibold text-bokka-ink text-sm">
                        {item.nomeProcedimento ? nomeProcLabel[item.nomeProcedimento] : '—'}
                      </span>
                      {(item.regiao || item.dente) && (
                        <p className="text-[11px] text-bokka-ink-3 mt-0.5">
                          {item.regiao ? regiaoLabel[item.regiao] : ''}
                          {item.regiao && item.dente ? ' · ' : ''}
                          {item.dente ? `Dente ${item.dente}` : ''}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                            item.odontogramaId
                              ? 'border-bokka-primary text-bokka-ink bg-bokka-surface'
                              : 'border-bokka-field-edge text-bokka-ink-2 bg-bokka-surface',
                          )}
                        >
                          <Link2 className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
                          {item.odontogramaId ? 'Vinculado ao odontograma' : 'Sem vínculo com o odontograma'}
                        </span>
                        {item.id && (
                          <button
                            type="button"
                            onClick={() => abrirMarcar(item)}
                            className="alvo-toque inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-bokka-primary-text hover:bg-bokka-primary-soft transition-colors"
                          >
                            <Grid3X3 className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
                            {item.odontogramaId ? 'Alterar odontograma' : 'Marcar no odontograma'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {item.status && (
                        <Badge tone={statusTone[item.status]} dot>
                          {statusLabel[item.status]}
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-bokka-ink">
                      {formatCurrency(item.valor)}
                    </td>
                    <td className="px-3 py-2.5 text-center tabular-nums text-bokka-ink-2">
                      {item.numeroDeSessoes
                        ? `${item.sessaoAtual ?? 1}/${item.numeroDeSessoes}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="inline-flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setFormInitial(item);
                            setModo('form');
                            setFormOpen(true);
                          }}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-primary-soft hover:text-bokka-primary-text transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmar({
                              id: item.id!,
                              nome: item.nomeProcedimento
                                ? nomeProcLabel[item.nomeProcedimento]
                                : 'Procedimento',
                            })
                          }
                          className="w-7 h-7 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-danger-soft hover:text-bokka-danger-ink transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={fecharModal}
        title={
          modo === 'marcar'
            ? formInitial?.odontogramaId
              ? 'Alterar odontograma'
              : 'Marcar no odontograma'
            : formInitial?.id
              ? 'Editar procedimento'
              : 'Novo procedimento'
        }
        subtitle={
          modo === 'marcar'
            ? formInitial?.odontogramaId
              ? 'Troque o odontograma do procedimento ou ajuste o dente e as faces.'
              : 'Escolha o odontograma, o dente e as faces.'
            : formInitial?.id
              ? 'Atualize os dados do procedimento.'
              : 'Preencha os dados para registrar um procedimento.'
        }
        size="xl"
      >
        {modo === 'marcar' && formInitial?.id ? (
          <MarcarNoOdontogramaConteudo
            procedimento={formInitial}
            onCancel={fecharModal}
            onConcluido={fecharModal}
          />
        ) : (
          <ProcedimentoFormInline
            initial={formInitial}
            pacienteId={pacienteId}
            onCancel={fecharModal}
            onSubmit={handleSubmit}
            onMarcarNoOdontograma={() => setModo('marcar')}
          />
        )}
      </Modal>

      <ConfirmModal
        open={!!confirmar}
        onClose={() => setConfirmar(null)}
        title="Excluir procedimento"
        message={`Tem certeza que deseja excluir "${confirmar?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleExcluir}
      />
    </>
  );
};

interface ProcFormProps {
  initial: Procedimento | null;
  pacienteId: string;
  /** `marca` só vem quando o usuário clicou no seletor de dentes; aí quem salva chama vincular-odontograma com o id devolvido. */
  onSubmit: (values: Procedimento, marca?: MarcaNoSeletor) => Promise<void>;
  onCancel: () => void;
  /** Esconde o link "Abrir odontograma completo" — redundante quando o form já foi aberto a partir do próprio odontograma. */
  showOdontogramaLink?: boolean;
  /** Troca o conteúdo do modal para "Marcar no odontograma" (sem vínculo) ou "Alterar odontograma" (já vinculado). Só ao editar. */
  onMarcarNoOdontograma?: () => void;
}

export const ProcedimentoFormInline = ({
  initial,
  pacienteId,
  onSubmit,
  onCancel,
  showOdontogramaLink = true,
  onMarcarNoOdontograma,
}: ProcFormProps) => {
  const [values, setValues] = useState<Procedimento>(
    () => initial ?? { ...emptyProcedimento, pacienteId },
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const pacienteQ = usePaciente(pacienteId);
  const odontogramasQ = useOdontogramasPorPaciente(pacienteId);
  const recenteQ = useOdontogramaRecente(pacienteId);
  // true quando o usuário clicou no seletor (e não só digitou o número): só então o dente é marcado no odontograma ao salvar.
  const [marcouNoSeletor, setMarcouNoSeletor] = useState(false);
  // Condição escolhida no painel do dente; vale só para o dente em que foi escolhida.
  const [condicaoEscolhida, setCondicaoEscolhida] = useState<{ dente: string; condicao?: CondicaoDenteEnum }>({ dente: '' });
  const [faces, setFaces] = useState<Record<string, FaceDenteEnum[] | undefined>>(() => {
    const unico = dentesDoTexto(initial?.dente);
    return unico.length === 1 && initial?.faces ? { [unico[0]]: initial.faces } : {};
  });
  // Regra: paciente conveniado paga via convênio — não expomos valor
  // nem opção de parcelamento na ficha do procedimento.
  const isConveniado = pacienteQ.data?.tipoPaciente === 'CONVENIO';
  const showPagamento = !isConveniado;

  const set = <K extends keyof Procedimento>(k: K, v: Procedimento[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  // Seleção do mini-arco: o texto do campo "Dente" é a fonte da verdade (continua editável à mão).
  const selecao: SelecaoDentes = useMemo(() => {
    const dentes = dentesDoTexto(values.dente);
    return {
      dentes,
      faces: Object.fromEntries(dentes.map((d) => [d, faces[d]])),
      condicao: dentes.length === 1 && condicaoEscolhida.dente === dentes[0] ? condicaoEscolhida.condicao : undefined,
    };
  }, [values.dente, faces, condicaoEscolhida]);

  const aoSelecionar = (nova: SelecaoDentes) => {
    set('dente', nova.dentes.join(', '));
    setFaces(nova.faces);
    setCondicaoEscolhida({ dente: nova.dentes.length === 1 ? nova.dentes[0] : '', condicao: nova.condicao });
    setMarcouNoSeletor(true);
  };

  const unicoDente = selecao.dentes.length === 1 ? selecao.dentes[0] : undefined;
  const facesDoDente = unicoDente ? (selecao.faces[unicoDente] ?? []) : [];

  const vinculado = odontogramasQ.data?.find((o) => o.id === values.odontogramaId);
  // Sem vínculo o backend escreve no mais recente (GET /recente); o front não adivinha por ordem de lista nem manda id.
  const destino = vinculado ?? recenteQ.data ?? undefined;
  const condicoes = useMemo(() => mapaDentes(destino), [destino]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // A API só aceita um código FDI válido (permanente ou decíduo) em "dente", ou vazio.
    const tokens = separarDentes(values.dente);
    if (tokens.length > 1 || (tokens.length === 1 && !denteValido(tokens[0]))) {
      setErrors({ dente: 'Informe um único dente com código FDI válido (ex.: 36).' });
      return;
    }
    setSubmitting(true);
    setErrors({});
    setGlobalError(null);
    try {
      // Se o paciente é conveniado, não persistimos valor/pagamento
      const payload: Procedimento = {
        ...values,
        dente: unicoDente ?? '',
        faces: facesDoDente,
        pacienteId,
        ...(isConveniado
          ? {
              valor: 0,
              tipoPagamento: undefined,
              numeroParcelas: undefined,
              dataPrimeiroPagamento: undefined,
            }
          : values.tipoPagamento === 'PARCELADO'
            ? { numeroParcelas: values.numeroParcelas ?? 2 }
            : { numeroParcelas: undefined }),
      };
      await onSubmit(payload, marcouNoSeletor && unicoDente ? { dente: unicoDente, faces: facesDoDente, condicao: selecao.condicao } : undefined);
    } catch (err) {
      if (err instanceof ApiError) {
        const fe = err.fieldErrors();
        if (Object.keys(fe).length) setErrors(fe);
        else setGlobalError(err.friendlyMessage());
      } else {
        setGlobalError('Não foi possível salvar. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {globalError && (
        <div className="text-sm text-bokka-danger-ink bg-bokka-danger-soft border border-bokka-danger/20 rounded-md px-3 py-2">
          {globalError}
        </div>
      )}

      <section>
        <h3 className="text-sm font-semibold text-bokka-ink mb-3">Identificação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Procedimento"
            required
            value={values.nomeProcedimento ?? 'PROFILAXIA'}
            onChange={(e) => set('nomeProcedimento', e.target.value as NomeProcedimentoEnum)}
            options={nomeProcOptions}
            error={errors.nomeProcedimento}
            containerClassName="sm:col-span-2"
          />
          <Input
            label="Dente"
            value={values.dente ?? ''}
            onChange={(e) => set('dente', e.target.value)}
            placeholder="ex: 36"
            hint="Um dente, código FDI. Ou clique nele no arco abaixo."
            error={errors.dente}
          />
          <Select
            label="Região"
            value={values.regiao ?? ''}
            onChange={(e) => set('regiao', (e.target.value || undefined) as RegiaoEnum | undefined)}
            options={regiaoOptions}
            error={errors.regiao}
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold text-bokka-ink">Odontograma</h3>
            <p className="text-xs text-bokka-ink-3 mt-0.5">
              {values.odontogramaId
                ? `Vinculado ao odontograma${vinculado?.dataAvaliacao ? ` de ${formatDate(vinculado.dataAvaliacao)}` : ' da paciente'}.`
                : 'Sem vínculo com o odontograma. Nada é vinculado sem você escolher.'}
            </p>
          </div>
          {showOdontogramaLink && (
            <Link
              to={`/pacientes/${pacienteId}/odontograma`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-bokka-primary-text hover:text-bokka-primary-strong"
            >
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
              Abrir odontograma completo
            </Link>
          )}
        </div>
        <div className="bg-bokka-surface-2 border border-bokka-border rounded-xl p-4 flex items-start gap-4 flex-wrap">
          <SeletorDenteFace
            value={selecao}
            onChange={aoSelecionar}
            modo="unico"
            condicoes={condicoes}
            className="w-full"
          />
          <div className="flex-1 min-w-[180px] space-y-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-semibold bg-bokka-surface',
                values.odontogramaId
                  ? 'border-bokka-primary text-bokka-ink'
                  : 'border-bokka-field-edge text-bokka-ink-2',
              )}
            >
              <Link2 className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
              {values.odontogramaId ? 'Vinculado' : 'Sem vínculo'}
            </span>
            {marcouNoSeletor && unicoDente && (
              <p className="text-[11px] text-bokka-ink-2 leading-relaxed">
                {values.odontogramaId
                  ? `Ao salvar, o dente ${unicoDente} também será marcado no odontograma já vinculado.`
                  : odontogramasQ.isLoading
                    ? `Ao salvar, o dente ${unicoDente} também será marcado no odontograma.`
                    : recenteQ.data
                      ? `Ao salvar, o dente ${unicoDente} também será marcado no odontograma mais recente (${formatDate(recenteQ.data.dataAvaliacao)}).`
                      : `Ao salvar, será criado um odontograma mínimo e o dente ${unicoDente} será marcado nele.`}
              </p>
            )}
            {initial?.id && onMarcarNoOdontograma && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={<Grid3X3 className="w-3.5 h-3.5" />}
                onClick={onMarcarNoOdontograma}
              >
                {values.odontogramaId ? 'Alterar odontograma' : 'Marcar no odontograma'}
              </Button>
            )}
            {!values.odontogramaId && !initial?.id && !marcouNoSeletor && (
              <p className="text-[11px] text-bokka-ink-3 leading-relaxed">
                Salve o procedimento para marcá-lo no odontograma da paciente.
              </p>
            )}
            {!odontogramasQ.isLoading && (odontogramasQ.data?.length ?? 0) === 0 && (
              <p className="text-[11px] text-bokka-ink-3 leading-relaxed">
                A paciente ainda não tem odontograma; você poderá criar um ao marcar.
              </p>
            )}
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-bokka-ink mb-3">Detalhes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Status"
            required
            value={values.status ?? 'ORCADO'}
            onChange={(e) => set('status', e.target.value as StatusProcedimentoEnum)}
            options={statusOptions}
            error={errors.status}
          />
          <Input
            label="Data de realização"
            type="date"
            value={values.dataRealizacao ?? ''}
            onChange={(e) => set('dataRealizacao', e.target.value)}
            error={errors.dataRealizacao}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="N. de sessões"
              type="number"
              min="1"
              value={String(values.numeroDeSessoes ?? 1)}
              onChange={(e) => set('numeroDeSessoes', parseInt(e.target.value) || 1)}
              error={errors.numeroDeSessoes}
            />
            <Input
              label="Sessão atual"
              type="number"
              min="1"
              value={String(values.sessaoAtual ?? 1)}
              onChange={(e) => set('sessaoAtual', parseInt(e.target.value) || 1)}
              error={errors.sessaoAtual}
            />
          </div>
        </div>
      </section>

      {showPagamento && (
        <section>
          <h3 className="text-sm font-semibold text-bokka-ink mb-3">Pagamento</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CurrencyInput
              label="Valor"
              value={values.valor}
              onChange={(v) => set('valor', v ?? 0)}
              error={errors.valor}
            />
            <Select
              label="Tipo de pagamento"
              value={values.tipoPagamento ?? 'A_VISTA'}
              onChange={(e) =>
                set('tipoPagamento', e.target.value as TipoPagamentoProcedimentoEnum)
              }
              options={tipoPagamentoOptions}
              error={errors.tipoPagamento}
            />
            <Input
              label="Data do primeiro pagamento"
              type="date"
              value={values.dataPrimeiroPagamento ?? ''}
              onChange={(e) => set('dataPrimeiroPagamento', e.target.value)}
              hint={
                values.tipoPagamento === 'PARCELADO'
                  ? 'As parcelas subsequentes vencem 1 mês depois cada.'
                  : 'Data em que o pagamento vence.'
              }
              error={errors.dataPrimeiroPagamento}
              containerClassName={
                values.tipoPagamento === 'PARCELADO' ? '' : 'sm:col-span-2'
              }
            />
            {values.tipoPagamento === 'PARCELADO' && (
              <Select
                label="Número de parcelas"
                required
                value={String(values.numeroParcelas ?? 2)}
                onChange={(e) => set('numeroParcelas', parseInt(e.target.value, 10))}
                options={parcelaOptions}
                hint={
                  values.valor && values.numeroParcelas
                    ? `${values.numeroParcelas}x de ${formatCurrency(values.valor / values.numeroParcelas)}`
                    : 'Até 24 parcelas'
                }
                error={errors.numeroParcelas}
              />
            )}
          </div>
          {values.valor && values.valor > 0 && values.dataPrimeiroPagamento && (
            <p className="text-xs text-bokka-primary-text bg-bokka-primary-soft/50 border border-bokka-primary/15 rounded-md px-3 py-2 mt-3">
              Ao salvar, {values.tipoPagamento === 'PARCELADO' && (values.numeroParcelas ?? 0) > 1
                ? `${values.numeroParcelas} cobranças serão criadas`
                : '1 cobrança será criada'}{' '}
              na Auditoria Financeira, a partir de{' '}
              {new Date(`${values.dataPrimeiroPagamento}T00:00:00`).toLocaleDateString('pt-BR')}.
            </p>
          )}
        </section>
      )}

      {isConveniado && !pacienteQ.isLoading && (
        <div className="text-xs text-bokka-ink-3 bg-bokka-primary-soft/50 border border-bokka-primary/15 rounded-md px-3 py-2">
          Este paciente é conveniado — cobrança será feita via convênio, sem valor ou parcelamento aqui.
        </div>
      )}

      <section>
        <h3 className="text-sm font-semibold text-bokka-ink mb-3">Observações</h3>
        <div className="grid grid-cols-1 gap-4">
          <Textarea
            label="Descrição"
            value={values.descricao ?? ''}
            onChange={(e) => set('descricao', e.target.value)}
            rows={2}
            error={errors.descricao}
          />
          <Textarea
            label="Observações técnicas"
            value={values.observacoesTecnicas ?? ''}
            onChange={(e) => set('observacoesTecnicas', e.target.value)}
            rows={2}
            error={errors.observacoesTecnicas}
          />
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-2 border-t border-bokka-border -mx-6 px-6 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initial?.id ? 'Salvar alterações' : 'Cadastrar procedimento'}
        </Button>
      </div>
    </form>
  );
};
