import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Syringe,
  Grid3X3,
  Link2,
  ExternalLink,
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
import { useOdontogramaRecente } from '../../services/odontogramaService';
import { ApiError } from '../../lib/api';
import { formatDate, formatCurrency, cn } from '../../lib/utils';
import type {
  Procedimento,
  NomeProcedimentoEnum,
  StatusProcedimentoEnum,
  RegiaoEnum,
  TipoPagamentoProcedimentoEnum,
} from '../../types';

const parcelaOptions = Array.from({ length: 23 }, (_, i) => ({
  value: String(i + 2),
  label: `${i + 2}x`,
}));

const tipoPagamentoOptions: { value: TipoPagamentoProcedimentoEnum; label: string }[] = [
  { value: 'A_VISTA', label: 'À vista' },
  { value: 'PARCELADO', label: 'Parcelado' },
];

const nomeProcLabel: Record<NomeProcedimentoEnum, string> = {
  RESTAURACAO_RESINA: 'Restauração em Resina',
  RESTAURACAO_AMALGAMA: 'Restauração em Amálgama',
  INLAY: 'Inlay',
  ONLAY: 'Onlay',
  FACETA_PORCELANA: 'Faceta de Porcelana',
  FACETA_RESINA: 'Faceta de Resina',
  TRATAMENTO_CANAL_UNIRRADICULAR: 'Tratamento de Canal (Uni)',
  TRATAMENTO_CANAL_BIRRADICULAR: 'Tratamento de Canal (Bi)',
  TRATAMENTO_CANAL_MULTIRRADICULAR: 'Tratamento de Canal (Multi)',
  RETRATAMENTO_CANAL: 'Retratamento de Canal',
  PROFILAXIA: 'Profilaxia',
  RASPAGEM_SUPRAGENGIVAL: 'Raspagem Supragengival',
  RASPAGEM_SUBGENGIVAL: 'Raspagem Subgengival',
  GENGIVECTOMIA: 'Gengivectomia',
  ENXERTO_GENGIVAL: 'Enxerto Gengival',
  EXTRACAO_SIMPLES: 'Extração Simples',
  EXTRACAO_DENTE_SISO: 'Extração de Siso',
  CIRURGIA_PERIODONTAL: 'Cirurgia Periodontal',
  FRENECTOMIA: 'Frenectomia',
  BIOPSIA: 'Biópsia',
  INSTALACAO_IMPLANTE: 'Instalação de Implante',
  INSTALACAO_PROTESE_SOBRE_IMPLANTE: 'Prótese sobre Implante',
  ENXERTO_OSSEO: 'Enxerto Ósseo',
  PROTESE_PARCIAL_REMOVIVEL: 'Prótese Parcial Removível',
  PROTESE_TOTAL: 'Prótese Total',
  COROA_PORCELANA: 'Coroa de Porcelana',
  COROA_METALICA: 'Coroa Metálica',
  PONTE_FIXA: 'Ponte Fixa',
  APARELHO_METALICO: 'Aparelho Metálico',
  APARELHO_ESTETICO: 'Aparelho Estético',
  APARELHO_INVISIVEL: 'Aparelho Invisível',
  MANUTENCAO_ORTODONTICA: 'Manutenção Ortodôntica',
  CONTENCAO: 'Contenção',
  SELANTE: 'Selante',
  FLUORTERAPIA: 'Fluorterapia',
  COROA_PEDIATRICA: 'Coroa Pediátrica',
  PULPOTOMIA: 'Pulpotomia',
  CLAREAMENTO_CASEIRO: 'Clareamento Caseiro',
  CLAREAMENTO_CONSULTORIO: 'Clareamento em Consultório',
  MICROABRASAO: 'Microabrasão',
  RADIOGRAFIA_PERIAPICAL: 'Radiografia Periapical',
  RADIOGRAFIA_PANORAMICA: 'Radiografia Panorâmica',
  TOMOGRAFIA: 'Tomografia',
};

const statusLabel: Record<StatusProcedimentoEnum, string> = {
  ORCADO: 'Orçado',
  AGENDADO: 'Agendado',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

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

const nomeProcOptions = (Object.entries(nomeProcLabel) as [NomeProcedimentoEnum, string][]).map(
  ([value, label]) => ({ value, label }),
);

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
  const [confirmar, setConfirmar] = useState<{ id: string; nome: string } | null>(null);

  const procedimentosQ = useProcedimentosPorPaciente(pacienteId);
  const criarM = useCriarProcedimento();
  const atualizarM = useAtualizarProcedimento();
  const excluirM = useExcluirProcedimento();

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

  const handleSubmit = async (values: Procedimento) => {
    if (formInitial?.id) {
      await atualizarM.mutateAsync({ id: formInitial.id, procedimento: values });
      bokkaToast.success('Procedimento atualizado.');
    } else {
      await criarM.mutateAsync(values);
      bokkaToast.success('Procedimento cadastrado.');
    }
    setFormOpen(false);
    setFormInitial(null);
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
                            setFormOpen(true);
                          }}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-primary-soft hover:text-bokka-primary transition-colors"
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
        onClose={() => {
          setFormOpen(false);
          setFormInitial(null);
        }}
        title={formInitial?.id ? 'Editar procedimento' : 'Novo procedimento'}
        subtitle={
          formInitial?.id
            ? 'Atualize os dados do procedimento.'
            : 'Preencha os dados para registrar um procedimento.'
        }
        size="xl"
      >
        <ProcedimentoFormInline
          initial={formInitial}
          pacienteId={pacienteId}
          onCancel={() => {
            setFormOpen(false);
            setFormInitial(null);
          }}
          onSubmit={handleSubmit}
        />
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
  onSubmit: (values: Procedimento) => Promise<void>;
  onCancel: () => void;
}

export const ProcedimentoFormInline = ({ initial, pacienteId, onSubmit, onCancel }: ProcFormProps) => {
  const [values, setValues] = useState<Procedimento>(
    () => initial ?? { ...emptyProcedimento, pacienteId },
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const pacienteQ = usePaciente(pacienteId);
  const odontogramaRecenteQ = useOdontogramaRecente(pacienteId);
  // Regra: paciente conveniado paga via convênio — não expomos valor
  // nem opção de parcelamento na ficha do procedimento.
  const isConveniado = pacienteQ.data?.tipoPaciente === 'CONVENIO';
  const showPagamento = !isConveniado;

  const set = <K extends keyof Procedimento>(k: K, v: Procedimento[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  // Vincula automaticamente ao odontograma mais recente da paciente (uma vez, se ainda não houver).
  useEffect(() => {
    if (!values.odontogramaId && odontogramaRecenteQ.data?.id) {
      setValues((prev) => ({ ...prev, odontogramaId: odontogramaRecenteQ.data!.id }));
    }
  }, [odontogramaRecenteQ.data?.id, values.odontogramaId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGlobalError(null);
    try {
      // Se o paciente é conveniado, não persistimos valor/pagamento
      const payload: Procedimento = {
        ...values,
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
      await onSubmit(payload);
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
            placeholder="ex: 18, 36"
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
                ? 'Este procedimento será vinculado ao odontograma da paciente.'
                : 'Nenhum odontograma cadastrado ainda para vincular.'}
            </p>
          </div>
          <Link
            to={`/pacientes/${pacienteId}/odontograma`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-bokka-primary hover:text-bokka-primary-strong"
          >
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
            Abrir odontograma completo
          </Link>
        </div>
        <div className="bg-bokka-surface-2 border border-bokka-border rounded-xl p-4 flex items-center gap-4 flex-wrap">
          <ArchMini highlightDente={values.dente ?? ''} />
          <div className="flex-1 min-w-[180px] space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold',
                  values.odontogramaId
                    ? 'bg-bokka-primary-soft text-bokka-primary'
                    : 'bg-bokka-surface-3 text-bokka-ink-3',
                )}
              >
                <Link2 className="w-3 h-3" strokeWidth={2} />
                {values.odontogramaId ? 'Vinculado' : 'Sem vínculo'}
              </span>
              {odontogramaRecenteQ.data?.dataAvaliacao && values.odontogramaId && (
                <span className="text-[11px] text-bokka-ink-3 tabular-nums">
                  {formatDate(odontogramaRecenteQ.data.dataAvaliacao)}
                </span>
              )}
            </div>
            {values.dente ? (
              <p className="text-xs text-bokka-ink-2 leading-relaxed">
                Realce no dente <b className="text-bokka-ink tabular-nums">{values.dente}</b>{' '}
                acima. Ajuste no campo "Dente" para trocar.
              </p>
            ) : (
              <p className="text-xs text-bokka-ink-3 leading-relaxed">
                Informe o número do dente (ex.: 36) no campo acima para destacá-lo no arco.
              </p>
            )}
            {!odontogramaRecenteQ.isLoading && !odontogramaRecenteQ.data && (
              <p className="text-[11px] text-bokka-ink-3 leading-relaxed">
                Dica: registre um odontograma primeiro para vincular procedimentos por dente.
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
            <p className="text-xs text-bokka-primary bg-bokka-primary-soft/50 border border-bokka-primary/15 rounded-md px-3 py-2 mt-3">
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

// ============ Mini-arco odontológico para o form ============
// SVG compacto mostrando as 32 posições FDI; realça o dente atual quando marcado.

const MINI_SUPERIOR = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'];
const MINI_INFERIOR = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];

interface ArchMiniProps {
  highlightDente: string;
}

const ArchMini = ({ highlightDente }: ArchMiniProps) => {
  const highlight = highlightDente.trim();
  return (
    <div
      className="shrink-0 bg-bokka-surface border border-bokka-border rounded-lg p-2.5"
      role="img"
      aria-label={
        highlight
          ? `Mini odontograma destacando o dente ${highlight}`
          : 'Mini odontograma'
      }
    >
      <svg viewBox="0 0 280 96" width={220} height={76} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mini-tooth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBF7EE" />
            <stop offset="100%" stopColor="#E6DCC1" />
          </linearGradient>
          <linearGradient id="mini-tooth-active" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-bokka-primary, #C97A5E)" />
            <stop offset="100%" stopColor="#8F4E36" />
          </linearGradient>
        </defs>
        <ArchRow y={12} teeth={MINI_SUPERIOR} highlight={highlight} />
        <ArchRow y={62} teeth={MINI_INFERIOR} highlight={highlight} />
        <line
          x1="12"
          x2="268"
          y1="48"
          y2="48"
          stroke="var(--color-bokka-border, #E5D9C0)"
          strokeDasharray="2 3"
          strokeWidth="0.75"
        />
      </svg>
      {highlight && (
        <div className="flex items-center justify-center mt-1 gap-1 text-[10px] font-semibold text-bokka-primary">
          <Grid3X3 className="w-3 h-3" strokeWidth={2} />
          Dente {highlight}
        </div>
      )}
    </div>
  );
};

const ArchRow = ({
  teeth,
  y,
  highlight,
}: {
  teeth: string[];
  y: number;
  highlight: string;
}) => (
  <g>
    {teeth.map((numero, i) => {
      const x = 14 + i * 16.4;
      const isActive = numero === highlight;
      return (
        <g key={numero} transform={`translate(${x}, ${y})`}>
          <rect
            width="12"
            height="22"
            rx="3"
            ry="3"
            fill={isActive ? 'url(#mini-tooth-active)' : 'url(#mini-tooth)'}
            stroke={
              isActive ? 'var(--color-bokka-primary-strong, #8F4E36)' : '#B9A97F'
            }
            strokeWidth={isActive ? 1 : 0.5}
          />
          {isActive && (
            <circle cx="6" cy="-4" r="2.4" fill="var(--color-bokka-primary, #C97A5E)" />
          )}
        </g>
      );
    })}
  </g>
);
