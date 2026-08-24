import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh bokka-bg-pattern text-bokka-ink flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 min-h-dvh">
        <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 pb-20 lg:pb-8">
          <div className="mx-auto max-w-[1440px]">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav onOpenMore={() => setSidebarOpen(true)} />
    </div>
  );
};
