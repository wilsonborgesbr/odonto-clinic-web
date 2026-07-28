import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
};

const iconClass = 'w-5 h-5 shrink-0';

const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/pacientes',
    label: 'Pacientes',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <path d="M16 10.5a3 3 0 1 0 0-6" />
        <path d="M17.5 20a5.5 5.5 0 0 1 4-5.3" />
      </svg>
    ),
  },
  {
    to: '/agenda',
    label: 'Agenda',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18" />
        <path d="M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    to: '/dentistas',
    label: 'Dentistas',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M8 3c-2.5 0-4 1.8-4 4 0 2 .5 3.5 1 5 .6 1.6 1 3 1 5 0 1.3.8 2 1.5 2 .7 0 1.2-.6 1.5-2l.7-3c.2-1 .5-1.5 1.3-1.5s1.1.5 1.3 1.5l.7 3c.3 1.4.8 2 1.5 2 .7 0 1.5-.7 1.5-2 0-2 .4-3.4 1-5 .5-1.5 1-3 1-5 0-2.2-1.5-4-4-4-1.5 0-2.3.8-3 .8s-1.5-.8-3-.8Z" />
      </svg>
    ),
  },
  {
    to: '/funcionarios',
    label: 'Funcionários',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M17 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: '/financeiro',
    label: 'Financeiro',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M12 2v20" />
        <path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    to: '/estoque',
    label: 'Estoque',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M21 8V21H3V8" />
        <path d="M1 3h22v5H1z" />
        <path d="M10 12h4" />
      </svg>
    ),
  },
  {
    to: '/convenios',
    label: 'Convênios',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
      </svg>
    ),
  },
  {
    to: '/documentos',
    label: 'Documentos',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M9 13h6M9 17h6" />
      </svg>
    ),
  },
  {
    to: '/anamnese',
    label: 'Anamnese',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M9 12h6M9 16h6" />
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-5-5Z" />
        <path d="M15 2v5h5" />
      </svg>
    ),
  },
  {
    to: '/odontograma',
    label: 'Odontograma',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
        <path d="M12 5.5c-1.5-1-3-1.5-4.5-1.5C5 4 3 5.5 3 8c0 3 2 5.5 3 7.5S8 20 9 20c.8 0 1.2-.5 1.5-1.5L12 14l1.5 4.5c.3 1 .7 1.5 1.5 1.5 1 0 1-1 3-4.5s3-4.5 3-7.5c0-2.5-2-4-4.5-4-1.5 0-3 .5-4.5 1.5Z" />
      </svg>
    ),
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-6 flex items-center border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold">
              O
            </div>
            <span className="font-semibold text-slate-800 tracking-tight">
              OdontoClinic
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-sky-50 text-sky-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-6 py-4 border-t border-slate-200 text-xs text-slate-400">
          v0.1 · Sistema Clínico
        </div>
      </aside>
    </>
  );
};
