import { ApiError } from './api';
import { bokkaToast } from '../components/ui/Toast';

interface ApplyApiErrorOptions {
  /** Chaves de campo que o formulário exibe (ex.: 'cpf', 'endereco.cep'). */
  campos: readonly string[];
  setErrors: (errors: Record<string, string>) => void;
  setGlobalError: (mensagem: string | null) => void;
  fallback?: string;
}

/**
 * Leva um erro do backend para o formulário, em qualquer um dos dois formatos:
 *  - validação do Spring: `mensagem` é um objeto { campo: texto } → o texto aparece no campo;
 *    chaves que o formulário não exibe vão para o aviso geral, para o erro nunca se perder;
 *  - normalizador (CPF/CNPJ/CRO/telefone inválidos, duplicidade): `mensagem` é uma string →
 *    aviso geral do formulário e toast (o aviso fica no topo, longe do botão Salvar).
 */
export const applyApiError = (
  err: unknown,
  { campos, setErrors, setGlobalError, fallback = 'Não foi possível salvar. Tente novamente.' }: ApplyApiErrorOptions,
) => {
  if (!(err instanceof ApiError)) {
    setGlobalError(fallback);
    bokkaToast.error(fallback);
    return;
  }

  const porCampo = err.fieldErrors();
  const chaves = Object.keys(porCampo);
  if (chaves.length === 0) {
    const mensagem = err.friendlyMessage();
    setGlobalError(mensagem);
    bokkaToast.error(mensagem);
    return;
  }

  const exibidos: Record<string, string> = {};
  const restantes: string[] = [];
  for (const chave of chaves) {
    if (campos.includes(chave)) exibidos[chave] = porCampo[chave];
    else restantes.push(porCampo[chave]);
  }
  setErrors(exibidos);
  if (restantes.length) {
    const mensagem = restantes.join(' ');
    setGlobalError(mensagem);
    bokkaToast.error(mensagem);
  }
};
