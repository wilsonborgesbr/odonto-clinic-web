import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CategoriaEstoqueEnum, Estoque } from '../types';

export const estoqueService = {
  listar: async () => (await api.get<Estoque[]>('/api/estoque')).data,
  listarAbaixoMinimo: async () => (await api.get<Estoque[]>('/api/estoque/abaixo-minimo')).data,
  listarPorCategoria: async (cat: CategoriaEstoqueEnum) =>
    (await api.get<Estoque[]>(`/api/estoque/categoria/${cat}`)).data,
  buscarPorId: async (id: string) => (await api.get<Estoque>(`/api/estoque/${id}`)).data,
  criar: async (e: Estoque) => (await api.post<Estoque>('/api/estoque', e)).data,
  atualizar: async (id: string, e: Estoque) =>
    (await api.put<Estoque>(`/api/estoque/${id}`, e)).data,
  excluir: async (id: string) => {
    await api.delete(`/api/estoque/${id}`);
  },
};

export const estoqueKeys = {
  all: ['estoque'] as const,
  lists: () => [...estoqueKeys.all, 'list'] as const,
  abaixoMinimo: () => [...estoqueKeys.all, 'abaixo-minimo'] as const,
  detail: (id: string) => [...estoqueKeys.all, 'detail', id] as const,
};

export const useEstoque = () =>
  useQuery({ queryKey: estoqueKeys.lists(), queryFn: estoqueService.listar });

export const useEstoqueAbaixoMinimo = () =>
  useQuery({
    queryKey: estoqueKeys.abaixoMinimo(),
    queryFn: estoqueService.listarAbaixoMinimo,
  });

export const useCriarEstoque = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: estoqueService.criar,
    onSuccess: () => qc.invalidateQueries({ queryKey: estoqueKeys.all }),
  });
};

export const useAtualizarEstoque = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estoque }: { id: string; estoque: Estoque }) =>
      estoqueService.atualizar(id, estoque),
    onSuccess: () => qc.invalidateQueries({ queryKey: estoqueKeys.all }),
  });
};

export const useExcluirEstoque = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: estoqueService.excluir,
    onSuccess: () => qc.invalidateQueries({ queryKey: estoqueKeys.all }),
  });
};
