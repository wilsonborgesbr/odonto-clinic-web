import { Check, Circle } from 'lucide-react';
import { avaliarSenha, cn, SENHA_MIN_CARACTERES } from '../lib/utils';
import type { NivelSenha } from '../lib/utils';

interface MedidorForcaSenhaProps {
  senha: string;
  /** id do bloco, para o campo apontar com aria-describedby. */
  id: string;
}

const SEGMENTOS: Record<NivelSenha, number> = { vazia: 0, fraca: 1, media: 2, forte: 3 };

const ROTULO: Record<Exclude<NivelSenha, 'vazia'>, { texto: string; cor: string; barra: string }> = {
  fraca: { texto: 'Fraca', cor: 'text-bokka-danger-ink', barra: 'bg-bokka-danger' },
  media: { texto: 'Média', cor: 'text-bokka-warning-ink', barra: 'bg-bokka-warning' },
  forte: { texto: 'Forte', cor: 'text-bokka-success-ink', barra: 'bg-bokka-success' },
};

const Requisito = ({ ok, destaque, children }: { ok: boolean; destaque?: boolean; children: string }) => (
  <li className="flex items-center gap-1.5">
    {ok ? (
      <Check className="w-3.5 h-3.5 shrink-0 text-bokka-success-ink" strokeWidth={2} aria-hidden="true" />
    ) : (
      <Circle className="w-3.5 h-3.5 shrink-0 text-bokka-ink-3" strokeWidth={1.75} aria-hidden="true" />
    )}
    <span className={cn(destaque && 'font-semibold')}>{children}</span>
    <span className="sr-only">{ok ? ' atendido' : ' pendente'}</span>
  </li>
);

/** Barra de força + requisitos da nova senha. Só o mínimo de caracteres bloqueia o envio. */
export const MedidorForcaSenha = ({ senha, id }: MedidorForcaSenhaProps) => {
  const a = avaliarSenha(senha);
  const preenchidos = SEGMENTOS[a.nivel];
  const rotulo = a.nivel === 'vazia' ? null : ROTULO[a.nivel];

  return (
    <div id={id} className="mt-2 space-y-2">
      <div className="flex items-center gap-3">
        <div className="grid grid-cols-3 gap-1.5 flex-1" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={cn(
                'h-1.5 rounded-full',
                n <= preenchidos && rotulo ? rotulo.barra : 'bg-bokka-surface-3',
              )}
            />
          ))}
        </div>
        {/* Só o rótulo é anunciado, e só quando o nível muda (não a cada tecla) */}
        <span aria-live="polite" className={cn('text-xs font-semibold min-w-10 text-right', rotulo?.cor)}>
          {rotulo ? <><span className="sr-only">Força da senha: </span>{rotulo.texto}</> : null}
        </span>
      </div>

      <ul className="text-xs text-bokka-ink-2 space-y-1">
        <Requisito ok={a.minimo} destaque>{`Mínimo de ${SENHA_MIN_CARACTERES} caracteres`}</Requisito>
        <Requisito ok={a.oitoOuMais}>8 ou mais caracteres</Requisito>
        <Requisito ok={a.letrasENumeros}>Letras e números</Requisito>
        <Requisito ok={a.maiusculaEMinuscula}>Maiúscula e minúscula</Requisito>
        <Requisito ok={a.simbolo}>Um símbolo (ex.: ! ? @ #)</Requisito>
      </ul>

      {a.nivel === 'fraca' && a.minimo && (
        <p className="text-xs text-bokka-ink-3">
          Dica: misture letras, números e símbolos para proteger melhor a conta.
        </p>
      )}
    </div>
  );
};
