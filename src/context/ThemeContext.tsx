import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useAtualizarPreferenciasUsuario, useUsuarioMeParaTema } from '../services/usuarioService';
import {
  TEMA_NO_BACKEND,
  TEMA_PADRAO,
  TEMA_STORAGE_KEY,
  TEMA_VISIVEL,
  aplicarTema,
  ehTema,
  lerTemaSalvo,
  salvarTema,
} from '../lib/tema';
import type { Tema } from '../lib/tema';
import { ThemeContext } from './themeContextValue';
import type { ThemeContextType } from './themeContextValue';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  // Estado inicial vem do cache local — o script do index.html já pintou o mesmo tema, então não há "pisca".
  const [tema, setTemaState] = useState<Tema>(lerTemaSalvo);

  // Interruptor desligado (produção): sempre Claro, não importa o que o navegador ou o servidor guardaram.
  const temaAtivo: Tema = TEMA_VISIVEL ? tema : TEMA_PADRAO;

  useEffect(() => aplicarTema(temaAtivo), [temaAtivo]);

  // Sincroniza entre abas — trocar o tema numa aba reflete nas outras.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (TEMA_VISIVEL && e.key === TEMA_STORAGE_KEY) setTemaState(lerTemaSalvo());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // --- Integração com o backend (ligada por TEMA_NO_BACKEND em lib/tema.ts) ---
  const { data: usuarioMe } = useUsuarioMeParaTema(user?.id, isAuthenticated && TEMA_NO_BACKEND && TEMA_VISIVEL);
  const atualizarPreferencias = useAtualizarPreferenciasUsuario();
  const sincronizadoParaUsuario = useRef<string | null>(null);
  const escolheuNaSessao = useRef(false);

  // O tema salvo no servidor é o do usuário que entrou, e SEMPRE substitui o que estava no navegador
  // (que pode ser de outro usuário): sem escolha salva (ausente, nulo ou 'system') vale o padrão Claro.
  // Lido UMA vez por sessão: se a leitura se repetisse, um PATCH que falhou desfaria a escolha recém-feita.
  // Não grava nada no servidor (o PATCH só acontece quando o usuário clica no botão). Se o /me falhar,
  // este efeito não roda: o tema atual vale só nesta sessão e não é gravado como escolha do novo usuário.
  useEffect(() => {
    if (!isAuthenticated) {
      sincronizadoParaUsuario.current = null;
      escolheuNaSessao.current = false;
      return;
    }
    if (!TEMA_VISIVEL || !TEMA_NO_BACKEND || !usuarioMe || !user?.id || usuarioMe.id !== user.id) return;
    if (sincronizadoParaUsuario.current === usuarioMe.id) return;
    sincronizadoParaUsuario.current = usuarioMe.id;
    // Se o usuário já clicou no botão antes do /me responder, a escolha dele (já enviada) vale mais.
    if (escolheuNaSessao.current) return;
    const doServidor = usuarioMe.preferences?.theme;
    const temaEfetivo = ehTema(doServidor) ? doServidor : TEMA_PADRAO;
    setTemaState(temaEfetivo);
    salvarTema(temaEfetivo);
  }, [isAuthenticated, usuarioMe, user?.id]);

  const setTema = useCallback(
    (novo: Tema) => {
      if (!TEMA_VISIVEL || !ehTema(novo)) return;
      escolheuNaSessao.current = true;
      setTemaState(novo);
      salvarTema(novo);
      // Tema é conveniência: se o PATCH falhar, a escolha continua valendo neste navegador (sem toast).
      if (TEMA_NO_BACKEND && isAuthenticated) {
        atualizarPreferencias.mutate({ theme: novo });
      }
    },
    [isAuthenticated, atualizarPreferencias],
  );

  const alternarTema = useCallback(
    () => setTema(temaAtivo === 'dark' ? 'light' : 'dark'),
    [setTema, temaAtivo],
  );

  const value = useMemo<ThemeContextType>(
    () => ({ tema: temaAtivo, setTema, alternarTema }),
    [temaAtivo, setTema, alternarTema],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
