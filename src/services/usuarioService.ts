import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { PermissaoEnum, RoleEnum, UsuarioDTO } from '../types';

export interface CriarUsuarioPayload {
  name: string;
  email: string;
  password: string;
  role: RoleEnum;
  permissoes?: PermissaoEnum[];
}

export interface AtualizarUsuarioPayload {
  name: string;
  email: string;
  role: RoleEnum;
  permissoes?: PermissaoEnum[];
  novaSenha?: string;
}

export interface AtualizarPreferenciasPayload {
  hideFinancialInfo: boolean;
}

export const usuarioService = {
  listar: async () => (await api.get<UsuarioDTO[]>('/api/usuarios')).data,
  me: async () => (await api.get<UsuarioDTO>('/api/usuarios/me')).data,
  criar: async (p: CriarUsuarioPayload) => (await api.post<UsuarioDTO>('/api/usuarios', p)).data,
  atualizar: async (id: string, p: AtualizarUsuarioPayload) =>
    (await api.put<UsuarioDTO>(`/api/usuarios/${id}`, p)).data,
  atualizarPreferencias: async (p: AtualizarPreferenciasPayload) =>
    (await api.patch<UsuarioDTO>('/api/usuarios/me/preferences', p)).data,
  inativar: async (id: string) => {
    await api.delete(`/api/usuarios/${id}`);
  },
  reativar: async (id: string) =>
    (await api.patch<UsuarioDTO>(`/api/usuarios/${id}/reativar`)).data,
};

export const usuarioKeys = {
  all: ['usuarios'] as const,
  list: () => [...usuarioKeys.all, 'list'] as const,
  me: () => [...usuarioKeys.all, 'me'] as const,
};

export const useUsuarioMe = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: usuarioKeys.me(),
    queryFn: usuarioService.me,
    enabled: options?.enabled ?? true,
  });

export const useAtualizarPreferenciasUsuario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usuarioService.atualizarPreferencias,
    onMutate: async (payload) => {
      // Cancela refetches em andamento pra uma resposta atrasada não sobrescrever
      // o update otimista abaixo (padrão canônico do React Query v5).
      await qc.cancelQueries({ queryKey: usuarioKeys.me() });
      const previous = qc.getQueryData<UsuarioDTO>(usuarioKeys.me());
      if (previous) {
        qc.setQueryData<UsuarioDTO>(usuarioKeys.me(), {
          ...previous,
          preferences: { ...previous.preferences, hideFinancialInfo: payload.hideFinancialInfo },
        });
      }
      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) qc.setQueryData(usuarioKeys.me(), context.previous);
    },
    onSuccess: (data) => qc.setQueryData(usuarioKeys.me(), data),
  });
};

export const useUsuarios = () =>
  useQuery({
    queryKey: usuarioKeys.list(),
    queryFn: usuarioService.listar,
  });

export const useCriarUsuario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usuarioService.criar,
    onSuccess: () => qc.invalidateQueries({ queryKey: usuarioKeys.all }),
  });
};

export const useAtualizarUsuario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AtualizarUsuarioPayload }) =>
      usuarioService.atualizar(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: usuarioKeys.all }),
  });
};

export const useInativarUsuario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usuarioService.inativar,
    onSuccess: () => qc.invalidateQueries({ queryKey: usuarioKeys.all }),
  });
};

export const useReativarUsuario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usuarioService.reativar,
    onSuccess: () => qc.invalidateQueries({ queryKey: usuarioKeys.all }),
  });
};
