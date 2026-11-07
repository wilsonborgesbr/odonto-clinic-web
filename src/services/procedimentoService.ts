import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { odontogramaKeys } from './odontogramaService';
import type { Procedimento, VincularOdontogramaRequest, VincularOdontogramaResponse } from '../types';

export const procedimentoService = {
  vincularOdontograma: async (id: string, req: VincularOdontogramaRequest) =>
    (await api.post<VincularOdontogramaResponse>(`/api/procedimentos/${id}/vincular-odontograma`, req)).data,
  listarPorPaciente: async (pacienteId: string) =>
    (await api.get<Procedimento[]>(`/api/procedimentos/paciente/${pacienteId}`)).data,
  buscarPorId: async (id: string) => (await api.get<Procedimento>(`/api/procedimentos/${id}`)).data,
  criar: async (p: Procedimento) => (await api.post<Procedimento>('/api/procedimentos', p)).data,
  atualizar: async (id: string, p: Procedimento) =>
    (await api.put<Procedimento>(`/api/procedimentos/${id}`, p)).data,
  excluir: async (id: string) => {
    await api.delete(`/api/procedimentos/${id}`);
  },
};

export const procedimentoKeys = {
  all: ['procedimentos'] as const,
  byPaciente: (pid: string) => [...procedimentoKeys.all, 'byPaciente', pid] as const,
  detail: (id: string) => [...procedimentoKeys.all, 'detail', id] as const,
};

export const useProcedimentosPorPaciente = (pacienteId: string | undefined) =>
  useQuery({
    queryKey: procedimentoKeys.byPaciente(pacienteId ?? ''),
    queryFn: () => procedimentoService.listarPorPaciente(pacienteId!),
    enabled: !!pacienteId,
  });

export const useCriarProcedimento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: procedimentoService.criar,
    onSuccess: (_d, vars) => {
      if (vars.pacienteId) {
        qc.invalidateQueries({ queryKey: procedimentoKeys.byPaciente(vars.pacienteId) });
      }
    },
  });
};

export const useAtualizarProcedimento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, procedimento }: { id: string; procedimento: Procedimento }) =>
      procedimentoService.atualizar(id, procedimento),
    onSuccess: () => qc.invalidateQueries({ queryKey: procedimentoKeys.all }),
  });
};

export const useVincularOdontograma = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: VincularOdontogramaRequest }) =>
      procedimentoService.vincularOdontograma(id, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: procedimentoKeys.all });
      qc.invalidateQueries({ queryKey: odontogramaKeys.all });
    },
  });
};

export const useExcluirProcedimento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: procedimentoService.excluir,
    onSuccess: () => qc.invalidateQueries({ queryKey: procedimentoKeys.all }),
  });
};
