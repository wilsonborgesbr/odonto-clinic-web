import { useAuth } from '../context/AuthContext';

export const ROTA_PENDENCIAS = '/cadastros/pendencias';

/** Pode consultar as pendências quem tem permissão em ao menos um módulo (senão o backend dá 403). */
export const usePodeVerPendencias = (): boolean => {
  const { user } = useAuth();
  if (!user) return false;
  if (user.role === 'PROPRIETARIO' || user.role === 'SOCIO') return true;
  return (user.permissoes?.length ?? 0) > 0;
};
