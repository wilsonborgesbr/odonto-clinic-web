import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import type { PendenciasCadastro } from '../types';

const SEM_PENDENCIAS: PendenciasCadastro = { total: 0, porEntidade: {}, itens: [] };

export const cadastroService = {
  /**
   * Cadastros com dado inválido (CPF/CNPJ/CRO/telefone/CEP), já filtrados pela clínica e pelas
   * permissões do usuário. 403 = sem permissão em nenhum módulo: tratado como "nada a mostrar".
   */
  pendencias: async (): Promise<PendenciasCadastro> => {
    try {
      const { data } = await api.get<PendenciasCadastro>('/api/cadastros/pendencias');
      return data;
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) return SEM_PENDENCIAS;
      throw err;
    }
  },
};

export const cadastroKeys = {
  all: ['cadastros'] as const,
  pendencias: () => [...cadastroKeys.all, 'pendencias'] as const,
};

/** O aviso é complementar: falha de rede não gera toast nem tela de erro, só some. */
export const usePendenciasCadastro = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: cadastroKeys.pendencias(),
    queryFn: cadastroService.pendencias,
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  });
