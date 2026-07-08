'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { AuthGate } from '@/components/auth-gate';

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

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <AuthGate>
      {({ user, logout }) => (
        <main className="min-h-screen bg-[linear-gradient(180deg,#f4ece4_0%,#efe4d9_100%)] text-foreground">
          <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-4 lg:grid-cols-[260px_1fr] lg:px-6 lg:py-6">
            <aside className="rounded-[28px] border border-border bg-[#2f241f] p-5 text-[#f7ede6] shadow-[0_24px_80px_rgba(46,34,28,0.35)]">
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
            </aside>

            <section className="space-y-6">{children}</section>
          </div>
        </main>
      )}
    </AuthGate>
  );
}
