import { useCallback } from 'react';
import { bokkaToast } from '../components/ui/Toast';
import { useVincularOdontograma } from '../services/procedimentoService';
import type { CondicaoDenteEnum, FaceDenteEnum } from '../types';

/** Dente, faces e condição (opcional) que o usuário marcou no SeletorDenteFace ao criar ou editar um procedimento. */
export interface MarcaNoSeletor {
  dente: string;
  faces: FaceDenteEnum[];
  /** Só vai se o usuário escolheu uma condição; "manter como está" não manda nada. */
  condicao?: CondicaoDenteEnum;
}

/**
 * O POST/PUT de procedimento não vincula o odontograma sozinho: depois de salvar, quem marcou dente
 * ou faces no seletor chama vincular-odontograma com o id devolvido. Sem marca, nada é chamado.
 * Se o vínculo falhar o procedimento já está salvo, então só avisa e aponta o botão da lista.
 */
export const useMarcarDenteAposSalvar = () => {
  const { mutateAsync } = useVincularOdontograma();
  return useCallback(
    async (procedimentoId: string | undefined, marca: MarcaNoSeletor | undefined) => {
      if (!procedimentoId || !marca) return;
      try {
        const r = await mutateAsync({
          id: procedimentoId,
          req: {
            dente: marca.dente,
            faces: marca.faces.length > 0 ? marca.faces : undefined,
            condicao: marca.condicao,
          },
        });
        bokkaToast.success(r.odontogramaCriado ? 'Odontograma criado e dente marcado.' : 'Dente marcado no odontograma.');
      } catch {
        bokkaToast.warning('Procedimento salvo, mas não deu para marcar no odontograma. Use "Marcar no odontograma" na lista.');
      }
    },
    [mutateAsync],
  );
};
