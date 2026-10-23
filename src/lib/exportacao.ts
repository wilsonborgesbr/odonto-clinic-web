/**
 * Geração de arquivos no navegador (CSV, Excel e PDF) a partir de um relatório tabular já montado.
 * Excel e PDF usam bibliotecas pesadas (write-excel-file e jspdf/jspdf-autotable, todas MIT), carregadas
 * por import() só no clique de exportar. Nada é enviado a servidor: o arquivo sai dos dados da tela.
 */

/** A biblioteca de Excel/PDF não pôde ser baixada (sem internet, bloqueio de rede). */
export class ErroCarregarGerador extends Error {
  constructor() {
    super('Não foi possível carregar o gerador de arquivos.');
    this.name = 'ErroCarregarGerador';
  }
}

const carregar = <T>(importacao: Promise<T>): Promise<T> =>
  importacao.catch(() => {
    throw new ErroCarregarGerador();
  });

export type TipoColuna = 'texto' | 'data' | 'inteiro' | 'moeda' | 'percentual';

export interface ColunaRelatorio {
  titulo: string;
  tipo: TipoColuna;
}

/** Célula: texto, número (moeda e contagem em unidades; percentual em 0-100), data AAAA-MM-DD (tipo 'data') ou vazio. */
export type CelulaRelatorio = string | number | null;

export type TomResumo = 'bom' | 'ruim' | 'neutro';

export interface RelatorioTabular {
  /** Ex.: "Produtividade" */
  titulo: string;
  /** Ex.: "Consultas realizadas · Outubro de 2026" */
  contexto: string;
  /** Ex.: "Outubro de 2026" (linha "Período:" do Excel) */
  periodo: string;
  nomeClinica?: string;
  geradoEm: Date;
  /** Rótulo e valor principal (ex.: "Total no período", 128). */
  resumoRotulo: string;
  resumoValor: number | null;
  resumoTipo: Exclude<TipoColuna, 'texto' | 'data'>;
  /** Vários números lado a lado no PDF (Fluxo de caixa); quando existe, substitui o valor principal. */
  resumoLista?: { rotulo: string; valor: number; tipo: 'moeda' }[];
  /** Ex.: "+12,5%" (em destaque) e "vs mês anterior · período anterior: 114" (complemento). */
  variacaoDestaque?: string;
  variacaoComplemento?: string;
  variacaoTom?: TomResumo;
  colunas: ColunaRelatorio[];
  linhas: CelulaRelatorio[][];
  /** Linha final em negrito (Total ou "No período"). */
  total?: CelulaRelatorio[];
  /** Nome da aba do Excel. */
  aba: string;
  /** Texto do documento PDF (propriedade "Título"). */
  tituloDocumento: string;
}

// ---------------------------------------------------------------- utilidades

const pad2 = (n: number) => String(n).padStart(2, '0');

export const dataHoraBr = (d: Date): string =>
  `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} às ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const nfMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const nfInteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const nfPct = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nfDecimal2 = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: false,
});

/**
 * Proteção contra injeção de fórmula (CSV e Excel): texto que começa com = + - @ (ou tab / retorno de carro)
 * seria interpretado como fórmula ao abrir no Excel ou no Sheets. Ganha o prefixo ' e vira texto. Vale só para
 * TEXTO: números e datas seguem numéricos (um negativo de verdade nunca passa por aqui).
 */
const INICIO_DE_FORMULA = /^[=+@\t\r-]/;
export const protegerTexto = (texto: string): string =>
  INICIO_DE_FORMULA.test(texto) ? `'${texto}` : texto;

const EH_DATA_ISO = /^[0-9]{4}-[0-9]{2}-[0-9]{2}/;

const dataBr = (iso: string): string => {
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
};

/** Formatação para leitura humana (PDF). */
const textoCelula = (tipo: TipoColuna, v: CelulaRelatorio): string => {
  if (v == null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) return '';
  if (typeof v === 'string') return tipo === 'data' && EH_DATA_ISO.test(v) ? dataBr(v) : v;
  if (tipo === 'moeda') return nfMoeda.format(v);
  if (tipo === 'percentual') return `${nfPct.format(v)}%`;
  if (tipo === 'inteiro') return nfInteiro.format(v);
  return String(v);
};

export const slugArquivo = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const baixarBlob = (blob: Blob, nomeArquivo: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // O navegador pode ainda estar iniciando o download: libera depois
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
};

// ---------------------------------------------------------------- CSV

/** Escapa uma célula de TEXTO: protege fórmula, dobra aspas e envolve em aspas se tiver ; " ou quebra de linha. */
const celulaCsv = (original: string): string => {
  const texto = protegerTexto(original);
  return /[;"\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

const valorCsv = (tipo: TipoColuna, v: CelulaRelatorio): string => {
  // Vazio de verdade: ponto sem valor (sem expediente, futuro, sem base) ou número inválido
  if (v == null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) return '';
  if (typeof v === 'string') {
    // Data AAAA-MM-DD vira dd/mm/aaaa (não é texto livre); o resto passa pela proteção de fórmula
    return tipo === 'data' && EH_DATA_ISO.test(v) ? dataBr(v) : celulaCsv(v);
  }
  // Números com vírgula decimal (padrão pt-BR do Excel), sem separador de milhar; negativos ficam como estão
  if (tipo === 'moeda' || tipo === 'percentual') return nfDecimal2.format(v);
  return String(Math.round(v));
};

/** CSV pt-BR: separador ";", vírgula decimal, aspas quando preciso, BOM UTF-8 e quebra CRLF. Só cabeçalho e dados. */
export const gerarCsv = (r: RelatorioTabular): Blob => {
  const cabecalho = r.colunas.map((c) => celulaCsv(c.titulo)).join(';');
  const linhas = r.linhas.map((linha) => linha.map((v, i) => valorCsv(r.colunas[i].tipo, v)).join(';'));
  const conteudo = [cabecalho, ...linhas].join('\r\n') + '\r\n';
  return new Blob(['﻿', conteudo], { type: 'text/csv;charset=utf-8' });
};

// ---------------------------------------------------------------- Excel

const AZUL_CABECALHO = '#EAF1FF';
const TINTA = '#0B1220';
const VERMELHO_NEGATIVO = '#B91C1C';

const textoVariacaoXlsx = (r: RelatorioTabular): string =>
  r.variacaoDestaque
    ? `Variação: ${r.variacaoDestaque} ${r.variacaoComplemento ?? ''}`.trim()
    : (r.variacaoComplemento ?? '');

export const gerarXlsx = async (r: RelatorioTabular): Promise<Blob> => {
  const { default: writeExcelFile } = await carregar(import('write-excel-file/browser'));

  const formato = (tipo: TipoColuna): string | undefined => {
    if (tipo === 'moeda') return '"R$" #,##0.00';
    if (tipo === 'percentual') return '0.0%';
    if (tipo === 'inteiro') return '0';
    if (tipo === 'data') return 'dd/mm/yyyy';
    return undefined;
  };

  // Texto livre (título, rótulos, nome da clínica...): sempre passa pela proteção contra fórmula
  const texto = (valor: string, extra: Record<string, unknown> = {}) => ({
    value: protegerTexto(valor),
    type: String,
    ...extra,
  });

  const celulaValor = (tipo: TipoColuna, v: CelulaRelatorio, extra: Record<string, unknown> = {}) => {
    // Célula realmente vazia (null): ponto sem expediente, futuro ou sem base; nunca 'null', 'NaN' ou '' como texto
    if (v == null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) return null;
    if (tipo === 'data' && typeof v === 'string' && EH_DATA_ISO.test(v)) {
      const [a, m, d] = v.slice(0, 10).split('-').map(Number);
      // A biblioteca converte em UTC: meia-noite UTC dá um número de série inteiro, sem hora, em qualquer fuso
      return { value: new Date(Date.UTC(a, m - 1, d)), type: Date, format: formato(tipo), align: 'left', ...extra };
    }
    if (typeof v === 'string') return texto(v, { align: 'left', ...extra });
    const numero = tipo === 'percentual' ? v / 100 : v;
    // Dinheiro negativo (ex.: prejuízo no Fluxo de caixa) em vermelho, com o sinal de menos
    const negativo = tipo === 'moeda' && v < 0 ? { textColor: VERMELHO_NEGATIVO } : {};
    return { value: numero, type: Number, format: formato(tipo), align: 'right', ...negativo, ...extra };
  };

  const negrito = { fontWeight: 'bold' } as const;
  const dados: unknown[][] = [
    [texto(`${r.titulo} · ${r.contexto.split(' · ')[0]}`, { fontWeight: 'bold', fontSize: 14 })],
    [texto(`Período: ${r.periodo}`)],
    r.resumoLista
      ? [texto(r.resumoLista.map((i) => `${i.rotulo}: ${nfMoeda.format(i.valor)}`).join('   '))]
      : [
          texto(r.resumoRotulo, negrito),
          r.resumoValor == null
            ? texto('—')
            : celulaValor(r.resumoTipo, r.resumoValor, { ...negrito, align: 'left' }),
        ],
    [textoVariacaoXlsx(r) ? texto(textoVariacaoXlsx(r)) : null],
    [texto(`Gerado em ${dataHoraBr(r.geradoEm)}${r.nomeClinica ? ` · ${r.nomeClinica}` : ''}`)],
    [],
    r.colunas.map((c) =>
      texto(c.titulo, {
        fontWeight: 'bold',
        backgroundColor: AZUL_CABECALHO,
        textColor: TINTA,
        align: c.tipo === 'texto' || c.tipo === 'data' ? 'left' : 'right',
      }),
    ),
    ...r.linhas.map((linha) => linha.map((v, i) => celulaValor(r.colunas[i].tipo, v))),
  ];
  if (r.total) {
    dados.push(r.total.map((v, i) => celulaValor(r.colunas[i].tipo, v, negrito)));
  }

  const larguraTexto = (i: number) =>
    Math.max(
      r.colunas[i].titulo.length,
      ...r.linhas.map((l) => textoCelula(r.colunas[i].tipo, l[i]).length),
      r.total ? textoCelula(r.colunas[i].tipo, r.total[i]).length : 0,
    );
  const colunas = r.colunas.map((_, i) => ({ width: Math.min(40, Math.max(14, larguraTexto(i) + 3)) }));
  // A coluna A também abriga o título e as linhas de contexto: dá espaço sem cortar
  colunas[0] = { width: Math.max(colunas[0].width, 26) };

  // O tipo exato das células da biblioteca é largo demais para tipar sem `any`; o formato é conferido em teste
  const blob = await (writeExcelFile as unknown as (
    d: unknown[][],
    o: Record<string, unknown>,
  ) => { toBlob: () => Promise<Blob> })(dados, {
    sheet: r.aba,
    columns: colunas,
    stickyRowsCount: 7,
  }).toBlob();
  return blob;
};

// ---------------------------------------------------------------- PDF

const COR = {
  azul: [42, 107, 242] as const,
  tinta: [11, 18, 32] as const,
  cinza: [100, 116, 139] as const,
  linha: [226, 232, 240] as const,
  faixa: [248, 250, 252] as const,
  cabecalho: [234, 241, 255] as const,
  bom: [4, 120, 87] as const,
  ruim: [185, 28, 28] as const,
  neutro: [71, 85, 105] as const,
  texto2: [51, 65, 85] as const,
};

export const gerarPdf = async (r: RelatorioTabular): Promise<Blob> => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    carregar(import('jspdf')),
    carregar(import('jspdf-autotable')),
  ]);

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  doc.setProperties({ title: r.tituloDocumento, subject: r.titulo, creator: 'Bokka' });
  const MARGEM = 16;
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();
  const util = largura - MARGEM * 2;
  const cor = (c: readonly [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);

  // 1. Cabeçalho: marca, data de geração e filete
  doc.setFillColor(...COR.azul);
  doc.roundedRect(MARGEM, 12, 7, 7, 1.2, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('B', MARGEM + 3.5, 17.2, { align: 'center' });
  doc.setFontSize(13);
  cor(COR.tinta);
  doc.text('Bokka', MARGEM + 10, 17.4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  cor(COR.cinza);
  doc.text(`Gerado em ${dataHoraBr(r.geradoEm)}`, largura - MARGEM, 17, { align: 'right' });
  doc.setDrawColor(...COR.linha);
  doc.setLineWidth(0.3);
  doc.line(MARGEM, 22, largura - MARGEM, 22);

  // 2. Título
  let y = 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  cor(COR.tinta);
  doc.text(r.titulo, MARGEM, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  cor(COR.texto2);
  doc.text(r.contexto, MARGEM, y, { maxWidth: util });
  y += 6;
  if (r.nomeClinica) {
    doc.setFontSize(10);
    cor(COR.cinza);
    doc.text(r.nomeClinica, MARGEM, y, { maxWidth: util });
    y += 6;
  }
  y += 3;

  // 3. Resumo
  const alturaResumo = r.resumoLista ? 22 : 26;
  doc.setFillColor(...COR.faixa);
  doc.setDrawColor(...COR.linha);
  doc.roundedRect(MARGEM, y, util, alturaResumo, 2, 2, 'FD');
  if (r.resumoLista) {
    const fatia = util / r.resumoLista.length;
    r.resumoLista.forEach((item, i) => {
      const x = MARGEM + 5 + fatia * i;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      cor(COR.cinza);
      doc.text(item.rotulo, x, y + 8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      cor(COR.tinta);
      doc.text(nfMoeda.format(item.valor), x, y + 16, { maxWidth: fatia - 6 });
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    cor(COR.cinza);
    doc.text(r.resumoRotulo, MARGEM + 5, y + 8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    cor(COR.tinta);
    doc.text(r.resumoValor == null ? '—' : textoCelula(r.resumoTipo, r.resumoValor), MARGEM + 5, y + 19);
    if (r.variacaoDestaque || r.variacaoComplemento) {
      // O PDF usa a fonte padrão (WinAnsi): o sinal de menos tipográfico vira hífen
      const destaque = (r.variacaoDestaque ?? '').replace(/−/g, '-');
      let yTexto = y + 11;
      if (destaque) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        cor(COR[r.variacaoTom ?? 'neutro']);
        doc.text(destaque, largura - MARGEM - 5, yTexto, { align: 'right' });
        yTexto += 6;
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      cor(COR.cinza);
      doc.text(r.variacaoComplemento ?? '', largura - MARGEM - 5, yTexto, {
        align: 'right',
        maxWidth: util * 0.5,
      });
    }
  }
  y += alturaResumo + 8;

  // 4. Tabela
  const numerica = (tipo: TipoColuna) => tipo !== 'texto' && tipo !== 'data';
  const corpo = r.linhas.map((l) => l.map((v, i) => textoCelula(r.colunas[i].tipo, v).replace(/−/g, '-')));
  if (r.total) corpo.push(r.total.map((v, i) => textoCelula(r.colunas[i].tipo, v).replace(/−/g, '-')));
  const colunasEstilo: Record<number, { halign: 'left' | 'right' }> = {};
  r.colunas.forEach((c, i) => {
    colunasEstilo[i] = { halign: numerica(c.tipo) ? 'right' : 'left' };
  });
  autoTable(doc, {
    startY: y,
    margin: { left: MARGEM, right: MARGEM, bottom: 20 },
    head: [r.colunas.map((c) => c.titulo)],
    body: corpo,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 2.2,
      textColor: [...COR.tinta],
      lineColor: [...COR.linha],
      lineWidth: 0.2,
    },
    headStyles: { fillColor: [...COR.cabecalho], textColor: [...COR.tinta], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [...COR.faixa] },
    bodyStyles: { fillColor: [255, 255, 255] },
    columnStyles: colunasEstilo,
    didParseCell: (dados) => {
      if (r.total && dados.section === 'body' && dados.row.index === corpo.length - 1) {
        dados.cell.styles.fontStyle = 'bold';
      }
      // Dinheiro negativo em vermelho (mesma cor do Excel)
      if (dados.section === 'body' && r.colunas[dados.column.index]?.tipo === 'moeda' && /^-/.test(String(dados.cell.raw))) {
        dados.cell.styles.textColor = [...COR.ruim];
      }
    },
    showHead: 'everyPage',
  });

  // 5. Rodapé em todas as páginas
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    cor(COR.cinza);
    doc.text('Bokka · Sistema de Gestão Odontológica · Suporte: suporte@bokka.com.br', MARGEM, altura - 10);
    doc.text(`Página ${p} de ${paginas}`, largura - MARGEM, altura - 10, { align: 'right' });
  }

  return doc.output('blob');
};

export type FormatoExportacao = 'xlsx' | 'pdf' | 'csv';

export const NOMES_FORMATO: Record<FormatoExportacao, string> = {
  xlsx: 'Excel',
  pdf: 'PDF',
  csv: 'CSV',
};

/** Gera o arquivo no formato pedido. Excel e PDF baixam a biblioteca na primeira vez. */
export const gerarArquivo = async (formato: FormatoExportacao, r: RelatorioTabular): Promise<Blob> => {
  if (formato === 'csv') return gerarCsv(r);
  if (formato === 'xlsx') return gerarXlsx(r);
  return gerarPdf(r);
};
