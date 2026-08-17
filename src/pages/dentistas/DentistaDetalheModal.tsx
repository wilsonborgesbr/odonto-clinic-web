import { useMemo, useState } from 'react';
import {
  Mail,
  Phone,
  Smartphone,
  MessageCircle,
  Pencil,
  MapPin,
  CalendarDays,
  Stethoscope,
  ShieldCheck,
  User as UserIcon,
  Award,
} from 'lucide-react';
import { Badge, AgendamentoStatusBadge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { DentistaForm } from './DentistaForm';
import { bokkaToast } from '../../components/ui/Toast';
import { useDentista, useAtualizarDentista } from '../../services/dentistaService';
import { useAgendamentosPorDentista } from '../../services/agendamentoService';
import { Avatar } from '../../components/ui/Avatar';
import { photoKeys } from '../../lib/profilePhotos';
import { cn, formatDate, formatPhone, formatTime, sanitizeEnderecoPayload } from '../../lib/utils';
import type { Dentista, EspecialidadeEnum } from '../../types';

const espLabel: Record<EspecialidadeEnum, string> = {
  CLINICO_GERAL: 'Clinico Geral',
  ORTODONTIA: 'Ortodontia',
  IMPLANTODONTIA: 'Implantodontia',
  ENDODONTIA: 'Endodontia',
  PERIODONTIA: 'Periodontia',
  ODONTOPEDIATRIA: 'Odontopediatria',
  CIRURGIA: 'Cirurgia',
  PROTESE: 'Protese',
  ESTETICA: 'Estetica',
  RADIOLOGIA: 'Radiologia',
};

const espIcon: Record<EspecialidadeEnum, string> = {
  CLINICO_GERAL: '#2A6BF2',
  ORTODONTIA: '#7C3AED',
  IMPLANTODONTIA: '#059669',
  ENDODONTIA: '#DC2626',
  PERIODONTIA: '#0891B2',
  ODONTOPEDIATRIA: '#D97706',
  CIRURGIA: '#4F46E5',
  PROTESE: '#9333EA',
  ESTETICA: '#EC4899',
  RADIOLOGIA: '#6366F1',
};

interface DentistaDetalheModalProps {
  dentistaId: string | null;
  open: boolean;
  onClose: () => void;
}

export const DentistaDetalheModal = ({ dentistaId, open, onClose }: DentistaDetalheModalProps) => {
  const [editing, setEditing] = useState(false);

  const dentistaQ = useDentista(dentistaId ?? undefined);
  const agendamentosQ = useAgendamentosPorDentista(dentistaId ?? undefined);
  const atualizarM = useAtualizarDentista();

  const dentista = dentistaQ.data;

  const handleSubmit = async (values: Dentista) => {
    if (!dentistaId) return;
    await atualizarM.mutateAsync({ id: dentistaId, dentista: sanitizeEnderecoPayload(values) });
    bokkaToast.success('Dados atualizados.');
    setEditing(false);
  };

  const proximoAgendamento = useMemo(() => {
    if (!agendamentosQ.data) return null;
    const now = Date.now();
    return (
      [...agendamentosQ.data]
        .filter((a) => a.dataHoraInicio && new Date(a.dataHoraInicio).getTime() > now)
        .sort((a, b) => (a.dataHoraInicio || '').localeCompare(b.dataHoraInicio || ''))
        [0] ?? null
    );
  }, [agendamentosQ.data]);

  const stats = useMemo(() => {
    if (!agendamentosQ.data) return { total: 0, realizados: 0, agendados: 0 };
    const total = agendamentosQ.data.length;
    const realizados = agendamentosQ.data.filter((a) => a.status === 'REALIZADO').length;
    const agendados = agendamentosQ.data.filter(
      (a) => a.status === 'AGENDADO' || a.status === 'CONFIRMADO',
    ).length;
    return { total, realizados, agendados };
  }, [agendamentosQ.data]);

  const enderecoLinha = dentista?.endereco
    ? [dentista.endereco.logradouro, dentista.endereco.numero, dentista.endereco.complemento]
        .filter(Boolean)
        .join(', ')
    : '';
  const enderecoLinha2 = dentista?.endereco
    ? [dentista.endereco.bairro, dentista.endereco.cidade, dentista.endereco.estado]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <>
      <Modal open={open} onClose={onClose} size="2xl">
        {!dentistaId ? null : dentistaQ.isLoading ? (
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
        ) : !dentista ? (
          <EmptyState
            icon={<Stethoscope className="w-6 h-6" strokeWidth={1.75} />}
            title="Dentista nao encontrado"
            description="Este profissional pode ter sido removido."
          />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Avatar
                  photoKey={photoKeys.dentista(dentista.id)}
                  name={dentista.nomeCompleto}
                  size="xl"
                  editable={false}
                  ring
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-bokka-ink tracking-tight">
                      {dentista.nomeCompleto}
                    </h2>
                    <Badge tone={dentista.ativo ? 'success' : 'neutral'} dot>
                      {dentista.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-sm text-bokka-ink-3 mt-1 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" strokeWidth={2} />
                    {dentista.cro}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {[
                  { icon: Mail, label: 'E-mail', href: dentista.email ? `mailto:${dentista.email}` : undefined },
                  { icon: Phone, label: 'Ligar', href: dentista.telefoneCelular ? `tel:${dentista.telefoneCelular}` : undefined },
                  { icon: MessageCircle, label: 'WhatsApp', href: dentista.telefoneCelular ? `https://wa.me/55${dentista.telefoneCelular.replace(/\D/g, '')}` : undefined },
                  { icon: Smartphone, label: 'SMS', href: dentista.telefoneCelular ? `sms:${dentista.telefoneCelular.replace(/\D/g, '')}` : undefined },
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="bg-bokka-surface-2 border border-bokka-border rounded-2xl p-5">
                <h3 className="text-base font-semibold text-bokka-ink mb-4">
                  Informacoes basicas
                </h3>
                <ul className="space-y-4">
                  <BasicRow
                    icon={<UserIcon className="w-4 h-4" strokeWidth={1.75} />}
                    label="Sexo"
                    value={dentista.sexo === 'FEMININO' ? 'Feminino' : dentista.sexo === 'MASCULINO' ? 'Masculino' : 'Outro'}
                  />
                  <BasicRow
                    icon={<Phone className="w-4 h-4" strokeWidth={1.75} />}
                    label="Celular"
                    value={formatPhone(dentista.telefoneCelular)}
                  />
                  <BasicRow
                    icon={<Mail className="w-4 h-4" strokeWidth={1.75} />}
                    label="E-mail"
                    value={dentista.email || '—'}
                  />
                  <BasicRow
                    icon={<MapPin className="w-4 h-4" strokeWidth={1.75} />}
                    label="Endereco"
                    value={
                      enderecoLinha || enderecoLinha2 ? (
                        <>
                          <div>{enderecoLinha || '—'}</div>
                          {enderecoLinha2 && <div className="text-bokka-ink-2 text-xs">{enderecoLinha2}</div>}
                        </>
                      ) : '—'
                    }
                  />
                  <BasicRow
                    icon={<ShieldCheck className="w-4 h-4" strokeWidth={1.75} />}
                    label="Desde"
                    value={formatDate(dentista.createdAt) || '—'}
                  />
                </ul>
              </div>

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

              <div
                className="rounded-2xl p-5 text-white relative overflow-hidden md:col-span-2 xl:col-span-1"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #0891B2 55%, #2A6BF2 100%)',
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider font-semibold text-white/70">
                      Registro profissional
                    </p>
                    <p className="text-base font-bold mt-1 truncate">
                      {(dentista.especialidades ?? []).length > 0
                        ? espLabel[dentista.especialidades![0]] ?? dentista.especialidades![0]
                        : 'Clinico Geral'}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                </div>
                <p className="text-2xl font-bold tabular-nums tracking-wider mt-6">
                  {dentista.cro || '•••• ••••'}
                </p>
                <div className="flex justify-between items-end mt-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
                      Atendimentos
                    </p>
                    <p className="text-sm font-semibold mt-0.5 tabular-nums">
                      {stats.realizados} realizados
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
                      Status
                    </p>
                    <p className="text-sm font-semibold mt-0.5">
                      {dentista.ativo ? 'Ativo' : 'Inativo'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {(dentista.especialidades ?? []).length > 0 && (
              <div className="bg-bokka-surface-2 border border-bokka-border rounded-2xl p-5">
                <h3 className="text-base font-semibold text-bokka-ink mb-4">
                  Especialidades
                </h3>
                <div className="flex flex-wrap gap-2">
                  {dentista.especialidades!.map((esp) => (
                    <div
                      key={esp}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bokka-surface border border-bokka-border"
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: espIcon[esp] || '#2A6BF2' }}
                      />
                      <span className="text-sm font-semibold text-bokka-ink">
                        {espLabel[esp] ?? esp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {proximoAgendamento && (
              <div className="bg-bokka-primary-soft border border-bokka-primary/20 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-bokka-primary text-white flex items-center justify-center">
                    <CalendarDays className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-xs uppercase font-semibold text-bokka-primary tracking-wider">
                      Proximo agendamento
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

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Editar dentista"
        subtitle="Atualize os dados do profissional."
        size="xl"
      >
        {dentista && (
          <DentistaForm
            initial={dentista}
            photoKey={photoKeys.dentista(dentistaId!)}
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
