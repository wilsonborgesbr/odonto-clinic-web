import { cn } from '../lib/utils';
import iconeClaro from '../assets/marca/icone-k2-claro.svg';
import iconeEscuro from '../assets/marca/icone-k2-escuro.svg';
import logotipoClaro from '../assets/marca/logotipo-L2-claro.svg';
import logotipoEscuro from '../assets/marca/logotipo-L2-escuro.svg';

interface BokkaMarkProps {
  /** Lado do ícone em px, como aparece na tela (sem contar o brilho da versão escura). */
  size?: number;
  /** Mostra o logotipo "bokka" (L2) junto do ícone. */
  withWordmark?: boolean;
  /** Ícone em cima, logotipo embaixo (painel de login). O padrão é lado a lado (menu lateral). */
  empilhado?: boolean;
  /** Altura do logotipo em px. Padrão: proporcional ao ícone (a mesma do mockup do menu lateral). */
  wordmarkAltura?: number;
  /** Fundo escuro fixo nos dois temas (painel marinho): usa sempre a versão escura da marca. */
  sobreEscuro?: boolean;
  className?: string;
}

/** Folga que a versão escura do ícone (1264 x 1264) tem em volta do quadrado de 1024 para o brilho verde. */
const FOLGA_BRILHO = 120 / 1024;
/** Proporção do arquivo do logotipo L2 (834 x 256), já sem a folga vertical de cima. */
const PROPORCAO_LOGOTIPO = 834 / 256;

/**
 * Marca Bokka (K2): ícone do sorriso + logotipo L2. Os SVGs ficam em src/assets/marca/ (kit final do Designer).
 * No tema escuro troca para a versão escura (ícone com brilho verde e logotipo branco), pelo atributo
 * data-theme do <html> (regras `.bokka-marca-*` em index.css), sem JS e sem piscar.
 */
export const BokkaMark = ({
  size = 32,
  withWordmark = false,
  empilhado = false,
  wordmarkAltura,
  sobreEscuro = false,
  className,
}: BokkaMarkProps) => {
  const altura = wordmarkAltura ?? Math.round(size * 0.6875);
  const largura = Math.round(altura * PROPORCAO_LOGOTIPO * 10) / 10;
  const ladoEscuro = Math.round(size * (1 + FOLGA_BRILHO * 2) * 100) / 100;
  const folga = Math.round(size * FOLGA_BRILHO * 100) / 100;

  const icone = (src: string, classe: string, escuro: boolean) => (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={escuro ? ladoEscuro : size}
      height={escuro ? ladoEscuro : size}
      draggable={false}
      className={cn('shrink-0 select-none max-w-none', classe)}
      style={escuro ? { margin: -folga } : undefined}
    />
  );

  const logotipo = (src: string, classe: string) => (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={largura}
      height={altura}
      draggable={false}
      className={cn('shrink-0 select-none max-w-none', classe)}
      style={{ width: largura, height: altura }}
    />
  );

  // Só uma das duas versões (clara/escura) aparece por vez, e qual delas depende do tema (CSS). Por isso todas as
  // imagens ficam aria-hidden e o nome "Bokka" vai no contêiner, quando há logotipo.
  return (
    <div
      {...(withWordmark ? { role: 'img', 'aria-label': 'Bokka' } : {})}
      className={cn(
        'inline-flex',
        empilhado ? 'flex-col items-start gap-7' : 'items-center gap-3',
        className,
      )}
    >
      {sobreEscuro ? (
        icone(iconeEscuro, '', true)
      ) : (
        <>
          {icone(iconeClaro, 'bokka-marca-claro', false)}
          {icone(iconeEscuro, 'bokka-marca-escuro', true)}
        </>
      )}
      {withWordmark &&
        (sobreEscuro ? (
          logotipo(logotipoEscuro, '')
        ) : (
          <>
            {logotipo(logotipoClaro, 'bokka-marca-claro')}
            {logotipo(logotipoEscuro, 'bokka-marca-escuro')}
          </>
        ))}
    </div>
  );
};
