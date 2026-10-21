import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Abre a edição de um cadastro quando a página é acessada com `?editar=<id>` (usado pela tela
 * de cadastros a corrigir). O parâmetro é consumido uma única vez e removido da URL.
 */
export const useEditarPorUrl = (abrir: (id: string) => void) => {
  const [params, setParams] = useSearchParams();
  const id = params.get('editar');
  const tratado = useRef<string | null>(null);

  useEffect(() => {
    if (!id) {
      tratado.current = null;
      return;
    }
    if (tratado.current === id) return;
    tratado.current = id;
    abrir(id);
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('editar');
        return next;
      },
      { replace: true },
    );
  }, [id, abrir, setParams]);
};
