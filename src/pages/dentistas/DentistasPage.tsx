import { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  RotateCcw,
  Phone,
  Mail,
  Stethoscope,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { bokkaToast } from '../../components/ui/Toast';
import { Avatar } from '../../components/ui/Avatar';
import { photoKeys } from '../../lib/profilePhotos';
import { DentistaForm } from './DentistaForm';
import { DentistaDetalheModal } from './DentistaDetalheModal';
import {
  useDentistas,
  useCriarDentista,
  useAtualizarDentista,
  useInativarDentista,
  useReativarDentista,
} from '../../services/dentistaService';
import { ApiError } from '../../lib/api';
import { formatPhone, sanitizeEnderecoPayload } from '../../lib/utils';
import type { Dentista, EspecialidadeEnum } from '../../types';

const espLabel: Record<EspecialidadeEnum, string> = {
  CLINICO_GERAL: 'Clínico Geral',
  ORTODONTIA: 'Ortodontia',
  IMPLANTODONTIA: 'Implantodontia',
  ENDODONTIA: 'Endodontia',
  PERIODONTIA: 'Periodontia',
  ODONTOPEDIATRIA: 'Odontopediatria',
  CIRURGIA: 'Cirurgia',
  PROTESE: 'Prótese',
  ESTETICA: 'Estética',
  RADIOLOGIA: 'Radiologia',
};

export const DentistasPage = () => {
  const [filter, setFilter] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<Dentista | null>(null);
  const [confirmar, setConfirmar] = useState<{ id: string; nome: string } | null>(null);
  const [detalheId, setDetalheId] = useState<string | null>(null);

  const dentistasQ = useDentistas({ pagina: 0, tamanho: 100 });
  const criarM = useCriarDentista();
  const atualizarM = useAtualizarDentista();
  const inativarM = useInativarDentista();
  const reativarM = useReativarDentista();

  const todos = dentistasQ.data?.content ?? [];

  const filtrados = useMemo(() => {
    let list = todos;
    if (filter === 'ativos') list = list.filter((d) => d.ativo);
    if (filter === 'inativos') list = list.filter((d) => !d.ativo);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.nomeCompleto.toLowerCase().includes(q) ||
          d.cro.toLowerCase().includes(q) ||
          (d.email && d.email.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [todos, filter, search]);

  const stats = useMemo(() => {
    const ativos = todos.filter((d) => d.ativo).length;
    return { total: todos.length, ativos, inativos: todos.length - ativos };
  }, [todos]);

  const handleSubmit = async (values: Dentista) => {
    const payload = sanitizeEnderecoPayload(values);
    try {
      if (formInitial?.id) {
        await atualizarM.mutateAsync({ id: formInitial.id, dentista: payload });
        bokkaToast.success('Dentista atualizado.');
      } else {
        await criarM.mutateAsync(payload);
        bokkaToast.success('Dentista cadastrado.');
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
      bokkaToast.success('Dentista inativado.');
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao inativar.',
      );
    } finally {
      setConfirmar(null);
    }
  };

  const handleReativar = async (id: string) => {
    try {
      await reativarM.mutateAsync(id);
      bokkaToast.success('Dentista reativado.');
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao reativar.',
      );
    }
  };

  const openEdit = (d: typeof todos[0]) => {
    setFormInitial({
      id: d.id,
      nomeCompleto: d.nomeCompleto,
      cro: d.cro,
      especialidades: d.especialidades,
      email: d.email,
      telefoneCelular: d.telefoneCelular,
      sexo: d.sexo || 'FEMININO',
      endereco: d.endereco || {},
    });
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-bokka-ink tracking-tight">Dentistas</h1>
          <p className="text-sm text-bokka-ink-3 mt-1">
            Cadastro e gerenciamento do quadro de dentistas.
          </p>
        </div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setFormInitial(null);
            setFormOpen(true);
          }}
        >
          Novo dentista
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-bokka-ink-3">Total</p>
          <p className="text-2xl font-bold text-bokka-ink mt-1 tabular-nums">{stats.total}</p>
        </div>
        <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-bokka-ink-3">Ativos</p>
          <p className="text-2xl font-bold text-bokka-success-ink mt-1 tabular-nums">{stats.ativos}</p>
        </div>
        <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-bokka-ink-3">Inativos</p>
          <p className="text-2xl font-bold text-bokka-ink-3 mt-1 tabular-nums">{stats.inativos}</p>
        </div>
      </div>

      <Card padded={false}>
        <div className="p-4 border-b border-bokka-border flex flex-wrap items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
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
              placeholder="Buscar por nome, CRO ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm bg-bokka-surface-2 border border-bokka-border rounded-lg pl-9 pr-3 h-9 placeholder:text-bokka-ink-3 outline-none focus:border-bokka-primary-ring"
            />
          </div>
        </div>

        {dentistasQ.isLoading ? (
          <div className="p-5 space-y-3">
            <Skeleton className="h-20 w-full" rounded="xl" />
            <Skeleton className="h-20 w-full" rounded="xl" />
            <Skeleton className="h-20 w-full" rounded="xl" />
          </div>
        ) : filtrados.length === 0 ? (
          <EmptyState
            icon={<Stethoscope className="w-6 h-6" strokeWidth={1.75} />}
            title="Nenhum dentista encontrado"
            description={
              search.trim()
                ? 'Nenhum resultado para essa busca.'
                : 'Cadastre o primeiro dentista da clínica.'
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
                  Cadastrar dentista
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y divide-bokka-border">
            {filtrados.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-bokka-surface-3/50 transition-colors cursor-pointer"
                onClick={() => setDetalheId(d.id)}
              >
                <Avatar
                  photoKey={photoKeys.dentista(d.id)}
                  remoteSrc={d.fotoUrl}
                  name={d.nomeCompleto}
                  size="lg"
                  ring
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-bokka-ink truncate">
                      {d.nomeCompleto}
                    </span>
                    <Badge tone={d.ativo ? 'success' : 'neutral'} dot>
                      {d.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-xs text-bokka-ink-3 mt-0.5 tabular-nums">{d.cro}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(d.especialidades ?? []).slice(0, 3).map((esp) => (
                      <span
                        key={esp}
                        className="px-2 py-0.5 rounded-full bg-bokka-primary-soft text-bokka-primary text-[10px] font-semibold"
                      >
                        {espLabel[esp] ?? esp}
                      </span>
                    ))}
                    {(d.especialidades ?? []).length > 3 && (
                      <span className="px-2 py-0.5 rounded-full bg-bokka-surface-3 text-bokka-ink-3 text-[10px] font-semibold">
                        +{d.especialidades!.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-4 text-xs text-bokka-ink-3 shrink-0">
                  {d.telefoneCelular && (
                    <a
                      href={`tel:${d.telefoneCelular}`}
                      className="inline-flex items-center gap-1 hover:text-bokka-primary"
                    >
                      <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
                      {formatPhone(d.telefoneCelular)}
                    </a>
                  )}
                  {d.email && (
                    <a
                      href={`mailto:${d.email}`}
                      className="inline-flex items-center gap-1 hover:text-bokka-primary"
                    >
                      <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span className="truncate max-w-[160px]">{d.email}</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {d.ativo ? (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(d)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-primary-soft hover:text-bokka-primary transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmar({ id: d.id, nome: d.nomeCompleto })}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-danger-soft hover:text-bokka-danger-ink transition-colors"
                        title="Inativar"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleReativar(d.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-success-soft hover:text-bokka-success-ink transition-colors"
                      title="Reativar"
                    >
                      <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setFormInitial(null);
        }}
        title={formInitial?.id ? 'Editar dentista' : 'Novo dentista'}
        subtitle={
          formInitial?.id
            ? 'Atualize os dados do profissional.'
            : 'Preencha os dados para cadastrar.'
        }
        size="xl"
      >
        <DentistaForm
          initial={formInitial}
          photoKey={formInitial?.id ? photoKeys.dentista(formInitial.id) : null}
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
        title="Inativar dentista"
        message={`Tem certeza que deseja inativar ${confirmar?.nome}? O profissional poderá ser reativado depois.`}
        confirmLabel="Inativar"
        danger
        onConfirm={handleInativar}
      />

      <DentistaDetalheModal
        dentistaId={detalheId}
        open={!!detalheId}
        onClose={() => setDetalheId(null)}
      />
    </div>
  );
};
