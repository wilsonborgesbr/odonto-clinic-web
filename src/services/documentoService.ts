import { fetchApi } from './api';
import type { Documento } from '../types';

export const documentoService = {
  listarPorPaciente: (pacienteId: string) =>
    fetchApi<Documento[]>(`/api/documentos/paciente/${pacienteId}`),

  buscarPorId: (id: string) => fetchApi<Documento>(`/api/documentos/${id}`),

  criar: (d: Documento) =>
    fetchApi<Documento>('/api/documentos', { method: 'POST', body: JSON.stringify(d) }),

  excluir: (id: string) =>
    fetchApi<void>(`/api/documentos/${id}`, { method: 'DELETE' }),
};
