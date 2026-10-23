import { useMemo } from 'react';
import { Building2, ChevronRight, Loader2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { compararNomes } from '../lib/utils';
import type { ClinicaOpcaoDTO } from '../types';

interface SeletorClinicaModalProps {
  open: boolean;
  clinicas: ClinicaOpcaoDTO[];
  /** Código da clínica do último acesso: aparece primeiro, com selo. */
  ultimoCodigo?: string;
  /** Clínica cuja seleção está em andamento (trava as demais). */
  escolhendoId: string | null;
  erro: string | null;
  onEscolher: (clinicaId: string) => void;
  onClose: () => void;
}

/** Só abre depois que o backend validou a senha: nunca lista clínicas antes disso. */
export const SeletorClinicaModal = ({
  open,
  clinicas,
  ultimoCodigo,
  escolhendoId,
  erro,
  onEscolher,
  onClose,
}: SeletorClinicaModalProps) => {
  const ordenadas = useMemo(() => {
    const ultimo = ultimoCodigo?.trim().toLowerCase();
    const porNome = [...clinicas].sort((a, b) => compararNomes(a.nome, b.nome));
    if (!ultimo) return porNome;
    return [
      ...porNome.filter((c) => c.codigo.toLowerCase() === ultimo),
      ...porNome.filter((c) => c.codigo.toLowerCase() !== ultimo),
    ];
  }, [clinicas, ultimoCodigo]);

  const ocupado = escolhendoId !== null;

  return (
    <Modal
      open={open}
      onClose={ocupado ? () => undefined : onClose}
      title="Escolha a clínica"
      subtitle="Seu e-mail está ligado a mais de uma clínica. Selecione onde quer entrar."
      size="sm"
      footer={
        <Button type="button" variant="ghost" onClick={onClose} disabled={ocupado}>
          Cancelar
        </Button>
      }
    >
      {erro && (
        <div
          role="alert"
          className="mb-4 text-sm text-bokka-danger-ink bg-bokka-danger-soft border border-bokka-danger/20 rounded-md px-3 py-2"
        >
          {erro}
        </div>
      )}

      <ul className="space-y-2" aria-busy={ocupado}>
        {ordenadas.map((c) => {
          const escolhida = escolhendoId === c.id;
          const ehUltimo = !!ultimoCodigo && c.codigo.toLowerCase() === ultimoCodigo.trim().toLowerCase();
          return (
            <li key={c.id}>
              <button
                type="button"
                disabled={ocupado}
                onClick={() => onEscolher(c.id)}
                title={c.nome}
                className="w-full flex items-center gap-3 rounded-xl border border-bokka-border bg-bokka-surface p-3 text-left transition-colors hover:border-bokka-primary hover:bg-bokka-primary-soft/40 focus-visible:outline-2 focus-visible:outline-bokka-primary-ring focus-visible:outline-offset-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                <span className="w-10 h-10 rounded-lg bg-bokka-primary-soft text-bokka-primary flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-bokka-ink truncate">{c.nome}</span>
                  <span className="block text-xs text-bokka-ink-3 truncate">Código: {c.codigo}</span>
                </span>
                {escolhida ? (
                  <Loader2
                    className="w-4 h-4 text-bokka-primary animate-spin shrink-0"
                    aria-label="Entrando"
                  />
                ) : ehUltimo ? (
                  <Badge tone="neutral">Último acesso</Badge>
                ) : (
                  <ChevronRight className="w-4 h-4 text-bokka-ink-3 shrink-0" aria-hidden="true" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
};
