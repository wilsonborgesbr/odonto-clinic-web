import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Users, ClipboardList, Package, MoreHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import type { PermissaoEnum, RoleEnum } from '../types';

interface BottomNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  permissao: PermissaoEnum;
}

const ITEM_INICIO: BottomNavItem = { to: '/', label: 'Início', icon: LayoutDashboard, permissao: 'DASHBOARD' };
const ITEM_AGENDA: BottomNavItem = { to: '/agenda', label: 'Agenda', icon: CalendarDays, permissao: 'AGENDAMENTOS' };
const ITEM_PACIENTES: BottomNavItem = { to: '/pacientes', label: 'Pacientes', icon: Users, permissao: 'PACIENTES' };
const ITEM_FINANCEIRO: BottomNavItem = { to: '/financeiro/auditoria', label: 'Financeiro', icon: ClipboardList, permissao: 'AUDITORIA_FINANCEIRA' };
const ITEM_ESTOQUE: BottomNavItem = { to: '/estoque', label: 'Estoque', icon: Package, permissao: 'ESTOQUE' };

// Composição por role — espelha a tabela da seção 2 da MOBILE-SPEC-2.
// Fica sempre atrás de hasPermissao, então uma permissão customizada nunca mostra um item indevido.
const candidatesByRole: Record<RoleEnum, BottomNavItem[]> = {
  PROPRIETARIO: [ITEM_INICIO, ITEM_AGENDA, ITEM_PACIENTES, ITEM_FINANCEIRO],
  SOCIO: [ITEM_INICIO, ITEM_AGENDA, ITEM_PACIENTES, ITEM_FINANCEIRO],
  ADMINISTRADOR: [ITEM_INICIO, ITEM_AGENDA, ITEM_PACIENTES, ITEM_FINANCEIRO],
  DENTISTA: [ITEM_INICIO, ITEM_AGENDA, ITEM_PACIENTES],
  RECEPCIONISTA: [ITEM_INICIO, ITEM_AGENDA, ITEM_PACIENTES],
  FINANCEIRO: [ITEM_INICIO, ITEM_FINANCEIRO],
  ESTOQUISTA: [ITEM_INICIO, ITEM_ESTOQUE],
  AUXILIAR_CLINICO: [ITEM_INICIO, ITEM_AGENDA],
};

// Mesmo universo de módulos do Sidebar — usado só pra contar quantos módulos o
// usuário enxerga, pra decidir se vale mostrar a bottom nav (regra: > 3 módulos).
const modulosSidebar: PermissaoEnum[] = [
  'DASHBOARD', 'PACIENTES', 'DENTISTAS', 'AGENDAMENTOS', 'AUDITORIA_FINANCEIRA',
  'FUNCIONARIOS', 'ESTOQUE', 'CONVENIOS', 'USUARIOS_E_PERMISSOES',
];

interface BottomNavProps {
  onOpenMore: () => void;
}

export const BottomNav = ({ onOpenMore }: BottomNavProps) => {
  const { user, hasPermissao } = useAuth();

  const totalModulos = modulosSidebar.filter(hasPermissao).length;
  const role = user?.role ?? 'DENTISTA';
  const items = (candidatesByRole[role] ?? []).filter((i) => hasPermissao(i.permissao));

  if (totalModulos <= 3 || items.length === 0) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-bokka-surface border-t border-bokka-border pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegação principal"
    >
      <div
        className="h-14 grid"
        style={{ gridTemplateColumns: `repeat(${items.length + 1}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
                  isActive ? 'text-bokka-primary' : 'text-bokka-ink-3',
                )
              }
            >
              <Icon className="w-5 h-5" strokeWidth={1.75} />
              {item.label}
            </NavLink>
          );
        })}
        <button
          type="button"
          onClick={onOpenMore}
          className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-bokka-ink-3 hover:text-bokka-ink transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" strokeWidth={1.75} />
          Mais
        </button>
      </div>
    </nav>
  );
};
