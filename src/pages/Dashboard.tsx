import { useEffect, useState } from 'react';
import { fetchApi } from '../services/api';
import type {
  Agendamento,
  Estoque,
  PacienteListagemDTO,
  PageResponse,
} from '../types';

type CardProps = {
  title: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'warning' | 'accent';
  icon: React.ReactNode;
  loading?: boolean;
};

const toneStyles: Record<NonNullable<CardProps['tone']>, string> = {
  default: 'bg-sky-50 text-sky-700',
  accent: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
};

const KpiCard = ({ title, value, hint, tone = 'default', icon, loading }: CardProps) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4">
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${toneStyles[tone]}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm text-slate-500 font-medium">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-800">
        {loading ? <span className="inline-block w-14 h-6 bg-slate-100 rounded animate-pulse" /> : value}
      </div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  </div>
);

const isSameDay = (isoDate: string | undefined, ref: Date): boolean => {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
};

const formatHour = (iso?: string) => {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [pacientesAtivos, setPacientesAtivos] = useState(0);
  const [agendamentosHoje, setAgendamentosHoje] = useState<Agendamento[]>([]);
  const [estoqueBaixo, setEstoqueBaixo] = useState<Estoque[]>([]);

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      setLoading(true);
      setErro(null);
      try {
        const hoje = new Date();

        const [pacientesResp, agendamentosResp, estoqueResp] = await Promise.all([
          fetchApi<PageResponse<PacienteListagemDTO>>('/api/pacientes?tamanho=200'),
          fetchApi<PageResponse<Agendamento>>('/api/agendamentos?tamanho=200'),
          fetchApi<Estoque[]>('/api/estoque/abaixo-minimo'),
        ]);

        if (!ativo) return;

        const ativos = pacientesResp.content.filter((p) => p.ativo).length;
        const doDia = agendamentosResp.content
          .filter((a) => isSameDay(a.dataHoraInicio, hoje))
          .sort((a, b) =>
            (a.dataHoraInicio || '').localeCompare(b.dataHoraInicio || ''),
          );

        setPacientesAtivos(ativos);
        setAgendamentosHoje(doDia);
        setEstoqueBaixo(estoqueResp);
      } catch (err) {
        if (!ativo) return;
        console.error('Erro ao carregar dashboard:', err);
        setErro('Não foi possível carregar os dados do dashboard.');
      } finally {
        if (ativo) setLoading(false);
      }
    };

    carregar();
    return () => {
      ativo = false;
    };
  }, []);

  const hojeFormatado = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 capitalize">{hojeFormatado}</p>
      </div>

      {erro && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          title="Pacientes ativos"
          value={pacientesAtivos}
          hint="Total de pacientes com cadastro ativo"
          tone="default"
          loading={loading}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
              <path d="M16 10.5a3 3 0 1 0 0-6" />
            </svg>
          }
        />
        <KpiCard
          title="Agendamentos de hoje"
          value={agendamentosHoje.length}
          hint="Consultas marcadas para o dia"
          tone="accent"
          loading={loading}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 10h18" />
              <path d="M8 3v4M16 3v4" />
            </svg>
          }
        />
        <KpiCard
          title="Estoque abaixo do mínimo"
          value={estoqueBaixo.length}
          hint={estoqueBaixo.length > 0 ? 'Itens que precisam de reposição' : 'Tudo em ordem'}
          tone={estoqueBaixo.length > 0 ? 'warning' : 'default'}
          loading={loading}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white border border-slate-200 rounded-xl">
          <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Agenda de hoje</h2>
            <span className="text-xs text-slate-400">{agendamentosHoje.length} consultas</span>
          </header>
          <div className="p-2">
            {loading ? (
              <ul className="p-3 space-y-2">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="h-12 rounded bg-slate-50 animate-pulse" />
                ))}
              </ul>
            ) : agendamentosHoje.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                Nenhum agendamento para hoje.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {agendamentosHoje.slice(0, 6).map((ag) => (
                  <li key={ag.id} className="px-3 py-3 flex items-center gap-3">
                    <div className="w-16 text-sm font-medium text-slate-700 tabular-nums">
                      {formatHour(ag.dataHoraInicio)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-800 truncate">
                        Paciente {ag.pacienteId?.slice(-6) || '—'}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        Dr(a). {ag.dentistaId?.slice(-6) || '—'}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {ag.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl">
          <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Estoque a repor</h2>
            <span className="text-xs text-slate-400">{estoqueBaixo.length} itens</span>
          </header>
          <div className="p-2">
            {loading ? (
              <ul className="p-3 space-y-2">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="h-12 rounded bg-slate-50 animate-pulse" />
                ))}
              </ul>
            ) : estoqueBaixo.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                Nenhum item abaixo do mínimo.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {estoqueBaixo.slice(0, 6).map((item) => (
                  <li key={item.id} className="px-3 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-800 truncate">
                        {item.nomeMaterial || 'Item sem nome'}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {item.categoria || 'sem categoria'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-amber-700 tabular-nums">
                        {item.quantidadeAtual ?? 0} {item.unidadeMedida || ''}
                      </div>
                      <div className="text-xs text-slate-400">
                        mín. {item.quantidadeMinima ?? 0}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
