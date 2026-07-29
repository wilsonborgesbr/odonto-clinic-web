import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { api, TOKEN_STORAGE_KEY } from '../lib/api';
import type { AuthResponseDTO, LoginRequestDTO, RegisterRequestDTO, User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (data: LoginRequestDTO) => Promise<void>;
  register: (data: RegisterRequestDTO) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const decodeUser = (token: string): User | null => {
  try {
    const decoded = jwtDecode<{ sub?: string; name?: string; email?: string }>(token);
    return {
      email: decoded.email || decoded.sub || undefined,
      name: decoded.name || undefined,
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

  const register = useCallback(async (payload: RegisterRequestDTO) => {
    const { data } = await api.post<AuthResponseDTO>('/auth/register', payload);
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

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      login,
      register,
      logout,
    }),
    [user, token, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return ctx;
};
