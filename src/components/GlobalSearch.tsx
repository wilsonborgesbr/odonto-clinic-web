import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  User,
  Stethoscope,
  UserCog,
  CalendarDays,
  X,
} from 'lucide-react';
import { usePacientes } from '../services/pacienteService';
import { useDentistas } from '../services/dentistaService';
import { useFuncionarios } from '../services/funcionarioService';
import { useAgendamentos } from '../services/agendamentoService';
import { cn } from '../lib/utils';

type SearchResult = {
  id: string;
  tipo: 'paciente' | 'dentista' | 'funcionario' | 'agendamento';
  titulo: string;
  subtitulo: string;
  to: string;
};

const norm = (s: string | undefined | null) =>
  (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const tipoStyle: Record<SearchResult['tipo'], { icon: React.ElementType; group: string; tone: string }> = {
  paciente: { icon: User, group: 'Pacientes', tone: 'bg-bokka-primary-soft text-bokka-primary' },
  dentista: { icon: Stethoscope, group: 'Dentistas', tone: 'bg-bokka-success-soft text-bokka-success-ink' },
  funcionario: { icon: UserCog, group: 'Funcionários', tone: 'bg-bokka-warning-soft text-bokka-warning-ink' },
  agendamento: { icon: CalendarDays, group: 'Agendamentos', tone: 'bg-bokka-primary-soft text-bokka-primary' },
};

const groupOrder: SearchResult['tipo'][] = ['paciente', 'dentista', 'funcionario', 'agendamento'];

export const GlobalSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Data — fetched once with large page sizes, cached by react-query
  const pacientesQ = usePacientes({ pagina: 0, tamanho: 500, ordem: 'nomeCompleto' });
  const dentistasQ = useDentistas({ pagina: 0, tamanho: 200 });
  const funcionariosQ = useFuncionarios({ pagina: 0, tamanho: 200 });
  const agendamentosQ = useAgendamentos({ pagina: 0, tamanho: 300, ordem: 'dataHoraInicio' });

  const pacienteMap = useMemo(() => {
    const m = new Map<string, string>();
    (pacientesQ.data?.content ?? []).forEach((p) => m.set(p.id, p.nomeCompleto));
    return m;
  }, [pacientesQ.data]);

  const results = useMemo<SearchResult[]>(() => {
    const q = norm(query.trim());
    if (q.length < 2) return [];
    const out: SearchResult[] = [];

    (pacientesQ.data?.content ?? []).forEach((p) => {
      if (norm(p.nomeCompleto).includes(q) || norm(p.cpf).includes(q) || norm(p.email).includes(q)) {
        out.push({
          id: p.id,
          tipo: 'paciente',
          titulo: p.nomeCompleto,
          subtitulo: p.cpf || p.email || '—',
          to: `/pacientes/${p.id}`,
        });
      }
    });

    (dentistasQ.data?.content ?? []).forEach((d) => {
      if (norm(d.nomeCompleto).includes(q) || norm(d.cro).includes(q) || norm(d.email).includes(q)) {
        out.push({
          id: d.id,
          tipo: 'dentista',
          titulo: d.nomeCompleto,
          subtitulo: d.cro ? `CRO ${d.cro}` : d.email || '—',
          to: `/dentistas`,
        });
      }
    });

    (funcionariosQ.data?.content ?? []).forEach((f) => {
      if (norm(f.nomeCompleto).includes(q) || norm(f.cpf).includes(q) || norm(f.email).includes(q)) {
        out.push({
          id: f.id,
          tipo: 'funcionario',
          titulo: f.nomeCompleto,
          subtitulo: f.cargo?.replace(/_/g, ' ').toLowerCase() || '—',
          to: `/funcionarios`,
        });
      }
    });

    (agendamentosQ.data?.content ?? []).forEach((a) => {
      const nomePaciente = a.pacienteId ? pacienteMap.get(a.pacienteId) ?? '' : '';
      if (norm(nomePaciente).includes(q) || norm(a.observacoes).includes(q)) {
        const data = a.dataHoraInicio
          ? new Date(a.dataHoraInicio).toLocaleString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '—';
        out.push({
          id: a.id ?? '',
          tipo: 'agendamento',
          titulo: nomePaciente || a.observacoes || 'Agendamento',
          subtitulo: data,
          to: `/agenda`,
        });
      }
    });

    return out.slice(0, 20);
  }, [query, pacientesQ.data, dentistasQ.data, funcionariosQ.data, agendamentosQ.data, pacienteMap]);

  const groupedResults = useMemo(() => {
    const map = new Map<SearchResult['tipo'], SearchResult[]>();
    groupOrder.forEach((k) => map.set(k, []));
    results.forEach((r) => map.get(r.tipo)?.push(r));
    return groupOrder
      .filter((k) => (map.get(k)?.length ?? 0) > 0)
      .map((k) => ({ tipo: k, items: map.get(k)! }));
  }, [results]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const commit = (r: SearchResult) => {
    navigate(r.to);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = results[activeIndex];
      if (chosen) commit(chosen);
    }
  };

  const showDropdown = open && query.trim().length >= 2;
  const hasResults = groupedResults.length > 0;
  const loading =
    pacientesQ.isLoading || dentistasQ.isLoading || funcionariosQ.isLoading || agendamentosQ.isLoading;

  let flatIndex = -1;

  return (
    <div ref={wrapperRef} className="relative hidden md:block w-64 lg:w-80">
      <div
        className={cn(
          'flex items-center bg-bokka-surface-2 border border-bokka-border rounded-full px-4 h-10 gap-2 transition-colors',
          showDropdown && 'border-bokka-primary-ring bg-bokka-surface',
          !showDropdown && 'focus-within:border-bokka-primary-ring focus-within:bg-bokka-surface',
        )}
      >
        <Search className="w-4 h-4 text-bokka-ink-3 shrink-0" strokeWidth={2} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Buscar pacientes, agendamentos..."
          className="bg-transparent border-0 outline-none text-sm text-bokka-ink placeholder:text-bokka-ink-3 flex-1 min-w-0"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="w-5 h-5 rounded-full flex items-center justify-center text-bokka-ink-3 hover:bg-bokka-surface-3 hover:text-bokka-ink shrink-0"
            aria-label="Limpar"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-2 right-0 w-[420px] max-w-[calc(100vw-2rem)] bg-bokka-surface border border-bokka-border rounded-2xl shadow-md overflow-hidden z-30">
          {loading && !hasResults ? (
            <div className="p-6 text-center text-sm text-bokka-ink-3">
              Carregando dados…
            </div>
          ) : !hasResults ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-bokka-surface-3 text-bokka-ink-3 flex items-center justify-center mx-auto mb-3">
                <Search className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <p className="text-sm font-semibold text-bokka-ink">
                Nada encontrado para "{query.trim()}"
              </p>
              <p className="text-xs text-bokka-ink-3 mt-1">
                Tente por nome, CPF, CRO ou e-mail.
              </p>
            </div>
          ) : (
            <div className="max-h-[480px] overflow-y-auto py-1.5">
              {groupedResults.map((group) => {
                const style = tipoStyle[group.tipo];
                return (
                  <div key={group.tipo} className="pb-1.5">
                    <div className="px-4 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-bokka-ink-3">
                      {style.group} · {group.items.length}
                    </div>
                    {group.items.map((r) => {
                      flatIndex += 1;
                      const isActive = flatIndex === activeIndex;
                      const Icon = style.icon;
                      return (
                        <button
                          key={`${r.tipo}-${r.id}`}
                          type="button"
                          onMouseEnter={() => setActiveIndex(flatIndex)}
                          onClick={() => commit(r)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                            isActive ? 'bg-bokka-surface-3' : 'hover:bg-bokka-surface-3/60',
                          )}
                        >
                          <span
                            className={cn(
                              'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                              style.tone,
                            )}
                          >
                            <Icon className="w-4 h-4" strokeWidth={1.75} />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-bokka-ink truncate">
                              {r.titulo}
                            </p>
                            <p className="text-[11px] text-bokka-ink-3 truncate capitalize">
                              {r.subtitulo}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
              <div className="border-t border-bokka-border px-4 py-2 text-[10px] text-bokka-ink-3 flex items-center justify-between">
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-bokka-surface-3 font-semibold">↑↓</kbd> navegar ·{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-bokka-surface-3 font-semibold">↵</kbd> abrir
                </span>
                <span className="tabular-nums">{results.length} resultado{results.length === 1 ? '' : 's'}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
