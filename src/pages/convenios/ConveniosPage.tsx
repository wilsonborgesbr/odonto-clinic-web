import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Percent,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { Input, Textarea } from '../../components/ui/Field';
import { bokkaToast } from '../../components/ui/Toast';
import {
  useConvenios,
  useCriarConvenio,
  useAtualizarConvenio,
  useInativarConvenio,
  useReativarConvenio,
} from '../../services/convenioService';
import { ApiError } from '../../lib/api';
import { cn, formatPhone, formatDate } from '../../lib/utils';
import type { Convenio, NomeProcedimentoEnum, Endereco } from '../../types';

const formatCnpj = (cnpj?: string | null): string => {
  if (!cnpj) return '—';
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};

const procLabel: Record<NomeProcedimentoEnum, string> = {
  RESTAURACAO_RESINA: 'Restauração em Resina',
  RESTAURACAO_AMALGAMA: 'Restauração em Amálgama',
  INLAY: 'Inlay',
  ONLAY: 'Onlay',
  FACETA_PORCELANA: 'Faceta de Porcelana',
  FACETA_RESINA: 'Faceta de Resina',
  TRATAMENTO_CANAL_UNIRRADICULAR: 'Canal Unirradicular',
  TRATAMENTO_CANAL_BIRRADICULAR: 'Canal Birradicular',
  TRATAMENTO_CANAL_MULTIRRADICULAR: 'Canal Multirradicular',
  RETRATAMENTO_CANAL: 'Retratamento de Canal',
  PROFILAXIA: 'Profilaxia',
  RASPAGEM_SUPRAGENGIVAL: 'Raspagem Supragengival',
  RASPAGEM_SUBGENGIVAL: 'Raspagem Subgengival',
  GENGIVECTOMIA: 'Gengivectomia',
  ENXERTO_GENGIVAL: 'Enxerto Gengival',
  EXTRACAO_SIMPLES: 'Extração Simples',
  EXTRACAO_DENTE_SISO: 'Extração de Siso',
  CIRURGIA_PERIODONTAL: 'Cirurgia Periodontal',
  FRENECTOMIA: 'Frenectomia',
  BIOPSIA: 'Biópsia',
  INSTALACAO_IMPLANTE: 'Implante',
  INSTALACAO_PROTESE_SOBRE_IMPLANTE: 'Prótese sobre Implante',
  ENXERTO_OSSEO: 'Enxerto Ósseo',
  PROTESE_PARCIAL_REMOVIVEL: 'PPR',
  PROTESE_TOTAL: 'Prótese Total',
  COROA_PORCELANA: 'Coroa de Porcelana',
  COROA_METALICA: 'Coroa Metálica',
  PONTE_FIXA: 'Ponte Fixa',
  APARELHO_METALICO: 'Aparelho Metálico',
  APARELHO_ESTETICO: 'Aparelho Estético',
  APARELHO_INVISIVEL: 'Aparelho Invisível',
  MANUTENCAO_ORTODONTICA: 'Manutenção Ortodôntica',
  CONTENCAO: 'Contenção',
  SELANTE: 'Selante',
  FLUORTERAPIA: 'Fluorterapia',
  COROA_PEDIATRICA: 'Coroa Pediátrica',
  PULPOTOMIA: 'Pulpotomia',
  CLAREAMENTO_CASEIRO: 'Clareamento Caseiro',
  CLAREAMENTO_CONSULTORIO: 'Clareamento Consultório',
  MICROABRASAO: 'Microabrasão',
  RADIOGRAFIA_PERIAPICAL: 'Rx Periapical',
  RADIOGRAFIA_PANORAMICA: 'Rx Panorâmica',
  TOMOGRAFIA: 'Tomografia',
};

interface ProcedureGroup {
  label: string;
  items: NomeProcedimentoEnum[];
}

const procedureGroups: ProcedureGroup[] = [
  {
    label: 'Prevenção',
    items: [
      'PROFILAXIA',
      'RASPAGEM_SUPRAGENGIVAL',
      'RASPAGEM_SUBGENGIVAL',
      'FLUORTERAPIA',
      'SELANTE',
      'RADIOGRAFIA_PERIAPICAL',
      'RADIOGRAFIA_PANORAMICA',
      'TOMOGRAFIA',
    ],
  },
  {
    label: 'Dentística',
    items: [
      'RESTAURACAO_RESINA',
      'RESTAURACAO_AMALGAMA',
      'INLAY',
      'ONLAY',
      'FACETA_PORCELANA',
      'FACETA_RESINA',
      'CLAREAMENTO_CASEIRO',
      'CLAREAMENTO_CONSULTORIO',
      'MICROABRASAO',
    ],
  },
  {
    label: 'Endodontia',
    items: [
      'TRATAMENTO_CANAL_UNIRRADICULAR',
      'TRATAMENTO_CANAL_BIRRADICULAR',
      'TRATAMENTO_CANAL_MULTIRRADICULAR',
      'RETRATAMENTO_CANAL',
    ],
  },
  {
    label: 'Periodontia',
    items: ['GENGIVECTOMIA', 'ENXERTO_GENGIVAL', 'CIRURGIA_PERIODONTAL'],
  },
  {
    label: 'Cirurgia',
    items: ['EXTRACAO_SIMPLES', 'EXTRACAO_DENTE_SISO', 'FRENECTOMIA', 'BIOPSIA'],
  },
  {
    label: 'Prótese',
    items: [
      'PROTESE_PARCIAL_REMOVIVEL',
      'PROTESE_TOTAL',
      'COROA_PORCELANA',
      'COROA_METALICA',
      'PONTE_FIXA',
      'INSTALACAO_IMPLANTE',
      'INSTALACAO_PROTESE_SOBRE_IMPLANTE',
      'ENXERTO_OSSEO',
    ],
  },
  {
    label: 'Ortodontia',
    items: [
      'APARELHO_METALICO',
      'APARELHO_ESTETICO',
      'APARELHO_INVISIVEL',
      'MANUTENCAO_ORTODONTICA',
      'CONTENCAO',
    ],
  },
  {
    label: 'Odontopediatria',
    items: ['COROA_PEDIATRICA', 'PULPOTOMIA'],
  },
];

const ITEMS_PER_PAGE = 10;

const emptyConvenio: Convenio = {
  nome: '',
  cnpj: '',
  registroANS: '',
  nomeContato: '',
  telefone: '',
  email: '',
  website: '',
  endereco: {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  },
  tabelaDePrecos: '',
  percentualCobertura: 0,
  carenciaDias: 0,
  dataInicioContrato: '',
  dataFimContrato: '',
  limiteConsultasMes: 0,
  coberturas: [],
  observacoes: '',
};

const CoberturasPicker = ({
  selected,
  onChange,
}: {
  selected: NomeProcedimentoEnum[];
  onChange: (next: NomeProcedimentoEnum[]) => void;
}) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (proc: NomeProcedimentoEnum) => {
    const next = selected.includes(proc)
      ? selected.filter((p) => p !== proc)
      : [...selected, proc];
    onChange(next);
  };

  const toggleGroup = (group: ProcedureGroup) => {
    const allSelected = group.items.every((p) => selected.includes(p));
    if (allSelected) {
      onChange(selected.filter((p) => !group.items.includes(p)));
    } else {
      const toAdd = group.items.filter((p) => !selected.includes(p));
      onChange([...selected, ...toAdd]);
    }
  };

  const toggleExpand = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="space-y-2">
      {procedureGroups.map((group) => {
        const isExpanded = expanded[group.label] ?? false;
        const allSelected = group.items.every((p) => selected.includes(p));
        const someSelected =
          !allSelected && group.items.some((p) => selected.includes(p));
        const selectedCount = group.items.filter((p) =>
          selected.includes(p),
        ).length;

        return (
          <div
            key={group.label}
            className="border border-bokka-border rounded-lg overflow-hidden"
          >
            <div className="flex items-center gap-3 px-3 py-2.5 bg-bokka-surface-2">
              <button
                type="button"
                onClick={() => toggleExpand(group.label)}
                className="text-bokka-ink-3 hover:text-bokka-ink transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" strokeWidth={1.75} />
                ) : (
                  <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
                )}
              </button>
              <label className="flex items-center gap-2 flex-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={() => toggleGroup(group)}
                  className="w-4 h-4 rounded border-bokka-border-strong text-bokka-primary focus:ring-bokka-primary-ring accent-bokka-primary"
                />
                <span className="text-sm font-semibold text-bokka-ink">
                  {group.label}
                </span>
              </label>
              <span className="text-xs text-bokka-ink-3 tabular-nums">
                {selectedCount}/{group.items.length}
              </span>
            </div>
            {isExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 px-4 py-3">
                {group.items.map((proc) => (
                  <label
                    key={proc}
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(proc)}
                      onChange={() => toggle(proc)}
                      className="w-3.5 h-3.5 rounded border-bokka-border-strong text-bokka-primary focus:ring-bokka-primary-ring accent-bokka-primary"
                    />
                    <span className="text-sm text-bokka-ink-2">
                      {procLabel[proc]}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ConvenioForm = ({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: Convenio | null;
  onSubmit: (values: Convenio) => Promise<void>;
  onCancel: () => void;
}) => {
  const [values, setValues] = useState<Convenio>(() => initial ?? emptyConvenio);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const set = <K extends keyof Convenio>(k: K, v: Convenio[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const setEnd = (k: keyof Endereco, v: string) =>
    setValues((prev) => ({
      ...prev,
      endereco: { ...(prev.endereco ?? {}), [k]: v },
    }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setGlobalError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      if (err instanceof ApiError) {
        const fe = err.fieldErrors();
        if (Object.keys(fe).length) setErrors(fe);
        else setGlobalError(err.friendlyMessage());
      } else {
        setGlobalError('Não foi possível salvar. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {globalError && (
        <div className="text-sm text-bokka-danger-ink bg-bokka-danger-soft border border-bokka-danger/20 rounded-md px-3 py-2">
          {globalError}
        </div>
      )}

      <section>
        <h3 className="text-sm font-semibold text-bokka-ink mb-3">
          Dados do convênio
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nome"
            required
            value={values.nome ?? ''}
            onChange={(e) => set('nome', e.target.value)}
            error={errors.nome}
            containerClassName="sm:col-span-2"
          />
          <Input
            label="CNPJ"
            required
            value={values.cnpj ?? ''}
            onChange={(e) => set('cnpj', e.target.value)}
            placeholder="00.000.000/0000-00"
            error={errors.cnpj}
          />
          <Input
            label="Registro ANS"
            value={values.registroANS ?? ''}
            onChange={(e) => set('registroANS', e.target.value)}
            error={errors.registroANS}
          />
          <Input
            label="Nome do contato"
            value={values.nomeContato ?? ''}
            onChange={(e) => set('nomeContato', e.target.value)}
            error={errors.nomeContato}
          />
          <Input
            label="Telefone"
            value={values.telefone ?? ''}
            onChange={(e) => set('telefone', e.target.value)}
            placeholder="(00) 00000-0000"
            error={errors.telefone}
          />
          <Input
            label="E-mail"
            type="email"
            value={values.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
            error={errors.email}
          />
          <Input
            label="Website"
            value={values.website ?? ''}
            onChange={(e) => set('website', e.target.value)}
            placeholder="https://"
            error={errors.website}
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-bokka-ink mb-3">
          Endereço
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
          <Input
            label="CEP"
            value={values.endereco?.cep ?? ''}
            onChange={(e) => setEnd('cep', e.target.value)}
            containerClassName="sm:col-span-2"
          />
          <Input
            label="Logradouro"
            value={values.endereco?.logradouro ?? ''}
            onChange={(e) => setEnd('logradouro', e.target.value)}
            containerClassName="sm:col-span-4"
          />
          <Input
            label="Número"
            value={values.endereco?.numero ?? ''}
            onChange={(e) => setEnd('numero', e.target.value)}
            containerClassName="sm:col-span-1"
          />
          <Input
            label="Complemento"
            value={values.endereco?.complemento ?? ''}
            onChange={(e) => setEnd('complemento', e.target.value)}
            containerClassName="sm:col-span-2"
          />
          <Input
            label="Bairro"
            value={values.endereco?.bairro ?? ''}
            onChange={(e) => setEnd('bairro', e.target.value)}
            containerClassName="sm:col-span-3"
          />
          <Input
            label="Cidade"
            value={values.endereco?.cidade ?? ''}
            onChange={(e) => setEnd('cidade', e.target.value)}
            containerClassName="sm:col-span-4"
          />
          <Input
            label="UF"
            maxLength={2}
            value={values.endereco?.estado ?? ''}
            onChange={(e) => setEnd('estado', e.target.value.toUpperCase())}
            containerClassName="sm:col-span-2"
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-bokka-ink mb-3">Contrato</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Tabela de preços"
            value={values.tabelaDePrecos ?? ''}
            onChange={(e) => set('tabelaDePrecos', e.target.value)}
            error={errors.tabelaDePrecos}
          />
          <Input
            label="Cobertura (%)"
            type="number"
            min={0}
            max={100}
            value={values.percentualCobertura ?? 0}
            onChange={(e) =>
              set('percentualCobertura', Number(e.target.value))
            }
            error={errors.percentualCobertura}
          />
          <Input
            label="Carência (dias)"
            type="number"
            min={0}
            value={values.carenciaDias ?? 0}
            onChange={(e) => set('carenciaDias', Number(e.target.value))}
            error={errors.carenciaDias}
          />
          <Input
            label="Início do contrato"
            type="date"
            value={values.dataInicioContrato ?? ''}
            onChange={(e) => set('dataInicioContrato', e.target.value)}
            error={errors.dataInicioContrato}
          />
          <Input
            label="Fim do contrato"
            type="date"
            value={values.dataFimContrato ?? ''}
            onChange={(e) => set('dataFimContrato', e.target.value)}
            error={errors.dataFimContrato}
          />
          <Input
            label="Limite consultas/mês"
            type="number"
            min={0}
            value={values.limiteConsultasMes ?? 0}
            onChange={(e) =>
              set('limiteConsultasMes', Number(e.target.value))
            }
            error={errors.limiteConsultasMes}
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-bokka-ink mb-3">
          Coberturas
        </h3>
        <CoberturasPicker
          selected={values.coberturas ?? []}
          onChange={(next) => set('coberturas', next)}
        />
      </section>

      <section>
        <h3 className="text-sm font-semibold text-bokka-ink mb-3">
          Observações
        </h3>
        <Textarea
          value={values.observacoes ?? ''}
          onChange={(e) => set('observacoes', e.target.value)}
          placeholder="Anotações sobre o convênio..."
          rows={3}
        />
      </section>

      <div className="flex justify-end gap-3 pt-2 border-t border-bokka-border -mx-6 px-6 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initial?.id ? 'Salvar alterações' : 'Cadastrar convênio'}
        </Button>
      </div>
    </form>
  );
};

export const ConveniosPage = () => {
  const [filter, setFilter] = useState<'todos' | 'ativos' | 'inativos'>(
    'todos',
  );
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<Convenio | null>(null);
  const [confirmar, setConfirmar] = useState<{
    id: string;
    nome: string;
  } | null>(null);

  const conveniosQ = useConvenios();
  const criarM = useCriarConvenio();
  const atualizarM = useAtualizarConvenio();
  const inativarM = useInativarConvenio();
  const reativarM = useReativarConvenio();

  const todos = conveniosQ.data ?? [];

  const filtrados = useMemo(() => {
    let list = [...todos];
    if (filter === 'ativos') list = list.filter((c) => c.ativo);
    if (filter === 'inativos') list = list.filter((c) => !c.ativo);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          (c.nome ?? '').toLowerCase().includes(q) ||
          (c.cnpj ?? '').toLowerCase().includes(q) ||
          (c.registroANS ?? '').toLowerCase().includes(q),
      );
    }
    list.sort((a, b) =>
      (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR'),
    );
    return list;
  }, [todos, filter, search]);

  const totalPages = Math.ceil(filtrados.length / ITEMS_PER_PAGE);
  const paginados = filtrados.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  const stats = useMemo(() => {
    const ativos = todos.filter((c) => c.ativo).length;
    return { total: todos.length, ativos, inativos: todos.length - ativos };
  }, [todos]);

  const handleSubmit = async (values: Convenio) => {
    try {
      if (formInitial?.id) {
        await atualizarM.mutateAsync({
          id: formInitial.id,
          convenio: values,
        });
        bokkaToast.success('Convênio atualizado.');
      } else {
        await criarM.mutateAsync(values);
        bokkaToast.success('Convênio cadastrado.');
      }
      setFormOpen(false);
      setFormInitial(null);
    } catch (err) {
      throw err;
    }
  };

  const handleInativar = async () => {
    if (!confirmar) return;
    try {
      await inativarM.mutateAsync(confirmar.id);
      bokkaToast.success('Convênio inativado.');
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError
          ? err.friendlyMessage()
          : 'Erro ao inativar.',
      );
    } finally {
      setConfirmar(null);
    }
  };

  const handleReativar = async (id: string) => {
    try {
      await reativarM.mutateAsync(id);
      bokkaToast.success('Convênio reativado.');
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError
          ? err.friendlyMessage()
          : 'Erro ao reativar.',
      );
    }
  };

  const openEdit = (c: Convenio) => {
    setFormInitial({
      id: c.id,
      nome: c.nome ?? '',
      cnpj: c.cnpj ?? '',
      registroANS: c.registroANS ?? '',
      nomeContato: c.nomeContato ?? '',
      telefone: c.telefone ?? '',
      email: c.email ?? '',
      website: c.website ?? '',
      endereco: {
        cep: c.endereco?.cep ?? '',
        logradouro: c.endereco?.logradouro ?? '',
        numero: c.endereco?.numero ?? '',
        complemento: c.endereco?.complemento ?? '',
        bairro: c.endereco?.bairro ?? '',
        cidade: c.endereco?.cidade ?? '',
        estado: c.endereco?.estado ?? '',
      },
      tabelaDePrecos: c.tabelaDePrecos ?? '',
      percentualCobertura: c.percentualCobertura ?? 0,
      carenciaDias: c.carenciaDias ?? 0,
      dataInicioContrato: c.dataInicioContrato ?? '',
      dataFimContrato: c.dataFimContrato ?? '',
      limiteConsultasMes: c.limiteConsultasMes ?? 0,
      coberturas: c.coberturas ?? [],
      observacoes: c.observacoes ?? '',
    });
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-bokka-ink tracking-tight">
            Convênios
          </h1>
          <p className="text-sm text-bokka-ink-3 mt-1">
            Cadastro e gerenciamento dos convênios odontológicos.
          </p>
        </div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setFormInitial(null);
            setFormOpen(true);
          }}
        >
          Novo convênio
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-bokka-ink-3">Total</p>
          <p className="text-2xl font-bold text-bokka-ink mt-1 tabular-nums">
            {stats.total}
          </p>
        </div>
        <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-bokka-ink-3">Ativos</p>
          <p className="text-2xl font-bold text-bokka-success-ink mt-1 tabular-nums">
            {stats.ativos}
          </p>
        </div>
        <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-bokka-ink-3">Inativos</p>
          <p className="text-2xl font-bold text-bokka-ink-3 mt-1 tabular-nums">
            {stats.inativos}
          </p>
        </div>
      </div>

      <Card padded={false}>
        <div className="p-4 border-b border-bokka-border flex flex-wrap items-center gap-3">
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value as typeof filter); setPage(0); }}
            className="text-sm bg-bokka-surface-2 border border-bokka-border rounded-lg px-3 h-9 text-bokka-ink outline-none focus:border-bokka-primary-ring"
          >
            <option value="todos">Todos</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </select>
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bokka-ink-3" />
            <input
              type="text"
              placeholder="Buscar por nome, CNPJ ou registro ANS..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full text-sm bg-bokka-surface-2 border border-bokka-border rounded-lg pl-9 pr-3 h-9 placeholder:text-bokka-ink-3 outline-none focus:border-bokka-primary-ring"
            />
          </div>
        </div>

        {conveniosQ.isLoading ? (
          <div className="p-5 space-y-3">
            <Skeleton className="h-20 w-full" rounded="xl" />
            <Skeleton className="h-20 w-full" rounded="xl" />
            <Skeleton className="h-20 w-full" rounded="xl" />
          </div>
        ) : filtrados.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="w-6 h-6" strokeWidth={1.75} />}
            title="Nenhum convênio encontrado"
            description={
              search.trim()
                ? 'Nenhum resultado para essa busca.'
                : 'Cadastre o primeiro convênio da clínica.'
            }
            action={
              !search.trim() ? (
                <Button
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setFormInitial(null);
                    setFormOpen(true);
                  }}
                >
                  Cadastrar convênio
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="divide-y divide-bokka-border">
              {paginados.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-bokka-surface-3/50 transition-colors cursor-pointer"
                  onClick={() => openEdit(c)}
                >
                  <div className="w-10 h-10 rounded-full bg-bokka-primary-soft text-bokka-primary flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-bokka-ink truncate">
                        {c.nome}
                      </span>
                      <Badge tone={c.ativo ? 'success' : 'neutral'} dot>
                        {c.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-bokka-ink-3 tabular-nums">
                        {formatCnpj(c.cnpj)}
                      </span>
                      {c.registroANS && (
                        <span className="text-xs text-bokka-ink-3">
                          ANS {c.registroANS}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {c.percentualCobertura != null &&
                        c.percentualCobertura > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bokka-primary-soft text-bokka-primary text-[10px] font-semibold">
                            <Percent
                              className="w-3 h-3"
                              strokeWidth={1.75}
                            />
                            {c.percentualCobertura}%
                          </span>
                        )}
                      {(c.coberturas ?? []).length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-bokka-surface-3 text-bokka-ink-3 text-[10px] font-semibold">
                          {c.coberturas!.length} procedimento
                          {c.coberturas!.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-4 text-xs text-bokka-ink-3 shrink-0">
                    {c.telefone && (
                      <span className="tabular-nums">
                        {formatPhone(c.telefone)}
                      </span>
                    )}
                    {c.dataFimContrato && (
                      <span className="tabular-nums">
                        Vig. {formatDate(c.dataFimContrato)}
                      </span>
                    )}
                  </div>

                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {c.ativo ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-primary-soft hover:text-bokka-primary transition-colors"
                          title="Editar"
                        >
                          <Pencil
                            className="w-3.5 h-3.5"
                            strokeWidth={1.75}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmar({
                              id: c.id!,
                              nome: c.nome ?? '',
                            })
                          }
                          className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-danger-soft hover:text-bokka-danger-ink transition-colors"
                          title="Inativar"
                        >
                          <Trash2
                            className="w-3.5 h-3.5"
                            strokeWidth={1.75}
                          />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReativar(c.id!)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-success-soft hover:text-bokka-success-ink transition-colors"
                        title="Reativar"
                      >
                        <RotateCcw
                          className="w-3.5 h-3.5"
                          strokeWidth={1.75}
                        />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={filtrados.length}
              onPageChange={setPage}
              itemName="convênios"
            />
          </>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setFormInitial(null);
        }}
        title={formInitial?.id ? 'Editar convênio' : 'Novo convênio'}
        subtitle={
          formInitial?.id
            ? 'Atualize os dados do convênio.'
            : 'Preencha os dados para cadastrar.'
        }
        size="xl"
      >
        <ConvenioForm
          initial={formInitial}
          onCancel={() => {
            setFormOpen(false);
            setFormInitial(null);
          }}
          onSubmit={handleSubmit}
        />
      </Modal>

      <ConfirmModal
        open={!!confirmar}
        onClose={() => setConfirmar(null)}
        title="Inativar convênio"
        message={`Tem certeza que deseja inativar ${confirmar?.nome}? O convênio poderá ser reativado depois.`}
        confirmLabel="Inativar"
        danger
        onConfirm={handleInativar}
      />
    </div>
  );
};
