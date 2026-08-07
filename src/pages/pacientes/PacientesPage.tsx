import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Eye, Pencil, UserX, Users as UsersIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Field';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { SkeletonTableRows } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { bokkaToast } from '../../components/ui/Toast';
import { PacienteForm } from './PacienteForm';
import { PacienteDetalheModal } from './PacienteDetalheModal';
import {
  pacienteService,
  useAtualizarPaciente,
  useCriarPaciente,
  useInativarPaciente,
  usePacientes,
  useReativarPaciente,
} from '../../services/pacienteService';
import { ApiError } from '../../lib/api';
import { Avatar } from '../../components/ui/Avatar';
import { photoKeys } from '../../lib/profilePhotos';
import { cn, formatCpf, formatPhone, sanitizeEnderecoPayload } from '../../lib/utils';
import type { Paciente, PacienteListagemDTO } from '../../types';

const PAGE_SIZE = 10;

const useDebounce = <T,>(value: T, delay = 350): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

export const PacientesPage = () => {
  const [pagina, setPagina] = useState(0);
  const [busca, setBusca] = useState('');
  const buscaDebounced = useDebounce(busca);

  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<Paciente | null>(null);

  const [confirmar, setConfirmar] = useState<PacienteListagemDTO | null>(null);
  const [detalheId, setDetalheId] = useState<string | null>(null);

  useEffect(() => {
    setPagina(0);
  }, [buscaDebounced]);

  const listQuery = usePacientes({
    pagina,
    tamanho: PAGE_SIZE,
    ordem: 'nomeCompleto',
    nome: buscaDebounced,
  });

  const criarM = useCriarPaciente();
  const atualizarM = useAtualizarPaciente();
  const inativarM = useInativarPaciente();
  const reativarM = useReativarPaciente();

  const linhas = useMemo(() => listQuery.data?.content ?? [], [listQuery.data]);
  const totalPaginas = listQuery.data?.totalPages ?? 0;
  const totalItens = listQuery.data?.totalElements ?? 0;
  const loading = listQuery.isLoading || listQuery.isFetching;

  const abrirNovo = () => {
    setFormInitial(null);
    setFormOpen(true);
  };

  const abrirEdicao = async (item: PacienteListagemDTO) => {
    try {
      const completo = await pacienteService.buscarPorId(item.id);
      setFormInitial(completo);
      setFormOpen(true);
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao carregar paciente',
      );
    }
  };

  const handleSubmit = async (paciente: Paciente) => {
    const payload = sanitizeEnderecoPayload(paciente);
    if (formInitial?.id) {
      await atualizarM.mutateAsync({ id: formInitial.id, paciente: payload });
      bokkaToast.success(`${paciente.nomeCompleto} atualizada.`);
    } else {
      await criarM.mutateAsync(payload);
      bokkaToast.success(`${paciente.nomeCompleto} cadastrada.`);
    }
    setFormOpen(false);
  };

  const handleInativar = async () => {
    if (!confirmar) return;
    const alvo = confirmar;
    try {
      await inativarM.mutateAsync(alvo.id);
      setConfirmar(null);
      bokkaToast.info(`${alvo.nomeCompleto} foi inativada.`, {
        actionLabel: 'Desfazer',
        onAction: async () => {
          try {
            await reativarM.mutateAsync(alvo.id);
            bokkaToast.success(`${alvo.nomeCompleto} reativada.`);
          } catch (err) {
            bokkaToast.error(
              err instanceof ApiError ? err.friendlyMessage() : 'Erro ao reativar',
            );
          }
        },
      });
    } catch (err) {
      bokkaToast.error(
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao inativar paciente',
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-bokka-ink">Pacientes</h1>
          <p className="text-sm text-bokka-ink-3 mt-1">
            {loading
              ? 'Carregando...'
              : `${totalItens} ${totalItens === 1 ? 'paciente ativo' : 'pacientes ativos'}`}
          </p>
        </div>
        <Button onClick={abrirNovo} icon={<Plus />}>
          Novo paciente
        </Button>
      </div>

      <div className="bg-bokka-surface border border-bokka-border rounded-xl shadow-sm">
        <div className="p-4 border-b border-bokka-border">
          <Input
            placeholder="Buscar por nome ou CPF..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            leadingIcon={<Search className="w-4 h-4" strokeWidth={2} />}
            containerClassName="max-w-md"
          />
        </div>

        {listQuery.isError && (
          <div className="px-4 py-3 text-sm text-bokka-danger-ink bg-bokka-danger-soft border-b border-bokka-danger/20">
            {listQuery.error instanceof ApiError
              ? listQuery.error.friendlyMessage()
              : 'Erro ao carregar pacientes'}
          </div>
        )}

        {loading ? (
          <SkeletonTableRows rows={5} />
        ) : linhas.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="w-6 h-6" strokeWidth={1.75} />}
            title={
              buscaDebounced
                ? `Nenhum paciente encontrado para "${buscaDebounced}"`
                : 'Nenhum paciente cadastrado ainda'
            }
            description={
              buscaDebounced
                ? 'Tente outro termo de busca.'
                : 'Comece adicionando o primeiro paciente da clínica.'
            }
            action={
              !buscaDebounced && (
                <Button onClick={abrirNovo} icon={<Plus />}>
                  Cadastrar paciente
                </Button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-bokka-ink-3 bg-bokka-surface-3">
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold">CPF</th>
                  <th className="px-4 py-3 font-semibold">E-mail</th>
                  <th className="px-4 py-3 font-semibold">Telefone</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bokka-border">
                {linhas.map((p) => (
                  <tr key={p.id} className="hover:bg-bokka-surface-3">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setDetalheId(p.id)}
                        className="flex items-center gap-3 group text-left"
                      >
                        <Avatar
                          photoKey={photoKeys.paciente(p.id)}
                          name={p.nomeCompleto}
                          size="sm"
                        />
                        <span className="font-semibold text-bokka-ink group-hover:text-bokka-primary">
                          {p.nomeCompleto}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-bokka-ink-2 tabular-nums">
                      {formatCpf(p.cpf)}
                    </td>
                    <td className="px-4 py-3 text-bokka-ink-2">{p.email || '—'}</td>
                    <td className="px-4 py-3 text-bokka-ink-2 tabular-nums">
                      {formatPhone(p.telefoneCelular)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={p.ativo ? 'success' : 'neutral'} dot>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className={cn('px-4 py-3 text-right')}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setDetalheId(p.id)}
                          className="p-2 rounded-md text-bokka-ink-2 hover:bg-bokka-surface hover:text-bokka-primary"
                          title="Ver ficha"
                        >
                          <Eye className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirEdicao(p)}
                          className="p-2 rounded-md text-bokka-ink-2 hover:bg-bokka-surface hover:text-bokka-primary"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmar(p)}
                          className="p-2 rounded-md text-bokka-ink-2 hover:bg-bokka-danger-soft hover:text-bokka-danger-ink"
                          title="Inativar"
                        >
                          <UserX className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={pagina}
          totalPages={totalPaginas}
          totalItems={totalItens}
          onPageChange={setPagina}
          loading={loading}
          itemName="pacientes"
        />
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formInitial?.id ? 'Editar paciente' : 'Novo paciente'}
        subtitle={formInitial?.id ? 'Atualize os dados do paciente.' : 'Cadastre um novo paciente na clínica.'}
        size="xl"
      >
        <PacienteForm
          initial={formInitial}
          photoKey={formInitial?.id ? photoKeys.paciente(formInitial.id) : null}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      <ConfirmModal
        open={!!confirmar}
        onClose={() => setConfirmar(null)}
        onConfirm={handleInativar}
        title="Inativar paciente?"
        message={
          confirmar
            ? `${confirmar.nomeCompleto} deixará de aparecer na listagem. Você pode desfazer em seguida pelo aviso na tela.`
            : ''
        }
        confirmLabel="Inativar"
        danger
        loading={inativarM.isPending}
      />

      <PacienteDetalheModal
        pacienteId={detalheId}
        open={!!detalheId}
        onClose={() => setDetalheId(null)}
      />
    </div>
  );
};
