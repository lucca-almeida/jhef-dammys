'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { AuthGate } from '@/components/auth-gate';
import { PwaInstallButton } from '@/components/pwa-install-button';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/agenda', label: 'Agenda' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/servicos', label: 'Servicos' },
  { href: '/orcamentos', label: 'Orcamentos' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/produtos', label: 'Produtos' },
  { href: '/custos', label: 'Custos' },
  { href: '/financeiro', label: 'Financeiro' },
];

const mobileItems = [
  { href: '/dashboard', label: 'Painel' },
  { href: '/agenda', label: 'Agenda' },
  { href: '/orcamentos', label: 'Orcar' },
  { href: '/eventos', label: 'Eventos' },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const currentPage =
    menuItems.find((item) => item.href === pathname)?.label ?? 'Painel';

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <AuthGate>
      {({ user, logout }) => (
        <main className="min-h-screen bg-[linear-gradient(180deg,#f4ece4_0%,#efe4d9_100%)] text-foreground">
          <div className="mx-auto max-w-7xl px-3 pb-[calc(88px+env(safe-area-inset-bottom))] pt-[calc(12px+env(safe-area-inset-top))] sm:px-4 lg:grid lg:min-h-screen lg:grid-cols-[260px_1fr] lg:gap-6 lg:px-6 lg:py-6 lg:pb-6">
            <header className="mb-4 rounded-[24px] border border-border bg-panel/90 px-4 py-4 shadow-[0_20px_50px_rgba(102,66,46,0.08)] backdrop-blur lg:hidden">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
                    JhefDammys
                  </p>
                  <h1 className="mt-1 truncate text-xl font-semibold tracking-tight">
                    {currentPage}
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMenuOpen(true)}
                  className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl border border-border bg-panel-strong px-4 text-sm font-medium text-foreground transition hover:border-accent/40"
                >
                  Menu
                </button>
              </div>
            </header>

            {isMenuOpen ? (
              <div
                className="fixed inset-0 z-40 bg-[#2f241f]/35 backdrop-blur-[2px] lg:hidden"
                onClick={() => setIsMenuOpen(false)}
              />
            ) : null}

            <aside
              className={`fixed inset-y-0 left-0 z-50 w-[min(88vw,320px)] overflow-y-auto border-r border-white/10 bg-[#2f241f] p-5 text-[#f7ede6] shadow-[0_24px_80px_rgba(46,34,28,0.35)] transition duration-200 lg:static lg:w-auto lg:translate-x-0 lg:rounded-[28px] lg:border lg:border-border ${
                isMenuOpen ? 'translate-x-0' : '-translate-x-[105%]'
              }`}
            >
              <div className="mb-4 flex items-center justify-between lg:hidden">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d8b6a5]">
                  Navegacao
                </p>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-flex min-h-[42px] min-w-[42px] items-center justify-center rounded-2xl border border-white/12 bg-white/6 text-sm font-medium text-[#f7ede6]"
                >
                  Fechar
                </button>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d8b6a5]">
                  JhefDammys
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight">
                  Painel interno
                </h1>
                <p className="mt-2 text-sm leading-6 text-[#d7c5bb]">
                  Agenda, clientes, custos e lucro em um lugar so.
                </p>
              </div>

              <div className="mt-4 rounded-[22px] border border-white/10 bg-[#3b2d27] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8b6a5]">
                  Acesso atual
                </p>
                <p className="mt-3 text-sm font-medium text-[#f7ede6]">
                  {user?.name ?? 'Administrador'}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#d7c5bb]">
                  {user?.email ?? 'Sem email carregado'}
                </p>
                <button
                  type="button"
                  onClick={logout}
                  className="mt-4 w-full rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-[#f7ede6] transition hover:bg-white/10"
                >
                  Sair
                </button>
              </div>

              <nav className="mt-6 space-y-2">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition ${
                        isActive
                          ? 'bg-[#f1e1d6] text-[#402c23]'
                          : 'text-[#f7ede6] hover:bg-white/8'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-xs opacity-70">{'>'}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-8 rounded-[22px] border border-white/10 bg-[#3b2d27] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d8b6a5]">
                  Foco da semana
                </p>
                <p className="mt-3 text-sm leading-6 text-[#f7ede6]">
                  Confirmar datas, revisar os custos dos eventos com material
                  proprio e manter o estoque de itens de giro alto em dia.
                </p>
              </div>

              <PwaInstallButton />
            </aside>

            <section className="space-y-4 lg:space-y-6">{children}</section>
          </div>

          <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-panel/95 px-3 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_40px_rgba(102,66,46,0.12)] backdrop-blur lg:hidden">
            <div className="mx-auto grid max-w-3xl grid-cols-4 gap-2">
              {mobileItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-xl px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.06em] transition ${
                      isActive
                        ? 'bg-[#2f241f] text-[#f7ede6]'
                        : 'bg-panel-strong text-muted'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </main>
      )}
    </AuthGate>
  );
}
