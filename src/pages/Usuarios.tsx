import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Mail,
  KeyRound,
  Shield,
  Check,
  X,
  Calendar,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Field';
import { bokkaToast } from '../components/ui/Toast';
import {
  useAtualizarUsuario,
  useCriarUsuario,
  useInativarUsuario,
  useReativarUsuario,
  useUsuarios,
} from '../services/usuarioService';
import { useAuth } from '../context/AuthContext';
import {
  useGoogleCalendarConexoes,
  useGoogleCalendarStatus,
} from '../services/googleCalendarService';
import { ESCOPO, SYNC_STATUS, explicacaoSync } from '../lib/googleCalendar';
import { ApiError } from '../lib/api';
import { cn, normalizeEmail } from '../lib/utils';
import type { ConexaoGoogleCalendar, EscopoGoogleCalendar, PermissaoEnum, RoleEnum, UsuarioDTO } from '../types';

// Rótulos exibidos ao usuário
const roleLabel: Record<RoleEnum, string> = {
  PROPRIETARIO: 'Proprietário(a)',
  SOCIO: 'Sócio(a)',
  ADMINISTRADOR: 'Administrador(a)',
  DENTISTA: 'Dentista',
  RECEPCIONISTA: 'Recepcionista',
  FINANCEIRO: 'Financeiro',
  ESTOQUISTA: 'Estoquista',
  AUXILIAR_CLINICO: 'Auxiliar clínico (ASB/TSB)',
};

const roleDescricao: Record<RoleEnum, string> = {
  PROPRIETARIO: 'Controle total. Único, não pode ser criado.',
  SOCIO: 'Mesmo poder do proprietário — acesso a tudo.',
  ADMINISTRADOR: 'Gerencia a clínica exceto configurações críticas.',
  DENTISTA: 'Pacientes, agenda, procedimentos, prontuários.',
  RECEPCIONISTA: 'Cadastro de pacientes, agenda, convênios.',
  FINANCEIRO: 'Somente auditoria financeira.',
  ESTOQUISTA: 'Somente controle de estoque.',
  AUXILIAR_CLINICO: 'Apoio clínico ao dentista + estoque.',
};

const permissaoLabel: Record<PermissaoEnum, string> = {
  DASHBOARD: 'Início (Dashboard)',
  PACIENTES: 'Pacientes',
  DENTISTAS: 'Dentistas',
  AGENDAMENTOS: 'Agendamentos',
  PROCEDIMENTOS: 'Procedimentos',
  ODONTOGRAMA: 'Odontograma',
  ANAMNESE: 'Anamnese',
  DOCUMENTOS: 'Documentos',
  FUNCIONARIOS: 'Funcionários (RH)',
  ESTOQUE: 'Estoque',
  CONVENIOS: 'Convênios',
  AUDITORIA_FINANCEIRA: 'Auditoria Financeira',
  USUARIOS_E_PERMISSOES: 'Usuários & Permissões',
  CONFIGURACOES: 'Configurações',
  INTEGRACAO_GOOGLE_CALENDAR: 'Google Calendar (agenda externa)',
};

const permissoesOrdenadas: PermissaoEnum[] = [
  'DASHBOARD',
  'PACIENTES',
  'DENTISTAS',
  'AGENDAMENTOS',
  'PROCEDIMENTOS',
  'ODONTOGRAMA',
  'ANAMNESE',
  'DOCUMENTOS',
  'FUNCIONARIOS',
  'ESTOQUE',
  'CONVENIOS',
  'AUDITORIA_FINANCEIRA',
  'USUARIOS_E_PERMISSOES',
  'CONFIGURACOES',
  'INTEGRACAO_GOOGLE_CALENDAR',
];

// Permissões padrão por role — espelha o backend em RoleEnum.java
const permissoesPadrao: Record<RoleEnum, PermissaoEnum[]> = {
  PROPRIETARIO: permissoesOrdenadas,
  SOCIO: permissoesOrdenadas,
  ADMINISTRADOR: [
    'DASHBOARD', 'PACIENTES', 'DENTISTAS', 'AGENDAMENTOS', 'PROCEDIMENTOS',
    'ODONTOGRAMA', 'ANAMNESE', 'DOCUMENTOS', 'FUNCIONARIOS', 'ESTOQUE',
    'CONVENIOS', 'AUDITORIA_FINANCEIRA', 'USUARIOS_E_PERMISSOES',
  ],
  DENTISTA: [
    'DASHBOARD', 'PACIENTES', 'DENTISTAS', 'AGENDAMENTOS',
    'PROCEDIMENTOS', 'ODONTOGRAMA', 'ANAMNESE', 'DOCUMENTOS',
  ],
  RECEPCIONISTA: ['DASHBOARD', 'PACIENTES', 'AGENDAMENTOS', 'CONVENIOS', 'DOCUMENTOS'],
  FINANCEIRO: ['DASHBOARD', 'AUDITORIA_FINANCEIRA'],
  ESTOQUISTA: ['DASHBOARD', 'ESTOQUE'],
  AUXILIAR_CLINICO: [
    'DASHBOARD', 'PACIENTES', 'AGENDAMENTOS', 'PROCEDIMENTOS',
    'ODONTOGRAMA', 'ANAMNESE', 'ESTOQUE',
  ],
};

// Roles disponíveis para CRIAR (proprietário excluído — só existe um)
const rolesCriaveis: RoleEnum[] = [
  'SOCIO', 'ADMINISTRADOR', 'DENTISTA', 'RECEPCIONISTA',
  'FINANCEIRO', 'ESTOQUISTA', 'AUXILIAR_CLINICO',
];

const roleTone: Record<RoleEnum, 'primary' | 'success' | 'warning' | 'neutral' | 'danger'> = {
  PROPRIETARIO: 'primary',
  SOCIO: 'primary',
  ADMINISTRADOR: 'success',
  DENTISTA: 'success',
  RECEPCIONISTA: 'warning',
  FINANCEIRO: 'warning',
  ESTOQUISTA: 'warning',
  AUXILIAR_CLINICO: 'neutral',
};

export const Usuarios = () => {
  const { user: currentUser } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<UsuarioDTO | null>(null);
  const [confirmarInativar, setConfirmarInativar] = useState<UsuarioDTO | null>(null);

  const usuariosQ = useUsuarios();
  const criarM = useCriarUsuario();
  const atualizarM = useAtualizarUsuario();
  const inativarM = useInativarUsuario();
  const reativarM = useReativarUsuario();
  // Status de sincronização com o Google por usuário. Se a consulta falhar, os indicadores só não aparecem.
  const conexoesQ = useGoogleCalendarConexoes();
  const googleStatusQ = useGoogleCalendarStatus();
  const conexaoPorUsuario = useMemo(() => {
    const mapa = new Map<string, ConexaoGoogleCalendar>();
    for (const c of conexoesQ.data ?? []) {
      const atual = mapa.get(c.userId);
      if (!atual || (atual.syncStatus !== 'ATIVO' && c.syncStatus === 'ATIVO')) mapa.set(c.userId, c);
    }
    return mapa;
  }, [conexoesQ.data]);
  const googleConfigurada = googleStatusQ.data?.configurada ?? false;

  const users = usuariosQ.data ?? [];

  const stats = useMemo(() => {
    const ativos = users.filter((u) => u.ativo).length;
    return {
      total: users.length,
      ativos,
      inativos: users.length - ativos,
    };
  }, [users]);

  const handleReativar = async (u: UsuarioDTO) => {
    try {
      await reativarM.mutateAsync(u.id);
      bokkaToast.success(`${u.name} reativado(a).`);
    } catch (err) {
      bokkaToast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao reativar.');
    }
  };

  const handleInativar = async () => {
    if (!confirmarInativar) return;
    try {
      await inativarM.mutateAsync(confirmarInativar.id);
      bokkaToast.success(`${confirmarInativar.name} inativado(a).`);
    } catch (err) {
      bokkaToast.error(err instanceof ApiError ? err.friendlyMessage() : 'Erro ao inativar.');
    } finally {
      setConfirmarInativar(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-bokka-ink tracking-tight">
            Usuários &amp; Permissões
          </h1>
          <p className="text-sm text-bokka-ink-3 mt-1">
            Convide dentistas, recepcionistas, sócios e defina quais módulos cada um pode acessar.
          </p>
        </div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setFormInitial(null);
            setFormOpen(true);
          }}
        >
          Novo usuário
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
        {usuariosQ.isLoading ? (
          <div className="p-5 space-y-3">
            <Skeleton className="h-20 w-full" rounded="xl" />
            <Skeleton className="h-20 w-full" rounded="xl" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<Shield className="w-6 h-6" strokeWidth={1.75} />}
            title="Nenhum usuário cadastrado além de você"
            description="Convide a equipe pra dividir tarefas com as permissões certas."
          />
        ) : (
          <div className="divide-y divide-bokka-border">
            {users.map((u) => {
              const isEu = u.id === currentUser?.id;
              const isProprietario = u.role === 'PROPRIETARIO';
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-bokka-surface-3/50 transition-colors"
                >
                  <div
                    className={cn(
                      'w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shrink-0',
                      isProprietario ? 'bg-bokka-primary' : 'bg-bokka-strong',
                    )}
                    aria-hidden="true"
                  >
                    {(u.name || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-bokka-ink truncate">
                        {u.name}
                      </span>
                      {isEu && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-bokka-primary-text bg-bokka-primary-soft px-2 py-0.5 rounded-full">
                          Você
                        </span>
                      )}
                      <Badge tone={u.ativo ? 'success' : 'neutral'} dot>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Badge tone={roleTone[u.role]}>{roleLabel[u.role]}</Badge>
                      <IndicadorGoogle
                        conexao={conexaoPorUsuario.get(u.id)}
                        temPermissao={u.permissoes.includes('INTEGRACAO_GOOGLE_CALENDAR')}
                        configurada={googleConfigurada}
                        carregado={conexoesQ.isSuccess}
                      />
                    </div>
                    <p className="text-xs text-bokka-ink-3 mt-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" strokeWidth={2} />
                      {u.email}
                    </p>
                    <p className="text-[11px] text-bokka-ink-3 mt-1">
                      {u.permissoes.length} permiss{u.permissoes.length === 1 ? 'ão' : 'ões'} ativas
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setFormInitial(u);
                        setFormOpen(true);
                      }}
                      disabled={isProprietario && !isEu}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-primary-soft hover:text-bokka-primary-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={isProprietario && !isEu ? 'Só o proprietário pode se editar' : 'Editar'}
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                    {u.ativo ? (
                      <button
                        type="button"
                        onClick={() => setConfirmarInativar(u)}
                        disabled={isProprietario || isEu}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-danger-soft hover:text-bokka-danger-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={
                          isProprietario
                            ? 'Proprietário não pode ser inativado'
                            : isEu
                              ? 'Você não pode se inativar'
                              : 'Inativar'
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReativar(u)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-success-soft hover:text-bokka-success-ink transition-colors"
                        title="Reativar"
                      >
                        <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setFormInitial(null);
        }}
        title={formInitial ? `Editar ${formInitial.name}` : 'Novo usuário'}
        subtitle={
          formInitial
            ? 'Ajuste cargo, permissões ou redefina a senha.'
            : 'Um convite direto — o usuário loga com o e-mail e senha que você definir.'
        }
        size="xl"
      >
        {formOpen && (
          <UsuarioForm
            initial={formInitial}
            onCancel={() => {
              setFormOpen(false);
              setFormInitial(null);
            }}
            onSubmit={async (payload, id) => {
              if (id) {
                await atualizarM.mutateAsync({ id, payload });
                bokkaToast.success('Usuário atualizado.');
              } else {
                await criarM.mutateAsync({
                  name: payload.name,
                  email: payload.email,
                  password: payload.novaSenha ?? '',
                  role: payload.role,
                  permissoes: payload.permissoes,
                  escopoGoogleCalendar: payload.escopoGoogleCalendar,
                });
                bokkaToast.success('Usuário criado.');
              }
              setFormOpen(false);
              setFormInitial(null);
            }}
          />
        )}
      </Modal>

      <ConfirmModal
        open={!!confirmarInativar}
        onClose={() => setConfirmarInativar(null)}
        onConfirm={handleInativar}
        title="Inativar usuário?"
        message={`${confirmarInativar?.name} não conseguirá mais entrar no sistema. Você pode reativar depois.`}
        confirmLabel="Inativar"
        danger
      />
    </div>
  );
};

/** Indicador pequeno do status de sincronização com o Google Calendar ao lado do usuário. */
const IndicadorGoogle = ({
  conexao,
  temPermissao,
  configurada,
  carregado,
}: {
  conexao?: ConexaoGoogleCalendar;
  temPermissao: boolean;
  configurada: boolean;
  carregado: boolean;
}) => {
  if (!carregado) return null;
  if (conexao) {
    const st = SYNC_STATUS[conexao.syncStatus] ?? SYNC_STATUS.ERRO_AUTENTICACAO;
    const escopo = ESCOPO[conexao.escopo]?.titulo ?? conexao.escopo;
    return (
      <span title={`${escopo}${conexao.googleEmail ? ` · ${conexao.googleEmail}` : ''}. ${explicacaoSync(conexao, true)}`}>
        <Badge tone={st.tom} dot>
          <Calendar className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
          Google: {st.curto}
        </Badge>
      </span>
    );
  }
  // Sem conexão: só vale lembrar quando o usuário pode conectar e o ambiente já está configurado.
  if (!temPermissao || !configurada) return null;
  return (
    <span title="Tem permissão para o Google Calendar, mas ainda não conectou.">
      <Badge tone="neutral">
        <Calendar className="w-3 h-3" strokeWidth={2} aria-hidden="true" />
        Google: não conectado
      </Badge>
    </span>
  );
};

// ============ Formulário ============

interface FormPayload {
  name: string;
  email: string;
  role: RoleEnum;
  permissoes: PermissaoEnum[];
  /** Só vai no payload quando quem edita é proprietário/sócio (os outros não podem mudar; omitir mantém o atual). */
  escopoGoogleCalendar?: EscopoGoogleCalendar;
  novaSenha?: string;
}

const UsuarioForm = ({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: UsuarioDTO | null;
  onSubmit: (payload: FormPayload, id?: string) => Promise<void>;
  onCancel: () => void;
}) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [role, setRole] = useState<RoleEnum>(initial?.role ?? 'DENTISTA');
  const [permissoes, setPermissoes] = useState<Set<PermissaoEnum>>(
    () => new Set(initial?.permissoes ?? permissoesPadrao[initial?.role ?? 'DENTISTA']),
  );
  const { user: atual } = useAuth();
  // Só proprietário e sócio concedem a integração com o Google (o backend também exige).
  const ehDono = atual?.role === 'PROPRIETARIO' || atual?.role === 'SOCIO';
  const [escopo, setEscopo] = useState<EscopoGoogleCalendar>(initial?.escopoGoogleCalendar ?? 'SOMENTE_PROPRIO');
  const [novaSenha, setNovaSenha] = useState('');
  const [customizando, setCustomizando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const roleOptions = rolesCriaveis
    .map((r) => ({ value: r, label: roleLabel[r] }));

  const togglePermissao = (p: PermissaoEnum) => {
    setCustomizando(true);
    setPermissoes((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const trocarRole = (r: RoleEnum) => {
    setRole(r);
    // Ao trocar o role, reseta pra permissões padrão se ainda não customizou.
    if (!customizando) {
      setPermissoes(new Set(permissoesPadrao[r]));
    }
  };

  const resetarParaPadrao = () => {
    setPermissoes(new Set(permissoesPadrao[role]));
    setCustomizando(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(
        {
          name: name.trim(),
          email: normalizeEmail(email),
          role,
          permissoes: Array.from(permissoes),
          escopoGoogleCalendar: ehDono ? escopo : undefined,
          novaSenha: novaSenha || undefined,
        },
        initial?.id,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.friendlyMessage() : 'Não foi possível salvar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="text-sm text-bokka-danger-ink bg-bokka-danger-soft border border-bokka-danger/20 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <section>
        <h3 className="text-sm font-semibold text-bokka-ink mb-3">Identificação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nome completo"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            containerClassName="sm:col-span-2"
          />
          <Input
            label="E-mail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label={initial ? 'Nova senha (opcional)' : 'Senha inicial'}
            type="password"
            required={!initial}
            minLength={6}
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            placeholder={initial ? 'Deixe em branco pra manter' : 'Mínimo 6 caracteres'}
            leadingIcon={<KeyRound className="w-4 h-4" strokeWidth={1.75} />}
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-bokka-ink">Cargo</h3>
        </div>
        <Select
          label="Cargo do usuário"
          required
          value={role}
          onChange={(e) => trocarRole(e.target.value as RoleEnum)}
          options={roleOptions}
          hint={roleDescricao[role]}
        />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-bokka-ink">Permissões</h3>
            <p className="text-xs text-bokka-ink-3 mt-0.5">
              {customizando
                ? 'Permissões customizadas — não usam o padrão do cargo.'
                : 'Usando o pacote padrão do cargo selecionado.'}
            </p>
          </div>
          {customizando && (
            <button
              type="button"
              onClick={resetarParaPadrao}
              className="text-xs font-semibold text-bokka-primary-text hover:text-bokka-primary-text-hover"
            >
              Voltar ao padrão
            </button>
          )}
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {permissoesOrdenadas.map((p) => {
            const enabled = permissoes.has(p);
            const bloqueada = p === 'INTEGRACAO_GOOGLE_CALENDAR' && !ehDono && !enabled;
            return (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => togglePermissao(p)}
                  disabled={bloqueada}
                  aria-pressed={enabled}
                  title={bloqueada ? 'Só o proprietário ou sócio pode conceder esta integração.' : undefined}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                    enabled
                      ? 'bg-bokka-primary-soft border-bokka-primary/30 text-bokka-ink'
                      : 'bg-bokka-surface border-bokka-border text-bokka-ink-3 hover:border-bokka-border-strong',
                  )}
                >
                  <span
                    className={cn(
                      'w-5 h-5 rounded-md flex items-center justify-center shrink-0',
                      enabled
                        ? 'bg-bokka-primary text-white'
                        : 'bg-bokka-surface-3 text-bokka-ink-3',
                    )}
                  >
                    {enabled ? (
                      <Check className="w-3 h-3" strokeWidth={3} />
                    ) : (
                      <X className="w-3 h-3" strokeWidth={2} />
                    )}
                  </span>
                  <span className="text-sm font-medium truncate">{permissaoLabel[p]}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {permissoes.has('INTEGRACAO_GOOGLE_CALENDAR') && (
          <div className="mt-3 space-y-2">
            <fieldset disabled={!ehDono} aria-describedby="escopo-google-dica">
              <legend className="text-xs font-semibold text-bokka-ink mb-1.5">Google Calendar: quais consultas enviar</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {(Object.keys(ESCOPO) as EscopoGoogleCalendar[]).map((e) => {
                  const ativo = e === escopo;
                  return (
                    <label
                      key={e}
                      title={!ehDono ? 'Só o proprietário ou sócio pode mudar o escopo do Google Calendar.' : undefined}
                      className={cn(
                        'flex items-start gap-3 rounded-lg border px-3 py-2 transition-colors',
                        ehDono ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
                        ativo
                          ? 'bg-bokka-primary-soft border-bokka-primary/30'
                          : 'bg-bokka-surface border-bokka-border hover:border-bokka-border-strong',
                      )}
                    >
                      <input
                        type="radio"
                        name="escopo-google-calendar"
                        value={e}
                        checked={ativo}
                        onChange={() => setEscopo(e)}
                        className="mt-1 accent-[var(--color-bokka-primary)]"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-bokka-ink">{ESCOPO[e].titulo}</span>
                        <span className="block text-xs text-bokka-ink-3 mt-0.5">{ESCOPO[e].descricao}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <p id="escopo-google-dica" className="text-xs text-bokka-ink-3">
              Google Calendar: esta pessoa poderá enviar{' '}
              {escopo === 'TODOS_DA_CLINICA'
                ? 'todas as consultas da clínica'
                : 'as consultas do dentista vinculado a ela'}
              , com o nome dos pacientes, para uma conta Google. O escopo acima define quais consultas ela recebe
              {ehDono ? ' e é escolhido aqui, pelo proprietário ou sócio' : ' e só o proprietário ou sócio muda'}. Ela
              conecta em Configurações. Retirar a permissão pausa a sincronização, mas os eventos que já estão no Google
              continuam lá.
            </p>
          </div>
        )}
      </section>

      <div className="flex justify-end gap-3 pt-4 border-t border-bokka-border -mx-6 px-6">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? 'Salvar alterações' : 'Criar usuário'}
        </Button>
      </div>
    </form>
  );
};
