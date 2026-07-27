import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Anamnese } from '../types';

export const anamneseService = {
  listarPorPaciente: async (pacienteId: string) =>
    (await api.get<Anamnese[]>(`/api/anamneses/paciente/${pacienteId}`)).data,
  buscarPorId: async (id: string) => (await api.get<Anamnese>(`/api/anamneses/${id}`)).data,
  criar: async (a: Anamnese) => (await api.post<Anamnese>('/api/anamneses', a)).data,
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
