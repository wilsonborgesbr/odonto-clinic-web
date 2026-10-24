import { Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  UserCog,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { usePodeVerPendencias } from '../../hooks/usePodeVerPendencias';
import { usePendenciasCadastro } from '../../services/cadastroService';
import type { EntidadePendencia, PendenciaItem } from '../../types';

interface GrupoConfig {
  titulo: string;
  icone: ReactNode;
  /** Página onde o cadastro é editado; sem rota = só exibição. */
  rota?: string;
}

const ICONE = 'h-4 w-4';

// Ordem de exibição dos grupos
const GRUPOS: Record<EntidadePendencia, GrupoConfig> = {
  PACIENTE: { titulo: 'Pacientes', icone: <Users className={ICONE} strokeWidth={1.75} />, rota: '/pacientes' },
  DENTISTA: { titulo: 'Dentistas', icone: <Stethoscope className={ICONE} strokeWidth={1.75} />, rota: '/dentistas' },
  FUNCIONARIO: { titulo: 'Funcionários', icone: <UserCog className={ICONE} strokeWidth={1.75} />, rota: '/funcionarios' },
  CONVENIO: { titulo: 'Convênios', icone: <ShieldCheck className={ICONE} strokeWidth={1.75} />, rota: '/convenios' },
  CLINICA: { titulo: 'Clínica', icone: <Building2 className={ICONE} strokeWidth={1.75} /> },
};

const ORDEM: EntidadePendencia[] = ['PACIENTE', 'DENTISTA', 'FUNCIONARIO', 'CONVENIO', 'CLINICA'];

const CAMPO_LABEL: Record<string, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  cro: 'CRO',
  telefone: 'Telefone',
  telefoneCelular: 'Celular',
  telefoneFixo: 'Telefone fixo',
  telefoneEmergencia: 'Telefone de emergência',
  cep: 'CEP',
  'endereco.cep': 'CEP',
};

const labelCampo = (campo: string) => CAMPO_LABEL[campo] ?? campo;

const ItemLinha = ({ item }: { item: PendenciaItem }) => {
  const rota = GRUPOS[item.entidade]?.rota;
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-bokka-ink">{item.nome}</p>
        <ul className="mt-1.5 space-y-1">
          {item.campos.map((c) => (
            <li key={c.campo} className="text-xs leading-relaxed text-bokka-ink-2">
              <span className="font-semibold">{labelCampo(c.campo)}:</span>{' '}
              <span className="break-all rounded bg-bokka-danger-soft px-1.5 py-0.5 font-mono text-bokka-danger-ink">
                {c.valor?.trim() ? c.valor : 'vazio'}
              </span>{' '}
              <span className="text-bokka-ink-3">— {c.motivo}</span>
            </li>
          ))}
        </ul>
      </div>
      {rota ? (
        <Link
          to={`${rota}?editar=${encodeURIComponent(item.id)}`}
          className="inline-flex shrink-0 items-center gap-1 self-start text-sm font-semibold text-bokka-primary-text hover:underline"
        >
          Corrigir
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
        </Link>
      ) : (
        <span className="shrink-0 self-start text-xs text-bokka-ink-3">Somente visualização</span>
      )}
    </li>
  );
};

export const PendenciasPage = () => {
  const habilitado = usePodeVerPendencias();
  const q = usePendenciasCadastro({ enabled: habilitado });

  const itens = q.data?.itens ?? [];
  const total = q.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-bokka-ink">Cadastros a corrigir</h1>
        <p className="mt-1 text-sm text-bokka-ink-3">
          {q.isLoading
            ? 'Carregando...'
            : total > 0
              ? `${total} ${total === 1 ? 'cadastro tem' : 'cadastros têm'} dados inválidos (CPF, CNPJ, CRO, telefone ou CEP). Nada é bloqueado, mas vale corrigir.`
              : 'Dados de documentos e contatos dos cadastros.'}
        </p>
      </div>

      {q.isLoading && (
        <Card className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
      )}

      {q.isError && (
        <Card className="flex flex-col items-start gap-3">
          <p className="text-sm text-bokka-danger-ink">Não foi possível carregar a lista agora.</p>
          <Button variant="secondary" size="sm" onClick={() => q.refetch()}>
            Tentar novamente
          </Button>
        </Card>
      )}

      {!q.isLoading && !q.isError && total === 0 && (
        <Card padded={false}>
          <EmptyState
            icon={<CheckCircle2 className="h-6 w-6" strokeWidth={1.75} />}
            title="Tudo certo por aqui"
            description="Nenhum cadastro com dados a corrigir."
          />
        </Card>
      )}

      {ORDEM.map((entidade) => {
        const doGrupo = itens.filter((i) => i.entidade === entidade);
        if (doGrupo.length === 0) return null;
        const grupo = GRUPOS[entidade];
        return (
          <section key={entidade} aria-labelledby={`pend-${entidade}`}>
            <h2
              id={`pend-${entidade}`}
              className="mb-2 flex items-center gap-2 text-sm font-semibold text-bokka-ink"
            >
              <span className="text-bokka-ink-3">{grupo.icone}</span>
              {grupo.titulo}
              <span className="rounded-full bg-bokka-warning-soft px-2 py-0.5 text-xs font-semibold text-bokka-warning-ink">
                {doGrupo.length}
              </span>
            </h2>
            <Card padded={false}>
              <ul className="divide-y divide-bokka-border">
                {doGrupo.map((item) => (
                  <ItemLinha key={`${item.entidade}-${item.id}`} item={item} />
                ))}
              </ul>
            </Card>
          </section>
        );
      })}
    </div>
  );
};
