import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
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
} from 'lucide-react';
import { Badge, AgendamentoStatusBadge } from '../../components/ui/Badge';
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
  useAtualizarPaciente,
} from '../../services/pacienteService';
import { useConvenio } from '../../services/convenioService';
import { useAgendamentosPorPaciente } from '../../services/agendamentoService';
import { useOdontogramasPorPaciente } from '../../services/odontogramaService';
import { Avatar } from '../../components/ui/Avatar';
import { photoKeys } from '../../lib/profilePhotos';
import {
  cn,
  formatDate,
  formatPhone,
  formatTime,
  sanitizeEnderecoPayload,
} from '../../lib/utils';
import type { Paciente } from '../../types';

interface PacienteDetalheModalProps {
  pacienteId: string | null;
  open: boolean;
  onClose: () => void;
}

export const PacienteDetalheModal = ({ pacienteId, open, onClose }: PacienteDetalheModalProps) => {
  const [editing, setEditing] = useState(false);

  const pacienteQ = usePaciente(pacienteId ?? undefined);
  const agendamentosQ = useAgendamentosPorPaciente(pacienteId ?? undefined);
  const odontogramasQ = useOdontogramasPorPaciente(pacienteId ?? undefined);
  const atualizarM = useAtualizarPaciente();

  const paciente = pacienteQ.data;
  const convenioId = paciente?.convenioId;
  const convenioQ = useConvenio(
    (paciente?.tipoPaciente === 'CONVENIO' || paciente?.tipoPaciente === 'MISTO') ? convenioId : undefined,
  );

  const handleSubmit = async (values: Paciente) => {
    if (!pacienteId) return;
    await atualizarM.mutateAsync({ id: pacienteId, paciente: sanitizeEnderecoPayload(values) });
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

  const enderecoLinha = paciente?.endereco
    ? [
        paciente.endereco.logradouro,
        paciente.endereco.numero,
        paciente.endereco.complemento,
      ]
        .filter(Boolean)
        .join(', ')
    : '';
  const enderecoLinha2 = paciente?.endereco
    ? [paciente.endereco.bairro, paciente.endereco.cidade, paciente.endereco.estado]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <>
      <Modal open={open} onClose={onClose} size="2xl">
        {!pacienteId ? null : pacienteQ.isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16" rounded="full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-40 w-full" rounded="xl" />
            <Skeleton className="h-40 w-full" rounded="xl" />
          </div>
        ) : !paciente ? (
          <EmptyState
            icon={<UserIcon className="w-6 h-6" strokeWidth={1.75} />}
            title="Paciente não encontrado"
            description="Este paciente pode ter sido removido."
          />
        ) : (
          <div className="space-y-5">
            {/* Header do paciente */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Avatar
                  photoKey={photoKeys.paciente(paciente.id)}
                  name={paciente.nomeCompleto}
                  size="xl"
                  editable={false}
                  ring
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-bokka-ink tracking-tight">
                      {paciente.nomeCompleto}
                    </h2>
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
                    'w-9 h-9 rounded-full flex items-center justify-center transition-colors border border-bokka-border',
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
                      <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </a>
                  ) : (
                    <button key={i} type="button" title={btn.label} className={commonClass} disabled>
                      <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors border border-bokka-border text-bokka-ink-2 bg-bokka-surface hover:bg-bokka-primary hover:text-white hover:border-bokka-primary ml-1"
                  title="Editar"
                >
                  <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            {/* Row 1: 3 cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* Basic Info */}
              <div className="bg-bokka-surface-2 border border-bokka-border rounded-2xl p-5">
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
                  <BasicRow
                    icon={<MapPin className="w-4 h-4" strokeWidth={1.75} />}
                    label="Endereço"
                    value={
                      enderecoLinha || enderecoLinha2 ? (
                        <>
                          <div>{enderecoLinha || '—'}</div>
                          {enderecoLinha2 && <div className="text-bokka-ink-2 text-xs">{enderecoLinha2}</div>}
                        </>
                      ) : '—'
                    }
                  />
                </ul>
              </div>

              {/* Agendamentos timeline */}
              <div className="bg-bokka-surface-2 border border-bokka-border rounded-2xl p-5">
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
                                'w-3 h-3 rounded-full ring-4 ring-bokka-surface-2',
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

              {/* Convênio gradient card */}
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
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
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

            {/* Row 2: Anamneses + Odontograma */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2">
                <PacienteAnamneses pacienteId={paciente.id!} />
              </div>

              {/* Odontograma preview */}
              <div
                className="rounded-2xl p-5 text-white overflow-hidden relative flex flex-col"
                style={{
                  background: 'linear-gradient(135deg, #2A6BF2 0%, #4F46E5 55%, #7C3AED 100%)',
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold">Odontograma</h3>
                    <p className="text-xs text-white/60 mt-0.5">
                      {odontogramasQ.data?.length
                        ? `${odontogramasQ.data.length} registros`
                        : 'Nenhum registro'}
                    </p>
                  </div>
                  <span className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
                    <Grid3X3 className="w-4 h-4" strokeWidth={1.75} />
                  </span>
                </div>

                <div className="flex-1 flex items-center justify-center py-4">
                  <ArcadaMiniIllustration />
                </div>

                <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-white/60 tracking-wider">
                      Ultimo registro
                    </p>
                    <p className="text-sm font-semibold mt-0.5">
                      {odontogramasQ.data?.[0]
                        ? formatDate(odontogramasQ.data[0].dataAvaliacao)
                        : 'Sem historico'}
                    </p>
                  </div>
                  <Link
                    to={`/pacientes/${pacienteId}/odontograma`}
                    onClick={onClose}
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

            {/* Próxima consulta destaque */}
            {proximoAgendamento && (
              <div className="bg-bokka-primary-soft border border-bokka-primary/20 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-bokka-primary text-white flex items-center justify-center">
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
        )}
      </Modal>

      {/* Edit form modal */}
      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Editar paciente"
        subtitle="Atualize os dados do cadastro."
        size="xl"
      >
        {paciente && (
          <PacienteForm
            initial={paciente}
            photoKey={photoKeys.paciente(pacienteId!)}
            onCancel={() => setEditing(false)}
            onSubmit={handleSubmit}
          />
        )}
      </Modal>
    </>
  );
};

const BasicRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
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

const ArcadaMiniIllustration = () => (
  <svg
    viewBox="0 0 200 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full max-w-[200px] h-auto"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="modalToothGrad" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E0E7FF" />
      </radialGradient>
      <radialGradient id="modalGumGrad" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
      </radialGradient>
    </defs>
    <path d="M 22 55 Q 100 15 178 55 Q 178 40 100 8 Q 22 40 22 55 Z" fill="url(#modalGumGrad)" />
    <path d="M 22 85 Q 100 125 178 85 Q 178 100 100 132 Q 22 100 22 85 Z" fill="url(#modalGumGrad)" />
    {Array.from({ length: 12 }).map((_, i) => {
      const t = i / 11;
      const x = 28 + t * 144;
      const y = 55 - Math.sin(t * Math.PI) * 22;
      return <ellipse key={`top-${i}`} cx={x} cy={y} rx="7" ry="10" fill="url(#modalToothGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />;
    })}
    {Array.from({ length: 12 }).map((_, i) => {
      const t = i / 11;
      const x = 28 + t * 144;
      const y = 85 + Math.sin(t * Math.PI) * 22;
      return <ellipse key={`bot-${i}`} cx={x} cy={y} rx="7" ry="10" fill="url(#modalToothGrad)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />;
    })}
  </svg>
);
