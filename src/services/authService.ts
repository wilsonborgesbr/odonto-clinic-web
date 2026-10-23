import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { usuarioKeys } from './usuarioService';
import type {
  AuthResponseDTO,
  ConfirmarEmailResponseDTO,
  LoginRequestDTO,
  LoginResultadoDTO,
  MensagemDTO,
  RecuperarSenhaRequestDTO,
  RedefinirSenhaRequestDTO,
  SelecionarClinicaRequestDTO,
  TipoTokenAuth,
  ValidarTokenResponseDTO,
} from '../types';

/** Resposta do login que traz o JWT (em oposição à seleção de clínica). */
export const loginTemToken = (r: LoginResultadoDTO): r is AuthResponseDTO => 'token' in r;

export const authService = {
  /** Sem `clinicaCodigo`, o backend procura a clínica pelo e-mail + senha; pode devolver SELECAO_CLINICA. */
  login: async (credenciais: LoginRequestDTO) =>
    (await api.post<LoginResultadoDTO>('/auth/login', credenciais)).data,

  selecionarClinica: async (payload: SelecionarClinicaRequestDTO) =>
    (await api.post<AuthResponseDTO>('/auth/login/selecionar-clinica', payload)).data,

  /** Sempre 200 com a mesma mensagem, exista ou não a conta (anti-enumeração). */
  recuperarSenha: async (payload: RecuperarSenhaRequestDTO) =>
    (await api.post<MensagemDTO>('/auth/recuperar-senha', payload)).data,

  /** 400 = token inválido, expirado ou já usado. */
  validarToken: async (token: string, tipo: TipoTokenAuth) =>
    (await api.post<ValidarTokenResponseDTO>('/auth/validar-token', { token, tipo })).data,

  redefinirSenha: async (payload: RedefinirSenhaRequestDTO) =>
    (await api.post<MensagemDTO | undefined>('/auth/redefinir-senha', payload)).data,

  /** Consome o token: só pode ser chamado uma vez por link. */
  confirmarEmail: async (token: string) =>
    (await api.post<ConfirmarEmailResponseDTO | undefined>('/auth/confirmar-email', { token })).data,

  /** Exige JWT do dono; o backend limita a quantidade de pedidos (429). */
  reenviarConfirmacao: async () =>
    (await api.post<MensagemDTO | undefined>('/auth/reenviar-confirmacao')).data,
};

export const authKeys = {
  all: ['auth'] as const,
  tokenReset: (token: string) => [...authKeys.all, 'validar-token', 'RESET_SENHA', token] as const,
  confirmarEmail: (token: string) => [...authKeys.all, 'confirmar-email', token] as const,
};

/** Valida o link de redefinição ao abrir a tela (não consome o token). */
export const useValidarTokenReset = (token: string | null) =>
  useQuery({
    queryKey: authKeys.tokenReset(token ?? ''),
    queryFn: () => authService.validarToken(token ?? '', 'RESET_SENHA'),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

/**
 * Consome o link de confirmação ao abrir a tela. Como o token só vale uma vez, a query nunca
 * refaz sozinha (foco, reconexão, retry) — o resultado fica em cache por token.
 */
export const useConfirmarEmail = (token: string | null) => {
  const qc = useQueryClient();
  return useQuery({
    queryKey: authKeys.confirmarEmail(token ?? ''),
    queryFn: async () => {
      const r = await authService.confirmarEmail(token ?? '');
      void qc.invalidateQueries({ queryKey: usuarioKeys.me() });
      return r ?? {};
    },
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const useRecuperarSenha = () =>
  useMutation({ mutationFn: authService.recuperarSenha });

export const useRedefinirSenha = () =>
  useMutation({ mutationFn: authService.redefinirSenha });

export const useReenviarConfirmacao = () =>
  useMutation({ mutationFn: authService.reenviarConfirmacao });
