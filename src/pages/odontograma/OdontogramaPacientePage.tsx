import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Grid3X3,
  Plus,
  Save,
  RotateCcw,
  Trash2,
  Syringe,
  Link2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { bokkaToast } from '../../components/ui/Toast';
import { usePaciente } from '../../services/pacienteService';
import {
  useCriarOdontograma,
  useOdontogramasPorPaciente,
} from '../../services/odontogramaService';
import {
  useProcedimentosPorPaciente,
  useCriarProcedimento,
} from '../../services/procedimentoService';
import { ApiError } from '../../lib/api';
import { cn, formatDate, formatCurrency, initials } from '../../lib/utils';
import type {
  CondicaoDenteEnum,
  DenteStatus,
  FaceDenteEnum,
  Odontograma,
  Procedimento,
} from '../../types';
import { ProcedimentoFormInline } from '../pacientes/PacienteProcedimentos';
import { ProcedimentoQuickLaunch } from './ProcedimentoQuickLaunch';
import {
  Odontograma3D,
  condicaoColor,
  condicaoLabel,
  faceLabel,
  CONDICOES_COM_FACE,
} from './Odontograma3D';

// ============ Config FDI ============
const SUPERIOR = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'];
const INFERIOR = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];

const TODAS_CONDICOES: CondicaoDenteEnum[] = [
  'HIGIDO',
  'CARIE',
  'RESTAURACAO_SATISFATORIA',
  'RESTAURACAO_INSATISFATORIA',
  'AUSENTE',
  'ENDODONTIA',
  'PROTESE_FIXA',
  'PROTESE_REMOVIVEL',
  'IMPLANTE',
  'FRATURA',
  'DENTE_INCLUSO',
  'EXTRACAO_INDICADA',
  'SELANTE',
];

export const OdontogramaPacientePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const pacienteQ = usePaciente(id);
  const historicoQ = useOdontogramasPorPaciente(id);
  const procedimentosQ = useProcedimentosPorPaciente(id);
  const criarM = useCriarOdontograma();
  const criarProcM = useCriarProcedimento();

  const [editing, setEditing] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [activeCondicao, setActiveCondicao] = useState<CondicaoDenteEnum>('CARIE');
  const [dentes, setDentes] = useState<Map<string, DenteStatus>>(new Map());
  const [observacoes, setObservacoes] = useState('');
  const [viewing, setViewing] = useState<Odontograma | null>(null);

  // Modal de procedimento — um Dialog só, que troca de conteúdo (rápido/completo) em vez de
  // dois Modals independentes: montar dois Dialogs do Headless UI ao mesmo tempo (um fechando,
  // outro abrindo na mesma leva de estado) faz o primeiro nunca desmontar — trocar o conteúdo
  // do mesmo Dialog evita o problema de raiz em vez de tentar sequenciar com setTimeout.
  const [procMode, setProcMode] = useState<'quick' | 'full' | null>(null);
  const [procContext, setProcContext] = useState<{
    dente?: string;
    odontogramaId?: string;
    condicaoLabel?: string;
  } | null>(null);
  const [procInitial, setProcInitial] = useState<Procedimento | null>(null);

  const fecharProcModal = () => {
    setProcMode(null);
    setProcContext(null);
    setProcInitial(null);
  };

  const iniciarNovaAvaliacao = () => {
    const ultimo = historicoQ.data?.[0];
    const map = new Map<string, DenteStatus>();
    if (ultimo?.dentes) {
      ultimo.dentes.forEach((d) => {
        if (d.numeroDente) map.set(d.numeroDente, { ...d });
      });
    }
    setDentes(map);
    setObservacoes('');
    setSelectedTooth(null);
    setEditing(true);
    setViewing(null);
  };

  const cancelarEdicao = () => {
    setEditing(false);
    setDentes(new Map());
    setSelectedTooth(null);
    setObservacoes('');
  };

  const aplicarCondicao = (numero: string, condicao: CondicaoDenteEnum) => {
    setDentes((prev) => {
      const next = new Map(prev);
      const anterior = next.get(numero);
      const preservaFaces =
        anterior?.condicao === condicao && CONDICOES_COM_FACE.includes(condicao);
      next.set(numero, {
        numeroDente: numero,
        condicao,
        // SELANTE só faz sentido na face oclusal — não precisa pedir a face ao usuário
        // (ODONTOGRAMA-COLOR-SPEC seção 3.4). Continua ajustável no FacePicker se quiser.
        faces: preservaFaces ? anterior?.faces : condicao === 'SELANTE' ? ['OCLUSAL'] : undefined,
        observacao: anterior?.observacao,
      });
      return next;
    });
    setSelectedTooth(numero);
  };

  const toggleFace = (numero: string, face: FaceDenteEnum) => {
    setDentes((prev) => {
      const next = new Map(prev);
      const atual = next.get(numero);
      if (!atual || !atual.condicao || !CONDICOES_COM_FACE.includes(atual.condicao)) {
        const cond = CONDICOES_COM_FACE.includes(activeCondicao)
          ? activeCondicao
          : ('CARIE' as CondicaoDenteEnum);
        next.set(numero, {
          numeroDente: numero,
          condicao: cond,
          faces: [face],
          observacao: atual?.observacao,
        });
      } else {
        const faces = atual.faces ?? [];
        const jaMarcada = faces.includes(face);
        const novasFaces = jaMarcada
          ? faces.filter((f) => f !== face)
          : [...faces, face];
        next.set(numero, {
          ...atual,
          faces: novasFaces.length > 0 ? novasFaces : undefined,
        });
      }
      return next;
    });
    setSelectedTooth(numero);
  };

  const removerCondicao = (numero: string) => {
    setDentes((prev) => {
      const next = new Map(prev);
      next.delete(numero);
      return next;
    });
  };

  const limparTudo = () => {
    setDentes(new Map());
    setSelectedTooth(null);
  };

  // Reutilizável: cria o documento de odontograma a partir do estado de edição em andamento.
  // Devolve o odontograma salvo, ou undefined se não salvou (vazio ou erro — toast já disparado).
  const salvarAvaliacao = async (): Promise<Odontograma | undefined> => {
    if (!id) return undefined;
    if (dentes.size === 0) {
      bokkaToast.warning('Marque pelo menos um dente antes de salvar.');
      return undefined;
    }
    try {
      return await criarM.mutateAsync({
        pacienteId: id,
        dataAvaliacao: new Date().toISOString().slice(0, 10),
        dentes: Array.from(dentes.values()),
        observacoes: observacoes || undefined,
      } as Odontograma);
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao salvar odontograma',
      );
      return undefined;
    }
  };

  const salvar = async () => {
    const salvo = await salvarAvaliacao();
    if (!salvo) return;
    bokkaToast.success('Odontograma salvo. Agora você pode vincular procedimentos.');
    setEditing(false);
    setDentes(new Map());
    setSelectedTooth(null);
    setObservacoes('');
    setViewing(salvo);
  };

  const abrirLancamentoRapido = (context: { dente?: string; odontogramaId?: string; condicao?: CondicaoDenteEnum }) => {
    setProcContext({
      dente: context.dente,
      odontogramaId: context.odontogramaId,
      condicaoLabel: context.condicao ? condicaoLabel(context.condicao) : undefined,
    });
    setProcMode('quick');
  };

  // Entrada 1 (edição): salva a avaliação inteira em andamento automaticamente — 1 clique só,
  // sem exigir "Salvar" antes (confirmado com o Wilson) — mantém o dente selecionado e abre
  // o formulário rápido pré-preenchido.
  const lancarProcedimentoNoDenteAtual = async () => {
    if (!selectedTooth) return;
    const condicaoAtual = dentes.get(selectedTooth)?.condicao;
    const salvo = await salvarAvaliacao();
    if (!salvo) return;
    bokkaToast.success('Odontograma salvo. Agora você pode lançar o procedimento.');
    const dente = selectedTooth;
    setEditing(false);
    setDentes(new Map());
    setObservacoes('');
    setViewing(salvo);
    abrirLancamentoRapido({ dente, odontogramaId: salvo.id, condicao: condicaoAtual });
  };

  // Entradas 2 e 3 (visualização): seringa no header do canvas e "Novo" no card Procedimentos.
  const criarProcedimentoNoDente = () => {
    if (!id) return;
    const contexto = viewing ?? historicoQ.data?.[0];
    const condicaoAtual = selectedTooth
      ? contexto?.dentes?.find((d) => d.numeroDente === selectedTooth)?.condicao
      : undefined;
    abrirLancamentoRapido({
      dente: selectedTooth ?? undefined,
      odontogramaId: contexto?.id,
      condicao: condicaoAtual,
    });
  };

  // Escape hatch do lançamento rápido: abre o formulário completo pré-preenchido com o que
  // já foi digitado, sem redigitar nada — pra quem precisa de parcelamento/pagamento detalhado.
  // Troca o conteúdo do MESMO Dialog (não abre um segundo) — ver comentário em procMode acima.
  const abrirFormularioCompleto = (draft: Procedimento) => {
    setProcInitial(draft);
    setProcMode('full');
  };

  const dentesArray = useMemo(() => Array.from(dentes.values()), [dentes]);
  const contagemPorCondicao = useMemo(() => {
    const m = new Map<CondicaoDenteEnum, number>();
    dentesArray.forEach((d) => {
      if (d.condicao) m.set(d.condicao, (m.get(d.condicao) ?? 0) + 1);
    });
    return m;
  }, [dentesArray]);

  // Procedimentos vinculados ao odontograma sendo visualizado
  const procedimentosVinculados = useMemo(() => {
    if (!viewing?.id) return [] as Procedimento[];
    return (procedimentosQ.data ?? []).filter(
      (p) => p.odontogramaId === viewing.id,
    );
  }, [procedimentosQ.data, viewing?.id]);

  // Dentes marcados no odontograma sendo visualizado (ordenados)
  const dentesDoViewing = useMemo(() => {
    if (!viewing?.dentes) return [] as DenteStatus[];
    return [...viewing.dentes]
      .filter((d) => d.numeroDente)
      .sort((a, b) => (a.numeroDente ?? '').localeCompare(b.numeroDente ?? ''));
  }, [viewing?.dentes]);

  if (pacienteQ.isLoading) {
    return <Skeleton className="h-96 w-full" rounded="xl" />;
  }
  if (!pacienteQ.data) {
    return (
      <div className="bg-bokka-surface border border-bokka-border rounded-xl">
        <EmptyState
          icon={<Grid3X3 className="w-6 h-6" strokeWidth={1.75} />}
          title="Paciente não encontrada"
          action={
            <Button variant="secondary" onClick={() => navigate('/pacientes')} icon={<ArrowLeft />}>
              Voltar
            </Button>
          }
        />
      </div>
    );
  }

  const paciente = pacienteQ.data;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-bokka-ink-3 flex-wrap">
        <Link to="/pacientes" className="hover:text-bokka-primary inline-flex items-center gap-1 font-medium">
          <ArrowLeft className="w-4 h-4" /> Pacientes
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/pacientes" className="hover:text-bokka-primary font-medium">
          {paciente.nomeCompleto}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-bokka-ink font-semibold">Odontograma</span>
      </div>

      {/* Header do paciente */}
      <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-bokka-primary-soft text-bokka-primary flex items-center justify-center text-sm font-bold shrink-0">
            {initials(paciente.nomeCompleto)}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-bokka-ink truncate">
              {paciente.nomeCompleto}
            </h1>
            <p className="text-sm text-bokka-ink-3">
              {historicoQ.data?.length ?? 0} odontograma
              {(historicoQ.data?.length ?? 0) === 1 ? '' : 's'} registrado
              {(historicoQ.data?.length ?? 0) === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        {!editing && (
          <Button onClick={iniciarNovaAvaliacao} icon={<Plus />}>
            Nova avaliação
          </Button>
        )}
      </div>

      {/* Editor */}
      {editing && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Painel de condição — abaixo de xl vem DEPOIS do canvas (order-2) e fica sticky no
              rodapé, já que é usado a cada toque num dente; volta pra coluna esquerda em xl+ */}
          <div className="order-2 xl:order-1 xl:col-span-1 space-y-4">
            <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4 max-lg:sticky max-lg:bottom-20 max-lg:z-20 max-lg:shadow-lg">
              <h3 className="text-sm font-semibold text-bokka-ink mb-3">
                Selecione a condição
              </h3>
              <p className="text-xs text-bokka-ink-3 mb-3">
                Clique no dente para aplicar. Selecionado atualmente:
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {TODAS_CONDICOES.map((c) => {
                  const { fill, textInk } = condicaoColor(c);
                  const active = activeCondicao === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setActiveCondicao(c)}
                      className={cn(
                        'flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all border',
                        active
                          ? 'border-bokka-ink bg-bokka-surface-3 ring-2 ring-bokka-primary/40'
                          : 'border-transparent hover:bg-bokka-surface-3',
                      )}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-bokka-border shrink-0"
                        style={{ background: fill }}
                      />
                      <span
                        style={{ color: active ? undefined : textInk }}
                        className="text-bokka-ink text-left"
                      >
                        {condicaoLabel(c)}
                      </span>
                      <span className="ml-auto text-bokka-ink-3 tabular-nums font-normal">
                        {contagemPorCondicao.get(c) ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Ações do dente — vivem DENTRO do card sticky (não no card "Dente selecionado"
                  abaixo), porque sticky não reserva espaço de layout: como esse card é alto (13
                  condições) e fica por cima em z-20, ele cobria os botões quando estavam no card
                  seguinte. Aqui dentro, os botões fazem parte do que cobre — nunca ficam cobertos. */}
              {selectedTooth && (
                <div className="mt-3 pt-3 border-t border-bokka-border">
                  {dentes.get(selectedTooth) && (
                    <button
                      type="button"
                      onClick={() => removerCondicao(selectedTooth)}
                      className="text-xs font-semibold text-bokka-danger-ink hover:text-bokka-danger inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remover marcação
                    </button>
                  )}
                  <Button
                    size="sm"
                    fullWidth
                    className="mt-2"
                    icon={<Syringe className="w-3.5 h-3.5" strokeWidth={1.75} />}
                    onClick={lancarProcedimentoNoDenteAtual}
                    loading={criarM.isPending}
                  >
                    Lançar procedimento
                  </Button>
                </div>
              )}
            </div>

            {selectedTooth && (
              <div className="bg-bokka-primary-soft border border-bokka-primary/20 rounded-2xl p-4">
                <p className="text-xs uppercase font-semibold text-bokka-primary tracking-wider">
                  Dente selecionado
                </p>
                <p className="text-3xl font-bold text-bokka-ink mt-1 tabular-nums">
                  {selectedTooth}
                </p>
                {dentes.get(selectedTooth) && (
                  <p className="text-sm font-semibold text-bokka-ink-2 mt-2">
                    {condicaoLabel(dentes.get(selectedTooth)!.condicao!)}
                  </p>
                )}
              </div>
            )}

            {CONDICOES_COM_FACE.includes(activeCondicao) && (
              <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4">
                <p className="text-xs uppercase font-semibold text-bokka-ink-3 tracking-wider">
                  Faces do dente
                </p>
                <p className="text-xs text-bokka-ink-3 mt-1 mb-3">
                  {selectedTooth
                    ? 'Clique na grade abaixo do dente ou nos botões:'
                    : 'Selecione um dente primeiro pra marcar faces.'}
                </p>
                <FacePicker
                  disabled={!selectedTooth}
                  numeroDente={selectedTooth ?? undefined}
                  facesAtuais={
                    selectedTooth ? dentes.get(selectedTooth)?.faces ?? [] : []
                  }
                  onToggle={(face) => selectedTooth && toggleFace(selectedTooth, face)}
                />
              </div>
            )}

            <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4">
              <label className="block text-sm font-semibold text-bokka-ink mb-2">
                Observações gerais
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={4}
                placeholder="Anotações sobre a avaliação..."
                className="w-full bg-bokka-surface-2 border border-bokka-border-strong rounded-md p-3 text-sm resize-y outline-none focus:border-bokka-primary-ring"
              />
            </div>
          </div>

          {/* Canvas do odontograma */}
          <div className="order-1 xl:order-2 xl:col-span-3 bg-bokka-surface border border-bokka-border rounded-2xl p-4 lg:p-6">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <h3 className="text-sm font-semibold text-bokka-ink">
                Odontograma — {dentes.size} dentes marcados
              </h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={limparTudo} icon={<RotateCcw />}>
                  Limpar
                </Button>
                <Button variant="secondary" size="sm" onClick={cancelarEdicao}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={salvar} loading={criarM.isPending} icon={<Save />}>
                  Salvar
                </Button>
              </div>
            </div>
            <Odontograma3D
              superior={SUPERIOR}
              inferior={INFERIOR}
              marks={dentes}
              selected={selectedTooth}
              onSelect={(numero) => aplicarCondicao(numero, activeCondicao)}
              onSelectFace={(numero, face) => toggleFace(numero, face)}
            />
          </div>
        </div>
      )}

      {/* Histórico + resumo + procedimentos vinculados */}
      {!editing && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Histórico (esquerda) */}
          <div className="xl:col-span-1 bg-bokka-surface border border-bokka-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-bokka-border">
              <h3 className="text-base font-semibold text-bokka-ink">Histórico</h3>
              <p className="text-xs text-bokka-ink-3 mt-0.5">Registros imutáveis</p>
            </div>
            {historicoQ.isLoading ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-14 w-full" rounded="lg" />
                <Skeleton className="h-14 w-full" rounded="lg" />
              </div>
            ) : !historicoQ.data?.length ? (
              <EmptyState
                compact
                icon={<Grid3X3 className="w-5 h-5" strokeWidth={1.75} />}
                title="Nenhum odontograma"
                description="Comece uma nova avaliação para registrar."
              />
            ) : (
              <ul className="divide-y divide-bokka-border">
                {historicoQ.data.map((o) => {
                  const isSelected = viewing?.id === o.id;
                  const vinculados = (procedimentosQ.data ?? []).filter(
                    (p) => p.odontogramaId === o.id,
                  ).length;
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setViewing(o);
                          setSelectedTooth(null);
                        }}
                        className={cn(
                          'w-full text-left p-4 hover:bg-bokka-surface-3 transition-colors',
                          isSelected && 'bg-bokka-primary-soft/50',
                        )}
                      >
                        <p className="text-sm font-semibold text-bokka-ink tabular-nums">
                          {formatDate(o.dataAvaliacao)}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-bokka-ink-3">
                            {o.dentes?.length ?? 0} dentes
                          </span>
                          {vinculados > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-bokka-primary font-semibold">
                              <Link2 className="w-3 h-3" strokeWidth={2} />
                              {vinculados} proc.
                            </span>
                          )}
                        </div>
                        {o.observacoes && (
                          <p className="text-xs text-bokka-ink-2 mt-1 line-clamp-2">
                            {o.observacoes}
                          </p>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Canvas (centro) */}
          <div className="xl:col-span-2 bg-bokka-surface border border-bokka-border rounded-2xl p-6">
            {viewing ? (
              <>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-bokka-ink">
                      Odontograma de {formatDate(viewing.dataAvaliacao)}
                    </h3>
                    <p className="text-xs text-bokka-ink-3 mt-0.5">
                      Clique num dente para vincular um procedimento.
                    </p>
                  </div>
                  {selectedTooth && (
                    <Button
                      size="sm"
                      icon={<Syringe className="w-3.5 h-3.5" strokeWidth={1.75} />}
                      onClick={criarProcedimentoNoDente}
                    >
                      Criar procedimento no dente {selectedTooth}
                    </Button>
                  )}
                </div>
                <Odontograma3D
                  superior={SUPERIOR}
                  inferior={INFERIOR}
                  marks={
                    new Map(
                      (viewing.dentes ?? [])
                        .filter((d) => d.numeroDente)
                        .map((d) => [d.numeroDente!, d]),
                    )
                  }
                  selected={selectedTooth}
                  onSelect={(numero) => setSelectedTooth(numero)}
                  readOnly={false}
                />

                {viewing.observacoes && (
                  <div className="mt-4 pt-4 border-t border-bokka-border">
                    <p className="text-xs uppercase font-semibold text-bokka-ink-3 tracking-wider">
                      Observações
                    </p>
                    <p className="text-sm text-bokka-ink-2 mt-1 leading-relaxed whitespace-pre-wrap">
                      {viewing.observacoes}
                    </p>
                  </div>
                )}
              </>
            ) : historicoQ.data?.length ? (
              <EmptyState
                compact
                icon={<Grid3X3 className="w-6 h-6" strokeWidth={1.75} />}
                title="Selecione um registro"
                description="Escolha um odontograma do histórico ao lado para visualizar."
              />
            ) : (
              <EmptyState
                icon={<Grid3X3 className="w-6 h-6" strokeWidth={1.75} />}
                title="Nenhum odontograma ainda"
                description="Registre a primeira avaliação clínica desta paciente."
                action={
                  <Button onClick={iniciarNovaAvaliacao} icon={<Plus />}>
                    Nova avaliação
                  </Button>
                }
              />
            )}
          </div>

          {/* Condições + procedimentos vinculados (direita) */}
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-bokka-surface border border-bokka-border rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-bokka-border">
                <h3 className="text-sm font-semibold text-bokka-ink">Condições</h3>
                <p className="text-xs text-bokka-ink-3 mt-0.5">
                  {viewing ? `${dentesDoViewing.length} dentes marcados` : 'Selecione um registro'}
                </p>
              </div>
              {viewing ? (
                dentesDoViewing.length === 0 ? (
                  <p className="p-4 text-xs text-bokka-ink-3">Sem marcações.</p>
                ) : (
                  <ul className="divide-y divide-bokka-border max-h-80 overflow-y-auto">
                    {dentesDoViewing.map((d) => {
                      const { fill } = condicaoColor(d.condicao);
                      const isSel = selectedTooth === d.numeroDente;
                      return (
                        <li key={d.numeroDente}>
                          <button
                            type="button"
                            onClick={() => setSelectedTooth(d.numeroDente ?? null)}
                            className={cn(
                              'w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-bokka-surface-3 transition-colors',
                              isSel && 'bg-bokka-primary-soft/60',
                            )}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-bokka-border shrink-0"
                              style={{ background: fill }}
                            />
                            <span className="text-sm font-bold text-bokka-ink tabular-nums w-8">
                              {d.numeroDente}
                            </span>
                            <span className="text-xs text-bokka-ink-2 truncate">
                              {d.condicao ? condicaoLabel(d.condicao) : '—'}
                            </span>
                            {d.faces && d.faces.length > 0 && (
                              <span className="text-[10px] text-bokka-ink-3 ml-auto">
                                {d.faces.map((f) => faceLabel(f)[0]).join('·')}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )
              ) : (
                <p className="p-4 text-xs text-bokka-ink-3">
                  Escolha um odontograma para ver suas condições.
                </p>
              )}
            </div>

            <div className="bg-bokka-surface border border-bokka-border rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-bokka-border flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-bokka-ink">Procedimentos</h3>
                  <p className="text-xs text-bokka-ink-3 mt-0.5">
                    {viewing
                      ? `${procedimentosVinculados.length} vinculados`
                      : 'Selecione um registro'}
                  </p>
                </div>
                {viewing && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={criarProcedimentoNoDente}
                  >
                    Novo
                  </Button>
                )}
              </div>
              {viewing ? (
                procedimentosVinculados.length === 0 ? (
                  <div className="p-4">
                    <p className="text-xs text-bokka-ink-3 leading-relaxed">
                      Ainda sem procedimentos vinculados. Selecione um dente e clique em{' '}
                      <b>Criar procedimento</b>.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-bokka-border max-h-80 overflow-y-auto">
                    {procedimentosVinculados.map((p) => (
                      <li key={p.id} className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Syringe
                            className="w-3.5 h-3.5 text-bokka-primary shrink-0"
                            strokeWidth={1.75}
                          />
                          <p className="text-sm font-semibold text-bokka-ink truncate">
                            {p.nomeProcedimento?.replace(/_/g, ' ').toLowerCase()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {p.dente && (
                            <Badge tone="info">Dente {p.dente}</Badge>
                          )}
                          {p.status && (
                            <span className="text-[11px] text-bokka-ink-3">
                              {p.status.replace(/_/g, ' ').toLowerCase()}
                            </span>
                          )}
                          {p.valor != null && p.valor > 0 && (
                            <span className="text-[11px] text-bokka-ink-2 ml-auto tabular-nums">
                              {formatCurrency(p.valor)}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                <p className="p-4 text-xs text-bokka-ink-3">
                  Escolha um odontograma para ver procedimentos ligados a ele.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de procedimento — um Dialog só, alterna entre lançamento rápido e formulário
          completo (escape hatch) trocando o conteúdo, nunca dois Dialogs montados ao mesmo tempo */}
      <Modal
        open={procMode !== null}
        onClose={fecharProcModal}
        title={
          procMode === 'quick'
            ? `Lançar procedimento${procContext?.dente ? ` · dente ${procContext.dente}` : ''}`
            : `Novo procedimento${procInitial?.dente ? ` · dente ${procInitial.dente}` : ''}`
        }
        subtitle={
          procMode === 'quick'
            ? 'Vinculado ao odontograma selecionado.'
            : 'Este procedimento ficará vinculado ao odontograma selecionado.'
        }
        size={procMode === 'quick' ? 'md' : 'xl'}
      >
        {id && procMode === 'quick' && (
          <ProcedimentoQuickLaunch
            pacienteId={id}
            dente={procContext?.dente}
            odontogramaId={procContext?.odontogramaId}
            condicaoLabel={procContext?.condicaoLabel}
            onCancel={fecharProcModal}
            onSubmit={async (values) => {
              await criarProcM.mutateAsync(values);
              bokkaToast.success('Procedimento lançado.');
              fecharProcModal();
            }}
            onEditarCompleto={abrirFormularioCompleto}
          />
        )}
        {id && procMode === 'full' && (
          <ProcedimentoFormInline
            initial={procInitial}
            pacienteId={id}
            showOdontogramaLink={false}
            onCancel={fecharProcModal}
            onSubmit={async (values) => {
              await criarProcM.mutateAsync(values);
              bokkaToast.success('Procedimento vinculado ao odontograma.');
              fecharProcModal();
            }}
          />
        )}
      </Modal>
    </div>
  );
};

// ============ Face picker ============

const FACES_ANTERIOR: FaceDenteEnum[] = ['MESIAL', 'DISTAL', 'INCISAL', 'VESTIBULAR', 'PALATINA', 'LINGUAL', 'CERVICAL'];
const FACES_POSTERIOR: FaceDenteEnum[] = ['MESIAL', 'DISTAL', 'OCLUSAL', 'VESTIBULAR', 'PALATINA', 'LINGUAL', 'CERVICAL'];

const isAnterior = (numero?: string) => {
  if (!numero) return false;
  const pos = parseInt(numero[1], 10);
  return pos === 1 || pos === 2 || pos === 3;
};
const isSuperior = (numero?: string) => {
  if (!numero) return false;
  const q = parseInt(numero[0], 10);
  return q === 1 || q === 2;
};

interface FacePickerProps {
  disabled: boolean;
  numeroDente?: string;
  facesAtuais: FaceDenteEnum[];
  onToggle: (face: FaceDenteEnum) => void;
}

const FacePicker = ({ disabled, numeroDente, facesAtuais, onToggle }: FacePickerProps) => {
  const anterior = isAnterior(numeroDente);
  const superior = isSuperior(numeroDente);
  const todas = anterior ? FACES_ANTERIOR : FACES_POSTERIOR;

  const faces = todas.filter((f) => {
    if (f === 'PALATINA') return superior;
    if (f === 'LINGUAL') return !superior;
    return true;
  });

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {faces.map((f) => {
        const marcada = facesAtuais.includes(f);
        return (
          <button
            key={f}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(f)}
            className={cn(
              'px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors',
              disabled && 'opacity-40 cursor-not-allowed',
              marcada
                ? 'bg-bokka-primary text-white border-bokka-primary'
                : 'bg-bokka-surface-2 text-bokka-ink-2 border-bokka-border hover:bg-bokka-surface-3',
            )}
          >
            {faceLabel(f)}
          </button>
        );
      })}
    </div>
  );
};
