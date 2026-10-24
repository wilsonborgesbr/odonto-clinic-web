import { createContext, useContext } from 'react';
import type { Tema } from '../lib/tema';

export interface ThemeContextType {
  /** Tema que está valendo na tela: 'light' (padrão) ou 'dark'. */
  tema: Tema;
  setTema: (tema: Tema) => void;
  alternarTema: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return ctx;
};
