import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginRequestDTO, AuthResponseDTO } from '../types';
import { fetchApi } from '../services/api';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: LoginRequestDTO) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('@OdontoClinic:token');
  });
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode<{ sub: string }>(token);
        // O JWT do Spring Security usa o email (ou username) no campo 'sub'
        setUser({ email: decoded.sub }); 
      } catch (error) {
        console.error("Token inválido ou malformado:", error);
        logout();
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const login = async (credentials: LoginRequestDTO) => {
    const response = await fetchApi<AuthResponseDTO>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.token) {
      setToken(response.token);
      localStorage.setItem('@OdontoClinic:token', response.token);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('@OdontoClinic:token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
