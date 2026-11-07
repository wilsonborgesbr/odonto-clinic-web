import { useState } from 'react';
import { Link2, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Skeleton } from '../ui/Skeleton';
import { bokkaToast } from '../ui/Toast';
import { SeletorDenteFace } from './SeletorDenteFace';
import type { SelecaoDentes } from './SeletorDenteFace';
import { useOdontogramaRecente, useOdontogramasPorPaciente } from '../../services/odontogramaService';
import { useVincularOdontograma } from '../../services/procedimentoService';
import { ApiError } from '../../lib/api';
import { cn, formatDate } from '../../lib/utils';
import { dentesDoTexto, mapaDentes, separarDentes, textoDaSelecao } from '../../lib/dentes';
import { nomeProcLabel } from '../../lib/procedimentoLabels';
import type { Odontograma, Procedimento } from '../../types';

interface ConteudoProps {
  /** Procedimento já salvo (precisa de id) que será vinculado. */
  procedimento: Procedimento;
  onCancel: () => void;
  onConcluido: () => void;
}

const nomeDoProcedimento = (p: Procedimento) =>
  p.nomeProcedimento ? nomeProcLabel[p.nomeProcedimento] : 'Procedimento';

const resumoOdontograma = (o: Odontograma) => {
  const marcados = o.dentes?.length ?? 0;
  return `Odontograma de ${formatDate(o.dataAvaliacao)}`.concat(
    marcados > 0 ? ` · ${marcados} dente${marcados > 1 ? 's' : ''} registrado${marcados > 1 ? 's' : ''}` : ' · sem dentes registrados',
  );
};

/**
 * Conteúdo do fluxo "Marcar no odontograma". Fica separado do Modal para poder entrar no mesmo
 * Dialog de quem já está aberto (trocar o conteúdo evita empilhar dois Dialogs do Headless UI).
 *
 * Quem resolve o odontograma é o backend (o já vinculado, o mais recente ou um mínimo criado na hora).
 * Aqui o usuário só vê qual será usado e, havendo mais de um, pode escolher; nada é vinculado calado.
 */
export const MarcarNoOdontogramaConteudo = ({ procedimento, onCancel, onConcluido }: ConteudoProps) => {
  const odontogramasQ = useOdontogramasPorPaciente(procedimento.pacienteId);
  const recenteQ = useOdontogramaRecente(procedimento.pacienteId);
  const vincularM = useVincularOdontograma();

  const inicial = dentesDoTexto(procedimento.dente);
  const [selecao, setSelecao] = useState<SelecaoDentes>({
    dentes: inicial.slice(0, 1),
    faces: inicial.length === 1 && procedimento.faces ? { [inicial[0]]: procedimento.faces } : {},
  });
  // undefined = "automático": NÃO manda odontogramaId e o backend resolve (o já vinculado, o mais recente ou cria um).
  // Só vira id quando o usuário escolhe um odontograma da lista.
  const [escolhidoId, setEscolhidoId] = useState<string | undefined>(undefined);
  const [erro, setErro] = useState<string | null>(null);

  const lista = odontogramasQ.data ?? [];
  // "Mais recente" é decisão do backend (GET /recente), nunca o primeiro da lista. No modo automático o arco mostra
  // esse odontograma; escolhendo um da lista, mostra o escolhido.
  const recente = recenteQ.data ?? undefined;
  // Procedimento já vinculado: o backend mantém o vínculo (vinculado > mais recente), então "automático" = o atual.
  const vinculadoId = procedimento.odontogramaId;
  const vinculado = vinculadoId ? lista.find((o) => o.id === vinculadoId) : undefined;
  const alvoAutomatico = vinculadoId ? vinculado : recente;
  const escolhido = escolhidoId ? lista.find((o) => o.id === escolhidoId) : alvoAutomatico;
  const trocando = !!escolhidoId && !!vinculadoId && escolhidoId !== vinculadoId;
  const dente = selecao.dentes[0];
  const varios = separarDentes(procedimento.dente).length > 1;
  const semOdontograma = !odontogramasQ.isLoading && !odontogramasQ.isError && lista.length === 0;
  const pronto = !odontogramasQ.isLoading && !odontogramasQ.isError && !recenteQ.isLoading && !recenteQ.isError;
  // O arco lê as condições do odontograma ESCOLHIDO: trocar o rádio redesenha o arco.
  const condicoes = mapaDentes(escolhido);

  const vincular = async () => {
    if (!procedimento.id || !dente) return;
    setErro(null);
    try {
      const faces = selecao.faces[dente] ?? [];
      const r = await vincularM.mutateAsync({
        id: procedimento.id,
        req: {
          odontogramaId: escolhidoId,
          dente,
          faces: faces.length > 0 ? faces : undefined,
          condicao: selecao.condicao,
        },
      });
      const marcado = textoDaSelecao(selecao, condicoes);
      const usado = r.odontograma?.dataAvaliacao ? ` de ${formatDate(r.odontograma.dataAvaliacao)}` : '';
      bokkaToast.success(
        r.odontogramaCriado
          ? `Odontograma criado. ${marcado} marcado.`
          : trocando
            ? `Procedimento movido para o odontograma${usado}. ${marcado} marcado.`
            : `${marcado} marcado no odontograma${usado}.`,
      );
      onConcluido();
    } catch (err) {
      const msg = err instanceof ApiError ? err.friendlyMessage() : null;
      setErro(msg ?? 'Não foi possível marcar no odontograma. Tente de novo.');
    }
  };

  return (
    <div className="space-y-6">
      {erro && (
        <div
          role="alert"
          className="text-sm text-bokka-danger-ink bg-bokka-danger-soft border border-bokka-danger/20 rounded-md px-3 py-2"
        >
          {erro}
        </div>
      )}

      <p className="text-sm text-bokka-ink-2">
        Procedimento: <b className="text-bokka-ink">{nomeDoProcedimento(procedimento)}</b>
      </p>

      <section aria-labelledby="marcar-odonto-titulo">
        <h3 id="marcar-odonto-titulo" className="text-sm font-semibold text-bokka-ink mb-3">
          Odontograma que será usado
        </h3>

        {odontogramasQ.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" rounded="lg" />
          </div>
        ) : odontogramasQ.isError || recenteQ.isError ? (
          <div className="rounded-xl border border-bokka-danger/20 bg-bokka-danger-soft px-4 py-3 text-sm text-bokka-danger-ink flex items-center justify-between gap-3 flex-wrap">
            <span>Não foi possível carregar os odontogramas da paciente.</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                odontogramasQ.refetch();
                recenteQ.refetch();
              }}
            >
              Tentar de novo
            </Button>
          </div>
        ) : semOdontograma ? (
          <div className="rounded-xl border border-bokka-border bg-bokka-surface-2 p-4 flex items-start gap-3">
            <Plus className="w-4 h-4 mt-0.5 shrink-0 text-bokka-ink-2" strokeWidth={2} aria-hidden="true" />
            <p className="text-sm text-bokka-ink-2">
              Esta paciente ainda não tem odontograma. Ao vincular, criamos um odontograma mínimo agora e marcamos o dente
              nele, sem sair daqui.
            </p>
          </div>
        ) : (
          <fieldset className="space-y-2">
            <legend className="sr-only">Escolha o odontograma</legend>
            {[undefined, ...lista].map((o) => {
              const automatico = o === undefined;
              const marcado = automatico ? escolhidoId === undefined : o.id === escolhidoId;
              return (
                <label
                  key={automatico ? 'automatico' : o.id}
                  className={cn(
                    'flex items-center gap-3 min-h-11 rounded-xl border px-3 py-2 cursor-pointer transition-colors',
                    marcado
                      ? 'border-bokka-primary bg-bokka-surface ring-1 ring-bokka-primary'
                      : 'border-bokka-field-edge bg-bokka-surface-2 hover:bg-bokka-surface-3',
                  )}
                >
                  <input
                    type="radio"
                    name="odontograma-escolhido"
                    checked={marcado}
                    onChange={() => setEscolhidoId(automatico ? undefined : o.id)}
                    className="w-4 h-4 shrink-0 accent-bokka-primary"
                  />
                  <span className="min-w-0 text-sm text-bokka-ink">
                    {automatico ? (
                      vinculadoId ? (
                        <>
                          Manter o vínculo atual
                          {vinculado?.dataAvaliacao ? ` (${formatDate(vinculado.dataAvaliacao)})` : ''}
                          <span className="block text-xs text-bokka-ink-3">O procedimento continua no odontograma em que já está.</span>
                        </>
                      ) : (
                        <>
                          Automático: o odontograma mais recente
                          {recente?.dataAvaliacao ? ` (${formatDate(recente.dataAvaliacao)})` : ''}
                          <span className="block text-xs text-bokka-ink-3">O sistema decide; se o procedimento já tem vínculo, vale o dele.</span>
                        </>
                      )
                    ) : (
                      <>
                        {resumoOdontograma(o)}
                        {o.id === vinculadoId && (
                          <span className="ml-2 inline-flex items-center rounded-full border border-bokka-primary px-2 py-0.5 text-[11px] font-semibold text-bokka-ink">
                            Vinculado atual
                          </span>
                        )}
                        {o.id === recente?.id && (
                          <span className="ml-2 inline-flex items-center rounded-full border border-bokka-field-edge px-2 py-0.5 text-[11px] font-semibold text-bokka-ink-2">
                            Mais recente
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </label>
              );
            })}
          </fieldset>
        )}
      </section>

      <section aria-labelledby="marcar-dente-titulo">
        <h3 id="marcar-dente-titulo" className="text-sm font-semibold text-bokka-ink mb-3">
          Dente e faces
        </h3>
        {varios && (
          <p className="text-xs text-bokka-ink-3 mb-3">
            O procedimento cita mais de um dente ({procedimento.dente}). Marque um por vez: este fluxo vincula um dente.
          </p>
        )}
        <SeletorDenteFace value={selecao} onChange={setSelecao} modo="unico" condicoes={condicoes} />
      </section>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-bokka-border -mx-6 px-6 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={vincularM.isPending}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={vincular}
          loading={vincularM.isPending}
          disabled={!pronto || !dente}
          className="h-auto min-h-10 py-2 whitespace-normal text-center max-w-full"
          icon={<Link2 className="w-4 h-4" strokeWidth={2} />}
        >
          {semOdontograma
            ? 'Criar odontograma e marcar o dente'
            : trocando && escolhido
              ? `Trocar para o de ${formatDate(escolhido.dataAvaliacao)}`
              : vinculadoId
                ? 'Salvar no odontograma atual'
                : escolhidoId && escolhido
                  ? `Vincular ao odontograma de ${formatDate(escolhido.dataAvaliacao)}`
                  : recente
                    ? `Vincular ao mais recente (${formatDate(recente.dataAvaliacao)})`
                    : 'Vincular ao odontograma'}
        </Button>
      </div>
    </div>
  );
};

interface ModalProps {
  open: boolean;
  procedimento: Procedimento | null;
  onClose: () => void;
}

/** Versão independente (com o próprio Dialog) para telas que ainda não têm um modal aberto. */
export const MarcarNoOdontogramaModal = ({ open, procedimento, onClose }: ModalProps) => (
  <Modal
    open={open}
    onClose={onClose}
    title={procedimento?.odontogramaId ? 'Alterar odontograma' : 'Marcar no odontograma'}
    subtitle="Escolha o odontograma, o dente e as faces."
    size="xl"
  >
    {procedimento && (
      <MarcarNoOdontogramaConteudo procedimento={procedimento} onCancel={onClose} onConcluido={onClose} />
    )}
  </Modal>
);
