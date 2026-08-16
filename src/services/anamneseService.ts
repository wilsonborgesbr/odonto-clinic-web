import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Anamnese } from '../types';

export const anamneseService = {
  listarPorPaciente: async (pacienteId: string) =>
    (await api.get<Anamnese[]>(`/api/anamneses/paciente/${pacienteId}`)).data,
  buscarPorId: async (id: string) => (await api.get<Anamnese>(`/api/anamneses/${id}`)).data,
  criar: async (a: Anamnese) => (await api.post<Anamnese>('/api/anamneses', a)).data,
  atualizar: async (id: string, a: Anamnese) =>
    (await api.put<Anamnese>(`/api/anamneses/${id}`, a)).data,
  excluir: async (id: string) => (await api.delete(`/api/anamneses/${id}`)).data,
};

export const anamneseKeys = {
  all: ['anamneses'] as const,
  byPaciente: (pid: string) => [...anamneseKeys.all, 'byPaciente', pid] as const,
  detail: (id: string) => [...anamneseKeys.all, 'detail', id] as const,
};

export const useAnamnesesPorPaciente = (pacienteId: string | undefined) =>
  useQuery({
    queryKey: anamneseKeys.byPaciente(pacienteId ?? ''),
    queryFn: () => anamneseService.listarPorPaciente(pacienteId!),
    enabled: !!pacienteId,
  });

export const useCriarAnamnese = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: anamneseService.criar,
    onSuccess: (_d, vars) => {
      if (vars.pacienteId) {
        qc.invalidateQueries({ queryKey: anamneseKeys.byPaciente(vars.pacienteId) });
      }
    },
  });
};

export const useAtualizarAnamnese = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, anamnese }: { id: string; anamnese: Anamnese }) =>
      anamneseService.atualizar(id, anamnese),
    onSuccess: (_d, vars) => {
      if (vars.anamnese.pacienteId) {
        qc.invalidateQueries({ queryKey: anamneseKeys.byPaciente(vars.anamnese.pacienteId) });
      }
    },
  });
};

export const useExcluirAnamnese = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; pacienteId: string }) =>
      anamneseService.excluir(id),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: anamneseKeys.byPaciente(vars.pacienteId) });
    },
  });
};
