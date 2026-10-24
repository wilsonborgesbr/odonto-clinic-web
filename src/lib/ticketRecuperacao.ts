/**
 * Ticket de redefinição de senha (trocado pelo código de 6 dígitos), guardado SÓ em memória.
 *
 * Fica fora de localStorage, sessionStorage, da URL e do state do histórico de propósito: é uma credencial
 * de uso único que vale 5 minutos. Recarregar a página apaga o ticket e a pessoa digita o código de novo.
 * Existe para a tela de recuperação passar o ticket para a de redefinição sem expô-lo.
 */

const VALIDADE_MS = 5 * 60_000;

export interface SessaoRecuperacao {
  ticket: string;
  nomeUsuario?: string;
  clinicaNome?: string;
  clinicaCodigo?: string;
  expiraEm: number;
}

let atual: SessaoRecuperacao | null = null;

export const guardarTicketRecuperacao = (
  dados: Omit<SessaoRecuperacao, 'expiraEm'>,
  agora: number = Date.now(),
): void => {
  atual = { ...dados, expiraEm: agora + VALIDADE_MS };
};

/** Devolve o ticket ainda dentro do prazo, ou null (e esquece o vencido). */
export const lerTicketRecuperacao = (agora: number = Date.now()): SessaoRecuperacao | null => {
  if (atual && atual.expiraEm <= agora) atual = null;
  return atual;
};

export const limparTicketRecuperacao = (): void => {
  atual = null;
};
