import type { CelulaRelatorio, ColunaRelatorio, RelatorioTabular } from './exportacao';
import {
  dataBr,
  diaDaSemana,
  formatarValor,
  lerIso,
  nomeMes,
  resumirVariacao,
  textoVariacaoCurto,
  type MetricaInfo,
} from './produtividade';
import type { PontoProdutividade, ProdutividadeDTO } from '../types';

const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

const tipoDoValor = (info: MetricaInfo): 'moeda' | 'percentual' | 'inteiro' =>
  info.unidade === 'MOEDA' ? 'moeda' : info.unidade === 'PERCENTUAL' ? 'percentual' : 'inteiro';

/** Colunas extras por métrica (chave em `detalhes` → cabeçalho). */
const EXTRAS: Partial<Record<MetricaInfo['id'], { chave: string; titulo: string }[]>> = {
  AGENDAMENTOS: [
    { chave: 'realizadas', titulo: 'Realizadas' },
    { chave: 'faltas', titulo: 'Faltas' },
    { chave: 'canceladas', titulo: 'Canceladas' },
    { chave: 'agendadas', titulo: 'Agendadas' },
  ],
  COMPARECIMENTO: [
    { chave: 'realizadas', titulo: 'Realizadas' },
    { chave: 'faltas', titulo: 'Faltas' },
  ],
};

/** Pontos que vão para o arquivo: o que está na tela, sem dias sem expediente nem futuro sem valor. */
const pontosExportaveis = (pontos: PontoProdutividade[]) =>
  pontos.filter((p) => !p.semExpediente && (p.valor != null || !p.futuro));

const rotuloDaLinha = (periodo: ProdutividadeDTO['periodo'], p: PontoProdutividade): CelulaRelatorio => {
  if (periodo === 'SEMANA') return `${dataBr(p.chave)} (${DIAS_CURTOS[diaDaSemana(p.chave)]})`;
  if (periodo === 'MES') return p.chave;
  if (periodo === 'ANO') return nomeMes(lerIso(p.chave).mes);
  return String(lerIso(p.chave).ano);
};

export interface OpcoesRelatorioProdutividade {
  info: MetricaInfo;
  dados: ProdutividadeDTO;
  /** "Outubro de 2026" */
  rotuloPeriodo: string;
  nomeClinica?: string;
  agora?: Date;
}

/** Monta o relatório da métrica, exatamente com o recorte que está na tela. */
export const montarRelatorioProdutividade = ({
  info,
  dados,
  rotuloPeriodo,
  nomeClinica,
  agora = new Date(),
}: OpcoesRelatorioProdutividade): RelatorioTabular => {
  const periodo = dados.periodo;
  const tipoValor = tipoDoValor(info);
  const extras = EXTRAS[info.id] ?? [];
  const primeira: ColunaRelatorio =
    periodo === 'SEMANA'
      ? { titulo: 'Data', tipo: 'texto' }
      : periodo === 'MES'
        ? { titulo: 'Data', tipo: 'data' }
        : periodo === 'ANO'
          ? { titulo: 'Mês', tipo: 'texto' }
          : { titulo: 'Ano', tipo: 'texto' };
  const colunas: ColunaRelatorio[] = [
    primeira,
    { titulo: info.colunaValor, tipo: tipoValor },
    ...extras.map((e) => ({ titulo: e.titulo, tipo: 'inteiro' as const })),
  ];

  const pontos = pontosExportaveis(dados.pontos);
  const linhas: CelulaRelatorio[][] = pontos.map((p) => [
    rotuloDaLinha(periodo, p),
    p.valor,
    ...extras.map((e) => (p.detalhes ? (p.detalhes[e.chave] ?? 0) : null)),
  ]);

  const mediaOuTaxa = info.id === 'COMPARECIMENTO' || info.id === 'TICKET_MEDIO';
  const total: CelulaRelatorio[] = [
    mediaOuTaxa ? 'No período' : 'Total',
    dados.total,
    ...extras.map((e) => pontos.reduce((soma, p) => soma + (p.detalhes ? (p.detalhes[e.chave] ?? 0) : 0), 0)),
  ];

  const variacao = resumirVariacao(info, periodo, dados.variacaoPercentual);
  let variacaoDestaque: string | undefined;
  let variacaoComplemento: string | undefined;
  if (variacao) {
    variacaoDestaque = variacao.texto;
    const anterior = dados.totalAnterior != null ? formatarValor(info.unidade, dados.totalAnterior) : null;
    variacaoComplemento = `${textoVariacaoCurto(dados.textoVariacao)}${anterior ? ` · período anterior: ${anterior}` : ''}`.trim();
  } else if (periodo === 'TODOS') {
    const anos = dados.anosDisponiveis;
    if (anos.length) {
      const de = Math.min(...anos);
      const ate = Math.max(...anos);
      variacaoComplemento = `${de === ate ? de : `${de} a ${ate}`} · ${ate - de + 1} ${ate - de + 1 === 1 ? 'ano' : 'anos'}`;
    }
  }

  return {
    titulo: 'Produtividade',
    contexto: `${info.rotulo} · ${rotuloPeriodo}`,
    periodo: rotuloPeriodo,
    nomeClinica,
    geradoEm: agora,
    resumoRotulo: mediaOuTaxa ? `${info.rotulo} no período` : 'Total no período',
    resumoValor: dados.total,
    resumoTipo: tipoValor,
    variacaoDestaque,
    variacaoComplemento,
    variacaoTom: variacao?.tom === 'bom' ? 'bom' : variacao?.tom === 'ruim' ? 'ruim' : 'neutro',
    colunas,
    linhas,
    total,
    aba: 'Produtividade',
    tituloDocumento: `Produtividade · ${info.rotulo} · ${rotuloPeriodo}`,
  };
};
