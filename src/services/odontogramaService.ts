import { fetchApi } from './api';
import type { Odontograma } from '../types';

export const odontogramaService = {
  listarPorPaciente: (pacienteId: string) =>
    fetchApi<Odontograma[]>(`/api/odontogramas/paciente/${pacienteId}`),

  buscarRecente: (pacienteId: string) =>
    fetchApi<Odontograma>(`/api/odontogramas/paciente/${pacienteId}/recente`),

  buscarPorId: (id: string) => fetchApi<Odontograma>(`/api/odontogramas/${id}`),

  criar: (o: Odontograma) =>
    fetchApi<Odontograma>('/api/odontogramas', { method: 'POST', body: JSON.stringify(o) }),
};
