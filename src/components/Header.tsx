import { Fragment, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu as MenuIcon, User as UserIcon, LogOut, ChevronDown, Settings } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui/Avatar';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsPanel } from './NotificationsPanel';
import { photoKeys } from '../lib/profilePhotos';
import type { RoleEnum } from '../types';

const roleLabel: Record<RoleEnum, string> = {
  PROPRIETARIO: 'Proprietário(a) — controle total',
  SOCIO: 'Sócio(a) — controle total',
  ADMINISTRADOR: 'Administrador(a)',
  DENTISTA: 'Dentista',
  RECEPCIONISTA: 'Recepcionista',
  FINANCEIRO: 'Financeiro',
  ESTOQUISTA: 'Estoquista',
  AUXILIAR_CLINICO: 'Auxiliar clínico (ASB/TSB)',
};

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header = ({ onToggleSidebar }: HeaderProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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

        <div className="min-w-0 flex-1" />

        <GlobalSearch />

        <NotificationsPanel />

        {/* Menu do perfil */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-2 bg-bokka-surface border border-bokka-border rounded-full pl-1 pr-3 py-1 hover:shadow-sm transition-shadow">
            <Avatar photoKey={photoKey} name={user?.name || user?.email} size="sm" />
            <div className="hidden sm:block text-left leading-tight max-w-[220px]">
              <div className="text-xs font-semibold text-bokka-ink truncate">
                {user?.name?.split(' ').slice(0, 2).join(' ') || 'Usuária'}
              </div>
              <div className="text-[10px] text-bokka-ink-3 truncate">
                {roleLabel[user?.role ?? 'DENTISTA'] ?? 'Usuário'}
              </div>
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
                  {user?.clinicaCodigo && (
                    <div className="text-[10px] text-bokka-ink-3 truncate mt-1">
                      Clínica: <span className="font-semibold text-bokka-primary">{user.clinicaCodigo}</span>
                    </div>
                  )}
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
                    <Link
                      to="/configuracoes"
                      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
                        active
                          ? 'bg-bokka-primary-soft text-bokka-primary'
                          : 'text-bokka-ink-2'
                      }`}
                    >
                      <Settings className="w-4 h-4" strokeWidth={1.75} /> Configurações
                    </Link>
                  )}
                </Menu.Item>
                <div className="h-px bg-bokka-border my-1" />
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
