// ==========================================
// ENUMS
// ==========================================

export type CargoFuncionarioEnum =
  | 'RECEPCIONISTA'
  | 'AUXILIAR_DENTARIO'
  | 'TECNICO_RADIOLOGIA'
  | 'ADMINISTRATIVO'
  | 'GERENTE';

export type CategoriaContaPagarEnum =
  | 'ALUGUEL'
  | 'MATERIAL_ODONTOLOGICO'
  | 'EQUIPAMENTO'
  | 'SALARIO'
  | 'AGUA'
  | 'LUZ'
  | 'INTERNET'
  | 'MANUTENCAO'
  | 'IMPOSTO'
  | 'OUTRO';

export type CategoriaEstoqueEnum =
  | 'DESCARTAVEL'
  | 'MEDICAMENTO'
  | 'INSTRUMENTO'
  | 'ANESTESICO'
  | 'MATERIAL_RESTAURADOR'
  | 'MATERIAL_PROTESE'
  | 'EPI'
  | 'LIMPEZA'
  | 'OUTRO';

export type CondicaoDenteEnum =
  | 'SAUDAVEL'
  | 'CARIADO'
  | 'RESTAURADO'
  | 'AUSENTE'
  | 'IMPLANTE'
  | 'COROA'
  | 'FRATURADO'
  | 'EM_TRATAMENTO'
  | 'EXTRAIR';

export type EspecialidadeEnum =
  | 'CLINICO_GERAL'
  | 'ORTODONTIA'
  | 'IMPLANTODONTIA'
  | 'ENDODONTIA'
  | 'PERIODONTIA'
  | 'ODONTOPEDIATRIA'
  | 'CIRURGIA'
  | 'PROTESE'
  | 'ESTETICA'
  | 'RADIOLOGIA';

export type FormaPagamentoEnum =
  | 'DINHEIRO'
  | 'PIX'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'CONVENIO'
  | 'BOLETO'
  | 'TRANSFERENCIA';

export type NomeProcedimentoEnum =
  | 'RESTAURACAO_RESINA'
  | 'RESTAURACAO_AMALGAMA'
  | 'INLAY'
  | 'ONLAY'
  | 'FACETA_PORCELANA'
  | 'FACETA_RESINA'
  | 'TRATAMENTO_CANAL_UNIRRADICULAR'
  | 'TRATAMENTO_CANAL_BIRRADICULAR'
  | 'TRATAMENTO_CANAL_MULTIRRADICULAR'
  | 'RETRATAMENTO_CANAL'
  | 'PROFILAXIA'
  | 'RASPAGEM_SUPRAGENGIVAL'
  | 'RASPAGEM_SUBGENGIVAL'
  | 'GENGIVECTOMIA'
  | 'ENXERTO_GENGIVAL'
  | 'EXTRACAO_SIMPLES'
  | 'EXTRACAO_DENTE_SISO'
  | 'CIRURGIA_PERIODONTAL'
  | 'FRENECTOMIA'
  | 'BIOPSIA'
  | 'INSTALACAO_IMPLANTE'
  | 'INSTALACAO_PROTESE_SOBRE_IMPLANTE'
  | 'ENXERTO_OSSEO'
  | 'PROTESE_PARCIAL_REMOVIVEL'
  | 'PROTESE_TOTAL'
  | 'COROA_PORCELANA'
  | 'COROA_METALICA'
  | 'PONTE_FIXA'
  | 'APARELHO_METALICO'
  | 'APARELHO_ESTETICO'
  | 'APARELHO_INVISIVEL'
  | 'MANUTENCAO_ORTODONTICA'
  | 'CONTENCAO'
  | 'SELANTE'
  | 'FLUORTERAPIA'
  | 'COROA_PEDIATRICA'
  | 'PULPOTOMIA'
  | 'CLAREAMENTO_CASEIRO'
  | 'CLAREAMENTO_CONSULTORIO'
  | 'MICROABRASAO'
  | 'RADIOGRAFIA_PERIAPICAL'
  | 'RADIOGRAFIA_PANORAMICA'
  | 'TOMOGRAFIA';

export type RegiaoEnum =
  | 'SUPERIOR'
  | 'INFERIOR'
  | 'ANTERIOR'
  | 'POSTERIOR';

export type SexoEnum =
  | 'MASCULINO'
  | 'FEMININO'
  | 'OUTRO';

export type StatusAgendamentoEnum =
  | 'AGENDADO'
  | 'CONFIRMADO'
  | 'REALIZADO'
  | 'FALTOU'
  | 'CANCELADO';

export type StatusFinanceiroEnum =
  | 'PENDENTE'
  | 'PAGO'
  | 'ATRASADO'
  | 'CANCELADO';

export type StatusProcedimentoEnum =
  | 'ORCADO'
  | 'AGENDADO'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO'
  | 'CANCELADO';

export type TipoDocumentoEnum =
  | 'RADIOGRAFIA'
  | 'FOTO_INTRAORAL'
  | 'FOTO_EXTRAORAL'
  | 'LAUDO'
  | 'CONTRATO'
  | 'ORCAMENTO_ASSINADO'
  | 'TERMO_CONSENTIMENTO'
  | 'OUTRO';

export type EstadoCivil =
  | 'SOLTEIRO'
  | 'CASADO'
  | 'DIVORCIADO'
  | 'VIUVO'
  | 'OUTRO';

export type TipoPagamentoPaciente =
  | 'PIX'
  | 'DINHEIRO'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO';

export type TipoPaciente =
  | 'CONVENIO'
  | 'PARTICULAR'
  | 'MISTO';

export type ComoConheceu =
  | 'INDICACAO'
  | 'INSTAGRAM'
  | 'GOOGLE'
  | 'OUTRO';

// ==========================================
// OBJECT EMBEDDEDS / VALUE OBJECTS
// ==========================================

export interface Endereco {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export interface DenteStatus {
  numeroDente?: string;
  condicao?: CondicaoDenteEnum;
  observacao?: string;
}

// ==========================================
// MODELS / ENTITIES
// ==========================================

export interface User {
  id?: string;
  name?: string;
  email?: string;
  password?: string;
}

export interface Agendamento {
  id?: string;
  pacienteId: string;
  dentistaId: string;
  procedimentoId?: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  status: StatusAgendamentoEnum;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Anamnese {
  id?: string;
  pacienteId?: string;
  dentistaId?: string;
  dataPreenchimento?: string;
  queixaPrincipal?: string;
  historicoDental?: string;
  usaMedicamentos?: boolean;
  quaisMedicamentos?: string;
  temAlergia?: boolean;
  quaisAlergias?: string;
  doencasPreexistentes?: string;
  gestante?: boolean;
  fumante?: boolean;
  consumoAlcool?: boolean;
  historiaFamiliar?: string;
  observacoes?: string;
  createdAt?: string;
}

export interface ContaPagar {
  id?: string;
  descricao: string;
  categoria: CategoriaContaPagarEnum;
  fornecedor?: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: StatusFinanceiroEnum;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContaReceber {
  id?: string;
  pacienteId: string;
  procedimentoId?: string;
  descricao: string;
  valorTotal: number;
  valorPago?: number;
  formaPagamento: FormaPagamentoEnum;
  numeroParcelas?: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: StatusFinanceiroEnum;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Convenio {
  id?: string;
  nome?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  tabelaDePrecos?: string;
  ativo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Dentista {
  id?: string;
  nomeCompleto: string;
  cro: string;
  especialidades?: EspecialidadeEnum[];
  email?: string;
  telefoneCelular?: string;
  sexo: SexoEnum;
  endereco?: Endereco;
  ativo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Documento {
  id?: string;
  pacienteId?: string;
  tipo?: TipoDocumentoEnum;
  urlArquivo?: string;
  descricao?: string;
  dataUpload?: string;
}

export interface Estoque {
  id?: string;
  nomeMaterial?: string;
  categoria?: CategoriaEstoqueEnum;
  quantidadeAtual?: number;
  quantidadeMinima?: number;
  unidadeMedida?: string;
  fornecedor?: string;
  dataValidade?: string;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Funcionario {
  id?: string;
  nomeCompleto: string;
  cpf: string;
  cargo: CargoFuncionarioEnum;
  email?: string;
  telefoneCelular?: string;
  sexo: SexoEnum;
  endereco?: Endereco;
  ativo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Odontograma {
  id?: string;
  pacienteId?: string;
  dentistaId?: string;
  dentes?: DenteStatus[];
  dataAvaliacao?: string;
  observacoes?: string;
  createdAt?: string;
}

export interface Paciente {
  id?: string;
  nomeCompleto: string;
  cpf: string;
  rg?: string;
  dataNascimento: string;
  sexo: SexoEnum;
  estadoCivil?: EstadoCivil;
  profissao?: string;
  email?: string;
  telefoneCelular?: string;
  telefoneFixo?: string;
  nomeContatoEmergencia?: string;
  telefoneEmergencia?: string;
  endereco?: Endereco;
  tipoSanguineo?: string;
  numeroProntuario?: string;
  tipoPaciente: TipoPaciente;
  tipoPagamento?: TipoPagamentoPaciente;
  comoConheceu?: ComoConheceu;
  ativo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Procedimento {
  id?: string;
  pacienteId?: string;
  nomeProcedimento?: NomeProcedimentoEnum;
  descricao?: string;
  dente?: string;
  regiao?: RegiaoEnum;
  status?: StatusProcedimentoEnum;
  dataRealizacao?: string;
  valor?: number;
  numeroDeSessoes?: number;
  sessaoAtual?: number;
  observacoesTecnicas?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// DTOs
// ==========================================

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface RegisterRequestDTO {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponseDTO {
  token: string;
}

export interface DentistaListagemDTO {
  id: string;
  nomeCompleto: string;
  cro: string;
  especialidades: EspecialidadeEnum[];
  email: string;
  telefoneCelular: string;
  ativo: boolean;
}

export interface FuncionarioListagemDTO {
  id: string;
  nomeCompleto: string;
  cpf: string;
  cargo: CargoFuncionarioEnum;
  email: string;
  telefoneCelular: string;
  ativo: boolean;
}

export interface PacienteListagemDTO {
  id: string;
  nomeCompleto: string;
  cpf: string;
  email: string;
  telefoneCelular: string;
  ativo: boolean;
}

// Resposta de Paginação do Spring Boot Data
export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}
