import { fetchApi } from './api';
import type { DentistaListagemDTO, PageResponse } from '../types';

export const dentistaService = {
  listarAtivos: () =>
    fetchApi<PageResponse<DentistaListagemDTO>>(
      '/api/dentistas?pagina=0&tamanho=200&ordem=nomeCompleto',
    ),
};
