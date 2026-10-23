import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MetricaProdutividade, PeriodoProdutividade, ProdutividadeDTO } from '../types';

export interface ConsultarProdutividadeParams {
  metrica: MetricaProdutividade;
  periodo: PeriodoProdutividade;
  /** AAAA-MM-DD */
  referencia: string;
  dentistaId?: string;
}

export const produtividadeService = {
  consultar: async (params: ConsultarProdutividadeParams) =>
    (await api.get<ProdutividadeDTO>('/api/dashboard/produtividade', { params })).data,
};

export const produtividadeKeys = {
  all: ['dashboard', 'produtividade'] as const,
  consulta: (p: ConsultarProdutividadeParams) => [...produtividadeKeys.all, p] as const,
};

export const useProdutividade = (params: ConsultarProdutividadeParams, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: produtividadeKeys.consulta(params),
    queryFn: () => produtividadeService.consultar(params),
    // Ao trocar métrica ou período o gráfico anterior fica na tela (esmaecido) até chegar o novo
    placeholderData: (prev) => prev,
    enabled: options?.enabled ?? true,
    retry: false,
    staleTime: 30_000,
  });
