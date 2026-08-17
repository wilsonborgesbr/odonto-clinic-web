import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ContaPagar, ContaReceber, StatusFinanceiroEnum } from '../types';

// ============ CONTAS A RECEBER ============

export const contaReceberService = {
  listar: async () => (await api.get<ContaReceber[]>('/api/contas-receber')).data,
  buscarPorId: async (id: string) =>
    (await api.get<ContaReceber>(`/api/contas-receber/${id}`)).data,
  buscarPorPaciente: async (pacienteId: string) =>
    (await api.get<ContaReceber[]>(`/api/contas-receber/paciente/${pacienteId}`)).data,
  buscarPorStatus: async (status: StatusFinanceiroEnum) =>
    (await api.get<ContaReceber[]>(`/api/contas-receber/status/${status}`)).data,
  criar: async (c: ContaReceber) =>
    (await api.post<ContaReceber>('/api/contas-receber', c)).data,
  atualizar: async (id: string, c: ContaReceber) =>
    (await api.put<ContaReceber>(`/api/contas-receber/${id}`, c)).data,
  registrarPagamento: async (id: string, valor: number) =>
    (await api.patch<ContaReceber>(`/api/contas-receber/${id}/pagamento`, null, {
      params: { valor },
    })).data,
  excluir: async (id: string) => {
    await api.delete(`/api/contas-receber/${id}`);
  },
};

export const contaReceberKeys = {
  all: ['contas-receber'] as const,
  lists: () => [...contaReceberKeys.all, 'list'] as const,
  byPaciente: (pid: string) => [...contaReceberKeys.all, 'byPaciente', pid] as const,
  byStatus: (s: StatusFinanceiroEnum) => [...contaReceberKeys.all, 'byStatus', s] as const,
  detail: (id: string) => [...contaReceberKeys.all, 'detail', id] as const,
};

export const useContasReceber = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: contaReceberKeys.lists(),
    queryFn: contaReceberService.listar,
    enabled: options?.enabled ?? true,
  });

export const useContasReceberPorPaciente = (pacienteId: string | undefined) =>
  useQuery({
    queryKey: contaReceberKeys.byPaciente(pacienteId ?? ''),
    queryFn: () => contaReceberService.buscarPorPaciente(pacienteId!),
    enabled: !!pacienteId,
  });

export const useCriarContaReceber = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: contaReceberService.criar,
    onSuccess: () => qc.invalidateQueries({ queryKey: contaReceberKeys.all }),
  });
};

export const useAtualizarContaReceber = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, conta }: { id: string; conta: ContaReceber }) =>
      contaReceberService.atualizar(id, conta),
    onSuccess: () => qc.invalidateQueries({ queryKey: contaReceberKeys.all }),
  });
};

export const useRegistrarPagamento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, valor }: { id: string; valor: number }) =>
      contaReceberService.registrarPagamento(id, valor),
    onSuccess: () => qc.invalidateQueries({ queryKey: contaReceberKeys.all }),
  });
};

export const useExcluirContaReceber = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: contaReceberService.excluir,
    onSuccess: () => qc.invalidateQueries({ queryKey: contaReceberKeys.all }),
  });
};

// ============ CONTAS A PAGAR ============

export const contaPagarService = {
  listar: async () => (await api.get<ContaPagar[]>('/api/contas-pagar')).data,
  buscarPorId: async (id: string) => (await api.get<ContaPagar>(`/api/contas-pagar/${id}`)).data,
  buscarPorStatus: async (status: StatusFinanceiroEnum) =>
    (await api.get<ContaPagar[]>(`/api/contas-pagar/status/${status}`)).data,
  criar: async (c: ContaPagar) => (await api.post<ContaPagar>('/api/contas-pagar', c)).data,
  atualizar: async (id: string, c: ContaPagar) =>
    (await api.put<ContaPagar>(`/api/contas-pagar/${id}`, c)).data,
  excluir: async (id: string) => {
    await api.delete(`/api/contas-pagar/${id}`);
  },
};

export const contaPagarKeys = {
  all: ['contas-pagar'] as const,
  lists: () => [...contaPagarKeys.all, 'list'] as const,
  detail: (id: string) => [...contaPagarKeys.all, 'detail', id] as const,
};

export const useContasPagar = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: contaPagarKeys.lists(),
    queryFn: contaPagarService.listar,
    enabled: options?.enabled ?? true,
  });

export const useCriarContaPagar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: contaPagarService.criar,
    onSuccess: () => qc.invalidateQueries({ queryKey: contaPagarKeys.all }),
  });
};

export const useAtualizarContaPagar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, conta }: { id: string; conta: ContaPagar }) =>
      contaPagarService.atualizar(id, conta),
    onSuccess: () => qc.invalidateQueries({ queryKey: contaPagarKeys.all }),
  });
};

export const useExcluirContaPagar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: contaPagarService.excluir,
    onSuccess: () => qc.invalidateQueries({ queryKey: contaPagarKeys.all }),
  });
};
