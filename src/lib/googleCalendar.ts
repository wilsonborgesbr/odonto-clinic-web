import type { BadgeTone } from '../components/ui/Badge';
import type {
  ConexaoGoogleCalendar,
  EscopoGoogleCalendar,
  MotivoBloqueioGoogle,
  SyncStatusGoogle,
} from '../types';

/** Texto provisório (rascunho do Backend/Maestro): o Designer ainda pode ajustar. */
export const ESCOPO: Record<EscopoGoogleCalendar, { titulo: string; descricao: string }> = {
  SOMENTE_PROPRIO: {
    titulo: 'Minha agenda de profissional',
    descricao:
      'Só as consultas do dentista vinculado ao seu usuário, na sua agenda do Google. Exige um usuário vinculado a um dentista ativo.',
  },
  TODOS_DA_CLINICA: {
    titulo: 'Agenda completa da clínica',
    descricao:
      'Todas as consultas da clínica, na sua agenda do Google. Não precisa ser dentista — serve pra quem organiza a agenda de todo mundo (ex: recepção). Só o proprietário ou sócio escolhe quem recebe esse acesso.',
  },
};

/** Mensagem do card de Configurações quando `podeConectar` é false (SEM_PERMISSAO e JA_CONECTADO têm tratamento próprio). */
export const MENSAGEM_BLOQUEIO: Record<Exclude<MotivoBloqueioGoogle, 'SEM_PERMISSAO'>, string> = {
  SEM_DENTISTA_VINCULADO: 'Peça ao proprietário para liberar "Todos os agendamentos da clínica" para você.',
  DENTISTA_INATIVO: 'O cadastro do dentista vinculado a você está inativo. Fale com o proprietário.',
  JA_CONECTADO: 'Já existe uma conexão ativa para o seu usuário.',
};

export const SYNC_STATUS: Record<
  SyncStatusGoogle,
  { rotulo: string; curto: string; tom: BadgeTone; explicacao: string }
> = {
  ATIVO: {
    rotulo: 'Sincronizando',
    curto: 'Sincronizando',
    tom: 'success',
    explicacao:
      'As consultas da Bokka estão sendo enviadas ao Google. Mudanças de horário feitas no Google chegam sozinhas à Bokka.',
  },
  PAUSADO_PELO_DONO: {
    rotulo: 'Pausado pelo proprietário',
    curto: 'Pausado',
    tom: 'warning',
    explicacao:
      'O proprietário retirou a permissão desta integração. Nada é enviado nem recebido enquanto isso. Os eventos que já estão no Google continuam lá e não serão atualizados. Peça ao proprietário para liberar de novo e, depois, desconecte e conecte outra vez.',
  },
  REVOGADO_PELO_GOOGLE: {
    rotulo: 'Acesso revogado no Google',
    curto: 'Revogado',
    tom: 'danger',
    explicacao:
      'O acesso da Bokka foi removido na conta Google. Desconecte e conecte de novo para voltar a sincronizar. Como a Bokka perdeu o acesso, os eventos que ela já criou continuam no Google; apague-os por lá se não quiser mantê-los.',
  },
  ERRO_AUTENTICACAO: {
    rotulo: 'Erro de autenticação',
    curto: 'Erro de acesso',
    tom: 'danger',
    explicacao:
      'O Google recusou a autenticação desta conexão. Desconecte e conecte de novo; se repetir, avise o suporte.',
  },
};

/**
 * Explicação do status. No ATIVO depende da atualização automática (`webhookAtivo`). `paraOutraPessoa` tira a
 * menção ao botão "Sincronizar agora", que só existe para a própria conexão.
 */
export const explicacaoSync = (conexao: ConexaoGoogleCalendar, paraOutraPessoa = false): string => {
  const st = SYNC_STATUS[conexao.syncStatus] ?? SYNC_STATUS.ERRO_AUTENTICACAO;
  if (conexao.syncStatus !== 'ATIVO' || conexao.webhookAtivo) return st.explicacao;
  return paraOutraPessoa
    ? 'As consultas da Bokka estão sendo enviadas ao Google. A atualização automática está desligada, então mudanças de horário feitas no Google ainda não chegam à Bokka.'
    : 'As consultas da Bokka estão sendo enviadas ao Google. A atualização automática está desligada, então mudanças de horário feitas no Google ainda não chegam à Bokka. Use "Sincronizar agora" para buscar as mudanças ou desconecte e conecte de novo.';
};

export const ATUALIZACAO_AUTOMATICA = {
  ativa: 'Ativa. Mudanças de horário feitas no Google chegam sozinhas à Bokka.',
  desligada: 'Desligada. O que você mudar no Google não chega à Bokka.',
} as const;

const doisDigitos = (n: number) => String(n).padStart(2, '0');

/**
 * Valor da linha "Última sincronização". O backend manda um LocalDateTime sem fuso, lido aqui como horário local
 * (24 h, sem segundos): hoje/ontem às HH:mm, senão DD/MM (com o ano se for de outro ano). `completo` vai no title.
 */
export const formatarUltimaSincronizacao = (
  iso: string | null | undefined,
  agora: Date = new Date(),
): { texto: string; completo?: string } => {
  if (!iso) return { texto: 'Ainda não sincronizou' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { texto: 'Ainda não sincronizou' };
  const hora = `${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`;
  const dia = `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}`;
  const completo = `${dia}/${d.getFullYear()} às ${hora}`;
  const inicioDoDia = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dias = Math.round((inicioDoDia(agora) - inicioDoDia(d)) / 86_400_000);
  if (dias === 0) return { texto: `hoje às ${hora}`, completo };
  if (dias === 1) return { texto: `ontem às ${hora}`, completo };
  return { texto: d.getFullYear() === agora.getFullYear() ? `${dia} às ${hora}` : completo, completo };
};

export interface MensagemRetornoGoogle {
  tom: 'warning' | 'error';
  texto: string;
}

/** Códigos que o backend devolve em `?googleCalendar=erro&motivo=...`, agrupados em mensagens amigáveis. */
export const mensagemRetornoGoogle = (motivo: string | null): MensagemRetornoGoogle => {
  switch (motivo) {
    case 'acesso_negado':
      return {
        tom: 'warning',
        texto: 'Você não autorizou o acesso ao Google Calendar. Para conectar, aceite as permissões pedidas pelo Google.',
      };
    case 'estado_invalido':
    case 'codigo_ausente':
      return {
        tom: 'warning',
        texto: 'A autorização expirou ou não pôde ser confirmada. Clique em Conectar e tente de novo.',
      };
    case 'usuario_invalido':
    case 'sem_permissao':
      return {
        tom: 'error',
        texto: 'Seu usuário não tem permissão para esta conexão. Fale com o proprietário da clínica.',
      };
    case 'ja_conectado':
      return {
        tom: 'warning',
        texto: 'Já existe uma conexão ativa para este usuário ou para a agenda geral da clínica.',
      };
    case 'sem_refresh_token':
    case 'escopo_insuficiente':
      return {
        tom: 'error',
        texto:
          'O Google não liberou todas as permissões necessárias. Marque todas as opções na tela do Google; se não aparecer, remova o acesso da Bokka em myaccount.google.com/permissions e tente de novo.',
      };
    case 'falha_google':
      return { tom: 'error', texto: 'O Google não respondeu como esperado. Tente novamente em alguns minutos.' };
    case 'muitas_tentativas':
      return { tom: 'warning', texto: 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.' };
    case 'dados_invalidos':
    case 'erro_interno':
      return { tom: 'error', texto: 'Não foi possível concluir a conexão. Tente novamente; se repetir, avise o suporte.' };
    default:
      return { tom: 'error', texto: 'Não foi possível conectar ao Google Calendar. Tente novamente.' };
  }
};

/** Só segue para o Google por https: a URL vem do nosso backend, mas o redirect é de navegador inteiro. */
export const urlDeAutorizacaoSegura = (url: string): boolean => {
  try {
    return new URL(url).protocol === 'https:';
  } catch {
    return false;
  }
};
