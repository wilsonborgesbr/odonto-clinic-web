import { formatCpf } from '../../lib/utils';

interface ResponsavelValorProps {
  nome?: string | null;
  cpf?: string | null;
}

/** Valor da linha "Responsável" nas fichas do paciente (página e modal). */
export const ResponsavelValor = ({ nome, cpf }: ResponsavelValorProps) => {
  if (!nome && !cpf) {
    return <span className="font-normal text-bokka-ink-3">Não informado</span>;
  }
  return (
    <>
      <div>{nome || '—'}</div>
      {cpf && <div className="text-bokka-ink-2 text-xs tabular-nums">{formatCpf(cpf)}</div>}
    </>
  );
};
