import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  ConexaoGoogleCalendar,
  GoogleCalendarAuthUrl,
  GoogleCalendarSincronizacao,
  GoogleCalendarStatus,
} from '../types';

export const googleCalendarService = {
  status: async () => (await api.get<GoogleCalendarStatus>('/api/google-calendar/status')).data,
  /** O escopo vem do usuário (definido pelo proprietário); não há mais parâmetro de tipo. */
  authUrl: async () => (await api.get<GoogleCalendarAuthUrl>('/api/google-calendar/auth-url')).data,
  desconectar: async () => {
    await api.post('/api/google-calendar/desconectar');
  },
  conexoes: async () => (await api.get<ConexaoGoogleCalendar[]>('/api/google-calendar/conexoes')).data,
  sincronizar: async () => (await api.post<GoogleCalendarSincronizacao>('/api/google-calendar/sincronizar')).data,
};

export const googleCalendarKeys = {
  all: ['google-calendar'] as const,
  status: () => [...googleCalendarKeys.all, 'status'] as const,
  conexoes: () => [...googleCalendarKeys.all, 'conexoes'] as const,
};

/** Estado da integração para o usuário logado (qualquer perfil pode consultar). */
export const useGoogleCalendarStatus = () =>
  useQuery({
    queryKey: googleCalendarKeys.status(),
    queryFn: googleCalendarService.status,
    staleTime: 15_000,
    // Enquanto uma sincronização roda (inclusive disparada em outra aba), acompanha até terminar.
    refetchInterval: (query) => (query.state.data?.conexao?.sincronizando ? 2_000 : false),
  });

/** Conexões da clínica inteira. Exige a permissão de Usuários & Permissões. */
export const useGoogleCalendarConexoes = (enabled = true) =>
  useQuery({
    queryKey: googleCalendarKeys.conexoes(),
    queryFn: googleCalendarService.conexoes,
    enabled,
    staleTime: 15_000,
    retry: false,
  });

/** Pede ao backend a URL de autorização do Google; quem chama redireciona o navegador para ela. */
export const useGoogleCalendarAuthUrl = () =>
  useMutation({ mutationFn: googleCalendarService.authUrl });

/** Dispara a sincronização manual (202). Quem chama acompanha o término pelo polling do status. */
export const useSincronizarGoogleCalendar = () => useMutation({ mutationFn: googleCalendarService.sincronizar });

export const useDesconectarGoogleCalendar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: googleCalendarService.desconectar,
    onSettled: () => qc.invalidateQueries({ queryKey: googleCalendarKeys.all }),
  });
};
