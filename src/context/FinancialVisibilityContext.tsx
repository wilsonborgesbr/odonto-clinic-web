import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useAtualizarPreferenciasUsuario, useUsuarioMe } from '../services/usuarioService';
import { bokkaToast } from '../components/ui/Toast';
import { FINANCIAL_VISIBILITY_STORAGE_KEY as STORAGE_KEY } from '../lib/api';

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

const writeStored = (visible: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, visible ? 'visible' : 'hidden');
  } catch {
    // localStorage indisponível (modo privado etc.) — segue só com o estado em memória.
  }
};

export const FinancialVisibilityProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  // Estado inicial vem do localStorage — evita "piscar" valores visíveis enquanto o
  // /api/usuarios/me (fonte de verdade, por usuário) ainda não respondeu.
  const [visible, setVisible] = useState<boolean>(readStored);

  const { data: usuarioMe } = useUsuarioMe({ enabled: isAuthenticated });
  const atualizarPreferencias = useAtualizarPreferenciasUsuario();

  // Sincroniza entre abas — clicar no olho numa aba reflete nas outras (cache local).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setVisible(readStored());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Backend é a fonte de verdade por usuário — assim que /me responde, o estado (e o
  // cache otimista em localStorage) se alinha à preferência salva daquele usuário.
  useEffect(() => {
    if (!usuarioMe) return;
    const backendVisible = !usuarioMe.preferences?.hideFinancialInfo;
    setVisible(backendVisible);
    writeStored(backendVisible);
  }, [usuarioMe]);

  const toggleVisible = useCallback(() => {
    // O valor novo é calculado fora do updater do setState — em React 19,
    // o updater funcional pode ser invocado mais de uma vez (StrictMode,
    // concurrent rendering), e um side-effect (chamar a API) lá dentro
    // dispararia requisições duplicadas.
    const prev = visible;
    const next = !prev;
    setVisible(next);
    writeStored(next);
    atualizarPreferencias.mutate(
      { hideFinancialInfo: !next },
      {
        onError: () => {
          // Reverte o otimismo local — backend segue sendo a fonte de verdade.
          setVisible(prev);
          writeStored(prev);
          bokkaToast.error('Não foi possível salvar a preferência de visibilidade.');
        },
      },
    );
  }, [visible, atualizarPreferencias]);

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
