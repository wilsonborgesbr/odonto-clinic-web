import { useEffect, useState } from 'react';
import {
  Settings,
  Bell,
  Palette,
  Webhook,
  Calendar,
  Wallet,
  CreditCard,
  Building2,
  Link2,
  Info,
  ArrowUpRight,
  Check,
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Field';
import { bokkaToast } from '../components/ui/Toast';
import { cn } from '../lib/utils';

type Prefs = {
  notifyPagamentos: boolean;
  notifyAgendamentos: boolean;
  notifyEstoqueBaixo: boolean;
  notifyDespesas: boolean;
  compactDensity: boolean;
  weekStartMonday: boolean;
};

const DEFAULTS: Prefs = {
  notifyPagamentos: true,
  notifyAgendamentos: true,
  notifyEstoqueBaixo: true,
  notifyDespesas: true,
  compactDensity: false,
  weekStartMonday: true,
};

const PREFS_KEY = 'bokka:preferences';
const WEBHOOKS_KEY = 'bokka:webhooks';

type Webhooks = {
  googleCalendarUrl: string;
  asaasApiKey: string;
  infinityPayApiKey: string;
  genericWebhookUrl: string;
};

const EMPTY_WEBHOOKS: Webhooks = {
  googleCalendarUrl: '',
  asaasApiKey: '',
  infinityPayApiKey: '',
  genericWebhookUrl: '',
};

const readPrefs = (): Prefs => {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return DEFAULTS;
  }
};

const readWebhooks = (): Webhooks => {
  try {
    const raw = localStorage.getItem(WEBHOOKS_KEY);
    if (!raw) return EMPTY_WEBHOOKS;
    return { ...EMPTY_WEBHOOKS, ...(JSON.parse(raw) as Partial<Webhooks>) };
  } catch {
    return EMPTY_WEBHOOKS;
  }
};

export const Configuracoes = () => {
  const [prefs, setPrefs] = useState<Prefs>(readPrefs);
  const [webhooks, setWebhooks] = useState<Webhooks>(readWebhooks);

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const salvarWebhooks = () => {
    localStorage.setItem(WEBHOOKS_KEY, JSON.stringify(webhooks));
    bokkaToast.success('Configurações de integração salvas localmente.');
  };

  const togglePref = <K extends keyof Prefs>(k: K) =>
    setPrefs((prev) => ({ ...prev, [k]: !prev[k] }));

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-bokka-ink tracking-tight">Configurações</h1>
        <p className="text-sm text-bokka-ink-3 mt-1">
          Personalize o comportamento do sistema e conecte a Bokka com serviços externos.
        </p>
      </div>

      {/* ============ Notificações ============ */}
      <Card>
        <CardHeader
          title="Notificações"
          subtitle="Escolha o que aparece no sino da barra superior."
        />
        <ul className="divide-y divide-bokka-border -mx-5 -my-1">
          <ToggleRow
            icon={<Wallet className="w-4 h-4" strokeWidth={1.75} />}
            title="Pagamentos recebidos"
            description="Cobranças quitadas por pacientes."
            enabled={prefs.notifyPagamentos}
            onToggle={() => togglePref('notifyPagamentos')}
          />
          <ToggleRow
            icon={<Calendar className="w-4 h-4" strokeWidth={1.75} />}
            title="Novos agendamentos"
            description="Consultas criadas ou alteradas."
            enabled={prefs.notifyAgendamentos}
            onToggle={() => togglePref('notifyAgendamentos')}
          />
          <ToggleRow
            icon={<Bell className="w-4 h-4" strokeWidth={1.75} />}
            title="Estoque baixo"
            description="Itens abaixo do mínimo cadastrado."
            enabled={prefs.notifyEstoqueBaixo}
            onToggle={() => togglePref('notifyEstoqueBaixo')}
          />
          <ToggleRow
            icon={<CreditCard className="w-4 h-4" strokeWidth={1.75} />}
            title="Despesas próximas do vencimento"
            description="Contas a pagar com vencimento em até 7 dias."
            enabled={prefs.notifyDespesas}
            onToggle={() => togglePref('notifyDespesas')}
          />
        </ul>
      </Card>

      {/* ============ Aparência ============ */}
      <Card>
        <CardHeader
          title="Aparência e comportamento"
          subtitle="Ajustes visuais e de fluxo aplicados na sua sessão."
        />
        <ul className="divide-y divide-bokka-border -mx-5 -my-1">
          <ToggleRow
            icon={<Palette className="w-4 h-4" strokeWidth={1.75} />}
            title="Densidade compacta"
            description="Reduz espaçamentos em tabelas e listas — ainda em preparação."
            enabled={prefs.compactDensity}
            onToggle={() => togglePref('compactDensity')}
          />
          <ToggleRow
            icon={<Calendar className="w-4 h-4" strokeWidth={1.75} />}
            title="Semana começa na segunda"
            description="Calendários mostram segunda como primeiro dia."
            enabled={prefs.weekStartMonday}
            onToggle={() => togglePref('weekStartMonday')}
          />
        </ul>
      </Card>

      {/* ============ Integrações / Webhooks ============ */}
      <Card>
        <CardHeader
          title="Integrações & Webhooks"
          subtitle="Conecte a Bokka a serviços externos. Chaves ficam apenas no seu navegador até a integração ser ativada."
          action={
            <Button size="sm" onClick={salvarWebhooks}>
              Salvar
            </Button>
          }
        />

        <div className="bg-bokka-primary-soft/60 border border-bokka-primary/15 rounded-xl p-4 mb-5 flex gap-3">
          <span className="w-8 h-8 rounded-lg bg-bokka-primary text-white flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" strokeWidth={2} />
          </span>
          <div className="text-sm text-bokka-ink-2 leading-relaxed">
            Essas conexões ainda não estão ativas — os campos ficam prontos para você guardar suas chaves.
            A ativação real acontece quando implementarmos o endpoint no backend (roadmap na próxima leva).
            Nada é enviado a servidores externos por enquanto.
          </div>
        </div>

        <div className="space-y-5">
          <IntegrationRow
            icon={<Calendar className="w-5 h-5" strokeWidth={1.75} />}
            title="Google Calendar"
            description="Sincroniza a agenda da clínica com o Google Calendar do proprietário."
            tag="Agenda"
            tone="primary"
            docsHref="https://developers.google.com/calendar/api/guides/overview"
          >
            <Input
              label="URL de webhook / autorização OAuth"
              placeholder="https://accounts.google.com/o/oauth2/v2/auth?..."
              value={webhooks.googleCalendarUrl}
              onChange={(e) =>
                setWebhooks((w) => ({ ...w, googleCalendarUrl: e.target.value }))
              }
              hint="No fluxo real, um botão 'Conectar' iniciará o OAuth e o token virá para o backend."
            />
          </IntegrationRow>

          <IntegrationRow
            icon={<Wallet className="w-5 h-5" strokeWidth={1.75} />}
            title="Asaas"
            description="Geração de cobranças (Pix, boleto, cartão) e conciliação automática das Contas a Receber."
            tag="Financeiro"
            tone="success"
            docsHref="https://docs.asaas.com/"
          >
            <Input
              label="API Key Asaas"
              type="password"
              placeholder="$aact_..."
              value={webhooks.asaasApiKey}
              onChange={(e) => setWebhooks((w) => ({ ...w, asaasApiKey: e.target.value }))}
              hint="Ambiente sandbox recomendado para testes. Endpoint: https://sandbox.asaas.com/api/v3"
            />
          </IntegrationRow>

          <IntegrationRow
            icon={<CreditCard className="w-5 h-5" strokeWidth={1.75} />}
            title="InfinitePay / Cielo LIO"
            description="Recebe eventos de vendas na maquininha e lança automaticamente na Auditoria."
            tag="Financeiro"
            tone="success"
            docsHref="https://developers.infinitepay.io/"
          >
            <Input
              label="Token da conta InfinitePay"
              type="password"
              placeholder="ipk_live_..."
              value={webhooks.infinityPayApiKey}
              onChange={(e) =>
                setWebhooks((w) => ({ ...w, infinityPayApiKey: e.target.value }))
              }
              hint="Também aceita eventos via webhook: POST /webhooks/infinity-pay (a implementar)."
            />
          </IntegrationRow>

          <IntegrationRow
            icon={<Webhook className="w-5 h-5" strokeWidth={1.75} />}
            title="Webhook genérico (n8n, Zapier, Make)"
            description="Recebe uma cópia de todos os eventos internos para orquestração externa."
            tag="Automação"
            tone="neutral"
            docsHref="https://webhook.site/"
          >
            <Input
              label="URL do webhook de saída"
              placeholder="https://hooks.example.com/bokka-events"
              value={webhooks.genericWebhookUrl}
              onChange={(e) =>
                setWebhooks((w) => ({ ...w, genericWebhookUrl: e.target.value }))
              }
              hint="Cada evento (pagamento, agendamento) enviará um POST JSON assinado com HMAC-SHA256."
            />
          </IntegrationRow>
        </div>
      </Card>

      {/* ============ Ambiente ============ */}
      <Card>
        <CardHeader
          title="Ambiente"
          subtitle="Informações da instalação atual do sistema."
        />
        <ul className="space-y-3 text-sm">
          <EnvRow
            icon={<Building2 className="w-4 h-4" strokeWidth={1.75} />}
            label="Consultório"
            value="Bokka · instância padrão"
          />
          <EnvRow
            icon={<Link2 className="w-4 h-4" strokeWidth={1.75} />}
            label="Backend"
            value={import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}
            mono
          />
          <EnvRow
            icon={<Settings className="w-4 h-4" strokeWidth={1.75} />}
            label="Versão do frontend"
            value="Bokka Web 0.1.0"
          />
        </ul>
      </Card>
    </div>
  );
};

// ============ Sub-components ============

const ToggleRow = ({
  icon,
  title,
  description,
  enabled,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) => (
  <li className="flex items-center gap-4 px-5 py-4">
    <span className="w-9 h-9 rounded-lg bg-bokka-primary-soft text-bokka-primary flex items-center justify-center shrink-0">
      {icon}
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-bokka-ink">{title}</p>
      <p className="text-xs text-bokka-ink-3 mt-0.5">{description}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={cn(
        'w-11 h-6 rounded-full relative transition-colors shrink-0',
        enabled ? 'bg-bokka-primary' : 'bg-bokka-border-strong',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
          enabled && 'translate-x-5',
        )}
      />
    </button>
  </li>
);

const IntegrationRow = ({
  icon,
  title,
  description,
  tag,
  tone,
  docsHref,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tag: string;
  tone: 'primary' | 'success' | 'neutral';
  docsHref: string;
  children: React.ReactNode;
}) => {
  const tagClass = {
    primary: 'bg-bokka-primary-soft text-bokka-primary',
    success: 'bg-bokka-success-soft text-bokka-success-ink',
    neutral: 'bg-bokka-surface-3 text-bokka-ink-2',
  }[tone];

  return (
    <div className="rounded-2xl border border-bokka-border bg-bokka-surface-2/60 p-5">
      <div className="flex items-start gap-4 mb-3">
        <span className="w-11 h-11 rounded-xl bg-bokka-surface border border-bokka-border text-bokka-primary flex items-center justify-center shrink-0">
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-bokka-ink">{title}</h3>
            <span className={cn('text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full', tagClass)}>
              {tag}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-bokka-warning-soft text-bokka-warning-ink">
              A ativar
            </span>
          </div>
          <p className="text-xs text-bokka-ink-3 mt-1">{description}</p>
        </div>
        <a
          href={docsHref}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-bokka-primary hover:text-bokka-primary-hover inline-flex items-center gap-1 shrink-0"
        >
          Docs
          <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
        </a>
      </div>
      {children}
    </div>
  );
};

const EnvRow = ({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <li className="flex items-center gap-3">
    <span className="w-8 h-8 rounded-lg bg-bokka-surface-3 text-bokka-ink-2 flex items-center justify-center shrink-0">
      {icon}
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] uppercase font-semibold text-bokka-ink-3 tracking-wider">
        {label}
      </p>
      <p
        className={cn(
          'text-sm font-semibold text-bokka-ink truncate mt-0.5',
          mono && 'font-mono text-xs',
        )}
      >
        {value}
      </p>
    </div>
    <span className="text-bokka-success shrink-0" title="Ativo">
      <Check className="w-4 h-4" strokeWidth={2} />
    </span>
  </li>
);
