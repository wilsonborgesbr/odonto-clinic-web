import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Convenio } from '../types';

export const convenioService = {
  listar: async () => (await api.get<Convenio[]>('/api/convenios')).data,
  buscarPorId: async (id: string) => (await api.get<Convenio>(`/api/convenios/${id}`)).data,
  criar: async (c: Convenio) => (await api.post<Convenio>('/api/convenios', c)).data,
  atualizar: async (id: string, c: Convenio) =>
    (await api.put<Convenio>(`/api/convenios/${id}`, c)).data,
  inativar: async (id: string) => {
    await api.delete(`/api/convenios/${id}`);
  },
};

export const convenioKeys = {
  all: ['convenios'] as const,
  lists: () => [...convenioKeys.all, 'list'] as const,
  detail: (id: string) => [...convenioKeys.all, 'detail', id] as const,
};

export const useConvenios = () =>
  useQuery({ queryKey: convenioKeys.lists(), queryFn: convenioService.listar });

export const useCriarConvenio = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: convenioService.criar,
    onSuccess: () => qc.invalidateQueries({ queryKey: convenioKeys.all }),
  });
};

export const useAtualizarConvenio = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, convenio }: { id: string; convenio: Convenio }) =>
      convenioService.atualizar(id, convenio),
    onSuccess: () => qc.invalidateQueries({ queryKey: convenioKeys.all }),
  });
};

export const useInativarConvenio = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: convenioService.inativar,
    onSuccess: () => qc.invalidateQueries({ queryKey: convenioKeys.all }),
  });
};
