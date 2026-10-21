import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// ============ DOCUMENTOS E CONTATO (formato canônico) ============
// Formatos canônicos aceitos pelo backend:
//  CPF 000.000.000-00 · CNPJ 00.000.000/0000-00 · CEP 00000-000
//  celular (XX) 9XXXX-XXXX · fixo (XX) XXXX-XXXX · CRO "CRO-UF 12345" ou "CRO-UF 12345/2022"
//  e-mail em minúsculas e sem espaços nas pontas.

export const onlyDigits = (v?: string | null): string => (v ?? '').replace(/\D/g, '');

// ---- máscaras (digitação: aceitam valor parcial e devolvem o formato canônico) ----

export const maskCpf = (v?: string | null): string => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

// CNPJ alfanumérico (desde jul/2026): as 12 primeiras posições aceitam dígitos e letras
// maiúsculas (A-Z); as 2 últimas (dígitos verificadores) são sempre numéricas.
const cnpjChars = (v?: string | null): string =>
  (v ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');

export const maskCnpj = (v?: string | null): string => {
  const raw = cnpjChars(v);
  const c = raw.slice(0, 12) + raw.slice(12).replace(/\D/g, '').slice(0, 2);
  if (c.length <= 2) return c;
  if (c.length <= 5) return `${c.slice(0, 2)}.${c.slice(2)}`;
  if (c.length <= 8) return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5)}`;
  if (c.length <= 12) return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8)}`;
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
};

export const maskCep = (v?: string | null): string => {
  const d = onlyDigits(v).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
};

/** 'servico' = 'auto' + 0800/0300 ("0800 123 4567"). */
export type PhoneVariant = 'celular' | 'fixo' | 'auto' | 'servico';

const isServico0800 = (d: string) => /^0[38]00/.test(d);

// Remove o DDI 55 quando o número vem colado com +55 (12 ou 13 dígitos).
const phoneDigits = (v?: string | null): string => {
  const d = onlyDigits(v);
  return d.length > 11 && d.startsWith('55') ? d.slice(2) : d;
};

export const maskPhone = (v?: string | null, variant: PhoneVariant = 'auto'): string => {
  const d = phoneDigits(v).slice(0, variant === 'fixo' ? 10 : 11);
  if (d.length === 0) return '';
  if (variant === 'servico' && d[0] === '0') {
    if (d.length <= 4) return d;
    if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  }
  if (d.length <= 2) return `(${d}`;
  const automatico = variant === 'auto' || variant === 'servico';
  const celular =
    variant === 'celular' || (automatico && (d[2] === '9' || d.length === 11));
  const corte = celular ? 5 : 4;
  const corpo = d.slice(2);
  if (corpo.length <= corte) return `(${d.slice(0, 2)}) ${corpo}`;
  return `(${d.slice(0, 2)}) ${corpo.slice(0, corte)}-${corpo.slice(corte)}`;
};

export const normalizeEmail = (v?: string | null): string => (v ?? '').trim().toLowerCase();

// ---- exibição (listagens e detalhes; dado antigo fora do padrão aparece como veio) ----

export const formatCpf = (cpf?: string | null): string => {
  if (!cpf) return '—';
  const d = onlyDigits(cpf);
  if (d.length !== 11) return cpf;
  return maskCpf(d);
};

export const formatCnpj = (cnpj?: string | null): string => {
  if (!cnpj) return '—';
  const c = cnpjChars(cnpj);
  if (c.length !== 14) return cnpj;
  return maskCnpj(c);
};

export const formatCep = (cep?: string | null): string => {
  if (!cep) return '—';
  const d = onlyDigits(cep);
  if (d.length !== 8) return cep;
  return maskCep(d);
};

export const formatPhone = (phone?: string | null): string => {
  if (!phone) return '—';
  const d = phoneDigits(phone);
  if (d.length === 11 && isServico0800(d)) return maskPhone(d, 'servico');
  if (d.length === 11 || d.length === 10) return maskPhone(d);
  return phone;
};

// ---- CRO: "CRO-UF 12345" ou "CRO-UF 12345/2022" ----

export interface CroPartes {
  uf: string;
  numero: string;
  ano: string;
}

/** Lê o CRO canônico e variações antigas ("cro-sp 12345", "CRO/SP 12345"). */
export const parseCro = (cro?: string | null): CroPartes | null => {
  if (!cro) return null;
  const m = cro.match(
    /^\s*CRO\s*[-/]?\s*([A-Za-z]{2})\s*[-:]?\s*(\d{3,6})(?:\s*\/\s*(\d{4}))?\s*$/i,
  );
  if (!m) return null;
  return { uf: m[1].toUpperCase(), numero: m[2], ano: m[3] ?? '' };
};

export const buildCro = (uf: string, numero: string, ano?: string): string => {
  if (!numero) return '';
  const base = `CRO-${uf.toUpperCase()} ${numero}`;
  return ano ? `${base}/${ano}` : base;
};

export const formatCro = (cro?: string | null): string => {
  if (!cro) return '—';
  const p = parseCro(cro);
  return p ? buildCro(p.uf, p.numero, p.ano) : cro;
};

// ---- dígito verificador ----

const todosIguais = (d: string) => /^(.)\1+$/.test(d);

export const isValidCpf = (v?: string | null): boolean => {
  const d = onlyDigits(v);
  if (d.length !== 11 || todosIguais(d)) return false;
  for (const t of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(d[i]) * (t + 1 - i);
    if (((soma * 10) % 11) % 10 !== Number(d[t])) return false;
  }
  return true;
};

const PESOS_CNPJ_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_CNPJ_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

// Cálculo oficial do CNPJ alfanumérico: valor de cada caractere = código ASCII - 48
// (0-9 valem 0-9; A=17 ... Z=42). Para CNPJ só numérico dá o mesmo resultado de sempre.
const digitoCnpj = (base: string, pesos: number[]): number => {
  const soma = pesos.reduce((acc, peso, i) => acc + (base.charCodeAt(i) - 48) * peso, 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
};

export const isValidCnpj = (v?: string | null): boolean => {
  const d = cnpjChars(v);
  if (!/^[0-9A-Z]{12}\d{2}$/.test(d) || todosIguais(d)) return false;
  return (
    digitoCnpj(d.slice(0, 12), PESOS_CNPJ_1) === Number(d[12]) &&
    digitoCnpj(d.slice(0, 13), PESOS_CNPJ_2) === Number(d[13])
  );
};

// ---- mensagens de erro de campo (undefined = válido) ----

interface OpcoesValidacao {
  required?: boolean;
}

export const validateCpf = (
  v?: string | null,
  { required = false }: OpcoesValidacao = {},
): string | undefined => {
  const d = onlyDigits(v);
  if (!d) return required ? 'Informe o CPF.' : undefined;
  if (d.length !== 11) return 'CPF incompleto. Informe os 11 dígitos (000.000.000-00).';
  if (!isValidCpf(d)) return 'CPF inválido. Confira os números digitados.';
  return undefined;
};

export const validateCnpj = (
  v?: string | null,
  { required = false }: OpcoesValidacao = {},
): string | undefined => {
  const d = cnpjChars(v);
  if (!d) return required ? 'Informe o CNPJ.' : undefined;
  if (d.length !== 14) return 'CNPJ incompleto. Informe os 14 caracteres (00.000.000/0000-00).';
  if (!isValidCnpj(d)) return 'CNPJ inválido. Confira os caracteres digitados.';
  return undefined;
};

export const validateCep = (v?: string | null): string | undefined => {
  const d = onlyDigits(v);
  if (!d) return undefined;
  return d.length === 8 ? undefined : 'CEP incompleto. Informe os 8 dígitos (00000-000).';
};

export const validatePhone = (
  v?: string | null,
  { variant = 'auto', required = false }: OpcoesValidacao & { variant?: PhoneVariant } = {},
): string | undefined => {
  const d = phoneDigits(v);
  if (!d) return required ? 'Informe o telefone.' : undefined;
  if (variant === 'servico' && d[0] === '0') {
    return /^0[38]00\d{7}$/.test(d)
      ? undefined
      : 'Número 0800/0300 inválido. Use o formato 0800 123 4567.';
  }
  if (!/^[1-9]{2}/.test(d)) return 'DDD inválido. Use dois dígitos, ex.: (11).';
  const celularOk = d.length === 11 && d[2] === '9';
  const fixoOk = d.length === 10;
  if (variant === 'celular' && !celularOk) {
    return 'Celular inválido. Use DDD + 9 dígitos, ex.: (11) 91234-5678.';
  }
  if (variant === 'fixo' && !fixoOk) {
    return 'Telefone fixo inválido. Use DDD + 8 dígitos, ex.: (11) 2345-6789.';
  }
  if ((variant === 'auto' || variant === 'servico') && !celularOk && !fixoOk) {
    return variant === 'servico'
      ? 'Telefone inválido. Use (11) 91234-5678, (11) 2345-6789 ou 0800 123 4567.'
      : 'Telefone inválido. Use (11) 91234-5678 para celular ou (11) 2345-6789 para fixo.';
  }
  return undefined;
};

export const validateEmail = (
  v?: string | null,
  { required = false }: OpcoesValidacao = {},
): string | undefined => {
  const e = normalizeEmail(v);
  if (!e) return required ? 'Informe o e-mail.' : undefined;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
    ? undefined
    : 'E-mail inválido. Use o formato nome@dominio.com.';
};

/** Mantém só os campos com erro: `coletarErros({ cpf: validateCpf(...) })`. */
export const coletarErros = (
  campos: Record<string, string | undefined>,
): Record<string, string> =>
  Object.fromEntries(Object.entries(campos).filter((e): e is [string, string] => !!e[1]));

/**
 * Prepara o payload para o backend: apara os textos e remove os campos vazios em qualquer
 * nível (objetos aninhados que ficarem sem campo algum também somem). Campo opcional nunca
 * vai como "" — vai omitido, e o backend o lê como null.
 */
export const omitirVazios = <T extends object>(valor: T): T => {
  const limpar = (v: unknown): unknown => {
    if (typeof v === 'string') {
      const t = v.trim();
      return t === '' ? undefined : t;
    }
    if (Array.isArray(v) || v === null || typeof v !== 'object') return v;
    const entradas = Object.entries(v)
      .map(([k, x]) => [k, limpar(x)] as const)
      .filter(([, x]) => x !== undefined);
    return entradas.length ? Object.fromEntries(entradas) : undefined;
  };
  return (limpar(valor) ?? {}) as T;
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export const formatCurrency = (value?: number | null): string => {
  if (value == null || Number.isNaN(value)) return 'R$ 0,00';
  return currencyFormatter.format(value);
};

/** Máscara de privacidade pra valores financeiros — largura fixa, não vaza a ordem de
 * grandeza do valor real (ao contrário de trocar só os dígitos por •, que preserva a
 * quantidade de casas). */
export const MASKED_CURRENCY = 'R$ ••••••';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateLongFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
});

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

// ORDENAÇÃO DE NOMES

// sensitivity 'base': "Álvaro" = "alvaro" = "ALVARO"; o Collator é criado uma vez (reaproveitado em cada sort).
const colatorNomes = new Intl.Collator('pt-BR', { sensitivity: 'base' });

/** Compara textos no padrão pt-BR, ignorando acento e maiúsculas/minúsculas. Aceita vazio/nulo (vai pro começo). */
export const compararNomes = (a?: string | null, b?: string | null): number =>
  colatorNomes.compare(a ?? '', b ?? '');

/** Cópia da lista ordenada por nome (pt-BR, sem acento/caixa); não altera a original. */
export const ordenarPorNome = <T,>(lista: readonly T[], nomeDe: (item: T) => string | null | undefined): T[] =>
  [...lista].sort((x, y) => compararNomes(nomeDe(x), nomeDe(y)));

const DATA_PURA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Data de calendário 'YYYY-MM-DD' válida, sem passar por Date/UTC. Ano < 1900 não conta. */
const partesDataPura = (iso?: string | null): { ano: number; mes: number; dia: number } | null => {
  const m = DATA_PURA.exec((iso ?? '').trim());
  if (!m) return null;
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  if (ano < 1900 || mes < 1 || mes > 12 || dia < 1) return null;
  if (dia > new Date(Date.UTC(ano, mes, 0)).getUTCDate()) return null;
  return { ano, mes, dia };
};

/** Hoje (fuso local) no formato 'YYYY-MM-DD', como o <input type="date"> espera em min/max. */
export const hojeIso = (): string => {
  const h = new Date();
  const mm = String(h.getMonth() + 1).padStart(2, '0');
  const dd = String(h.getDate()).padStart(2, '0');
  return `${h.getFullYear()}-${mm}-${dd}`;
};

/**
 * Idade em anos completos a partir de 'YYYY-MM-DD'. Faz split da string (new Date(iso) leria a
 * data em UTC e erraria o dia no fuso do Brasil). Null se vazio, inválido, ano < 1900 ou futuro:
 * durante a digitação o ano incompleto ("0002") cai aqui e nada pisca na tela.
 */
export const calcularIdade = (iso?: string | null): number | null => {
  const p = partesDataPura(iso);
  if (!p) return null;
  const h = new Date();
  let idade = h.getFullYear() - p.ano;
  const antesDoAniversario =
    h.getMonth() + 1 < p.mes || (h.getMonth() + 1 === p.mes && h.getDate() < p.dia);
  if (antesDoAniversario) idade -= 1;
  return idade < 0 ? null : idade;
};

/** "10/05/2010 · 15 anos"; sem idade calculável (data inválida) mostra só a data, sem data "—". */
export const formatNascimento = (iso?: string | null, idade: number | null = calcularIdade(iso)): string => {
  if (!iso) return '—';
  const data = formatDate(iso);
  if (idade === null) return data;
  return `${data} · ${idade} ${idade === 1 ? 'ano' : 'anos'}`;
};

export const validateDataNascimento =(v?: string | null): string | undefined => {
  const s = (v ?? '').trim();
  if (!s) return undefined;
  if (!partesDataPura(s)) return 'Data de nascimento inválida.';
  if (s > hojeIso()) return 'A data de nascimento não pode ser futura.';
  return undefined;
};

export const formatDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const pura = partesDataPura(iso);
  if (pura) {
    return `${String(pura.dia).padStart(2, '0')}/${String(pura.mes).padStart(2, '0')}/${pura.ano}`;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return dateFormatter.format(d);
};

export const formatDateLong = (iso?: string | Date | null): string => {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  return dateLongFormatter.format(d);
};

export const formatTime = (iso?: string | null): string => {
  if (!iso) return '--:--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return timeFormatter.format(d);
};

export const formatDateTime = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${dateFormatter.format(d)} ${timeFormatter.format(d)}`;
};

export const isSameDay = (isoDate: string | Date | undefined, ref: Date): boolean => {
  if (!isoDate) return false;
  const d = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
};

export const getGreeting = (now = new Date()): string => {
  const h = now.getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

export const initials = (name?: string | null): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Backend Endereco tem @NotBlank em cep/logradouro/bairro/cidade/estado com @Valid no owner.
 * Se qualquer required estiver vazio, o payload precisa vir sem o campo endereco (que é opcional
 * como um todo). Esta helper devolve o objeto sem endereco quando incompleto.
 */
export const nomeProcLabel: Record<string, string> = {
  RESTAURACAO_RESINA: 'Restauração em Resina',
  RESTAURACAO_AMALGAMA: 'Restauração em Amálgama',
  INLAY: 'Inlay',
  ONLAY: 'Onlay',
  FACETA_PORCELANA: 'Faceta de Porcelana',
  FACETA_RESINA: 'Faceta de Resina',
  TRATAMENTO_CANAL_UNIRRADICULAR: 'Tratamento de Canal (Uni)',
  TRATAMENTO_CANAL_BIRRADICULAR: 'Tratamento de Canal (Bi)',
  TRATAMENTO_CANAL_MULTIRRADICULAR: 'Tratamento de Canal (Multi)',
  RETRATAMENTO_CANAL: 'Retratamento de Canal',
  PROFILAXIA: 'Profilaxia',
  RASPAGEM_SUPRAGENGIVAL: 'Raspagem Supragengival',
  RASPAGEM_SUBGENGIVAL: 'Raspagem Subgengival',
  GENGIVECTOMIA: 'Gengivectomia',
  ENXERTO_GENGIVAL: 'Enxerto Gengival',
  EXTRACAO_SIMPLES: 'Extração Simples',
  EXTRACAO_DENTE_SISO: 'Extração de Siso',
  CIRURGIA_PERIODONTAL: 'Cirurgia Periodontal',
  FRENECTOMIA: 'Frenectomia',
  BIOPSIA: 'Biópsia',
  INSTALACAO_IMPLANTE: 'Instalação de Implante',
  INSTALACAO_PROTESE_SOBRE_IMPLANTE: 'Prótese sobre Implante',
  ENXERTO_OSSEO: 'Enxerto Ósseo',
  PROTESE_PARCIAL_REMOVIVEL: 'Prótese Parcial Removível',
  PROTESE_TOTAL: 'Prótese Total',
  COROA_PORCELANA: 'Coroa de Porcelana',
  COROA_METALICA: 'Coroa Metálica',
  PONTE_FIXA: 'Ponte Fixa',
  APARELHO_METALICO: 'Aparelho Metálico',
  APARELHO_ESTETICO: 'Aparelho Estético',
  APARELHO_INVISIVEL: 'Aparelho Invisível',
  MANUTENCAO_ORTODONTICA: 'Manutenção Ortodôntica',
  CONTENCAO: 'Contenção',
  SELANTE: 'Selante',
  FLUORTERAPIA: 'Fluorterapia',
  COROA_PEDIATRICA: 'Coroa Pediátrica',
  PULPOTOMIA: 'Pulpotomia',
  CLAREAMENTO_CASEIRO: 'Clareamento Caseiro',
  CLAREAMENTO_CONSULTORIO: 'Clareamento em Consultório',
  MICROABRASAO: 'Microabrasão',
  RADIOGRAFIA_PERIAPICAL: 'Radiografia Periapical',
  RADIOGRAFIA_PANORAMICA: 'Radiografia Panorâmica',
  TOMOGRAFIA: 'Tomografia',
};

export const formatDescricaoFinanceira = (descricao?: string | null): string => {
  if (!descricao) return '—';
  return descricao.replace(/([A-Z][A-Z0-9_]{2,})/, (enumName) => {
    return nomeProcLabel[enumName] ?? enumName.replace(/_/g, ' ');
  });
};

export const sanitizeEnderecoPayload = <T extends { endereco?: unknown }>(values: T): T => {
  const end = values.endereco as
    | { cep?: string; logradouro?: string; bairro?: string; cidade?: string; estado?: string }
    | null
    | undefined;
  const incompleto =
    !end ||
    !end.cep?.trim() ||
    !end.logradouro?.trim() ||
    !end.bairro?.trim() ||
    !end.cidade?.trim() ||
    !end.estado?.trim();
  if (!incompleto) return values;
  const { endereco: _skip, ...rest } = values as { endereco?: unknown } & Record<string, unknown>;
  void _skip;
  return rest as T;
};
