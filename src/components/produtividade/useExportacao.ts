import { useEffect, useRef, useState } from 'react';
import { useFinancialVisibility } from '../../context/FinancialVisibilityContext';
import {
  ErroCarregarGerador,
  NOMES_FORMATO,
  baixarBlob,
  gerarArquivo,
  type FormatoExportacao,
  type RelatorioTabular,
} from '../../lib/exportacao';
import type { User } from '../../types';
import { bokkaToast } from '../ui/Toast';

interface PedidoExportacao {
  formato: FormatoExportacao;
  /** Relatório com valores em R$: só sai com os valores visíveis e a preferência confirmada. */
  financeiro: boolean;
  montarRelatorio: () => RelatorioTabular;
  nomeArquivo: (extensao: FormatoExportacao) => string;
  /** Para o aviso de sucesso: "Excel {descricao} baixado." (ex.: "de produtividade"). */
  descricao: string;
}

/**
 * Exportação dos cards de gráfico (Produtividade e Fluxo de caixa). Ignora duplo clique e confere a regra de
 * privacidade de novo no clique e depois de gerar o arquivo (o olho pode mudar em outra aba com o menu aberto).
 */
export const useExportacao = () => {
  const { visible, pronto } = useFinancialVisibility();
  const [gerando, setGerando] = useState<FormatoExportacao | null>(null);
  const privacidade = useRef({ visible, pronto });
  useEffect(() => {
    privacidade.current = { visible, pronto };
  }, [visible, pronto]);

  const exportar = async ({ formato, financeiro, montarRelatorio, nomeArquivo, descricao }: PedidoExportacao) => {
    if (gerando) return;
    const bloqueado = () => financeiro && (!privacidade.current.visible || !privacidade.current.pronto);
    if (bloqueado()) {
      bokkaToast.error('Mostre os valores para exportar.');
      return;
    }
    setGerando(formato);
    const nome = NOMES_FORMATO[formato];
    try {
      const blob = await gerarArquivo(formato, montarRelatorio());
      if (bloqueado()) {
        bokkaToast.error('Mostre os valores para exportar.');
        return;
      }
      baixarBlob(blob, nomeArquivo(formato));
      bokkaToast.success(`${nome} ${descricao} baixado.`);
    } catch (e) {
      bokkaToast.error(
        e instanceof ErroCarregarGerador
          ? 'Não foi possível carregar o gerador de arquivos. Verifique sua conexão e tente de novo.'
          : `Não foi possível gerar o ${nome}. Tente novamente.`,
      );
    } finally {
      setGerando(null);
    }
  };

  return { gerando, exportar };
};

/** Nome da clínica para os relatórios: vem da sessão (claim clinicaNome); sem ele, usa o código. */
export const nomeDaClinica = (user: User | null | undefined): string | undefined =>
  user?.clinicaNome ?? (user?.clinicaCodigo ? `Clínica ${user.clinicaCodigo}` : undefined);
