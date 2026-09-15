import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { api, TOKEN_STORAGE_KEY } from '../lib/api';
import type {
  AuthResponseDTO,
  LoginRequestDTO,
  PermissaoEnum,
  RegisterClinicaRequestDTO,
  RoleEnum,
  User,
} from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: LoginRequestDTO) => Promise<void>;
  registerClinica: (data: RegisterClinicaRequestDTO) => Promise<void>;
  logout: () => void;
  updateName: (name: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  /** Verifica se o usuário atual possui uma permissão específica. */
  hasPermissao: (permissao: PermissaoEnum) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface JwtClaims {
  sub?: string;
  name?: string;
  email?: string;
  userId?: string;
  clinicaId?: string;
  clinicaCodigo?: string;
  role?: RoleEnum;
  permissoes?: PermissaoEnum[];
}

const decodeUser = (token: string): User | null => {
  try {
    const decoded = jwtDecode<JwtClaims>(token);
    return {
      id: decoded.userId,
      email: decoded.email || decoded.sub || undefined,
      name: decoded.name || undefined,
      clinicaId: decoded.clinicaId,
      clinicaCodigo: decoded.clinicaCodigo,
      role: decoded.role,
      permissoes: decoded.permissoes ?? [],
    };
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  );
  const [user, setUser] = useState<User | null>(() => {
    const t = localStorage.getItem(TOKEN_STORAGE_KEY);
    return t ? decodeUser(t) : null;
  });

  useEffect(() => {
    if (token) {
      const u = decodeUser(token);
      if (!u) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
      } else {
        setUser(u);
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const login = useCallback(async (credentials: LoginRequestDTO) => {
    const { data } = await api.post<AuthResponseDTO>('/auth/login', credentials);
    if (data.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setToken(data.token);
    }
  }, []);

  const registerClinica = useCallback(async (payload: RegisterClinicaRequestDTO) => {
    const { data } = await api.post<AuthResponseDTO>('/auth/register-clinica', payload);
    if (data.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setToken(data.token);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateName = useCallback(
    async (name: string) => {
      const { data } = await api.put<AuthResponseDTO>('/auth/profile', {
        name,
        email: user?.email,
      });
      if (data.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        setToken(data.token);
      }
    },
    [user?.email],
  );

  const updateEmail = useCallback(
    async (email: string) => {
      const { data } = await api.put<AuthResponseDTO>('/auth/profile', {
        name: user?.name ?? '',
        email,
      });
      if (data.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        setToken(data.token);
      }
    },
    [user?.name],
  );

  const hasPermissao = useCallback(
    (permissao: PermissaoEnum): boolean => {
      if (!user) return false;
      // Proprietário e sócio sempre têm tudo (defensivo — o backend já garante).
      if (user.role === 'PROPRIETARIO' || user.role === 'SOCIO') return true;
      return user.permissoes?.includes(permissao) ?? false;
    },
    [user],
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      login,
      registerClinica,
      logout,
      updateName,
      updateEmail,
      hasPermissao,
    }),
    [user, token, login, registerClinica, logout, updateName, updateEmail, hasPermissao],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return ctx;
};

/** Atalho para consumir uma permissão específica de forma reativa. */
export const usePermissao = (permissao: PermissaoEnum): boolean => {
  const { hasPermissao } = useAuth();
  return hasPermissao(permissao);
};
