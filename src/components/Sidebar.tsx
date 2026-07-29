import { Link, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarDays,
  Syringe,
  ClipboardList,
  Grid3X3,
  Wallet,
  Receipt,
  ShieldCheck,
  UserCog,
  Package,
  FileText,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BokkaMark } from './BokkaMark';
import { Avatar } from './ui/Avatar';
import { photoKeys } from '../lib/profilePhotos';
import { cn } from '../lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const groups: NavGroup[] = [
  {
    label: 'Principal',
    items: [{ to: '/', label: 'Início', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Clínico',
    items: [
      { to: '/pacientes', label: 'Pacientes', icon: Users },
      { to: '/dentistas', label: 'Dentistas', icon: Stethoscope },
      { to: '/agenda', label: 'Agendamentos', icon: CalendarDays },
      { to: '/procedimentos', label: 'Procedimentos', icon: Syringe },
      { to: '/anamnese', label: 'Anamnese', icon: ClipboardList },
      { to: '/odontograma', label: 'Odontograma', icon: Grid3X3 },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { to: '/contas-receber', label: 'Contas a Receber', icon: Wallet },
      { to: '/contas-pagar', label: 'Contas a Pagar', icon: Receipt },
      { to: '/convenios', label: 'Convênios', icon: ShieldCheck },
    ],
  },
  {
    label: 'Administrativo',
    items: [
      { to: '/funcionarios', label: 'Funcionários', icon: UserCog },
      { to: '/estoque', label: 'Estoque', icon: Package },
      { to: '/documentos', label: 'Documentos', icon: FileText },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user } = useAuth();
  const userPhotoKey = photoKeys.user(user?.email);

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
          {groups.map((group) => (
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

        <div className="border-t border-bokka-border p-3 shrink-0">
          <Link
            to="/perfil"
            onClick={onClose}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-bokka-surface-3 transition-colors group"
          >
            <Avatar photoKey={userPhotoKey} name={user?.name || user?.email} size="md" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-bokka-ink truncate">
                {user?.name || 'Dra. Tainah'}
              </div>
              <div className="text-xs text-bokka-ink-3 truncate">Meu perfil</div>
            </div>
            <ChevronRight className="w-4 h-4 text-bokka-ink-3 group-hover:text-bokka-ink" />
          </Link>
        </div>
      </aside>
    </>
  );
};
