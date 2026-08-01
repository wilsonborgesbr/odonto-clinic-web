import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Grid3X3, Plus, Save, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { bokkaToast } from '../../components/ui/Toast';
import { usePaciente } from '../../services/pacienteService';
import {
  useCriarOdontograma,
  useOdontogramasPorPaciente,
} from '../../services/odontogramaService';
import { ApiError } from '../../lib/api';
import { cn, formatDate, initials } from '../../lib/utils';
import type { CondicaoDenteEnum, DenteStatus, Odontograma } from '../../types';
import { Odontograma3D, condicaoColor, condicaoLabel } from './Odontograma3D';

// ============ Config FDI ============
// Notação FDI padrão internacional. Ordem visual como se olhássemos pra boca do paciente.
// Superior (topo): quadrante 1 (direita do paciente) + quadrante 2 (esquerda)
// Inferior (baixo): quadrante 4 (direita do paciente) + quadrante 3 (esquerda)
const SUPERIOR = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'];
const INFERIOR = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];

const TODAS_CONDICOES: CondicaoDenteEnum[] = [
  'SAUDAVEL',
  'CARIADO',
  'RESTAURADO',
  'AUSENTE',
  'IMPLANTE',
  'COROA',
  'FRATURADO',
  'EM_TRATAMENTO',
  'EXTRAIR',
];

export const OdontogramaPacientePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const pacienteQ = usePaciente(id);
  const historicoQ = useOdontogramasPorPaciente(id);
  const criarM = useCriarOdontograma();

  const [editing, setEditing] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [activeCondicao, setActiveCondicao] = useState<CondicaoDenteEnum>('CARIADO');
  const [dentes, setDentes] = useState<Map<string, DenteStatus>>(new Map());
  const [observacoes, setObservacoes] = useState('');

  const [viewing, setViewing] = useState<Odontograma | null>(null);

  // Popula editor com base no odontograma mais recente
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
      next.set(numero, {
        numeroDente: numero,
        condicao,
        observacao: anterior?.observacao,
      });
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

  const salvar = async () => {
    if (!id) return;
    if (dentes.size === 0) {
      bokkaToast.warning('Marque pelo menos um dente antes de salvar.');
      return;
    }
    try {
      await criarM.mutateAsync({
        pacienteId: id,
        dataAvaliacao: new Date().toISOString().slice(0, 10),
        dentes: Array.from(dentes.values()),
        observacoes: observacoes || undefined,
      } as Odontograma);
      bokkaToast.success('Odontograma salvo.');
      cancelarEdicao();
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao salvar odontograma',
      );
    }
  };

  const dentesArray = useMemo(() => Array.from(dentes.values()), [dentes]);
  const contagemPorCondicao = useMemo(() => {
    const m = new Map<CondicaoDenteEnum, number>();
    dentesArray.forEach((d) => {
      if (d.condicao) m.set(d.condicao, (m.get(d.condicao) ?? 0) + 1);
    });
    return m;
  }, [dentesArray]);

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
        <Link
          to={`/pacientes/${id}`}
          className="hover:text-bokka-primary font-medium"
        >
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
              {historicoQ.data?.length ?? 0} odontograma{(historicoQ.data?.length ?? 0) === 1 ? '' : 's'} registrado{(historicoQ.data?.length ?? 0) === 1 ? '' : 's'}
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
          {/* Painel de condição */}
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4">
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
                      <span style={{ color: active ? undefined : textInk }} className="text-bokka-ink text-left">
                        {condicaoLabel(c)}
                      </span>
                      <span className="ml-auto text-bokka-ink-3 tabular-nums font-normal">
                        {contagemPorCondicao.get(c) ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>
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
                  <>
                    <p className="text-sm font-semibold text-bokka-ink-2 mt-2">
                      {condicaoLabel(dentes.get(selectedTooth)!.condicao!)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removerCondicao(selectedTooth)}
                      className="mt-3 text-xs font-semibold text-bokka-danger-ink hover:text-bokka-danger inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remover marcação
                    </button>
                  </>
                )}
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
          <div className="xl:col-span-3 bg-bokka-surface border border-bokka-border rounded-2xl p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
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
            <div className="overflow-x-auto">
              <Odontograma3D
                superior={SUPERIOR}
                inferior={INFERIOR}
                marks={dentes}
                selected={selectedTooth}
                onSelect={(numero) => {
                  aplicarCondicao(numero, activeCondicao);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Histórico */}
      {!editing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 bg-bokka-surface border border-bokka-border rounded-2xl overflow-hidden">
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
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => setViewing(o)}
                        className={cn(
                          'w-full text-left p-4 hover:bg-bokka-surface-3 transition-colors',
                          isSelected && 'bg-bokka-primary-soft/50',
                        )}
                      >
                        <p className="text-sm font-semibold text-bokka-ink tabular-nums">
                          {formatDate(o.dataAvaliacao)}
                        </p>
                        <p className="text-xs text-bokka-ink-3 mt-0.5">
                          {o.dentes?.length ?? 0} dentes marcados
                        </p>
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

          <div className="lg:col-span-2 bg-bokka-surface border border-bokka-border rounded-2xl p-6">
            {viewing ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-bokka-ink">
                      Odontograma de {formatDate(viewing.dataAvaliacao)}
                    </h3>
                    <p className="text-xs text-bokka-ink-3 mt-0.5">
                      Registro imutável. Para atualizar, crie uma nova avaliação.
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
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
                    readOnly
                  />
                </div>
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
        </div>
      )}
    </div>
  );
};
