import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Funcionario, FuncionarioListagemDTO, PageResponse } from '../types';

export interface ListarFuncionariosParams {
  pagina?: number;
  tamanho?: number;
  ordem?: string;
}

export const funcionarioService = {
  listar: async (params: ListarFuncionariosParams = {}) => {
    const { data } = await api.get<PageResponse<FuncionarioListagemDTO>>('/api/funcionarios', {
      params: { pagina: params.pagina, tamanho: params.tamanho, ordem: params.ordem },
    });
    return data;
  },
  buscarPorId: async (id: string) =>
    (await api.get<Funcionario>(`/api/funcionarios/${id}`)).data,
  criar: async (f: Funcionario) => (await api.post<Funcionario>('/api/funcionarios', f)).data,
  atualizar: async (id: string, f: Funcionario) =>
    (await api.put<Funcionario>(`/api/funcionarios/${id}`, f)).data,
  inativar: async (id: string) => {
    await api.delete(`/api/funcionarios/${id}`);
  },
  reativar: async (id: string) =>
    (await api.patch<Funcionario>(`/api/funcionarios/${id}/reativar`)).data,
};

export const funcionarioKeys = {
  all: ['funcionarios'] as const,
  lists: () => [...funcionarioKeys.all, 'list'] as const,
  list: (p: ListarFuncionariosParams) => [...funcionarioKeys.lists(), p] as const,
  detail: (id: string) => [...funcionarioKeys.all, 'detail', id] as const,
};

export const useFuncionarios = (params: ListarFuncionariosParams) =>
  useQuery({
    queryKey: funcionarioKeys.list(params),
    queryFn: () => funcionarioService.listar(params),
    placeholderData: (prev) => prev,
  });

export const useFuncionario = (id: string | undefined) =>
  useQuery({
    queryKey: funcionarioKeys.detail(id ?? ''),
    queryFn: () => funcionarioService.buscarPorId(id!),
    enabled: !!id,
  });

export const useCriarFuncionario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: funcionarioService.criar,
    onSuccess: () => qc.invalidateQueries({ queryKey: funcionarioKeys.all }),
  });
};

export const useAtualizarFuncionario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, funcionario }: { id: string; funcionario: Funcionario }) =>
      funcionarioService.atualizar(id, funcionario),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: funcionarioKeys.all });
      qc.invalidateQueries({ queryKey: funcionarioKeys.detail(vars.id) });
    },
  });
};

export const useInativarFuncionario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: funcionarioService.inativar,
    onSuccess: () => qc.invalidateQueries({ queryKey: funcionarioKeys.all }),
  });
};

export const useReativarFuncionario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: funcionarioService.reativar,
    onSuccess: () => qc.invalidateQueries({ queryKey: funcionarioKeys.all }),
  });
};
