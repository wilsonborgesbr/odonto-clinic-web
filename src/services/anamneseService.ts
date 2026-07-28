import { fetchApi } from './api';
import type { Anamnese } from '../types';

export const anamneseService = {
  listarPorPaciente: (pacienteId: string) =>
    fetchApi<Anamnese[]>(`/api/anamneses/paciente/${pacienteId}`),

  buscarRecente: (pacienteId: string) =>
    fetchApi<Anamnese>(`/api/anamneses/paciente/${pacienteId}/recente`),

  buscarPorId: (id: string) => fetchApi<Anamnese>(`/api/anamneses/${id}`),

  criar: (a: Anamnese) =>
    fetchApi<Anamnese>('/api/anamneses', { method: 'POST', body: JSON.stringify(a) }),
};
