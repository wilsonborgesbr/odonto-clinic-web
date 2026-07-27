import { fetchApi } from './api';
import type { ContaReceber, ContaPagar } from '../types';

export const contaReceberService = {
  listar: () => fetchApi<ContaReceber[]>('/api/contas-receber'),

  buscarPorId: (id: string) => fetchApi<ContaReceber>(`/api/contas-receber/${id}`),

  buscarPorPaciente: (pacienteId: string) =>
    fetchApi<ContaReceber[]>(`/api/contas-receber/paciente/${pacienteId}`),

  buscarPorStatus: (status: string) =>
    fetchApi<ContaReceber[]>(`/api/contas-receber/status/${status}`),

  criar: (conta: ContaReceber) =>
    fetchApi<ContaReceber>('/api/contas-receber', {
      method: 'POST',
      body: JSON.stringify(conta),
    }),

  atualizar: (id: string, conta: ContaReceber) =>
    fetchApi<ContaReceber>(`/api/contas-receber/${id}`, {
      method: 'PUT',
      body: JSON.stringify(conta),
    }),

  registrarPagamento: (id: string, valor: number) =>
    fetchApi<ContaReceber>(`/api/contas-receber/${id}/pagamento?valor=${valor}`, {
      method: 'PATCH',
    }),

  excluir: (id: string) =>
    fetchApi<void>(`/api/contas-receber/${id}`, { method: 'DELETE' }),
};

export const contaPagarService = {
  listar: () => fetchApi<ContaPagar[]>('/api/contas-pagar'),

  buscarPorId: (id: string) => fetchApi<ContaPagar>(`/api/contas-pagar/${id}`),

  buscarPorStatus: (status: string) =>
    fetchApi<ContaPagar[]>(`/api/contas-pagar/status/${status}`),

  criar: (conta: ContaPagar) =>
    fetchApi<ContaPagar>('/api/contas-pagar', {
      method: 'POST',
      body: JSON.stringify(conta),
    }),

  atualizar: (id: string, conta: ContaPagar) =>
    fetchApi<ContaPagar>(`/api/contas-pagar/${id}`, {
      method: 'PUT',
      body: JSON.stringify(conta),
    }),

  excluir: (id: string) =>
    fetchApi<void>(`/api/contas-pagar/${id}`, { method: 'DELETE' }),
};
