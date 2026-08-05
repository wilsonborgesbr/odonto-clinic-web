import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatCpf = (cpf?: string | null): string => {
  if (!cpf) return '—';
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

export const formatPhone = (phone?: string | null): string => {
  if (!phone) return '—';
  const d = phone.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export const formatCurrency = (value?: number | null): string => {
  if (value == null || Number.isNaN(value)) return 'R$ 0,00';
  return currencyFormatter.format(value);
};

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const dateLongFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
});

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return dateFormatter.format(d);
};

export const formatDateLong = (iso?: string | Date | null): string => {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  return dateLongFormatter.format(d);
};

export const formatTime = (iso?: string | null): string => {
  if (!iso) return '--:--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return timeFormatter.format(d);
};

export const formatDateTime = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${dateFormatter.format(d)} ${timeFormatter.format(d)}`;
};

export const isSameDay = (isoDate: string | Date | undefined, ref: Date): boolean => {
  if (!isoDate) return false;
  const d = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
};

export const getGreeting = (now = new Date()): string => {
  const h = now.getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

export const initials = (name?: string | null): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Backend Endereco tem @NotBlank em cep/logradouro/bairro/cidade/estado com @Valid no owner.
 * Se qualquer required estiver vazio, o payload precisa vir sem o campo endereco (que é opcional
 * como um todo). Esta helper devolve o objeto sem endereco quando incompleto.
 */
export const sanitizeEnderecoPayload = <T extends { endereco?: unknown }>(values: T): T => {
  const end = values.endereco as
    | { cep?: string; logradouro?: string; bairro?: string; cidade?: string; estado?: string }
    | null
    | undefined;
  const incompleto =
    !end ||
    !end.cep?.trim() ||
    !end.logradouro?.trim() ||
    !end.bairro?.trim() ||
    !end.cidade?.trim() ||
    !end.estado?.trim();
  if (!incompleto) return values;
  const { endereco: _skip, ...rest } = values as { endereco?: unknown } & Record<string, unknown>;
  void _skip;
  return rest as T;
};
