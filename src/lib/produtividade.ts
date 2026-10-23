import type {
  MetricaProdutividade,
  PeriodoProdutividade,
  PermissaoEnum,
  PontoProdutividade,
  ProdutividadeDTO,
  UnidadeProdutividade,
} from '../types';

// ============ CATÁLOGO DE MÉTRICAS ============

export type GrupoMetrica = 'Agenda' | 'Pacientes' | 'Financeiro';
export type MelhorQuando = 'maior' | 'menor' | 'neutro';

export interface MetricaInfo {
  id: MetricaProdutividade;
  rotulo: string;
  grupo: GrupoMetrica;
  descricao: string;
  permissao: PermissaoEnum;
  unidade: UnidadeProdutividade;
  /** Depende do olho de privacidade (mascarada e sem exportação com valores ocultos). */
  financeira: boolean;
  melhor: MelhorQuando;
  /** Mostra pontos futuros e deixa navegar para períodos futuros com dados. */
  projetaFuturo: boolean;
  /** [singular, plural] do valor no tooltip (só contagens). */
  substantivo?: [string, string];
  vazio: string;
  /** Cabeçalho da coluna de valor nos arquivos exportados. */
  colunaValor: string;
  /** Trecho do nome do arquivo exportado. */
  arquivo: string;
  linkAgenda?: boolean;
}

export const METRICAS: MetricaInfo[] = [
  {
    id: 'CONSULTAS_REALIZADAS',
    rotulo: 'Consultas realizadas',
    grupo: 'Agenda',
    descricao: 'Atendimentos concluídos',
    permissao: 'AGENDAMENTOS',
    unidade: 'CONTAGEM',
    financeira: false,
    melhor: 'maior',
    projetaFuturo: false,
    substantivo: ['consulta', 'consultas'],
    vazio: 'Sem consultas realizadas neste período',
    colunaValor: 'Consultas realizadas',
    arquivo: 'consultas',
    linkAgenda: true,
  },
  {
    id: 'AGENDAMENTOS',
    rotulo: 'Agendamentos',
    grupo: 'Agenda',
    descricao: 'Todos os horários marcados',
    permissao: 'AGENDAMENTOS',
    unidade: 'CONTAGEM',
    financeira: false,
    melhor: 'maior',
    projetaFuturo: true,
    substantivo: ['agendamento', 'agendamentos'],
    vazio: 'Nenhum agendamento neste período',
    colunaValor: 'Agendamentos',
    arquivo: 'agendamentos',
    linkAgenda: true,
  },
  {
    id: 'FALTAS',
    rotulo: 'Faltas',
    grupo: 'Agenda',
    descricao: 'Pacientes que não compareceram',
    permissao: 'AGENDAMENTOS',
    unidade: 'CONTAGEM',
    financeira: false,
    melhor: 'menor',
    projetaFuturo: false,
    substantivo: ['falta', 'faltas'],
    vazio: 'Nenhuma falta neste período',
    colunaValor: 'Faltas',
    arquivo: 'faltas',
  },
  {
    id: 'COMPARECIMENTO',
    rotulo: 'Comparecimento',
    grupo: 'Agenda',
    descricao: '% que compareceu entre os previstos',
    permissao: 'AGENDAMENTOS',
    unidade: 'PERCENTUAL',
    financeira: false,
    melhor: 'maior',
    projetaFuturo: false,
    vazio: 'Sem dados de comparecimento neste período',
    colunaValor: 'Comparecimento (%)',
    arquivo: 'comparecimento',
  },
  {
    id: 'CANCELAMENTOS',
    rotulo: 'Cancelamentos',
    grupo: 'Agenda',
    descricao: 'Horários cancelados',
    permissao: 'AGENDAMENTOS',
    unidade: 'CONTAGEM',
    financeira: false,
    melhor: 'menor',
    projetaFuturo: false,
    substantivo: ['cancelamento', 'cancelamentos'],
    vazio: 'Nenhum cancelamento neste período',
    colunaValor: 'Cancelamentos',
    arquivo: 'cancelamentos',
  },
  {
    id: 'NOVOS_PACIENTES',
    rotulo: 'Novos pacientes',
    grupo: 'Pacientes',
    descricao: 'Cadastros no período',
    permissao: 'PACIENTES',
    unidade: 'CONTAGEM',
    financeira: false,
    melhor: 'maior',
    projetaFuturo: false,
    substantivo: ['paciente novo', 'pacientes novos'],
    vazio: 'Nenhum paciente novo neste período',
    colunaValor: 'Novos pacientes',
    arquivo: 'novos-pacientes',
  },
  {
    id: 'FATURAMENTO',
    rotulo: 'Faturamento',
    grupo: 'Financeiro',
    descricao: 'Valor recebido',
    permissao: 'AUDITORIA_FINANCEIRA',
    unidade: 'MOEDA',
    financeira: true,
    melhor: 'maior',
    projetaFuturo: false,
    vazio: 'Sem recebimentos neste período',
    colunaValor: 'Faturamento (R$)',
    arquivo: 'faturamento',
  },
  {
    id: 'TICKET_MEDIO',
    rotulo: 'Ticket médio',
    grupo: 'Financeiro',
    descricao: 'Recebido por paciente que pagou',
    permissao: 'AUDITORIA_FINANCEIRA',
    unidade: 'MOEDA',
    financeira: true,
    melhor: 'maior',
    projetaFuturo: false,
    vazio: 'Sem dados de ticket médio neste período',
    colunaValor: 'Ticket médio (R$)',
    arquivo: 'ticket-medio',
  },
  {
    id: 'A_RECEBER',
    rotulo: 'A receber',
    grupo: 'Financeiro',
    descricao: 'Vencimentos em aberto',
    permissao: 'AUDITORIA_FINANCEIRA',
    unidade: 'MOEDA',
    financeira: true,
    melhor: 'neutro',
    projetaFuturo: true,
    vazio: 'Nada a receber neste período',
    colunaValor: 'A receber (R$)',
    arquivo: 'a-receber',
  },
];

export const METRICA_PADRAO: MetricaProdutividade = 'CONSULTAS_REALIZADAS';
export const GRUPOS_METRICA: GrupoMetrica[] = ['Agenda', 'Pacientes', 'Financeiro'];

const METRICAS_POR_ID = new Map(METRICAS.map((m) => [m.id, m]));
export const infoMetrica = (id: MetricaProdutividade): MetricaInfo => METRICAS_POR_ID.get(id)!;
export const ehMetrica = (v: unknown): v is MetricaProdutividade =>
  typeof v === 'string' && METRICAS_POR_ID.has(v as MetricaProdutividade);

export const PERIODOS: { id: PeriodoProdutividade; rotulo: string; nome: string }[] = [
  { id: 'SEMANA', rotulo: 'Semana', nome: 'Semana' },
  { id: 'MES', rotulo: 'Mês', nome: 'Mês' },
  { id: 'ANO', rotulo: 'Ano', nome: 'Ano' },
  { id: 'TODOS', rotulo: 'Todos', nome: 'Todos os anos' },
];
export const PERIODO_PADRAO: PeriodoProdutividade = 'MES';
export const ehPeriodo = (v: unknown): v is PeriodoProdutividade =>
  v === 'SEMANA' || v === 'MES' || v === 'ANO' || v === 'TODOS';

// ============ PREFERÊNCIAS POR NAVEGADOR ============

export const PREF_METRICA = 'bokka:produtividade:metrica';
export const PREF_PERIODO = 'bokka:produtividade:periodo';
export const PREF_COMPARAR = 'bokka:produtividade:comparar';

export const lerPreferencia = (chave: string): string | null => {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
};

export const gravarPreferencia = (chave: string, valor: string) => {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    /* sem localStorage: a escolha vale só nesta sessão */
  }
};

// ============ DATAS (strings AAAA-MM-DD, sem fuso do navegador) ============

const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_LONGOS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const pad2 = (n: number) => String(n).padStart(2, '0');
const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface DataPura {
  ano: number;
  mes: number; // 1-12
  dia: number;
}

export const lerIso = (iso: string): DataPura => {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return { ano: a, mes: m, dia: d };
};

export const montarIso = (ano: number, mes: number, dia: number): string => {
  // Date só para normalizar estouros de mês/dia (UTC evita qualquer desvio de fuso)
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
};

export const hojeLocalIso = (agora: Date = new Date()): string =>
  `${agora.getFullYear()}-${pad2(agora.getMonth() + 1)}-${pad2(agora.getDate())}`;

export const somarDias = (iso: string, n: number): string => {
  const { ano, mes, dia } = lerIso(iso);
  return montarIso(ano, mes, dia + n);
};

/** 0 = domingo ... 6 = sábado */
export const diaDaSemana = (iso: string): number => {
  const { ano, mes, dia } = lerIso(iso);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
};

export const segundaDaSemana = (iso: string): string =>
  somarDias(iso, -((diaDaSemana(iso) + 6) % 7));

export const primeiroDiaDoMes = (iso: string): string => {
  const { ano, mes } = lerIso(iso);
  return montarIso(ano, mes, 1);
};

/** Início do período que contém `ref` (segunda, dia 1, 1º de janeiro). */
export const inicioDoPeriodo = (periodo: PeriodoProdutividade, ref: string): string => {
  const { ano, mes } = lerIso(ref);
  if (periodo === 'SEMANA') return segundaDaSemana(ref);
  if (periodo === 'MES') return montarIso(ano, mes, 1);
  if (periodo === 'ANO') return montarIso(ano, 1, 1);
  return montarIso(1900, 1, 1);
};

/** Move a referência um período para trás (-1) ou para a frente (+1). */
export const deslocarReferencia = (
  periodo: PeriodoProdutividade,
  ref: string,
  direcao: -1 | 1,
): string => {
  const { ano, mes } = lerIso(ref);
  if (periodo === 'SEMANA') return somarDias(ref, 7 * direcao);
  if (periodo === 'MES') return montarIso(ano, mes + direcao, 1);
  if (periodo === 'ANO') return montarIso(ano + direcao, 1, 1);
  return ref;
};

/** Texto curto do botão de período: "19 a 25 de out", "Outubro de 2026", "2026", "Todos os anos". */
export const rotuloPeriodoCurto = (periodo: PeriodoProdutividade, ref: string): string => {
  const { ano, mes } = lerIso(ref);
  if (periodo === 'MES') return `${capitalizar(MESES_LONGOS[mes - 1])} de ${ano}`;
  if (periodo === 'ANO') return String(ano);
  if (periodo === 'TODOS') return 'Todos os anos';
  const ini = lerIso(segundaDaSemana(ref));
  const fim = lerIso(somarDias(segundaDaSemana(ref), 6));
  if (ini.mes === fim.mes) return `${ini.dia} a ${fim.dia} de ${MESES_CURTOS[fim.mes - 1]}`;
  return `${ini.dia} ${MESES_CURTOS[ini.mes - 1]} a ${fim.dia} ${MESES_CURTOS[fim.mes - 1]}`;
};

/** "qui, 23 de out" */
export const rotuloDia = (iso: string): string => {
  const { mes, dia } = lerIso(iso);
  return `${DIAS_CURTOS[diaDaSemana(iso)]}, ${dia} de ${MESES_CURTOS[mes - 1]}`;
};

/** "20/10/2026" */
export const dataBr = (iso: string): string => {
  const { ano, mes, dia } = lerIso(iso);
  return `${pad2(dia)}/${pad2(mes)}/${ano}`;
};

/** Rótulo completo do ponto no tooltip e na tabela para leitor de tela. */
export const rotuloDoPonto = (periodo: PeriodoProdutividade, ponto: PontoProdutividade): string => {
  const { ano, mes } = lerIso(ponto.chave);
  if (periodo === 'ANO') return `${capitalizar(MESES_LONGOS[mes - 1])} de ${ano}`;
  if (periodo === 'TODOS') return String(ano);
  return rotuloDia(ponto.chave);
};

export const nomeMes = (mes: number): string => capitalizar(MESES_LONGOS[mes - 1]);

// ============ NÚMEROS ============

const nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlCompacto = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const MASCARA_MOEDA = 'R$ ••••';

export const formatarValor = (unidade: UnidadeProdutividade, v: number | null | undefined): string => {
  if (v == null || Number.isNaN(v)) return '—';
  if (unidade === 'MOEDA') return brl.format(v);
  if (unidade === 'PERCENTUAL') return `${nf1.format(v)}%`;
  return nf0.format(Math.round(v));
};

export const formatarValorTooltip = (info: MetricaInfo, v: number | null | undefined): string => {
  if (v == null) return 'Sem dados';
  if (info.unidade !== 'CONTAGEM') return formatarValor(info.unidade, v);
  const n = Math.round(v);
  const [sing, plur] = info.substantivo ?? ['', ''];
  return `${nf0.format(n)} ${n === 1 ? sing : plur}`.trim();
};

export const rotuloEixoY = (unidade: UnidadeProdutividade, v: number): string => {
  if (unidade === 'MOEDA') return v === 0 ? 'R$ 0' : brlCompacto.format(v).replace(/\s/g, ' ');
  if (unidade === 'PERCENTUAL') return `${nf0.format(v)}%`;
  return nf0.format(v);
};

export const passoBonito = (bruto: number, inteiro: boolean): number => {
  if (bruto <= 0) return 1;
  const e = Math.pow(10, Math.floor(Math.log10(bruto)));
  const f = bruto / e;
  const n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  const s = n * e;
  return inteiro && s < 1 ? 1 : s;
};

/** Eixo Y: sempre começa em 0; comparecimento fixo 0 a 100; demais com 3 degraus e ~5% de folga. */
export const escalaY = (
  unidade: UnidadeProdutividade,
  valores: number[],
): { topo: number; marcas: number[] } => {
  if (unidade === 'PERCENTUAL') return { topo: 100, marcas: [0, 50, 100] };
  const maior = Math.max(1, ...valores) * 1.05;
  const passo = passoBonito(maior / 3, unidade === 'CONTAGEM');
  return { topo: passo * 3, marcas: [0, passo, passo * 2, passo * 3] };
};

// ============ VARIAÇÃO ============

export type DirecaoVariacao = 'subiu' | 'desceu' | 'igual';
export type TomVariacao = 'bom' | 'ruim' | 'neutro';

export interface VariacaoResumo {
  texto: string;
  direcao: DirecaoVariacao;
  tom: TomVariacao;
}

/** null = sem selo (falta um dos lados, anterior zerado ou "Todos os anos"). */
export const resumirVariacao = (
  info: MetricaInfo,
  periodo: PeriodoProdutividade,
  variacao: number | null | undefined,
): VariacaoResumo | null => {
  if (periodo === 'TODOS' || variacao == null || Number.isNaN(variacao)) return null;
  const arredondado = Math.round(variacao * 10) / 10;
  const direcao: DirecaoVariacao = arredondado > 0 ? 'subiu' : arredondado < 0 ? 'desceu' : 'igual';
  const sinal = arredondado > 0 ? '+' : arredondado < 0 ? '−' : '';
  const numero = nf1.format(Math.abs(arredondado));
  const texto = info.unidade === 'PERCENTUAL' ? `${sinal}${numero} p.p.` : `${sinal}${numero}%`;
  let tom: TomVariacao = 'neutro';
  if (direcao !== 'igual' && info.melhor !== 'neutro') {
    const bom = (direcao === 'subiu') === (info.melhor === 'maior');
    tom = bom ? 'bom' : 'ruim';
  }
  return { texto, direcao, tom };
};

// ============ PONTOS, TOOLTIP E ACESSIBILIDADE ============

const plural = (n: number, s: string, p: string) => (n === 1 ? s : p);

/** Linha extra do tooltip (detalhes do ponto). Vazia quando não há nada útil. */
export const linhaExtra = (info: MetricaInfo, ponto: PontoProdutividade): string => {
  const d = ponto.detalhes;
  if (!d) return '';
  const n = (k: string) => Math.round(Number(d[k] ?? 0));
  switch (info.id) {
    case 'CONSULTAS_REALIZADAS':
    case 'FALTAS':
    case 'CANCELAMENTOS': {
      const t = n('agendamentos');
      return t > 0 ? `de ${nf0.format(t)} ${plural(t, 'agendamento', 'agendamentos')}` : '';
    }
    case 'AGENDAMENTOS': {
      const partes: string[] = [];
      const r = n('realizadas');
      const f = n('faltas');
      const c = n('canceladas');
      const a = n('agendadas');
      if (r) partes.push(`${r} ${plural(r, 'realizada', 'realizadas')}`);
      if (f) partes.push(`${f} ${plural(f, 'falta', 'faltas')}`);
      if (c) partes.push(`${c} ${plural(c, 'cancelada', 'canceladas')}`);
      if (a) partes.push(`${a} ${plural(a, 'agendada', 'agendadas')}`);
      return partes.join(' · ');
    }
    case 'COMPARECIMENTO': {
      const prev = n('previstos');
      return prev > 0 ? `${n('realizadas')} de ${prev} atendimentos previstos` : '';
    }
    case 'FATURAMENTO': {
      const r = n('recebimentos');
      return r > 0 ? `${r} ${plural(r, 'recebimento', 'recebimentos')}` : '';
    }
    case 'TICKET_MEDIO': {
      const p = n('pacientesPagantes');
      return p > 0 ? `${p} ${plural(p, 'paciente pagante', 'pacientes pagantes')}` : '';
    }
    case 'A_RECEBER': {
      const atrasado = Number(d.atrasado ?? 0);
      return atrasado > 0 ? `${brl.format(atrasado)} em atraso` : '';
    }
    default:
      return '';
  }
};

/** Nenhum dado a mostrar: tudo zerado ou sem base no período. */
export const periodoVazio = (info: MetricaInfo, dados: ProdutividadeDTO): boolean => {
  const valores = dados.pontos.map((p) => p.valor).filter((v): v is number => v != null);
  if (valores.length === 0) return true;
  if (info.unidade === 'PERCENTUAL') return false;
  return valores.every((v) => v === 0) && !dados.total;
};

export const textoResumoGrafico = (
  info: MetricaInfo,
  dados: ProdutividadeDTO,
  mascarado: boolean,
  rotuloPeriodo: string,
): string => {
  if (mascarado) return `Gráfico de área. ${info.rotulo} em ${rotuloPeriodo}. Valores financeiros ocultos.`;
  const variacao = resumirVariacao(info, dados.periodo, dados.variacaoPercentual);
  let t = `Gráfico de área. ${info.rotulo} em ${rotuloPeriodo}: ${formatarValor(info.unidade, dados.total)}${
    info.unidade === 'PERCENTUAL' ? ' no período' : ' no total'
  }`;
  if (variacao && variacao.direcao !== 'igual') {
    t += `, ${variacao.texto.replace(/^[+−]/, '')} ${variacao.direcao === 'subiu' ? 'a mais' : 'a menos'} que no período anterior`;
    if (variacao.tom === 'ruim') t += ', o que é ruim';
  }
  let maior: PontoProdutividade | null = null;
  for (const p of dados.pontos) {
    if (p.valor != null && (maior == null || p.valor > (maior.valor as number))) maior = p;
  }
  if (maior && (maior.valor as number) > 0) {
    t += `. Maior ponto: ${rotuloDoPonto(dados.periodo, maior)}, com ${formatarValor(info.unidade, maior.valor)}`;
  }
  return `${t}.`;
};

/** Índices (na lista de pontos plotados) que recebem rótulo no eixo X. */
export const indicesRotuloX = (
  periodo: PeriodoProdutividade,
  pontos: { rotulo: string; chave: string }[],
  estreito: boolean,
): Set<number> => {
  const n = pontos.length;
  const saida = new Set<number>();
  if (periodo === 'SEMANA' || n <= 1) {
    pontos.forEach((_, i) => saida.add(i));
    return saida;
  }
  if (periodo === 'MES') {
    const dias = estreito ? [1, 8, 15, 22, 29] : [1, 5, 10, 15, 20, 25];
    const diaDe = (i: number) => lerIso(pontos[i].chave).dia;
    let ultimoDia = 0;
    for (const alvo of dias) {
      // Dia alvo sem ponto (domingo/sem expediente não é plotado): usa o ponto seguinte, se estiver a 1 dia
      const i = pontos.findIndex((_, idx) => diaDe(idx) >= alvo);
      if (i >= 0 && diaDe(i) - alvo <= 1 && diaDe(i) > ultimoDia) {
        saida.add(i);
        ultimoDia = diaDe(i);
      }
    }
    if (diaDe(n - 1) - ultimoDia >= (estreito ? 4 : 2)) saida.add(n - 1);
    return saida;
  }
  if (periodo === 'ANO') {
    pontos.forEach((_, i) => {
      if (!estreito || i % 2 === 0) saida.add(i);
    });
    return saida;
  }
  const passo = estreito && n > 4 ? 2 : 1;
  for (let i = 0; i < n; i += passo) saida.add(i);
  saida.add(n - 1);
  return saida;
};

// ============ NOMES DE ARQUIVO ============

export const nomeArquivoProdutividade = (
  info: MetricaInfo,
  periodo: PeriodoProdutividade,
  ref: string,
  anos: number[],
  extensao: string,
): string => {
  const { ano, mes } = lerIso(ref);
  let parte: string;
  if (periodo === 'SEMANA') {
    const ini = segundaDaSemana(ref);
    parte = `semana-${ini}-a-${somarDias(ini, 6)}`;
  } else if (periodo === 'MES') parte = `mes-${ano}-${pad2(mes)}`;
  else if (periodo === 'ANO') parte = `ano-${ano}`;
  else parte = anos.length ? `todos-${Math.min(...anos)}-${Math.max(...anos)}` : 'todos';
  return `bokka-produtividade-${info.arquivo}-${parte}.${extensao}`;
};

/** Texto do "mesmo intervalo" explicado no title do selo. */
export const dicaMesmoIntervalo = (textoVariacao: string | null | undefined): string | undefined =>
  textoVariacao && /mesmo intervalo/.test(textoVariacao)
    ? 'Compara os mesmos dias do período anterior, porque o período atual ainda não terminou.'
    : undefined;

/** "vs mês anterior" sem o parêntese técnico do servidor. */
export const textoVariacaoCurto = (textoVariacao: string | null | undefined): string =>
  (textoVariacao ?? '').replace(/\s*\(.*\)\s*$/, '').trim();
