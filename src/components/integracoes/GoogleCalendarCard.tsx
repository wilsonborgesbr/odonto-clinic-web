import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Calendar, CalendarCheck, ChevronDown, Info, Lock, LogOut, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { ConfirmModal } from '../ui/Modal';
import { bokkaToast } from '../ui/Toast';
import {
  useDesconectarGoogleCalendar,
  useGoogleCalendarAuthUrl,
  useGoogleCalendarStatus,
  useSincronizarGoogleCalendar,
} from '../../services/googleCalendarService';
import { ApiError } from '../../lib/api';
import {
  ATUALIZACAO_AUTOMATICA,
  ESCOPO,
  MENSAGEM_BLOQUEIO,
  SYNC_STATUS,
  explicacaoSync,
  formatarUltimaSincronizacao,
  urlDeAutorizacaoSegura,
} from '../../lib/googleCalendar';
import { cn } from '../../lib/utils';
import type { ConexaoGoogleCalendar } from '../../types';

/**
 * Card do Google Calendar em Configurações. Estados: carregando, erro ao consultar, conectado (qualquer status de
 * sincronização), sem permissão, integração ainda não configurada no ambiente, e o fluxo de conectar (um tipo
 * direto, ou a escolha entre vários).
 */
export const GoogleCalendarCard = () => {
  const statusQ = useGoogleCalendarStatus();
  const status = statusQ.data;

  return (
    <Card>
      <div className="flex items-start gap-4">
        <span className="w-11 h-11 rounded-xl bg-bokka-surface-2 border border-bokka-border text-bokka-primary-text flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-bokka-ink">Google Calendar</h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-bokka-primary-soft text-bokka-primary-text">
              Agenda
            </span>
          </div>
          <p className="text-xs text-bokka-ink-3 mt-1">
            Veja as consultas da Bokka no seu Google Calendar. O que você marca, remarca ou cancela aqui aparece lá.
          </p>
        </div>
      </div>

      {/* text-sm aqui: o reset global `button { font: inherit }` faz os botões herdarem o tamanho do contêiner. */}
      <div className="mt-4 text-sm">
        {statusQ.isLoading ? (
          <div className="space-y-2" aria-busy="true" aria-label="Carregando a integração">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-10 w-full" rounded="xl" />
          </div>
        ) : statusQ.isError || !status ? (
          <div role="alert" className="rounded-xl border border-bokka-danger/30 bg-bokka-danger-soft p-4 text-sm">
            <p className="text-bokka-danger-ink">
              Não foi possível consultar o Google Calendar agora.
              {statusQ.error instanceof ApiError && statusQ.error.status !== 0 ? '' : ' Verifique a conexão.'}
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              icon={<RefreshCw className="w-4 h-4" aria-hidden="true" />}
              onClick={() => void statusQ.refetch()}
              loading={statusQ.isFetching}
            >
              Tentar de novo
            </Button>
          </div>
        ) : status.conexao ? (
          <ConexaoAtual conexao={status.conexao} />
        ) : !status.permitido || status.motivoBloqueio === 'SEM_PERMISSAO' ? (
          <Aviso icone={<Lock className="w-4 h-4" strokeWidth={2} aria-hidden="true" />}>
            Seu usuário não tem a permissão da integração com o Google Calendar. Peça ao proprietário da clínica para
            liberar em Usuários &amp; Permissões.
          </Aviso>
        ) : !status.configurada ? (
          <Aviso icone={<Info className="w-4 h-4" strokeWidth={2} aria-hidden="true" />}>
            A integração com o Google Calendar ainda não está disponível neste ambiente. Assim que for configurada,
            o botão de conectar aparece aqui.
          </Aviso>
        ) : status.podeConectar === false ? (
          <Aviso icone={<Info className="w-4 h-4" strokeWidth={2} aria-hidden="true" />}>
            {status.motivoBloqueio
              ? MENSAGEM_BLOQUEIO[status.motivoBloqueio]
              : 'Não é possível conectar o Google Calendar para o seu usuário agora.'}
          </Aviso>
        ) : (
          <Conectar />
        )}
      </div>
    </Card>
  );
};

const Aviso = ({ icone, children }: { icone: ReactNode; children: ReactNode }) => (
  <div className="rounded-xl border border-bokka-border bg-bokka-surface-2 p-4 flex gap-3 text-sm text-bokka-ink-2 leading-relaxed">
    <span className="mt-0.5 shrink-0 text-bokka-ink-3">{icone}</span>
    <p>{children}</p>
  </div>
);

const CHAVE_COMO_FUNCIONA = 'bokka:gc-como-funciona-visto';

/** Bloco recolhível: aberto na primeira vez que a pessoa vê o card, recolhido depois (conveniência por navegador). */
const ComoFunciona = () => {
  const painelId = useId();
  const [aberto, setAberto] = useState(() => {
    try {
      return localStorage.getItem(CHAVE_COMO_FUNCIONA) === null;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_COMO_FUNCIONA, '1');
    } catch {
      // Sem armazenamento (janela privada): o bloco só abre de novo na próxima visita.
    }
  }, []);

  return (
    <div className="rounded-xl border border-bokka-border bg-bokka-surface-2">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls={painelId}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left cursor-pointer"
      >
        <span className="font-semibold text-bokka-ink">Como funciona</span>
        <ChevronDown
          className={cn('w-4 h-4 shrink-0 text-bokka-ink-3 transition-transform', aberto && 'rotate-180')}
          aria-hidden="true"
        />
      </button>
      {aberto && (
        <div id={painelId} className="px-4 pb-4 space-y-2 text-xs text-bokka-ink-2 leading-relaxed">
          <p>
            <strong className="font-semibold text-bokka-ink">Da Bokka para o Google:</strong> cada consulta vira um
            evento com o nome do paciente, o procedimento, o dentista e um link para o prontuário (o link exige login na
            Bokka). As observações do agendamento nunca são enviadas.
          </p>
          <p>
            <strong className="font-semibold text-bokka-ink">Do Google para a Bokka:</strong> se você mudar o horário de
            um evento, a Bokka atualiza a consulta, desde que o dentista esteja livre. Se não estiver, vale o horário da
            Bokka e o evento volta ao horário certo. Isso acontece por atualização automática, sem você fazer nada.
            Excluir um evento no Google não cancela a consulta na Bokka.
          </p>
          <p>Para marcar, remarcar ou cancelar, use a Bokka. O Google serve para conferir e para ajustar horários.</p>
          <p>
            <strong className="font-semibold text-bokka-ink">Privacidade:</strong> os eventos levam o nome completo do
            paciente e o procedimento, que são dados de saúde (LGPD, art. 11). Ao conectar, esses dados passam a ficar
            também na conta Google escolhida, sob as regras e a segurança do Google. Conecte só contas que sigam o sigilo
            da clínica, com verificação em duas etapas, e não compartilhe essa agenda com quem não deve ver os
            pacientes.
          </p>
          {/* Vale enquanto o código gravar na agenda principal ("primary"); apagar se for adotado o calendário dedicado. */}
          <p>
            Na tela de permissão, o Google vai dizer "ver e editar eventos em todas as suas agendas". É assim que o
            Google descreve essa permissão; a Bokka só altera os eventos que ela mesma criou.
          </p>
        </div>
      )}
    </div>
  );
};

/** Sem escolha de agenda: o escopo já vem definido pelo proprietário em Usuários & Permissões. */
const Conectar = () => {
  const authUrlM = useGoogleCalendarAuthUrl();
  const statusQ = useGoogleCalendarStatus();
  const [erro, setErro] = useState<string | null>(null);

  const conectar = async () => {
    setErro(null);
    try {
      const { url } = await authUrlM.mutateAsync();
      if (!urlDeAutorizacaoSegura(url)) {
        setErro('O endereço de autorização recebido não é seguro. Avise o suporte.');
        return;
      }
      // Redirect de navegador inteiro: o Google devolve para o backend, que volta para /configuracoes.
      window.location.assign(url);
    } catch (err) {
      setErro(err instanceof ApiError ? err.friendlyMessage() : 'Não foi possível iniciar a conexão.');
      // 409 e 403 indicam que o estado mudou desde a última consulta.
      if (err instanceof ApiError && (err.status === 409 || err.status === 403)) void statusQ.refetch();
    }
  };

  return (
    <div className="space-y-4">
      <ComoFunciona />
      {erro && (
        <p role="alert" className="text-sm text-bokka-danger-ink bg-bokka-danger-soft border border-bokka-danger/20 rounded-md px-3 py-2">
          {erro}
        </p>
      )}

      <Button
        onClick={() => void conectar()}
        loading={authUrlM.isPending}
        icon={<CalendarCheck className="w-4 h-4" aria-hidden="true" />}
      >
        Conectar com o Google
      </Button>
    </div>
  );
};

const ESPERA_MINIMA_MS = 8_000;
const ESPERA_MAXIMA_MS = 90_000;
const INTERVALO_MS = 1_500;
const MSG_FALHA_SINCRONIZAR = 'Não foi possível sincronizar agora. Tente de novo em instantes.';

const pausa = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Sincronização manual: POST (202) e depois polling do status até `sincronizando` voltar a false. Termina quando viu a
 * sincronização rodar, quando `ultimaSincronizacaoEm` mudou, ou depois de uma espera mínima (caso rápida demais para
 * ser vista). `ultimaSincronizacaoFalhou` decide entre o toast de sucesso e o de erro.
 */
const useSincronizarAgora = (conexao: ConexaoGoogleCalendar) => {
  const sincronizarM = useSincronizarGoogleCalendar();
  const statusQ = useGoogleCalendarStatus();
  const [acompanhando, setAcompanhando] = useState(false);
  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const acompanhar = async (baseline: string | null | undefined) => {
    const inicio = Date.now();
    let viu = false;
    while (montado.current && Date.now() - inicio < ESPERA_MAXIMA_MS) {
      await pausa(INTERVALO_MS);
      const { data } = await statusQ.refetch();
      const c = data?.conexao;
      if (!c) return; // desconectou no meio do caminho
      if (c.sincronizando) {
        viu = true;
        continue;
      }
      if (viu || c.ultimaSincronizacaoEm !== baseline || Date.now() - inicio >= ESPERA_MINIMA_MS) {
        if (c.ultimaSincronizacaoFalhou) bokkaToast.error(MSG_FALHA_SINCRONIZAR);
        else bokkaToast.success('Sincronização concluída.');
        return;
      }
    }
    if (montado.current) bokkaToast.error('A sincronização está demorando mais que o normal. Confira de novo em instantes.');
  };

  const sincronizar = async () => {
    const baseline = conexao.ultimaSincronizacaoEm;
    try {
      // 202 com jaEmAndamento=true (já havia uma rodando) também é sucesso.
      await sincronizarM.mutateAsync();
    } catch (err) {
      const estadoMudou = err instanceof ApiError && (err.status === 404 || err.status === 409);
      bokkaToast.error(estadoMudou ? err.friendlyMessage() : MSG_FALHA_SINCRONIZAR);
      if (estadoMudou) void statusQ.refetch();
      return;
    }
    setAcompanhando(true);
    try {
      await acompanhar(baseline);
    } finally {
      if (montado.current) setAcompanhando(false);
    }
  };

  return { sincronizar, emAndamento: sincronizarM.isPending || acompanhando || conexao.sincronizando === true };
};

const ConexaoAtual = ({ conexao }: { conexao: ConexaoGoogleCalendar }) => {
  const desconectarM = useDesconectarGoogleCalendar();
  const { sincronizar, emAndamento } = useSincronizarAgora(conexao);
  const [confirmar, setConfirmar] = useState(false);
  const st = SYNC_STATUS[conexao.syncStatus] ?? SYNC_STATUS.ERRO_AUTENTICACAO;
  const escopo = ESCOPO[conexao.escopo];
  const ativo = conexao.syncStatus === 'ATIVO';
  const ultima = formatarUltimaSincronizacao(conexao.ultimaSincronizacaoEm);

  const desconectar = async () => {
    try {
      await desconectarM.mutateAsync();
      bokkaToast.success('Google Calendar desconectado. Os eventos da Bokka estão sendo removidos da sua agenda do Google.');
    } catch (err) {
      bokkaToast.error(err instanceof ApiError ? err.friendlyMessage() : 'Não foi possível desconectar.');
    } finally {
      setConfirmar(false);
    }
  };

  return (
    <div className="rounded-xl border border-bokka-border bg-bokka-surface-2 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={st.tom} dot>
          {st.rotulo}
        </Badge>
        <span className="text-sm font-semibold text-bokka-ink">{escopo?.titulo ?? conexao.escopo}</span>
      </div>
      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_minmax(0,1fr)]">
        <dt className="text-bokka-ink-3">Conta Google</dt>
        <dd className="font-medium text-bokka-ink break-all">{conexao.googleEmail ?? 'Não informada'}</dd>
        {ativo && (
          <>
            <dt className="text-bokka-ink-3">Atualização automática</dt>
            <dd className="text-bokka-ink-2">
              {conexao.webhookAtivo ? ATUALIZACAO_AUTOMATICA.ativa : ATUALIZACAO_AUTOMATICA.desligada}
            </dd>
            <dt className="text-bokka-ink-3">Última sincronização</dt>
            <dd className="text-bokka-ink-2" title={ultima.completo}>
              {ultima.texto}
            </dd>
          </>
        )}
      </dl>
      <p className="text-xs text-bokka-ink-2 leading-relaxed">{explicacaoSync(conexao)}</p>
      {ativo && conexao.ultimaSincronizacaoFalhou && !emAndamento && (
        <p role="status" className="text-xs text-bokka-warning-ink leading-relaxed">
          A última sincronização não terminou bem. Use "Sincronizar agora" para tentar de novo.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {ativo && (
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className={cn('w-4 h-4', emAndamento && 'animate-spin')} aria-hidden="true" />}
            onClick={() => void sincronizar()}
            disabled={emAndamento}
            aria-busy={emAndamento}
            title="Envia as consultas para o Google e busca as mudanças de horário feitas lá."
          >
            {emAndamento ? 'Sincronizando…' : 'Sincronizar agora'}
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          icon={<LogOut className="w-4 h-4" aria-hidden="true" />}
          onClick={() => setConfirmar(true)}
        >
          Desconectar
        </Button>
      </div>
      <ConfirmModal
        open={confirmar}
        onClose={() => setConfirmar(false)}
        onConfirm={() => void desconectar()}
        title="Desconectar o Google Calendar?"
        message="A Bokka deixa de enviar e receber consultas e remove da sua agenda do Google os eventos que ela criou. Seus outros eventos não são alterados. A remoção pode levar alguns instantes. Você pode conectar de novo quando quiser."
        confirmLabel="Desconectar e remover eventos"
        danger
        loading={desconectarM.isPending}
      />
    </div>
  );
};
