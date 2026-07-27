import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Documento } from '../types';

export const documentoService = {
  listarPorPaciente: async (pacienteId: string) =>
    (await api.get<Documento[]>(`/api/documentos/paciente/${pacienteId}`)).data,
  buscarPorId: async (id: string) => (await api.get<Documento>(`/api/documentos/${id}`)).data,
  criar: async (d: Documento) => (await api.post<Documento>('/api/documentos', d)).data,
  excluir: async (id: string) => {
    await api.delete(`/api/documentos/${id}`);
  },
};

export const documentoKeys = {
  all: ['documentos'] as const,
  byPaciente: (pid: string) => [...documentoKeys.all, 'byPaciente', pid] as const,
};

export const useDocumentosPorPaciente = (pacienteId: string | undefined) =>
  useQuery({
    queryKey: documentoKeys.byPaciente(pacienteId ?? ''),
    queryFn: () => documentoService.listarPorPaciente(pacienteId!),
    enabled: !!pacienteId,
  });

export const useCriarDocumento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: documentoService.criar,
    onSuccess: (_d, vars) => {
      if (vars.pacienteId) {
        qc.invalidateQueries({ queryKey: documentoKeys.byPaciente(vars.pacienteId) });
      }
    },
  });
};

export const useExcluirDocumento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: documentoService.excluir,
    onSuccess: () => qc.invalidateQueries({ queryKey: documentoKeys.all }),
  });
};
