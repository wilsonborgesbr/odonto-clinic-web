import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  Wallet,
  Calendar,
  Package,
  ArrowDownRight,
  UserPlus,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useContasReceber, useContasPagar } from '../services/financeiroService';
import { useAgendamentos } from '../services/agendamentoService';
import { useEstoque } from '../services/estoqueService';
import { usePacientes } from '../services/pacienteService';
import { cn, formatCurrency } from '../lib/utils';

// ============ Preferências (compartilhadas com a página Configurações) ============
const PREFS_KEY = 'bokka:preferences';
type Prefs = {
  notifyPagamentos: boolean;
  notifyAgendamentos: boolean;
  notifyEstoqueBaixo: boolean;
  notifyDespesas: boolean;
};
const DEFAULT_PREFS: Prefs = {
  notifyPagamentos: true,
  notifyAgendamentos: true,
  notifyEstoqueBaixo: true,
  notifyDespesas: true,
};

const readPrefs = (): Prefs => {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
};

// ============ Read-state ============
const LAST_SEEN_KEY = 'bokka:notifications:lastSeen';
const getLastSeen = (): number => {
  const raw = localStorage.getItem(LAST_SEEN_KEY);
  return raw ? parseInt(raw, 10) || 0 : 0;
};

// ============ Modelo ============
type NotifTipo = 'pagamento' | 'agendamento' | 'despesa' | 'estoque' | 'paciente' | 'procedimento';

type Notif = {
  id: string;
  tipo: NotifTipo;
  titulo: string;
  descricao: string;
  timestamp: number;
  href?: string;
};

const tipoStyle: Record<NotifTipo, { icon: React.ElementType; tone: string; label: string }> = {
  pagamento: {
    icon: Wallet,
    tone: 'bg-bokka-success-soft text-bokka-success-ink',
    label: 'Pagamento',
  },
  agendamento: {
    icon: Calendar,
    tone: 'bg-bokka-primary-soft text-bokka-primary',
    label: 'Agenda',
  },
  despesa: {
    icon: ArrowDownRight,
    tone: 'bg-bokka-danger-soft text-bokka-danger-ink',
    label: 'Despesa',
  },
  estoque: {
    icon: Package,
    tone: 'bg-bokka-warning-soft text-bokka-warning-ink',
    label: 'Estoque',
  },
  paciente: {
    icon: UserPlus,
    tone: 'bg-bokka-primary-soft text-bokka-primary',
    label: 'Paciente',
  },
  procedimento: {
    icon: Sparkles,
    tone: 'bg-bokka-primary-soft text-bokka-primary',
    label: 'Procedimento',
  },
};

const parseTs = (iso: string | undefined | null): number => {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
};

const relativeTime = (ts: number, now: number): string => {
  const diff = now - ts;
  if (diff < 0) {
    const abs = Math.abs(diff);
    if (abs < 60_000) return 'em segundos';
    if (abs < 3_600_000) return `em ${Math.round(abs / 60_000)} min`;
    if (abs < 86_400_000) return `em ${Math.round(abs / 3_600_000)} h`;
    return `em ${Math.round(abs / 86_400_000)} dias`;
  }
  if (diff < 60_000) return 'agora';
  if (diff < 3_600_000) return `há ${Math.round(diff / 60_000)} min`;
  if (diff < 86_400_000) return `há ${Math.round(diff / 3_600_000)} h`;
  if (diff < 7 * 86_400_000) return `há ${Math.round(diff / 86_400_000)} dias`;
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

// ============ Componente ============

export const NotificationsPanel = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<number>(() => getLastSeen());
  const wrapperRef = useRef<HTMLDivElement>(null);
  const now = useMemo(() => Date.now(), []);
  const prefs = useMemo(readPrefs, [open]);

  // Fetch todas as fontes (cache do react-query)
  const receberQ = useContasReceber();
  const pagarQ = useContasPagar();
  const agendamentosQ = useAgendamentos({ pagina: 0, tamanho: 200, ordem: 'dataHoraInicio' });
  const estoqueQ = useEstoque();
  const pacientesQ = usePacientes({ pagina: 0, tamanho: 100, ordem: 'nomeCompleto' });

  const notifs = useMemo<Notif[]>(() => {
    const out: Notif[] = [];

    if (prefs.notifyPagamentos) {
      (receberQ.data ?? [])
        .filter((c) => c.status === 'PAGO' && c.dataPagamento)
        .forEach((c) => {
          out.push({
            id: `pag-receber-${c.id}`,
            tipo: 'pagamento',
            titulo: `Pagamento recebido · ${formatCurrency(c.valorPago ?? c.valorTotal ?? 0)}`,
            descricao: c.descricao || 'Cobrança quitada por paciente',
            timestamp: parseTs(c.dataPagamento) || parseTs(c.updatedAt),
            href: '/financeiro/auditoria',
          });
        });
    }

    if (prefs.notifyAgendamentos) {
      (agendamentosQ.data?.content ?? [])
        .filter((a) => a.createdAt || a.dataHoraInicio)
        .forEach((a) => {
          const ts = parseTs(a.createdAt) || parseTs(a.dataHoraInicio);
          if (!ts) return;
          out.push({
            id: `ag-${a.id}`,
            tipo: 'agendamento',
            titulo: 'Novo agendamento',
            descricao: a.observacoes || 'Consulta agendada',
            timestamp: ts,
            href: '/agenda',
          });
        });
    }

    if (prefs.notifyDespesas) {
      (pagarQ.data ?? []).forEach((c) => {
        // Despesa paga
        if (c.status === 'PAGO' && c.dataPagamento) {
          out.push({
            id: `desp-paga-${c.id}`,
            tipo: 'despesa',
            titulo: `Despesa quitada · ${formatCurrency(c.valor ?? 0)}`,
            descricao: c.descricao || 'Saída registrada',
            timestamp: parseTs(c.dataPagamento) || parseTs(c.updatedAt),
            href: '/financeiro/auditoria',
          });
        }
        // Despesa próxima do vencimento (7 dias)
        if (c.status !== 'PAGO' && c.status !== 'CANCELADO' && c.dataVencimento) {
          const vencTs = parseTs(c.dataVencimento);
          const dias = (vencTs - now) / 86_400_000;
          if (dias >= -1 && dias <= 7) {
            out.push({
              id: `desp-vence-${c.id}`,
              tipo: 'despesa',
              titulo:
                dias < 0
                  ? 'Despesa vencida'
                  : dias < 1
                    ? 'Despesa vence hoje'
                    : `Despesa vence em ${Math.ceil(dias)} dias`,
              descricao: `${c.descricao || 'Conta a pagar'} · ${formatCurrency(c.valor ?? 0)}`,
              timestamp: vencTs,
              href: '/financeiro/auditoria',
            });
          }
        }
      });
    }

    if (prefs.notifyEstoqueBaixo) {
      (estoqueQ.data ?? [])
        .filter((e) => (e.quantidadeAtual ?? 0) <= (e.quantidadeMinima ?? 0))
        .forEach((e) => {
          const ts = parseTs(e.updatedAt) || parseTs(e.createdAt) || now;
          out.push({
            id: `est-${e.id}`,
            tipo: 'estoque',
            titulo: `Estoque baixo · ${e.nomeMaterial ?? 'material'}`,
            descricao: `${e.quantidadeAtual ?? 0} / ${e.quantidadeMinima ?? 0} ${e.unidadeMedida ?? ''} restantes`,
            timestamp: ts,
            href: '/estoque',
          });
        });
    }

    // Novos pacientes (últimos 14 dias) — não é "novidade organizacional" restrita, é evento clínico
    (pacientesQ.data?.content ?? [])
      .filter((p) => p.createdAt)
      .forEach((p) => {
        const ts = parseTs(p.createdAt);
        if (!ts || now - ts > 14 * 86_400_000) return;
        out.push({
          id: `pac-${p.id}`,
          tipo: 'paciente',
          titulo: 'Novo paciente cadastrado',
          descricao: p.nomeCompleto,
          timestamp: ts,
          href: `/pacientes/${p.id}`,
        });
      });

    return out.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  }, [receberQ.data, pagarQ.data, agendamentosQ.data, estoqueQ.data, pacientesQ.data, prefs, now]);

  const unreadCount = useMemo(
    () => notifs.filter((n) => n.timestamp > lastSeen).length,
    [notifs, lastSeen],
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openPanel = () => {
    setOpen(true);
  };

  const marcarTodasLidas = () => {
    const ts = Date.now();
    localStorage.setItem(LAST_SEEN_KEY, String(ts));
    setLastSeen(ts);
  };

  const commit = (n: Notif) => {
    if (n.href) navigate(n.href);
    setOpen(false);
  };

  const nothingEnabled =
    !prefs.notifyPagamentos &&
    !prefs.notifyAgendamentos &&
    !prefs.notifyDespesas &&
    !prefs.notifyEstoqueBaixo;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-label={`Notificações${unreadCount ? ` — ${unreadCount} não lidas` : ''}`}
        onClick={() => (open ? setOpen(false) : openPanel())}
        className={cn(
          'relative w-10 h-10 rounded-full border border-bokka-border flex items-center justify-center transition-colors',
          open
            ? 'bg-bokka-primary text-white border-bokka-primary'
            : 'bg-bokka-surface text-bokka-ink-2 hover:bg-bokka-surface-3',
        )}
      >
        <Bell className="w-4 h-4" strokeWidth={2} />
        {unreadCount > 0 && !open && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-bokka-danger text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-bokka-surface tabular-nums">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-bokka-surface border border-bokka-border rounded-2xl shadow-md overflow-hidden z-30">
          <div className="px-4 py-3 flex items-center justify-between border-b border-bokka-border bg-bokka-surface-2">
            <div>
              <p className="text-sm font-bold text-bokka-ink">Notificações</p>
              <p className="text-[11px] text-bokka-ink-3 mt-0.5">
                {unreadCount > 0
                  ? `${unreadCount} não ${unreadCount === 1 ? 'lida' : 'lidas'} · ${notifs.length} no total`
                  : `${notifs.length} ${notifs.length === 1 ? 'notificação' : 'notificações'}`}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={marcarTodasLidas}
                className="text-xs font-semibold text-bokka-primary hover:text-bokka-primary-hover inline-flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" strokeWidth={2} />
                Marcar todas lidas
              </button>
            )}
          </div>

          {nothingEnabled ? (
            <EmptyPanel
              icon={<BellOff className="w-6 h-6" strokeWidth={1.75} />}
              titulo="Notificações desativadas"
              descricao="Você desligou todos os tipos de notificação em Configurações."
              actionLabel="Abrir configurações"
              onAction={() => {
                navigate('/configuracoes');
                setOpen(false);
              }}
            />
          ) : notifs.length === 0 ? (
            <EmptyPanel
              icon={<Bell className="w-6 h-6" strokeWidth={1.75} />}
              titulo="Nada por enquanto"
              descricao="Assim que houver movimento — pagamento, agendamento, alerta de estoque — aparece aqui."
            />
          ) : (
            <ul className="max-h-[420px] overflow-y-auto divide-y divide-bokka-border">
              {notifs.map((n) => {
                const style = tipoStyle[n.tipo];
                const Icon = style.icon;
                const unread = n.timestamp > lastSeen;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => commit(n)}
                      className={cn(
                        'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
                        unread ? 'bg-bokka-primary-soft/30 hover:bg-bokka-primary-soft/60' : 'hover:bg-bokka-surface-3/60',
                      )}
                    >
                      <span
                        className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                          style.tone,
                        )}
                      >
                        <Icon className="w-4 h-4" strokeWidth={1.75} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-bokka-ink truncate flex-1">
                            {n.titulo}
                          </p>
                          {unread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-bokka-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-bokka-ink-3 mt-0.5 truncate">
                          {n.descricao}
                        </p>
                        <p className="text-[10px] text-bokka-ink-3 mt-1 inline-flex items-center gap-1 uppercase font-semibold tracking-wider">
                          <Clock className="w-3 h-3" strokeWidth={2} />
                          {relativeTime(n.timestamp, now)}
                          <span className="mx-1 text-bokka-border-strong">·</span>
                          <span>{style.label}</span>
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-bokka-border px-4 py-2 bg-bokka-surface-2">
            <button
              type="button"
              onClick={() => {
                navigate('/configuracoes');
                setOpen(false);
              }}
              className="text-[11px] font-semibold text-bokka-ink-3 hover:text-bokka-primary transition-colors"
            >
              Ajustar em Configurações →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyPanel = ({
  icon,
  titulo,
  descricao,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  titulo: string;
  descricao: string;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <div className="px-6 py-10 text-center">
    <div className="w-14 h-14 rounded-2xl bg-bokka-surface-3 text-bokka-ink-3 flex items-center justify-center mx-auto mb-3">
      {icon}
    </div>
    <p className="text-sm font-semibold text-bokka-ink">{titulo}</p>
    <p className="text-xs text-bokka-ink-3 mt-1 max-w-[280px] mx-auto">{descricao}</p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-4 text-xs font-semibold text-bokka-primary hover:text-bokka-primary-hover"
      >
        {actionLabel}
      </button>
    )}
  </div>
);
