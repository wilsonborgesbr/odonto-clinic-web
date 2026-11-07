import type { CondicaoDenteEnum, DenteStatus, FaceDenteEnum, Odontograma } from '../types';
import { condicaoLabel } from './odontogramaGeom';

// Numeração FDI. Cada lista segue a ordem em que o arco é desenhado, da direita do paciente para a esquerda.
export const DENTES_SUPERIOR = ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'];
export const DENTES_INFERIOR = ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'];
// O backend também aceita decíduos (51-55, 61-65, 71-75, 81-85). O arco desenha só os 32 permanentes;
// um decíduo vindo do texto do campo continua valendo e aparece no selo.
const DENTES_DECIDUOS = [
  '55', '54', '53', '52', '51', '61', '62', '63', '64', '65',
  '85', '84', '83', '82', '81', '71', '72', '73', '74', '75',
];
const TODOS_OS_DENTES = [...DENTES_SUPERIOR, ...DENTES_INFERIOR, ...DENTES_DECIDUOS];

export interface Quadrante {
  id: 1 | 2 | 3 | 4;
  nome: string;
  dentes: string[];
}

export const QUADRANTES: Quadrante[] = [
  { id: 1, nome: 'Superior direito', dentes: DENTES_SUPERIOR.slice(0, 8) },
  { id: 2, nome: 'Superior esquerdo', dentes: DENTES_SUPERIOR.slice(8) },
  { id: 4, nome: 'Inferior direito', dentes: DENTES_INFERIOR.slice(0, 8) },
  { id: 3, nome: 'Inferior esquerdo', dentes: DENTES_INFERIOR.slice(8) },
];

export const denteValido = (codigo: string): boolean => TODOS_OS_DENTES.includes(codigo);

export const quadranteDoDente = (codigo: string): Quadrante['id'] | undefined =>
  QUADRANTES.find((q) => q.dentes.includes(codigo))?.id;

// Incisivos e caninos (posição 1 a 3) têm borda incisal; os demais têm face oclusal. Vale também para decíduos.
export const ehAnterior = (codigo: string): boolean => {
  const pos = parseInt(codigo[1] ?? '', 10);
  return pos >= 1 && pos <= 3;
};

export const ehSuperior = (codigo: string): boolean => {
  const q = parseInt(codigo[0] ?? '', 10);
  return q === 1 || q === 2 || q === 5 || q === 6;
};

export type LetraFace = 'O' | 'M' | 'D' | 'V' | 'L' | 'C';
export const LETRAS_FACE: LetraFace[] = ['O', 'M', 'D', 'V', 'L', 'C'];

/**
 * Chips de face de cada dente, na mesma regra da grade do completo (lib/odontogramaGeom.facesDaGrade):
 * posteriores O M D V L; anteriores O (incisal) M D C (cervical) L, sem V.
 * TODO (docs/design-seletor-dente-face.md, seção 2): os anteriores ainda não têm Vestibular; decisão do Wilson/clínica.
 */
export const letrasDoDente = (dente: string): LetraFace[] =>
  ehAnterior(dente) ? ['O', 'M', 'D', 'C', 'L'] : ['O', 'M', 'D', 'V', 'L'];

export const faceDaLetra = (letra: LetraFace, dente: string): FaceDenteEnum => {
  switch (letra) {
    case 'O':
      return ehAnterior(dente) ? 'INCISAL' : 'OCLUSAL';
    case 'M':
      return 'MESIAL';
    case 'D':
      return 'DISTAL';
    case 'V':
      return 'VESTIBULAR';
    case 'L':
      return ehSuperior(dente) ? 'PALATINA' : 'LINGUAL';
    case 'C':
      return 'CERVICAL';
  }
};

export const nomeDaFace = (letra: LetraFace, dente: string): string => {
  switch (letra) {
    case 'O':
      return ehAnterior(dente) ? 'Incisal' : 'Oclusal';
    case 'M':
      return 'Mesial';
    case 'D':
      return 'Distal';
    case 'V':
      return 'Vestibular';
    case 'L':
      return ehSuperior(dente) ? 'Palatina' : 'Lingual';
    case 'C':
      return 'Cervical';
  }
};

/** Letra de exibição da face. */
export const letraDaFace = (face: FaceDenteEnum): LetraFace => {
  switch (face) {
    case 'OCLUSAL':
    case 'INCISAL':
      return 'O';
    case 'MESIAL':
      return 'M';
    case 'DISTAL':
      return 'D';
    case 'VESTIBULAR':
      return 'V';
    case 'PALATINA':
    case 'LINGUAL':
      return 'L';
    case 'CERVICAL':
      return 'C';
  }
};

export const letrasDasFaces = (faces: FaceDenteEnum[] | undefined): LetraFace[] => {
  const marcadas = new Set<LetraFace>();
  faces?.forEach((f) => marcadas.add(letraDaFace(f)));
  return LETRAS_FACE.filter((l) => marcadas.has(l));
};

export const separarDentes = (texto: string | undefined): string[] =>
  (texto ?? '').split(/[\s,;/]+/).filter(Boolean);

/** Dentes FDI válidos citados no texto do campo "Dente", sem repetição e na ordem em que aparecem. */
export const dentesDoTexto = (texto: string | undefined): string[] =>
  Array.from(new Set(separarDentes(texto).filter(denteValido)));

/** Texto do selo que acompanha o seletor: "Sem dente", "Dente 36 (O,V)" ou "Dentes 18, 36 (O,V)". */
export const descreverSelecao = (
  dentes: string[],
  faces: Record<string, FaceDenteEnum[] | undefined>,
): string => {
  if (dentes.length === 0) return 'Sem dente';
  const partes = dentes.map((d) => {
    const letras = letrasDasFaces(faces[d]);
    return letras.length > 0 ? `${d} (${letras.join(',')})` : d;
  });
  return `${dentes.length === 1 ? 'Dente' : 'Dentes'} ${partes.join(', ')}`;
};

/** Dentes de um odontograma indexados pelo número FDI. */
export const mapaDentes = (o: Odontograma | undefined): Record<string, DenteStatus | undefined> => {
  const mapa: Record<string, DenteStatus | undefined> = {};
  o?.dentes?.forEach((d) => {
    if (d.numeroDente) mapa[d.numeroDente] = d;
  });
  return mapa;
};

export interface SelecaoDentes {
  dentes: string[];
  faces: Record<string, FaceDenteEnum[] | undefined>;
  /** Condição escolhida no painel para o dente selecionado. undefined = manter como está. */
  condicao?: CondicaoDenteEnum;
}

/** Texto do selo e do toast: "Dente 36 (O,V) · Hígido → Cárie", "· condição mantida (X)" ou "· sem condição registrada". */
export const textoDaSelecao = (
  value: SelecaoDentes,
  condicoes: Record<string, DenteStatus | undefined> | undefined,
  comCondicao = true,
): string => {
  const base = descreverSelecao(value.dentes, value.faces);
  if (!comCondicao || value.dentes.length !== 1) return base;
  const atual = condicoes?.[value.dentes[0]]?.condicao;
  if (value.condicao) {
    return `${base} · ${atual ? condicaoLabel(atual) : 'sem condição'} → ${condicaoLabel(value.condicao)}`;
  }
  return atual ? `${base} · condição mantida (${condicaoLabel(atual)})` : `${base} · sem condição registrada`;
};
