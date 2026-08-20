import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Smartphone,
  Video,
  Pencil,
  MessageCircle,
  Cake,
  MapPin,
  Grid3X3,
  CalendarDays,
  User as UserIcon,
  ShieldCheck,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Badge, AgendamentoStatusBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { PacienteForm } from './PacienteForm';
import { PacienteAnamneses } from './PacienteAnamneses';
import { PacienteDocumentos } from './PacienteDocumentos';
import { PacienteProcedimentos } from './PacienteProcedimentos';
import { bokkaToast } from '../../components/ui/Toast';
import {
  usePaciente,
  usePacientes,
  useAtualizarPaciente,
} from '../../services/pacienteService';
import { useConvenio } from '../../services/convenioService';
import { useAgendamentosPorPaciente } from '../../services/agendamentoService';
import { useOdontogramasPorPaciente } from '../../services/odontogramaService';
import { ApiError } from '../../lib/api';
import { Avatar } from '../../components/ui/Avatar';
import { photoKeys } from '../../lib/profilePhotos';
import {
  cn,
  formatCpf,
  formatDate,
  formatPhone,
  formatTime,
  sanitizeEnderecoPayload,
} from '../../lib/utils';
import type { Paciente } from '../../types';

export const PacienteDetalhePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [queueSearch, setQueueSearch] = useState('');
  const [queueSort, setQueueSort] = useState<'recent' | 'oldest' | 'all'>('all');

  const pacienteQ = usePaciente(id);
  const agendamentosQ = useAgendamentosPorPaciente(id);
  const odontogramasQ = useOdontogramasPorPaciente(id);

  const queueQ = usePacientes({
    pagina: 0,
    tamanho: 20,
    ordem: queueSort === 'oldest' ? 'createdAt,asc' : 'nomeCompleto',
    nome: queueSearch.trim() || undefined,
  });

  const atualizarM = useAtualizarPaciente();
  const paciente = pacienteQ.data;
  const convenioQ = useConvenio(
    (paciente?.tipoPaciente === 'CONVENIO' || paciente?.tipoPaciente === 'MISTO') ? paciente?.convenioId : undefined,
  );

  const handleSubmit = async (values: Paciente) => {
    if (!id) return;
    await atualizarM.mutateAsync({ id, paciente: sanitizeEnderecoPayload(values) });
    bokkaToast.success('Dados atualizados.');
    setEditing(false);
  };

  const proximoAgendamento = useMemo(() => {
    if (!agendamentosQ.data) return null;
    const now = Date.now();
    return (
      [...agendamentosQ.data]
        .filter((a) => a.dataHoraInicio && new Date(a.dataHoraInicio).getTime() > now)
        .sort((a, b) =>
          (a.dataHoraInicio || '').localeCompare(b.dataHoraInicio || ''),
        )[0] ?? null
    );
  }, [agendamentosQ.data]);

  if (pacienteQ.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" rounded="xl" />
        <Skeleton className="h-64 w-full" rounded="xl" />
      </div>
    );
  }

  if (pacienteQ.isError || !paciente) {
    return (
      <div className="bg-bokka-surface border border-bokka-border rounded-xl">
        <EmptyState
          icon={<UserIcon className="w-6 h-6" strokeWidth={1.75} />}
          title="Paciente não encontrada"
          description={
            pacienteQ.error instanceof ApiError
              ? pacienteQ.error.friendlyMessage()
              : 'A paciente pedida não existe ou foi removida.'
          }
          action={
            <Button variant="secondary" onClick={() => navigate('/pacientes')} icon={<ArrowLeft />}>
              Voltar para pacientes
            </Button>
          }
        />
      </div>
    );
  }

  const enderecoLinha = paciente.endereco
    ? [
        paciente.endereco.logradouro,
        paciente.endereco.numero,
        paciente.endereco.complemento,
      ]
        .filter(Boolean)
        .join(', ')
    : '';
  const enderecoLinha2 = paciente.endereco
    ? [paciente.endereco.bairro, paciente.endereco.cidade, paciente.endereco.estado]
        .filter(Boolean)
        .join(' · ')
    : '';

  const queueItems = queueQ.data?.content ?? [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-bokka-ink-3">
        <Link to="/pacientes" className="hover:text-bokka-primary inline-flex items-center gap-1 font-medium">
          <ArrowLeft className="w-4 h-4" /> Pacientes
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-bokka-ink font-semibold">{paciente.nomeCompleto}</span>
      </div>

      {/* Grid principal: queue lateral + conteúdo */}
      <div className="grid grid-cols-12 gap-6">
        {/* Patient Queue lateral (desktop) */}
        <aside className="hidden lg:block lg:col-span-3 xl:col-span-3">
          <div className="bg-bokka-surface border border-bokka-border rounded-2xl overflow-hidden sticky top-24">
            <div className="p-4 pb-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-bokka-ink">Fila de pacientes</h2>
                <div className="w-8 h-8 rounded-full bg-bokka-surface-3 flex items-center justify-center text-bokka-ink-3">
                  <Search className="w-4 h-4" strokeWidth={2} />
                </div>
              </div>
              <input
                type="text"
                placeholder="Buscar..."
                value={queueSearch}
                onChange={(e) => setQueueSearch(e.target.value)}
                className="w-full text-sm bg-bokka-surface-2 border border-bokka-border rounded-md px-3 h-9 placeholder:text-bokka-ink-3 outline-none focus:border-bokka-primary-ring"
              />
            </div>
            <div className="px-4 pb-3 flex gap-1">
              {(
                [
                  { v: 'all', l: 'Todos' },
                  { v: 'oldest', l: 'Antigos' },
                  { v: 'recent', l: 'Recentes' },
                ] as const
              ).map((t) => (
                <button
                  key={t.v}
                  type="button"
                  onClick={() => setQueueSort(t.v)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
                    queueSort === t.v
                      ? 'bg-bokka-primary-soft text-bokka-primary'
                      : 'text-bokka-ink-3 hover:bg-bokka-surface-3',
                  )}
                >
                  {t.l}
                </button>
              ))}
            </div>

            <div className="max-h-[calc(100vh-16rem)] overflow-y-auto px-3 pb-4 space-y-2">
              {queueQ.isLoading ? (
                <>
                  <Skeleton className="h-16 w-full" rounded="lg" />
                  <Skeleton className="h-16 w-full" rounded="lg" />
                  <Skeleton className="h-16 w-full" rounded="lg" />
                </>
              ) : (
                queueItems.map((p) => {
                  const active = p.id === id;
                  return (
                    <Link
                      key={p.id}
                      to={`/pacientes/${p.id}`}
                      className={cn(
                        'flex items-center gap-3 p-2.5 rounded-xl border transition-colors',
                        active
                          ? 'border-bokka-primary bg-bokka-primary-soft/40'
                          : 'border-transparent hover:bg-bokka-surface-3',
                      )}
                    >
                      <Avatar
                        photoKey={photoKeys.paciente(p.id)}
                        remoteSrc={p.fotoUrl}
                        name={p.nomeCompleto}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-bokka-ink truncate">
                          {p.nomeCompleto}
                        </div>
                        <div className="text-[11px] text-bokka-ink-3 tabular-nums truncate">
                          {formatCpf(p.cpf)}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-bokka-ink-3" />
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* Conteúdo principal */}
        <div className="col-span-12 lg:col-span-9 xl:col-span-9 space-y-6">
          {/* Header rico do paciente */}
          <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Avatar
                  photoKey={photoKeys.paciente(paciente.id)}
                  remoteSrc={paciente.fotoUrl}
                  name={paciente.nomeCompleto}
                  size="xl"
                  editable
                  ring
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-bokka-ink tracking-tight">
                      {paciente.nomeCompleto}
                    </h1>
                    <Badge tone={paciente.ativo ? 'success' : 'neutral'} dot>
                      {paciente.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-sm text-bokka-ink-3 mt-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
                    Paciente desde {formatDate(paciente.createdAt) || '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {[
                  { icon: Mail, label: 'E-mail', href: paciente.email ? `mailto:${paciente.email}` : undefined },
                  { icon: Phone, label: 'Ligar', href: paciente.telefoneCelular ? `tel:${paciente.telefoneCelular}` : undefined },
                  { icon: MessageCircle, label: 'WhatsApp', href: paciente.telefoneCelular ? `https://wa.me/55${paciente.telefoneCelular.replace(/\D/g, '')}` : undefined },
                  { icon: Smartphone, label: 'SMS', href: paciente.telefoneCelular ? `sms:${paciente.telefoneCelular.replace(/\D/g, '')}` : undefined },
                  { icon: Video, label: 'Chamada de vídeo', href: paciente.email ? `https://meet.google.com/new?email=${paciente.email}` : undefined },
                ].map((btn, i) => {
                  const Icon = btn.icon;
                  const disabled = !btn.href;
                  const commonClass = cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-colors border border-bokka-border',
                    disabled
                      ? 'text-bokka-ink-3 bg-bokka-surface-2 cursor-not-allowed'
                      : 'text-bokka-ink-2 bg-bokka-surface hover:bg-bokka-primary hover:text-white hover:border-bokka-primary',
                  );
                  return btn.href ? (
                    <a
                      key={i}
                      href={btn.href}
                      target={btn.href.startsWith('http') ? '_blank' : undefined}
                      rel="noreferrer"
                      title={btn.label}
                      className={commonClass}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.75} />
                    </a>
                  ) : (
                    <button key={i} type="button" title={btn.label} className={commonClass} disabled>
                      <Icon className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors border border-bokka-border text-bokka-ink-2 bg-bokka-surface hover:bg-bokka-primary hover:text-white hover:border-bokka-primary ml-1"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </div>

          {/* Row 1: 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Card 1: Basic Info */}
            <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-5">
              <h3 className="text-base font-semibold text-bokka-ink mb-4">
                Informações básicas
              </h3>
              <ul className="space-y-4">
                <BasicRow
                  icon={<UserIcon className="w-4 h-4" strokeWidth={1.75} />}
                  label="Sexo"
                  value={paciente.sexo === 'FEMININO' ? 'Feminino' : paciente.sexo === 'MASCULINO' ? 'Masculino' : 'Outro'}
                />
                <BasicRow
                  icon={<Cake className="w-4 h-4" strokeWidth={1.75} />}
                  label="Nascimento"
                  value={formatDate(paciente.dataNascimento)}
                />
                <BasicRow
                  icon={<Phone className="w-4 h-4" strokeWidth={1.75} />}
                  label="Celular"
                  value={formatPhone(paciente.telefoneCelular)}
                />
                <BasicRow
                  icon={<Mail className="w-4 h-4" strokeWidth={1.75} />}
                  label="E-mail"
                  value={paciente.email || '—'}
                />
                {(enderecoLinha || enderecoLinha2) && (
                  <BasicRow
                    icon={<MapPin className="w-4 h-4" strokeWidth={1.75} />}
                    label="Endereço"
                    value={
                      <>
                        <div>{enderecoLinha || '—'}</div>
                        <div className="text-bokka-ink-2 text-xs">{enderecoLinha2}</div>
                      </>
                    }
                  />
                )}
              </ul>
            </div>

            {/* Card 2: Timeline vertical */}
            <div className="bg-bokka-surface border border-bokka-border rounded-2xl p-5">
              <h3 className="text-base font-semibold text-bokka-ink mb-4">
                Agendamentos
              </h3>
              {agendamentosQ.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" rounded="lg" />
                  <Skeleton className="h-12 w-full" rounded="lg" />
                </div>
              ) : !agendamentosQ.data?.length ? (
                <p className="text-sm text-bokka-ink-3">Nenhum agendamento ainda.</p>
              ) : (
                <ul className="space-y-3 relative">
                  {[...agendamentosQ.data]
                    .sort((a, b) => (b.dataHoraInicio || '').localeCompare(a.dataHoraInicio || ''))
                    .slice(0, 4)
                    .map((ag, i, arr) => (
                      <li key={ag.id} className="flex gap-3 relative">
                        <div className="flex flex-col items-center shrink-0">
                          <div
                            className={cn(
                              'w-3 h-3 rounded-full ring-4 ring-bokka-surface',
                              ag.status === 'CONFIRMADO'
                                ? 'bg-bokka-success'
                                : ag.status === 'CANCELADO'
                                  ? 'bg-bokka-danger'
                                  : ag.status === 'REALIZADO'
                                    ? 'bg-bokka-ink-3'
                                    : 'bg-bokka-primary',
                            )}
                          />
                          {i < arr.length - 1 && (
                            <div className="w-px flex-1 bg-bokka-border mt-1 mb-1" style={{ minHeight: '32px' }} />
                          )}
                        </div>
                        <div className="min-w-0 pb-2">
                          <p className="text-xs text-bokka-ink-3 tabular-nums font-medium">
                            {formatDate(ag.dataHoraInicio)} · {formatTime(ag.dataHoraInicio)}
                          </p>
                          <p className="text-sm font-semibold text-bokka-ink truncate mt-0.5">
                            {ag.observacoes || 'Consulta agendada'}
                          </p>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            {/* Card 3: Convênio (gradient) */}
            <div
              className="rounded-2xl p-5 text-white relative overflow-hidden md:col-span-2 xl:col-span-1"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 55%, #2A6BF2 100%)',
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider font-semibold text-white/70">
                    Tipo de atendimento
                  </p>
                  <p className="text-base font-bold mt-1 truncate">
                    {paciente.tipoPaciente === 'CONVENIO'
                      ? 'Convênio'
                      : paciente.tipoPaciente === 'MISTO'
                        ? 'Atendimento misto'
                        : 'Particular'}
                  </p>
                  {(paciente.tipoPaciente === 'CONVENIO' || paciente.tipoPaciente === 'MISTO') && convenioQ.data?.nome && (
                    <p className="text-xs font-semibold text-white/80 mt-1 truncate">
                      {convenioQ.data.nome}
                    </p>
                  )}
                </div>
                <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
                </div>
              </div>
              <p className="text-2xl font-bold tabular-nums tracking-wider mt-6">
                {paciente.numeroProntuario
                  ? paciente.numeroProntuario.padStart(12, '0').replace(/(.{4})/g, '$1 ').trim()
                  : '•••• •••• ••••'}
              </p>
              <div className="flex justify-between items-end mt-6">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
                    Prontuário
                  </p>
                  <p className="text-sm font-semibold mt-0.5">
                    #{(paciente.id || '').slice(-6).toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
                    Status
                  </p>
                  <p className="text-sm font-semibold mt-0.5">
                    {paciente.ativo ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Anamneses + Odontograma preview */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <PacienteAnamneses pacienteId={paciente.id!} />
            </div>

            {/* Odontograma preview */}
            <div className="bg-bokka-ink rounded-2xl p-5 text-white overflow-hidden relative flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold">Odontograma</h3>
                  <p className="text-xs text-white/60 mt-0.5">
                    {odontogramasQ.data?.length
                      ? `${odontogramasQ.data.length} registros`
                      : 'Nenhum registro'}
                  </p>
                </div>
                <span className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                  <Grid3X3 className="w-4 h-4" strokeWidth={1.75} />
                </span>
              </div>

              <div className="flex-1 flex items-center justify-center py-4">
                <ArcadaMiniIllustration />
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-semibold text-white/60 tracking-wider">
                    Último registro
                  </p>
                  <p className="text-sm font-semibold mt-0.5">
                    {odontogramasQ.data?.[0]
                      ? formatDate(odontogramasQ.data[0].dataAvaliacao)
                      : 'Sem histórico'}
                  </p>
                </div>
                <Link
                  to={`/pacientes/${id}/odontograma`}
                  className="text-xs font-semibold bg-white text-bokka-ink hover:bg-white/90 px-3 py-1.5 rounded-md inline-flex items-center gap-1"
                >
                  Abrir <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Procedimentos do paciente */}
          <PacienteProcedimentos pacienteId={paciente.id!} />

          {/* Documentos do paciente */}
          <PacienteDocumentos pacienteId={paciente.id!} />

          {/* Próxima consulta destaque, se houver */}
          {proximoAgendamento && (
            <div className="bg-bokka-primary-soft border border-bokka-primary/20 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-bokka-primary text-white flex items-center justify-center">
                  <CalendarDays className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-xs uppercase font-semibold text-bokka-primary tracking-wider">
                    Próxima consulta
                  </p>
                  <p className="text-lg font-bold text-bokka-ink mt-0.5 tabular-nums">
                    {formatDate(proximoAgendamento.dataHoraInicio)} ·{' '}
                    {formatTime(proximoAgendamento.dataHoraInicio)}
                  </p>
                </div>
              </div>
              <AgendamentoStatusBadge status={proximoAgendamento.status} />
            </div>
          )}
        </div>
      </div>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Editar paciente"
        subtitle="Atualize os dados do cadastro."
        size="xl"
      >
        <PacienteForm
          initial={paciente}
          onCancel={() => setEditing(false)}
          onSubmit={handleSubmit}
        />
      </Modal>
    </div>
  );
};

// ============ Sub-componentes ============

interface BasicRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

const BasicRow = ({ icon, label, value }: BasicRowProps) => (
  <li className="flex items-start gap-3">
    <span className="w-8 h-8 rounded-lg bg-bokka-primary-soft text-bokka-primary flex items-center justify-center shrink-0 mt-0.5">
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] uppercase font-semibold text-bokka-ink-3 tracking-wider">
        {label}
      </p>
      <div className="text-sm font-semibold text-bokka-ink mt-0.5 break-words">
        {value}
      </div>
    </div>
  </li>
);

/** Ilustração compacta de arcada dental — mostrada no card "Odontograma" preview. */
const ArcadaMiniIllustration = () => (
  <svg
    viewBox="0 0 200 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full max-w-[220px] h-auto"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="toothGrad" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </radialGradient>
      <radialGradient id="gumGrad" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="#FCA5A5" />
        <stop offset="100%" stopColor="#EF4444" />
      </radialGradient>
    </defs>
    {/* Gengiva superior */}
    <path
      d="M 22 55 Q 100 15 178 55 Q 178 40 100 8 Q 22 40 22 55 Z"
      fill="url(#gumGrad)"
      opacity="0.8"
    />
    {/* Gengiva inferior */}
    <path
      d="M 22 85 Q 100 125 178 85 Q 178 100 100 132 Q 22 100 22 85 Z"
      fill="url(#gumGrad)"
      opacity="0.8"
    />
    {/* Dentes superiores (arco) */}
    {Array.from({ length: 12 }).map((_, i) => {
      const t = i / 11;
      const x = 28 + t * 144;
      const y = 55 - Math.sin(t * Math.PI) * 22;
      return (
        <ellipse
          key={`top-${i}`}
          cx={x}
          cy={y}
          rx="7"
          ry="10"
          fill="url(#toothGrad)"
          stroke="#CBD5E1"
          strokeWidth="0.5"
        />
      );
    })}
    {/* Dentes inferiores (arco) */}
    {Array.from({ length: 12 }).map((_, i) => {
      const t = i / 11;
      const x = 28 + t * 144;
      const y = 85 + Math.sin(t * Math.PI) * 22;
      return (
        <ellipse
          key={`bot-${i}`}
          cx={x}
          cy={y}
          rx="7"
          ry="10"
          fill="url(#toothGrad)"
          stroke="#CBD5E1"
          strokeWidth="0.5"
        />
      );
    })}
  </svg>
);
