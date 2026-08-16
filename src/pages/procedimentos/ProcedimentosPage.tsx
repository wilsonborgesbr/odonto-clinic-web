import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Syringe,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import type { BadgeTone } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { Input, Select, Textarea } from '../../components/ui/Field';
import { bokkaToast } from '../../components/ui/Toast';
import {
  useProcedimentos,
  useCriarProcedimento,
  useAtualizarProcedimento,
  useExcluirProcedimento,
} from '../../services/procedimentoService';
import { usePacientes } from '../../services/pacienteService';
import { ApiError } from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';
import type {
  Procedimento,
  NomeProcedimentoEnum,
  StatusProcedimentoEnum,
  RegiaoEnum,
} from '../../types';

const PAGE_SIZE = 10;

const nomeProcLabel: Record<NomeProcedimentoEnum, string> = {
  RESTAURACAO_RESINA: 'Restauração em Resina',
  RESTAURACAO_AMALGAMA: 'Restauração em Amálgama',
  INLAY: 'Inlay',
  ONLAY: 'Onlay',
  FACETA_PORCELANA: 'Faceta de Porcelana',
  FACETA_RESINA: 'Faceta de Resina',
  TRATAMENTO_CANAL_UNIRRADICULAR: 'Tratamento de Canal (Uni)',
  TRATAMENTO_CANAL_BIRRADICULAR: 'Tratamento de Canal (Bi)',
  TRATAMENTO_CANAL_MULTIRRADICULAR: 'Tratamento de Canal (Multi)',
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
  INSTALACAO_IMPLANTE: 'Instalação de Implante',
  INSTALACAO_PROTESE_SOBRE_IMPLANTE: 'Prótese sobre Implante',
  ENXERTO_OSSEO: 'Enxerto Ósseo',
  PROTESE_PARCIAL_REMOVIVEL: 'Prótese Parcial Removível',
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
  CLAREAMENTO_CONSULTORIO: 'Clareamento em Consultório',
  MICROABRASAO: 'Microabrasão',
  RADIOGRAFIA_PERIAPICAL: 'Radiografia Periapical',
  RADIOGRAFIA_PANORAMICA: 'Radiografia Panorâmica',
  TOMOGRAFIA: 'Tomografia',
};

type AreaProcedimento =
  | 'PREVENCAO'
  | 'DENTISTICA'
  | 'ENDODONTIA'
  | 'PERIODONTIA'
  | 'CIRURGIA'
  | 'PROTESE'
  | 'ORTODONTIA'
  | 'ODONTOPEDIATRIA';

const areaLabel: Record<AreaProcedimento, string> = {
  PREVENCAO: 'Prevenção',
  DENTISTICA: 'Dentística',
  ENDODONTIA: 'Endodontia',
  PERIODONTIA: 'Periodontia',
  CIRURGIA: 'Cirurgia',
  PROTESE: 'Prótese',
  ORTODONTIA: 'Ortodontia',
  ODONTOPEDIATRIA: 'Odontopediatria',
};

const procArea: Record<NomeProcedimentoEnum, AreaProcedimento> = {
  PROFILAXIA: 'PREVENCAO',
  RASPAGEM_SUPRAGENGIVAL: 'PREVENCAO',
  RASPAGEM_SUBGENGIVAL: 'PREVENCAO',
  FLUORTERAPIA: 'PREVENCAO',
  SELANTE: 'PREVENCAO',
  RADIOGRAFIA_PERIAPICAL: 'PREVENCAO',
  RADIOGRAFIA_PANORAMICA: 'PREVENCAO',
  TOMOGRAFIA: 'PREVENCAO',
  RESTAURACAO_RESINA: 'DENTISTICA',
  RESTAURACAO_AMALGAMA: 'DENTISTICA',
  INLAY: 'DENTISTICA',
  ONLAY: 'DENTISTICA',
  FACETA_PORCELANA: 'DENTISTICA',
  FACETA_RESINA: 'DENTISTICA',
  CLAREAMENTO_CASEIRO: 'DENTISTICA',
  CLAREAMENTO_CONSULTORIO: 'DENTISTICA',
  MICROABRASAO: 'DENTISTICA',
  TRATAMENTO_CANAL_UNIRRADICULAR: 'ENDODONTIA',
  TRATAMENTO_CANAL_BIRRADICULAR: 'ENDODONTIA',
  TRATAMENTO_CANAL_MULTIRRADICULAR: 'ENDODONTIA',
  RETRATAMENTO_CANAL: 'ENDODONTIA',
  GENGIVECTOMIA: 'PERIODONTIA',
  ENXERTO_GENGIVAL: 'PERIODONTIA',
  CIRURGIA_PERIODONTAL: 'PERIODONTIA',
  EXTRACAO_SIMPLES: 'CIRURGIA',
  EXTRACAO_DENTE_SISO: 'CIRURGIA',
  FRENECTOMIA: 'CIRURGIA',
  BIOPSIA: 'CIRURGIA',
  PROTESE_PARCIAL_REMOVIVEL: 'PROTESE',
  PROTESE_TOTAL: 'PROTESE',
  COROA_PORCELANA: 'PROTESE',
  COROA_METALICA: 'PROTESE',
  PONTE_FIXA: 'PROTESE',
  INSTALACAO_IMPLANTE: 'PROTESE',
  INSTALACAO_PROTESE_SOBRE_IMPLANTE: 'PROTESE',
  ENXERTO_OSSEO: 'PROTESE',
  APARELHO_METALICO: 'ORTODONTIA',
  APARELHO_ESTETICO: 'ORTODONTIA',
  APARELHO_INVISIVEL: 'ORTODONTIA',
  MANUTENCAO_ORTODONTICA: 'ORTODONTIA',
  CONTENCAO: 'ORTODONTIA',
  COROA_PEDIATRICA: 'ODONTOPEDIATRIA',
  PULPOTOMIA: 'ODONTOPEDIATRIA',
};

const allAreas: AreaProcedimento[] = [
  'PREVENCAO', 'DENTISTICA', 'ENDODONTIA', 'PERIODONTIA',
  'CIRURGIA', 'PROTESE', 'ORTODONTIA', 'ODONTOPEDIATRIA',
];

const statusLabel: Record<StatusProcedimentoEnum, string> = {
  ORCADO: 'Orçado',
  AGENDADO: 'Agendado',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

const statusTone: Record<StatusProcedimentoEnum, BadgeTone> = {
  ORCADO: 'neutral',
  AGENDADO: 'info',
  EM_ANDAMENTO: 'warning',
  CONCLUIDO: 'success',
  CANCELADO: 'danger',
};

const allStatus: StatusProcedimentoEnum[] = [
  'ORCADO', 'AGENDADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO',
];

const regiaoLabel: Record<RegiaoEnum, string> = {
  SUPERIOR: 'Superior',
  INFERIOR: 'Inferior',
  ANTERIOR: 'Anterior',
  POSTERIOR: 'Posterior',
};

const allRegioes: RegiaoEnum[] = ['SUPERIOR', 'INFERIOR', 'ANTERIOR', 'POSTERIOR'];

const nomeProcOptions: { value: NomeProcedimentoEnum; label: string }[] = (
  Object.entries(nomeProcLabel) as [NomeProcedimentoEnum, string][]
).map(([value, label]) => ({ value, label }));

const regiaoOptions: { value: string; label: string }[] = [
  { value: '', label: '— Selecione —' },
  ...allRegioes.map((r) => ({ value: r, label: regiaoLabel[r] })),
];

const statusOptions: { value: string; label: string }[] = allStatus.map((s) => ({
  value: s,
  label: statusLabel[s],
}));

const emptyProcedimento: Procedimento = {
  pacienteId: '',
  nomeProcedimento: 'PROFILAXIA',
  descricao: '',
  dente: '',
  regiao: undefined,
  status: 'ORCADO',
  dataRealizacao: '',
  valor: 0,
  numeroDeSessoes: 1,
  sessaoAtual: 1,
  observacoesTecnicas: '',
};

export const ProcedimentosPage = () => {
  const [statusFilter, setStatusFilter] = useState<StatusProcedimentoEnum | 'todos'>('todos');
  const [areaFilter, setAreaFilter] = useState<AreaProcedimento | 'todas'>('todas');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<Procedimento | null>(null);
  const [confirmar, setConfirmar] = useState<{ id: string; nome: string } | null>(null);

  const procedimentosQ = useProcedimentos();
  const pacientesQ = usePacientes({ pagina: 0, tamanho: 200 });
  const criarM = useCriarProcedimento();
  const atualizarM = useAtualizarProcedimento();
  const excluirM = useExcluirProcedimento();

  const todos = procedimentosQ.data ?? [];

  const pacienteMap = useMemo(() => {
    const map = new Map<string, string>();
    (pacientesQ.data?.content ?? []).forEach((p) => map.set(p.id, p.nomeCompleto));
    return map;
  }, [pacientesQ.data]);

  const pacienteOptions = useMemo(
    () => [
      { value: '', label: '— Selecione um paciente —' },
      ...(pacientesQ.data?.content ?? []).map((p) => ({
        value: p.id,
        label: p.nomeCompleto,
      })),
    ],
    [pacientesQ.data],
  );

  const filtrados = useMemo(() => {
    let list = todos;
    if (statusFilter !== 'todos') list = list.filter((p) => p.status === statusFilter);
    if (areaFilter !== 'todas') list = list.filter((p) => p.nomeProcedimento && procArea[p.nomeProcedimento] === areaFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => {
        const nomeProc = p.nomeProcedimento ? (nomeProcLabel[p.nomeProcedimento] ?? '').toLowerCase() : '';
        const nomePac = p.pacienteId ? (pacienteMap.get(p.pacienteId) ?? '').toLowerCase() : '';
        return nomeProc.includes(q) || nomePac.includes(q);
      });
    }
    list = [...list].sort((a, b) => {
      const da = a.dataRealizacao ?? '';
      const db = b.dataRealizacao ?? '';
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return db.localeCompare(da);
    });
    return list;
  }, [todos, statusFilter, areaFilter, search, pacienteMap]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginados = useMemo(
    () => filtrados.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filtrados, page],
  );

  const stats = useMemo(() => {
    const total = todos.length;
    const concluidos = todos.filter((p) => p.status === 'CONCLUIDO').length;
    const emAndamento = todos.filter((p) => p.status === 'EM_ANDAMENTO').length;
    return { total, concluidos, emAndamento };
  }, [todos]);

  const handleSubmit = async (values: Procedimento) => {
    try {
      if (formInitial?.id) {
        await atualizarM.mutateAsync({ id: formInitial.id, procedimento: values });
        bokkaToast.success('Procedimento atualizado.');
      } else {
        await criarM.mutateAsync(values);
        bokkaToast.success('Procedimento cadastrado.');
      }
      setFormOpen(false);
      setFormInitial(null);
    } catch (err) {
      throw err;
    }
  };

  const handleExcluir = async () => {
    if (!confirmar) return;
    try {
      await excluirM.mutateAsync(confirmar.id);
      bokkaToast.success('Procedimento excluído.');
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao excluir.',
      );
    } finally {
      setConfirmar(null);
    }
  };

  const openEdit = (item: Procedimento) => {
    setFormInitial(item);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-bokka-ink tracking-tight">Procedimentos</h1>
          <p className="text-sm text-bokka-ink-3 mt-1">
            {stats.total} procedimento{stats.total !== 1 ? 's' : ''} cadastrado{stats.total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setFormInitial(null);
            setFormOpen(true);
          }}
        >
          Novo procedimento
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-bokka-ink-3">Total</p>
          <p className="text-2xl font-bold text-bokka-ink mt-1 tabular-nums">{stats.total}</p>
        </div>
        <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-bokka-ink-3">Concluídos</p>
          <p className="text-2xl font-bold text-bokka-success-ink mt-1 tabular-nums">{stats.concluidos}</p>
        </div>
        <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-bokka-ink-3">Em andamento</p>
          <p className="text-2xl font-bold text-bokka-warning-ink mt-1 tabular-nums">{stats.emAndamento}</p>
        </div>
      </div>

      <Card padded={false}>
        <div className="p-4 border-b border-bokka-border space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(0); }}
              className="text-sm bg-bokka-surface-2 border border-bokka-border rounded-lg px-3 h-9 text-bokka-ink outline-none focus:border-bokka-primary-ring"
            >
              <option value="todos">Todos os status</option>
              {allStatus.map((s) => (
                <option key={s} value={s}>{statusLabel[s]}</option>
              ))}
            </select>
            <select
              value={areaFilter}
              onChange={(e) => { setAreaFilter(e.target.value as typeof areaFilter); setPage(0); }}
              className="text-sm bg-bokka-surface-2 border border-bokka-border rounded-lg px-3 h-9 text-bokka-ink outline-none focus:border-bokka-primary-ring"
            >
              <option value="todas">Todas as áreas</option>
              {allAreas.map((a) => (
                <option key={a} value={a}>{areaLabel[a]}</option>
              ))}
            </select>
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-bokka-ink-3" />
              <input
                type="text"
                placeholder="Buscar por paciente ou procedimento..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="w-full text-sm bg-bokka-surface-2 border border-bokka-border rounded-lg pl-9 pr-3 h-9 placeholder:text-bokka-ink-3 outline-none focus:border-bokka-primary-ring"
              />
            </div>
          </div>
        </div>

        {procedimentosQ.isLoading ? (
          <div className="p-5 space-y-3">
            <Skeleton className="h-16 w-full" rounded="xl" />
            <Skeleton className="h-16 w-full" rounded="xl" />
            <Skeleton className="h-16 w-full" rounded="xl" />
          </div>
        ) : filtrados.length === 0 ? (
          <EmptyState
            icon={<Syringe className="w-6 h-6" strokeWidth={1.75} />}
            title="Nenhum procedimento encontrado"
            description={
              search.trim() || statusFilter !== 'todos' || areaFilter !== 'todas'
                ? 'Nenhum resultado para os filtros aplicados.'
                : 'Cadastre o primeiro procedimento.'
            }
            action={
              !search.trim() && statusFilter === 'todos' && areaFilter === 'todas' ? (
                <Button
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setFormInitial(null);
                    setFormOpen(true);
                  }}
                >
                  Cadastrar procedimento
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-bokka-ink-3 bg-bokka-surface-3">
                  <th className="px-5 py-3 font-semibold">Procedimento</th>
                  <th className="px-4 py-3 font-semibold">Paciente</th>
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Valor</th>
                  <th className="px-4 py-3 font-semibold text-center">Sessão</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bokka-border">
                {paginados.map((item) => (
                  <tr key={item.id} className="hover:bg-bokka-surface-3">
                    <td className="px-5 py-3">
                      <span className="font-semibold text-bokka-ink">
                        {item.nomeProcedimento ? nomeProcLabel[item.nomeProcedimento] : '—'}
                      </span>
                      {item.regiao && (
                        <p className="text-[11px] text-bokka-ink-3 mt-0.5">
                          {regiaoLabel[item.regiao]}
                          {item.dente ? ` · Dente ${item.dente}` : ''}
                        </p>
                      )}
                      {!item.regiao && item.dente && (
                        <p className="text-[11px] text-bokka-ink-3 mt-0.5">Dente {item.dente}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-bokka-ink-2 truncate max-w-[160px]">
                      {item.pacienteId ? pacienteMap.get(item.pacienteId) ?? '—' : '—'}
                    </td>
                    <td className="px-4 py-3 text-bokka-ink-3 tabular-nums whitespace-nowrap">
                      {formatDate(item.dataRealizacao)}
                    </td>
                    <td className="px-4 py-3">
                      {item.status && (
                        <Badge tone={statusTone[item.status]} dot>
                          {statusLabel[item.status]}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-bokka-ink">
                      {formatCurrency(item.valor)}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-bokka-ink-2">
                      {item.numeroDeSessoes
                        ? `${item.sessaoAtual ?? 1}/${item.numeroDeSessoes}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-primary-soft hover:text-bokka-primary transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmar({
                              id: item.id!,
                              nome: item.nomeProcedimento
                                ? nomeProcLabel[item.nomeProcedimento]
                                : 'Procedimento',
                            })
                          }
                          className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-danger-soft hover:text-bokka-danger-ink transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtrados.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={filtrados.length}
            onPageChange={setPage}
            itemName="procedimentos"
          />
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setFormInitial(null);
        }}
        title={formInitial?.id ? 'Editar procedimento' : 'Novo procedimento'}
        subtitle={
          formInitial?.id
            ? 'Atualize os dados do procedimento.'
            : 'Preencha os dados para registrar um procedimento.'
        }
        size="xl"
      >
        <ProcedimentoForm
          initial={formInitial}
          pacienteOptions={pacienteOptions}
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
        title="Excluir procedimento"
        message={`Tem certeza que deseja excluir "${confirmar?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleExcluir}
      />
    </div>
  );
};

interface ProcedimentoFormProps {
  initial: Procedimento | null;
  pacienteOptions: { value: string; label: string }[];
  onSubmit: (values: Procedimento) => Promise<void>;
  onCancel: () => void;
}

const ProcedimentoForm = ({ initial, pacienteOptions, onSubmit, onCancel }: ProcedimentoFormProps) => {
  const [values, setValues] = useState<Procedimento>(() => initial ?? emptyProcedimento);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const set = <K extends keyof Procedimento>(k: K, v: Procedimento[K]) =>
    setValues((prev) => ({ ...prev, [k]: v }));

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
        <h3 className="text-sm font-semibold text-bokka-ink mb-3">Identificação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Paciente"
            required
            value={values.pacienteId ?? ''}
            onChange={(e) => set('pacienteId', e.target.value)}
            options={pacienteOptions}
            error={errors.pacienteId}
          />
          <Select
            label="Procedimento"
            required
            value={values.nomeProcedimento ?? 'PROFILAXIA'}
            onChange={(e) => set('nomeProcedimento', e.target.value as NomeProcedimentoEnum)}
            options={nomeProcOptions}
            error={errors.nomeProcedimento}
          />
          <Input
            label="Dente"
            value={values.dente ?? ''}
            onChange={(e) => set('dente', e.target.value)}
            placeholder="ex: 18, 36"
            error={errors.dente}
          />
          <Select
            label="Região"
            value={values.regiao ?? ''}
            onChange={(e) => set('regiao', (e.target.value || undefined) as RegiaoEnum | undefined)}
            options={regiaoOptions}
            error={errors.regiao}
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-bokka-ink mb-3">Detalhes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Status"
            required
            value={values.status ?? 'ORCADO'}
            onChange={(e) => set('status', e.target.value as StatusProcedimentoEnum)}
            options={statusOptions}
            error={errors.status}
          />
          <Input
            label="Data de realização"
            type="date"
            value={values.dataRealizacao ?? ''}
            onChange={(e) => set('dataRealizacao', e.target.value)}
            error={errors.dataRealizacao}
          />
          <Input
            label="Valor (R$)"
            type="number"
            min="0"
            step="0.01"
            value={String(values.valor ?? 0)}
            onChange={(e) => set('valor', parseFloat(e.target.value) || 0)}
            error={errors.valor}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="N. de sessões"
              type="number"
              min="1"
              value={String(values.numeroDeSessoes ?? 1)}
              onChange={(e) => set('numeroDeSessoes', parseInt(e.target.value) || 1)}
              error={errors.numeroDeSessoes}
            />
            <Input
              label="Sessão atual"
              type="number"
              min="1"
              value={String(values.sessaoAtual ?? 1)}
              onChange={(e) => set('sessaoAtual', parseInt(e.target.value) || 1)}
              error={errors.sessaoAtual}
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-bokka-ink mb-3">Observações</h3>
        <div className="grid grid-cols-1 gap-4">
          <Textarea
            label="Descrição"
            value={values.descricao ?? ''}
            onChange={(e) => set('descricao', e.target.value)}
            rows={2}
            error={errors.descricao}
          />
          <Textarea
            label="Observações técnicas"
            value={values.observacoesTecnicas ?? ''}
            onChange={(e) => set('observacoesTecnicas', e.target.value)}
            rows={2}
            error={errors.observacoesTecnicas}
          />
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-2 border-t border-bokka-border -mx-6 px-6 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initial?.id ? 'Salvar alterações' : 'Cadastrar procedimento'}
        </Button>
      </div>
    </form>
  );
};
