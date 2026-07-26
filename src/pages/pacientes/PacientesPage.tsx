import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Paciente, PacienteListagemDTO, PageResponse } from '../../types';
import { pacienteService } from '../../services/pacienteService';
import { ApiError } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { PacienteForm } from './PacienteForm';

const PAGE_SIZE = 10;

const useDebounce = <T,>(value: T, delay = 400): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const formatCpf = (cpf?: string) => {
  if (!cpf) return '—';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export const PacientesPage = () => {
  const toast = useToast();

  // Estado da listagem
  const [page, setPage] = useState<PageResponse<PacienteListagemDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [erroLista, setErroLista] = useState<string | null>(null);

  // Filtros
  const [pagina, setPagina] = useState(0);
  const [busca, setBusca] = useState('');
  const buscaDebounced = useDebounce(busca);

  // Modal de form
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<Paciente | null>(null);

  // Modal de confirmação de inativação
  const [confirmar, setConfirmar] = useState<PacienteListagemDTO | null>(null);
  const [inativando, setInativando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroLista(null);
    try {
      const resp = await pacienteService.listar({
        pagina,
        tamanho: PAGE_SIZE,
        ordem: 'nomeCompleto',
        nome: buscaDebounced,
      });
      setPage(resp);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.friendlyMessage() : 'Erro ao carregar pacientes';
      setErroLista(msg);
    } finally {
      setLoading(false);
    }
  }, [pagina, buscaDebounced]);

  // Recarrega toda vez que página ou busca mudam
  useEffect(() => {
    carregar();
  }, [carregar]);

  // Ao mudar o termo de busca, voltamos para a primeira página
  useEffect(() => {
    setPagina(0);
  }, [buscaDebounced]);

  const totalPaginas = page?.totalPages ?? 0;
  const totalItens = page?.totalElements ?? 0;

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
      const msg = err instanceof ApiError ? err.friendlyMessage() : 'Erro ao carregar paciente';
      toast.error(msg);
    }
  };

  const handleSubmitForm = async (paciente: Paciente) => {
    if (formInitial?.id) {
      await pacienteService.atualizar(formInitial.id, paciente);
      toast.success(`${paciente.nomeCompleto} atualizado(a).`);
    } else {
      await pacienteService.criar(paciente);
      toast.success(`${paciente.nomeCompleto} cadastrado(a).`);
    }
    setFormOpen(false);
    carregar();
  };

  const handleInativar = async () => {
    if (!confirmar) return;
    setInativando(true);
    try {
      const alvo = confirmar;
      await pacienteService.inativar(alvo.id);
      setConfirmar(null);
      // Mostra toast com "Desfazer" — o backend não expõe listagem de inativos,
      // então o toast é a única forma prática de reativar em seguida.
      toast.info(`${alvo.nomeCompleto} foi inativado(a).`, {
        actionLabel: 'Desfazer',
        onAction: async () => {
          try {
            await pacienteService.reativar(alvo.id);
            toast.success(`${alvo.nomeCompleto} reativado(a).`);
            carregar();
          } catch (err) {
            const msg =
              err instanceof ApiError ? err.friendlyMessage() : 'Erro ao reativar';
            toast.error(msg);
          }
        },
      });
      carregar();
    } catch (err) {
      const msg = err instanceof ApiError ? err.friendlyMessage() : 'Erro ao inativar';
      toast.error(msg);
    } finally {
      setInativando(false);
    }
  };

  const linhas = useMemo(() => page?.content ?? [], [page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Pacientes</h1>
          <p className="text-sm text-slate-500">
            {loading
              ? 'Carregando...'
              : `${totalItens} paciente${totalItens === 1 ? '' : 's'} ativo${totalItens === 1 ? '' : 's'}`}
          </p>
        </div>
        <Button onClick={abrirNovo} icon={<span className="text-lg leading-none">＋</span>}>
          Novo paciente
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="p-4 border-b border-slate-100">
          <TextField
            label=""
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            containerClassName="max-w-md"
          />
        </div>

        {erroLista && (
          <div className="p-4 border-b border-red-200 bg-red-50 text-red-700 text-sm">
            {erroLista}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 uppercase tracking-wide bg-slate-50">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">CPF</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="p-3">
                      <div className="h-8 bg-slate-50 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : linhas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    {buscaDebounced
                      ? `Nenhum paciente encontrado para "${buscaDebounced}".`
                      : 'Nenhum paciente cadastrado ainda.'}
                  </td>
                </tr>
              ) : (
                linhas.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800 font-medium">{p.nomeCompleto}</td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums">
                      {formatCpf(p.cpf)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums">
                      {p.telefoneCelular || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => abrirEdicao(p)}>
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setConfirmar(p)}
                        >
                          Inativar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm">
            <span className="text-slate-500">
              Página {pagina + 1} de {totalPaginas}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={pagina === 0 || loading}
                onClick={() => setPagina((p) => Math.max(0, p - 1))}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={pagina >= totalPaginas - 1 || loading}
                onClick={() => setPagina((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formInitial?.id ? 'Editar paciente' : 'Novo paciente'}
        size="xl"
      >
        <PacienteForm
          initial={formInitial}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleSubmitForm}
        />
      </Modal>

      <ConfirmModal
        open={!!confirmar}
        title="Inativar paciente?"
        message={
          confirmar
            ? `${confirmar.nomeCompleto} deixará de aparecer na listagem. Você pode desfazer em seguida pelo aviso na tela.`
            : ''
        }
        confirmLabel="Inativar"
        danger
        loading={inativando}
        onClose={() => setConfirmar(null)}
        onConfirm={handleInativar}
      />
    </div>
  );
};
