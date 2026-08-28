import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

const STORAGE_KEY = 'bokka:financeiro-visivel';

interface FinancialVisibilityContextType {
  visible: boolean;
  toggleVisible: () => void;
}

const FinancialVisibilityContext = createContext<FinancialVisibilityContextType | undefined>(
  undefined,
);

const readStored = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'hidden';
  } catch {
    return true;
  }
};

export const FinancialVisibilityProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState<boolean>(readStored);

  // Sincroniza entre abas — clicar no olho numa aba reflete nas outras.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setVisible(readStored());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleVisible = useCallback(() => {
    setVisible((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? 'visible' : 'hidden');
      } catch {
        // localStorage indisponível (modo privado etc.) — segue só com o estado em memória.
      }
      return next;
    });
  }, []);

  const value = useMemo<FinancialVisibilityContextType>(
    () => ({ visible, toggleVisible }),
    [visible, toggleVisible],
  );

  return (
    <FinancialVisibilityContext.Provider value={value}>
      {children}
    </FinancialVisibilityContext.Provider>
  );
};

export const useFinancialVisibility = (): FinancialVisibilityContextType => {
  const ctx = useContext(FinancialVisibilityContext);
  if (!ctx) {
    throw new Error(
      'useFinancialVisibility deve ser usado dentro de um FinancialVisibilityProvider',
    );
  }
  return ctx;
};
