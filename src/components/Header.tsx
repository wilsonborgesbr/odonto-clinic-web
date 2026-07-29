import { Fragment, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu as MenuIcon, Search, Bell, User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '../context/AuthContext';
import { formatDateLong } from '../lib/utils';
import { Avatar } from './ui/Avatar';
import { photoKeys } from '../lib/profilePhotos';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const pageTitles: Record<string, string> = {
  '/': 'Início',
  '/perfil': 'Meu perfil',
  '/pacientes': 'Pacientes',
  '/dentistas': 'Dentistas',
  '/agenda': 'Agendamentos',
  '/procedimentos': 'Procedimentos',
  '/anamnese': 'Anamnese',
  '/odontograma': 'Odontograma',
  '/contas-receber': 'Contas a Receber',
  '/contas-pagar': 'Contas a Pagar',
  '/convenios': 'Convênios',
  '/funcionarios': 'Funcionários',
  '/estoque': 'Estoque',
  '/documentos': 'Documentos',
};

const resolveTitle = (pathname: string): string => {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    const base = `/${segments[0]}`;
    return pageTitles[base] ?? 'Bokka';
  }
  return 'Bokka';
};

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const title = resolveTitle(location.pathname);
  const dateStr = formatDateLong(new Date());
  const photoKey = useMemo(() => photoKeys.user(user?.email), [user?.email]);

  return (
    <header className="h-16 bg-bokka-surface/85 backdrop-blur border-b border-bokka-border sticky top-0 z-20 shrink-0">
      <div className="h-full px-4 lg:px-8 flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 -ml-2 rounded-md text-bokka-ink-2 hover:bg-bokka-surface-3"
          aria-label="Abrir menu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-bokka-ink truncate">{title}</h1>
          <p className="text-xs text-bokka-ink-3 capitalize hidden sm:block">{dateStr}</p>
        </div>

        <div className="hidden md:flex items-center bg-bokka-surface-2 border border-bokka-border rounded-full px-4 h-10 gap-2 w-64 lg:w-80 focus-within:border-bokka-primary-ring focus-within:bg-bokka-surface transition-colors">
          <Search className="w-4 h-4 text-bokka-ink-3 shrink-0" strokeWidth={2} />
          <input
            type="text"
            placeholder="Buscar pacientes, agendamentos..."
            className="bg-transparent border-0 outline-none text-sm text-bokka-ink placeholder:text-bokka-ink-3 flex-1 min-w-0"
          />
        </div>

        <button
          type="button"
          aria-label="Notificações"
          className="relative w-10 h-10 rounded-full bg-bokka-surface border border-bokka-border hover:bg-bokka-surface-3 text-bokka-ink-2 flex items-center justify-center"
        >
          <Bell className="w-4 h-4" strokeWidth={2} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-bokka-danger ring-2 ring-bokka-surface" />
        </button>

        {/* Menu do perfil */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-2 bg-bokka-surface border border-bokka-border rounded-full pl-1 pr-3 py-1 hover:shadow-sm transition-shadow">
            <Avatar photoKey={photoKey} name={user?.name || user?.email} size="sm" />
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-semibold text-bokka-ink max-w-[140px] truncate">
                {user?.name?.split(' ').slice(0, 2).join(' ') || 'Usuária'}
              </div>
              <div className="text-[10px] text-bokka-ink-3">Proprietária</div>
            </div>
            <ChevronDown className="w-4 h-4 text-bokka-ink-3 hidden sm:block" strokeWidth={2} />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl bg-bokka-surface border border-bokka-border shadow-md focus:outline-none overflow-hidden">
              <div className="p-4 flex items-center gap-3 border-b border-bokka-border bg-bokka-surface-2">
                <Avatar
                  photoKey={photoKey}
                  name={user?.name || user?.email}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-bokka-ink truncate">
                    {user?.name || 'Usuária'}
                  </div>
                  <div className="text-xs text-bokka-ink-3 truncate">{user?.email}</div>
                </div>
              </div>
              <div className="p-1.5">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/perfil"
                      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                        active
                          ? 'bg-bokka-primary-soft text-bokka-primary'
                          : 'text-bokka-ink-2'
                      }`}
                    >
                      <UserIcon className="w-4 h-4" strokeWidth={1.75} /> Meu perfil
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        navigate('/login', { replace: true });
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                        active
                          ? 'bg-bokka-danger-soft text-bokka-danger-ink'
                          : 'text-bokka-ink-2'
                      }`}
                    >
                      <LogOut className="w-4 h-4" strokeWidth={1.75} /> Sair
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  );
};
