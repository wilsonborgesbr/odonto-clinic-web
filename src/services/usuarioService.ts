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

export const usuarioService = {
  listar: async () => (await api.get<UsuarioDTO[]>('/api/usuarios')).data,
  me: async () => (await api.get<UsuarioDTO>('/api/usuarios/me')).data,
  criar: async (p: CriarUsuarioPayload) => (await api.post<UsuarioDTO>('/api/usuarios', p)).data,
  atualizar: async (id: string, p: AtualizarUsuarioPayload) =>
    (await api.put<UsuarioDTO>(`/api/usuarios/${id}`, p)).data,
  inativar: async (id: string) => {
    await api.delete(`/api/usuarios/${id}`);
  },
  reativar: async (id: string) =>
    (await api.patch<UsuarioDTO>(`/api/usuarios/${id}/reativar`)).data,
};

export const usuarioKeys = {
  all: ['usuarios'] as const,
  list: () => [...usuarioKeys.all, 'list'] as const,
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
