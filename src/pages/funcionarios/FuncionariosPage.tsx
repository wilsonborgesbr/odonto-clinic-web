import { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  RotateCcw,
  Phone,
  Mail,
  UserCog,
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
import { FuncionarioForm } from './FuncionarioForm';
import { FuncionarioDetalheModal } from './FuncionarioDetalheModal';
import {
  useFuncionarios,
  useCriarFuncionario,
  useAtualizarFuncionario,
  useInativarFuncionario,
  useReativarFuncionario,
} from '../../services/funcionarioService';
import { ApiError } from '../../lib/api';
import { formatPhone, sanitizeEnderecoPayload } from '../../lib/utils';
import type { Funcionario, CargoFuncionarioEnum } from '../../types';

const cargoLabel: Record<CargoFuncionarioEnum, string> = {
  RECEPCIONISTA: 'Recepcionista',
  SECRETARIA: 'Secretária(o)',
  AUXILIAR_SAUDE_BUCAL: 'Aux. Saúde Bucal (ASB)',
  AUXILIAR_DENTARIO: 'Auxiliar Dentário',
  TECNICO_SAUDE_BUCAL: 'Téc. Saúde Bucal (TSB)',
  TECNICO_PROTESE_DENTARIA: 'Téc. Prótese Dentária',
  TECNICO_RADIOLOGIA: 'Téc. Radiologia',
  AUXILIAR_ADMINISTRATIVO: 'Aux. Administrativo',
  ADMINISTRATIVO: 'Administrativo',
  SOCIO: 'Sócio(a)',
  COORDENADOR_CLINICO: 'Coordenador(a) Clínico(a)',
  GERENTE: 'Gerente',
  FINANCEIRO: 'Financeiro',
  MARKETING: 'Marketing',
  COMERCIAL: 'Comercial',
  SERVICOS_GERAIS: 'Serviços Gerais',
  SEGURANCA: 'Segurança',
  ESTAGIARIO: 'Estagiário(a)',
  OUTRO: 'Outro',
};

export const FuncionariosPage = () => {
  const [filter, setFilter] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<Funcionario | null>(null);
  const [confirmar, setConfirmar] = useState<{ id: string; nome: string } | null>(null);
  const [detalheId, setDetalheId] = useState<string | null>(null);

  const funcionariosQ = useFuncionarios({ pagina: 0, tamanho: 100 });
  const criarM = useCriarFuncionario();
  const atualizarM = useAtualizarFuncionario();
  const inativarM = useInativarFuncionario();
  const reativarM = useReativarFuncionario();

  const todos = funcionariosQ.data?.content ?? [];

  const filtrados = useMemo(() => {
    let list = todos;
    if (filter === 'ativos') list = list.filter((f) => f.ativo);
    if (filter === 'inativos') list = list.filter((f) => !f.ativo);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.nomeCompleto.toLowerCase().includes(q) ||
          f.cpf.toLowerCase().includes(q) ||
          (f.email && f.email.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [todos, filter, search]);

  const stats = useMemo(() => {
    const ativos = todos.filter((f) => f.ativo).length;
    return { total: todos.length, ativos, inativos: todos.length - ativos };
  }, [todos]);

  const handleSubmit = async (values: Funcionario) => {
    const payload = sanitizeEnderecoPayload(values);
    try {
      if (formInitial?.id) {
        await atualizarM.mutateAsync({ id: formInitial.id, funcionario: payload });
        bokkaToast.success('Funcionário atualizado.');
      } else {
        await criarM.mutateAsync(payload);
        bokkaToast.success('Funcionário cadastrado.');
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
      bokkaToast.success('Funcionário inativado.');
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
      bokkaToast.success('Funcionário reativado.');
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao reativar.',
      );
    }
  };

  const openEdit = (f: typeof todos[0]) => {
    setFormInitial({
      id: f.id,
      nomeCompleto: f.nomeCompleto,
      cpf: f.cpf,
      cargo: f.cargo,
      email: f.email,
      telefoneCelular: f.telefoneCelular,
      sexo: f.sexo || 'FEMININO',
      endereco: f.endereco || {},
    });
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-bokka-ink tracking-tight">Funcionários</h1>
          <p className="text-sm text-bokka-ink-3 mt-1">
            Cadastro e gerenciamento da equipe administrativa e auxiliar.
          </p>
        </div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setFormInitial(null);
            setFormOpen(true);
          }}
        >
          Novo funcionário
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
              placeholder="Buscar por nome, CPF ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm bg-bokka-surface-2 border border-bokka-border rounded-lg pl-9 pr-3 h-9 placeholder:text-bokka-ink-3 outline-none focus:border-bokka-primary-ring"
            />
          </div>
        </div>

        {funcionariosQ.isLoading ? (
          <div className="p-5 space-y-3">
            <Skeleton className="h-20 w-full" rounded="xl" />
            <Skeleton className="h-20 w-full" rounded="xl" />
            <Skeleton className="h-20 w-full" rounded="xl" />
          </div>
        ) : filtrados.length === 0 ? (
          <EmptyState
            icon={<UserCog className="w-6 h-6" strokeWidth={1.75} />}
            title="Nenhum funcionário encontrado"
            description={
              search.trim()
                ? 'Nenhum resultado para essa busca.'
                : 'Cadastre o primeiro funcionário da clínica.'
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
                  Cadastrar funcionário
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y divide-bokka-border">
            {filtrados.map((f) => (
              <div
                key={f.id}
                onClick={() => setDetalheId(f.id)}
                className="flex items-center gap-4 px-5 py-4 hover:bg-bokka-surface-3/50 transition-colors cursor-pointer"
              >
                <Avatar
                  photoKey={photoKeys.funcionario(f.id)}
                  remoteSrc={f.fotoUrl}
                  name={f.nomeCompleto}
                  size="lg"
                  ring
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-bokka-ink truncate">
                      {f.nomeCompleto}
                    </span>
                    <Badge tone={f.ativo ? 'success' : 'neutral'} dot>
                      {f.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-xs text-bokka-ink-3 mt-0.5 tabular-nums">{f.cpf}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-bokka-primary-soft text-bokka-primary text-[10px] font-semibold">
                    {cargoLabel[f.cargo] ?? f.cargo}
                  </span>
                </div>

                <div className="hidden sm:flex items-center gap-4 text-xs text-bokka-ink-3 shrink-0">
                  {f.telefoneCelular && (
                    <a
                      href={`tel:${f.telefoneCelular}`}
                      className="inline-flex items-center gap-1 hover:text-bokka-primary"
                    >
                      <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
                      {formatPhone(f.telefoneCelular)}
                    </a>
                  )}
                  {f.email && (
                    <a
                      href={`mailto:${f.email}`}
                      className="inline-flex items-center gap-1 hover:text-bokka-primary"
                    >
                      <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span className="truncate max-w-[160px]">{f.email}</span>
                    </a>
                  )}
                </div>

                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {f.ativo ? (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(f)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-primary-soft hover:text-bokka-primary transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmar({ id: f.id, nome: f.nomeCompleto })}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-danger-soft hover:text-bokka-danger-ink transition-colors"
                        title="Inativar"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleReativar(f.id)}
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
        title={formInitial?.id ? 'Editar funcionário' : 'Novo funcionário'}
        subtitle={
          formInitial?.id
            ? 'Atualize os dados do funcionário.'
            : 'Preencha os dados para cadastrar.'
        }
        size="xl"
      >
        <FuncionarioForm
          initial={formInitial}
          photoKey={formInitial?.id ? photoKeys.funcionario(formInitial.id) : null}
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
        title="Inativar funcionário"
        message={`Tem certeza que deseja inativar ${confirmar?.nome}? O funcionário poderá ser reativado depois.`}
        confirmLabel="Inativar"
        danger
        onConfirm={handleInativar}
      />

      <FuncionarioDetalheModal
        funcionarioId={detalheId}
        open={!!detalheId}
        onClose={() => setDetalheId(null)}
      />
    </div>
  );
};
