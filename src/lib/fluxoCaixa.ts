import type { CelulaRelatorio, RelatorioTabular } from './exportacao';
import { formatCurrency } from './utils';
import { nomeMes, passoBonito } from './produtividade';

/** Um mês do Fluxo de caixa (últimos 6 meses, já somados pela página de Auditoria). */
export interface MesFluxo {
  /** AAAA-MM */
  chave: string;
  /** "Mai" (eixo X) */
  mes: string;
  receita: number;
  despesa: number;
  lucro: number;
}

export const mesAno = (chave: string): { ano: number; mes: number } => {
  const [a, m] = chave.split('-').map(Number);
  return { ano: a, mes: m };
};

/** "Outubro de 2026" */
export const nomeMesCompleto = (chave: string): string => {
  const { ano, mes } = mesAno(chave);
  return `${nomeMes(mes)} de ${ano}`;
};

export const totaisFluxo = (fluxo: MesFluxo[]) =>
  fluxo.reduce(
    (t, m) => ({ receita: t.receita + m.receita, despesa: t.despesa + m.despesa, lucro: t.lucro + m.lucro }),
    { receita: 0, despesa: 0, lucro: 0 },
  );

export const fluxoVazio = (fluxo: MesFluxo[]): boolean =>
  fluxo.every((m) => m.receita === 0 && m.despesa === 0);

// ---------------------------------------------------------------- eixo Y

const moedaCompacta = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const numeroCompacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });

/** "R$ 2,5 mil", "-R$ 10 mil" (negativos abreviados); `curto` tira o "R$" (gráfico estreito). */
export const rotuloEixoMoeda = (v: number, curto: boolean): string => {
  if (v === 0) return curto ? '0' : 'R$ 0';
  return (curto ? numeroCompacto : moedaCompacta).format(v).replace(/\s/g, ' ');
};

/** Eixo com 4 a 6 marcas, aceitando lucro negativo (a faixa começa abaixo de zero). */
export const escalaFluxo = (fluxo: MesFluxo[]): { minimo: number; maximo: number; marcas: number[] } => {
  const valores = fluxo.flatMap((m) => [m.receita, m.despesa, m.lucro]);
  const menor = Math.min(0, ...valores);
  const maior = Math.max(0, ...valores);
  if (menor === 0 && maior === 0) return { minimo: 0, maximo: 4, marcas: [0, 1, 2, 3, 4] };
  const passo = passoBonito((maior - menor) / 4, false);
  const minimo = Math.floor(menor / passo) * passo;
  const maximo = Math.ceil(maior / passo) * passo;
  const marcas: number[] = [];
  for (let v = minimo; v <= maximo + passo / 1000; v += passo) marcas.push(Math.round(v * 100) / 100);
  return { minimo, maximo, marcas };
};

// ---------------------------------------------------------------- texto e arquivos

export const periodoFluxoTexto = (fluxo: MesFluxo[]): string => {
  if (fluxo.length === 0) return 'Últimos 6 meses';
  const ini = mesAno(fluxo[0].chave);
  const fim = mesAno(fluxo[fluxo.length - 1].chave);
  const a = nomeMes(ini.mes).toLowerCase();
  const b = nomeMes(fim.mes).toLowerCase();
  return `Últimos 6 meses · ${a}${ini.ano !== fim.ano ? ` de ${ini.ano}` : ''} a ${b} de ${fim.ano}`;
};

export const textoResumoFluxo = (fluxo: MesFluxo[], mascarado: boolean): string => {
  if (mascarado) return 'Gráfico de receitas, despesas e lucro líquido dos últimos 6 meses. Valores financeiros ocultos.';
  const t = totaisFluxo(fluxo);
  let texto = `Gráfico de receitas, despesas e lucro líquido dos últimos 6 meses. Receita total ${formatCurrency(t.receita)}, despesa total ${formatCurrency(t.despesa)}, lucro líquido ${formatCurrency(t.lucro)}.`;
  const negativos = fluxo.filter((m) => m.lucro < 0).map((m) => nomeMes(mesAno(m.chave).mes).toLowerCase());
  if (negativos.length) texto += ` Lucro negativo em ${negativos.join(', ')}.`;
  return texto;
};

export const nomeArquivoFluxo = (fluxo: MesFluxo[], extensao: string): string => {
  const ini = fluxo[0]?.chave ?? 'inicio';
  const fim = fluxo[fluxo.length - 1]?.chave ?? 'fim';
  return `bokka-fluxo-de-caixa-ultimos-6-meses-${ini}-a-${fim}.${extensao}`;
};

export const montarRelatorioFluxo = (
  fluxo: MesFluxo[],
  nomeClinica: string | undefined,
  agora: Date = new Date(),
): RelatorioTabular => {
  const t = totaisFluxo(fluxo);
  const contexto = periodoFluxoTexto(fluxo);
  const linhas: CelulaRelatorio[][] = fluxo.map((m) => [nomeMesCompleto(m.chave), m.receita, m.despesa, m.lucro]);
  return {
    titulo: 'Fluxo de caixa',
    contexto,
    periodo: contexto.replace('Últimos 6 meses · ', ''),
    nomeClinica,
    geradoEm: agora,
    resumoRotulo: 'Total nos últimos 6 meses',
    resumoValor: t.lucro,
    resumoTipo: 'moeda',
    resumoLista: [
      { rotulo: 'Receitas', valor: t.receita, tipo: 'moeda' },
      { rotulo: 'Despesas', valor: t.despesa, tipo: 'moeda' },
      { rotulo: 'Lucro líquido', valor: t.lucro, tipo: 'moeda' },
    ],
    colunas: [
      { titulo: 'Mês', tipo: 'texto' },
      { titulo: 'Receitas (R$)', tipo: 'moeda' },
      { titulo: 'Despesas (R$)', tipo: 'moeda' },
      { titulo: 'Lucro líquido (R$)', tipo: 'moeda' },
    ],
    linhas,
    total: ['Total', t.receita, t.despesa, t.lucro],
    aba: 'Fluxo de caixa',
    tituloDocumento: `Fluxo de caixa · ${contexto}`,
  };
};
