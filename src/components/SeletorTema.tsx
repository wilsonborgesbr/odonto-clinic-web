import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/themeContextValue';
import { TEMA_VISIVEL } from '../lib/tema';

/**
 * Botão da topbar que alterna entre Claro e Escuro. Mostra o ícone do tema para o qual vai trocar
 * (lua no claro, sol no escuro); o tooltip e o rótulo dizem o mesmo. Mesmo tamanho dos outros botões
 * redondos da topbar (40px), então não estoura a barra em 375px.
 */
export const SeletorTema = () => {
  const { tema, alternarTema } = useTheme();
  const paraEscuro = tema === 'light';
  const destino = paraEscuro ? 'Tema escuro' : 'Tema claro';
  const Icone = paraEscuro ? Moon : Sun;

  // Interruptor desligado (produção): o botão não existe.
  if (!TEMA_VISIVEL) return null;

  return (
    <button
      type="button"
      onClick={alternarTema}
      title={destino}
      aria-label={`Mudar para ${destino.toLowerCase()}`}
      className="shrink-0 w-10 h-10 rounded-full border border-bokka-border bg-bokka-surface text-bokka-ink-2 hover:bg-bokka-surface-3 flex items-center justify-center transition-colors"
    >
      <Icone className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
    </button>
  );
};
