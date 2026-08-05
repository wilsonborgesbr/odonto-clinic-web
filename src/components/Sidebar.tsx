import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  ClipboardList,
  ShieldCheck,
  UserCog,
  Package,
  KeyRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BokkaMark } from './BokkaMark';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import type { PermissaoEnum } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  permissao: PermissaoEnum;
  end?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const groups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { to: '/', label: 'Início', icon: LayoutDashboard, permissao: 'DASHBOARD', end: true },
    ],
  },
  {
    label: 'Clínico',
    items: [
      { to: '/pacientes', label: 'Pacientes', icon: Users, permissao: 'PACIENTES' },
      { to: '/dentistas', label: 'Dentistas', icon: Stethoscope, permissao: 'DENTISTAS' },
      { to: '/agenda', label: 'Agendamentos', icon: CalendarDays, permissao: 'AGENDAMENTOS' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { to: '/financeiro/auditoria', label: 'Auditoria', icon: ClipboardList, permissao: 'AUDITORIA_FINANCEIRA' },
    ],
  },
  {
    label: 'Administrativo',
    items: [
      { to: '/funcionarios', label: 'Funcionários', icon: UserCog, permissao: 'FUNCIONARIOS' },
      { to: '/estoque', label: 'Estoque', icon: Package, permissao: 'ESTOQUE' },
      { to: '/convenios', label: 'Convênios', icon: ShieldCheck, permissao: 'CONVENIOS' },
      { to: '/usuarios', label: 'Usuários & Permissões', icon: KeyRound, permissao: 'USUARIOS_E_PERMISSOES' },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { hasPermissao } = useAuth();

  // Filtra items por permissão; grupos sem items visíveis são omitidos.
  const visibleGroups = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => hasPermissao(i.permissao)) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-bokka-ink/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[248px] bg-bokka-surface border-r border-bokka-border flex flex-col',
          'transform transition-transform duration-200 ease-out lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="h-16 px-5 flex items-center border-b border-bokka-border shrink-0">
          <BokkaMark size={32} withWordmark />
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {visibleGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-bokka-ink-3">
                {group.label}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                            isActive
                              ? 'bg-bokka-ink text-white shadow-sm'
                              : 'text-bokka-ink-2 hover:bg-bokka-surface-3 hover:text-bokka-ink',
                          )
                        }
                      >
                        <Icon
                          strokeWidth={1.75}
                          className="w-[18px] h-[18px] shrink-0"
                          aria-hidden="true"
                        />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};
