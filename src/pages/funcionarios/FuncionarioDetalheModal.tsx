import { useMemo, useState } from 'react';
import {
  Mail,
  Phone,
  Smartphone,
  MessageCircle,
  Pencil,
  MapPin,
  ShieldCheck,
  User as UserIcon,
  Briefcase,
  UserCog,
  IdCard,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { FuncionarioForm } from './FuncionarioForm';
import { bokkaToast } from '../../components/ui/Toast';
import { useFuncionario, useAtualizarFuncionario } from '../../services/funcionarioService';
import { Avatar } from '../../components/ui/Avatar';
import { photoKeys } from '../../lib/profilePhotos';
import { cn, formatCpf, formatDate, formatPhone, sanitizeEnderecoPayload } from '../../lib/utils';
import type { CargoFuncionarioEnum, Funcionario } from '../../types';

const cargoLabel: Record<CargoFuncionarioEnum, string> = {
  RECEPCIONISTA: 'Recepcionista',
  SECRETARIA: 'Secretária(o)',
  AUXILIAR_SAUDE_BUCAL: 'Auxiliar em Saúde Bucal',
  AUXILIAR_DENTARIO: 'Auxiliar Dentário',
  TECNICO_SAUDE_BUCAL: 'Técnico em Saúde Bucal',
  TECNICO_PROTESE_DENTARIA: 'Técnico em Prótese Dentária',
  TECNICO_RADIOLOGIA: 'Técnico em Radiologia',
  AUXILIAR_ADMINISTRATIVO: 'Auxiliar Administrativo',
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

// Grupos para colorir o card do cargo por área da clínica
const cargoGrupo: Record<CargoFuncionarioEnum, 'clinico' | 'admin' | 'apoio' | 'gestao'> = {
  RECEPCIONISTA: 'admin',
  SECRETARIA: 'admin',
  AUXILIAR_SAUDE_BUCAL: 'clinico',
  AUXILIAR_DENTARIO: 'clinico',
  TECNICO_SAUDE_BUCAL: 'clinico',
  TECNICO_PROTESE_DENTARIA: 'clinico',
  TECNICO_RADIOLOGIA: 'clinico',
  AUXILIAR_ADMINISTRATIVO: 'admin',
  ADMINISTRATIVO: 'admin',
  SOCIO: 'gestao',
  COORDENADOR_CLINICO: 'gestao',
  GERENTE: 'gestao',
  FINANCEIRO: 'admin',
  MARKETING: 'admin',
  COMERCIAL: 'admin',
  SERVICOS_GERAIS: 'apoio',
  SEGURANCA: 'apoio',
  ESTAGIARIO: 'apoio',
  OUTRO: 'apoio',
};

const grupoGradient: Record<'clinico' | 'admin' | 'apoio' | 'gestao', string> = {
  clinico: 'linear-gradient(135deg, #059669 0%, #0891B2 55%, #2A6BF2 100%)',
  admin: 'linear-gradient(135deg, #2A6BF2 0%, #4F46E5 55%, #7C3AED 100%)',
  gestao: 'linear-gradient(135deg, #0B1220 0%, #1E293B 55%, #334155 100%)',
  apoio: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 55%, #DC2626 100%)',
};

const grupoLabel: Record<'clinico' | 'admin' | 'apoio' | 'gestao', string> = {
  clinico: 'Área clínica',
  admin: 'Administrativo',
  gestao: 'Gestão',
  apoio: 'Apoio operacional',
};

interface FuncionarioDetalheModalProps {
  funcionarioId: string | null;
  open: boolean;
  onClose: () => void;
}

export const FuncionarioDetalheModal = ({
  funcionarioId,
  open,
  onClose,
}: FuncionarioDetalheModalProps) => {
  const [editing, setEditing] = useState(false);

  const funcionarioQ = useFuncionario(funcionarioId ?? undefined);
  const atualizarM = useAtualizarFuncionario();

  const funcionario = funcionarioQ.data;

  const handleSubmit = async (values: Funcionario) => {
    if (!funcionarioId) return;
    await atualizarM.mutateAsync({
      id: funcionarioId,
      funcionario: sanitizeEnderecoPayload(values),
    });
    bokkaToast.success('Dados atualizados.');
    setEditing(false);
  };

  const enderecoLinha = funcionario?.endereco
    ? [
        funcionario.endereco.logradouro,
        funcionario.endereco.numero,
        funcionario.endereco.complemento,
      ]
        .filter(Boolean)
        .join(', ')
    : '';
  const enderecoLinha2 = funcionario?.endereco
    ? [
        funcionario.endereco.bairro,
        funcionario.endereco.cidade,
        funcionario.endereco.estado,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  const grupo = useMemo(
    () => (funcionario ? cargoGrupo[funcionario.cargo] : 'admin'),
    [funcionario],
  );

  return (
    <>
      <Modal open={open} onClose={onClose} size="2xl">
        {!funcionarioId ? null : funcionarioQ.isLoading ? (
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
        ) : !funcionario ? (
          <EmptyState
            icon={<UserCog className="w-6 h-6" strokeWidth={1.75} />}
            title="Funcionário não encontrado"
            description="Este funcionário pode ter sido removido."
          />
        ) : (
          <div className="space-y-5">
            {/* Cabeçalho */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <Avatar
                  photoKey={photoKeys.funcionario(funcionario.id)}
                  remoteSrc={funcionario.fotoUrl}
                  name={funcionario.nomeCompleto}
                  size="xl"
                  editable={false}
                  ring
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-bokka-ink tracking-tight">
                      {funcionario.nomeCompleto}
                    </h2>
                    <Badge tone={funcionario.ativo ? 'success' : 'neutral'} dot>
                      {funcionario.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-sm text-bokka-ink-3 mt-1 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" strokeWidth={2} />
                    {cargoLabel[funcionario.cargo]}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {[
                  {
                    icon: Mail,
                    label: 'E-mail',
                    href: funcionario.email ? `mailto:${funcionario.email}` : undefined,
                  },
                  {
                    icon: Phone,
                    label: 'Ligar',
                    href: funcionario.telefoneCelular
                      ? `tel:${funcionario.telefoneCelular}`
                      : undefined,
                  },
                  {
                    icon: MessageCircle,
                    label: 'WhatsApp',
                    href: funcionario.telefoneCelular
                      ? `https://wa.me/55${funcionario.telefoneCelular.replace(/\D/g, '')}`
                      : undefined,
                  },
                  {
                    icon: Smartphone,
                    label: 'SMS',
                    href: funcionario.telefoneCelular
                      ? `sms:${funcionario.telefoneCelular.replace(/\D/g, '')}`
                      : undefined,
                  },
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
                    <button
                      key={i}
                      type="button"
                      title={btn.label}
                      className={commonClass}
                      disabled
                    >
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

            {/* Trio de cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="bg-bokka-surface-2 border border-bokka-border rounded-2xl p-5">
                <h3 className="text-base font-semibold text-bokka-ink mb-4">
                  Informações básicas
                </h3>
                <ul className="space-y-4">
                  <BasicRow
                    icon={<UserIcon className="w-4 h-4" strokeWidth={1.75} />}
                    label="Sexo"
                    value={
                      funcionario.sexo === 'FEMININO'
                        ? 'Feminino'
                        : funcionario.sexo === 'MASCULINO'
                          ? 'Masculino'
                          : 'Outro'
                    }
                  />
                  <BasicRow
                    icon={<IdCard className="w-4 h-4" strokeWidth={1.75} />}
                    label="CPF"
                    value={formatCpf(funcionario.cpf)}
                  />
                  <BasicRow
                    icon={<Phone className="w-4 h-4" strokeWidth={1.75} />}
                    label="Celular"
                    value={formatPhone(funcionario.telefoneCelular) || '—'}
                  />
                  <BasicRow
                    icon={<Mail className="w-4 h-4" strokeWidth={1.75} />}
                    label="E-mail"
                    value={funcionario.email || '—'}
                  />
                  <BasicRow
                    icon={<MapPin className="w-4 h-4" strokeWidth={1.75} />}
                    label="Endereço"
                    value={
                      enderecoLinha || enderecoLinha2 ? (
                        <>
                          <div>{enderecoLinha || '—'}</div>
                          {enderecoLinha2 && (
                            <div className="text-bokka-ink-2 text-xs">{enderecoLinha2}</div>
                          )}
                        </>
                      ) : (
                        '—'
                      )
                    }
                  />
                  <BasicRow
                    icon={<ShieldCheck className="w-4 h-4" strokeWidth={1.75} />}
                    label="Desde"
                    value={formatDate(funcionario.createdAt) || '—'}
                  />
                </ul>
              </div>

              <div className="bg-bokka-surface-2 border border-bokka-border rounded-2xl p-5">
                <h3 className="text-base font-semibold text-bokka-ink mb-4">
                  Contato rápido
                </h3>
                <ul className="space-y-3">
                  {funcionario.telefoneCelular && (
                    <ContactRow
                      icon={<Phone className="w-4 h-4" strokeWidth={1.75} />}
                      label="Ligar agora"
                      value={formatPhone(funcionario.telefoneCelular)}
                      href={`tel:${funcionario.telefoneCelular}`}
                    />
                  )}
                  {funcionario.telefoneCelular && (
                    <ContactRow
                      icon={<MessageCircle className="w-4 h-4" strokeWidth={1.75} />}
                      label="Abrir WhatsApp"
                      value={formatPhone(funcionario.telefoneCelular)}
                      href={`https://wa.me/55${funcionario.telefoneCelular.replace(/\D/g, '')}`}
                      external
                    />
                  )}
                  {funcionario.email && (
                    <ContactRow
                      icon={<Mail className="w-4 h-4" strokeWidth={1.75} />}
                      label="Enviar e-mail"
                      value={funcionario.email}
                      href={`mailto:${funcionario.email}`}
                    />
                  )}
                  {!funcionario.telefoneCelular && !funcionario.email && (
                    <p className="text-sm text-bokka-ink-3">
                      Nenhum canal de contato cadastrado.
                    </p>
                  )}
                </ul>
              </div>

              <div
                className="rounded-2xl p-5 text-white relative overflow-hidden md:col-span-2 xl:col-span-1"
                style={{ background: grupoGradient[grupo] }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider font-semibold text-white/70">
                      {grupoLabel[grupo]}
                    </p>
                    <p className="text-base font-bold mt-1 truncate">
                      {cargoLabel[funcionario.cargo]}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                </div>
                <p className="text-2xl font-bold tabular-nums tracking-wider mt-6">
                  {formatCpf(funcionario.cpf)}
                </p>
                <div className="flex justify-between items-end mt-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
                      Cadastrado em
                    </p>
                    <p className="text-sm font-semibold mt-0.5 tabular-nums">
                      {formatDate(funcionario.createdAt) || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
                      Status
                    </p>
                    <p className="text-sm font-semibold mt-0.5">
                      {funcionario.ativo ? 'Ativo' : 'Inativo'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Editar funcionário"
        subtitle="Atualize os dados do colaborador."
        size="xl"
      >
        {funcionario && (
          <FuncionarioForm
            initial={funcionario}
            photoKey={photoKeys.funcionario(funcionarioId!)}
            onCancel={() => setEditing(false)}
            onSubmit={handleSubmit}
          />
        )}
      </Modal>
    </>
  );
};

const BasicRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
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

const ContactRow = ({
  icon,
  label,
  value,
  href,
  external,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) => (
  <li>
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className="flex items-center gap-3 rounded-xl p-3 border border-bokka-border bg-bokka-surface hover:border-bokka-primary hover:bg-bokka-primary-soft/50 transition-colors group"
    >
      <span className="w-9 h-9 rounded-lg bg-bokka-primary-soft text-bokka-primary flex items-center justify-center shrink-0 group-hover:bg-bokka-primary group-hover:text-white transition-colors">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase font-semibold text-bokka-ink-3 tracking-wider">
          {label}
        </p>
        <p className="text-sm font-semibold text-bokka-ink truncate mt-0.5">{value}</p>
      </div>
    </a>
  </li>
);
