import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Odontograma } from '../types';

export const odontogramaService = {
  listarPorPaciente: async (pacienteId: string) =>
    (await api.get<Odontograma[]>(`/api/odontogramas/paciente/${pacienteId}`)).data,
  buscarRecentePorPaciente: async (pacienteId: string) =>
    (await api.get<Odontograma>(`/api/odontogramas/paciente/${pacienteId}/recente`)).data,
  buscarPorId: async (id: string) => (await api.get<Odontograma>(`/api/odontogramas/${id}`)).data,
  criar: async (o: Odontograma) => (await api.post<Odontograma>('/api/odontogramas', o)).data,
};

export const odontogramaKeys = {
  all: ['odontogramas'] as const,
  byPaciente: (pid: string) => [...odontogramaKeys.all, 'byPaciente', pid] as const,
  detail: (id: string) => [...odontogramaKeys.all, 'detail', id] as const,
};

export const useOdontogramasPorPaciente = (pacienteId: string | undefined) =>
  useQuery({
    queryKey: odontogramaKeys.byPaciente(pacienteId ?? ''),
    queryFn: () => odontogramaService.listarPorPaciente(pacienteId!),
    enabled: !!pacienteId,
  });

export const useCriarOdontograma = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: odontogramaService.criar,
    onSuccess: (_d, vars) => {
      if (vars.pacienteId) {
        qc.invalidateQueries({ queryKey: odontogramaKeys.byPaciente(vars.pacienteId) });
      }
    },
  });
};
